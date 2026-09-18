import { CCFF00 } from "@/lib/collection";
import { aggregateHoldersByWallet } from "./aggregate";
import type { Holder, NftOwnership } from "./types";

const RPC =
  process.env.ROBINHOOD_RPC_URL ?? "https://rpc.mainnet.chain.robinhood.com";
const OWNER_OF = "0x6352211e";
const TOTAL_SUPPLY = "0x18160ddd";
const TOKEN_URI = "0xc87b56dd";
const TRANSFER_TOPIC =
  "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
const ZERO = "0x0000000000000000000000000000000000000000";
const BLOCK_WINDOW = 1_500_000;

type RpcResponse = {
  result?: unknown;
  error?: { message?: string };
};

type RpcLog = {
  topics: string[];
  blockNumber: string;
  logIndex: string;
};

function encodeUint(value: number): string {
  return value.toString(16).padStart(64, "0");
}

function decodeAddress(data: string): string | null {
  if (!data || data === "0x") return null;
  return `0x${data.slice(-40)}`;
}

function decodeUint(data: string): number {
  if (!data || data === "0x") return 0;
  return Number(BigInt(data));
}

function topicAddress(topic: string): string {
  return `0x${topic.slice(-40)}`;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function rpcRequest(
  method: string,
  params: unknown[],
  attempt = 0,
): Promise<RpcResponse> {
  const response = await fetch(RPC, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
    cache: "no-store",
  });

  if ((response.status === 429 || response.status === 503) && attempt < 8) {
    const retryAfter = Number(response.headers.get("retry-after"));
    const wait = Number.isFinite(retryAfter) && retryAfter > 0
      ? retryAfter * 1000
      : 400 * 2 ** attempt;
    await sleep(wait);
    return rpcRequest(method, params, attempt + 1);
  }

  if (!response.ok) {
    throw new Error(`RPC lookup failed (${response.status})`);
  }

  return (await response.json()) as RpcResponse;
}

async function rpcCall(data: string): Promise<string> {
  const payload = await rpcRequest("eth_call", [
    { to: CCFF00.contract, data },
    "latest",
  ]);
  if (typeof payload.result !== "string") {
    throw new Error(payload.error?.message ?? "RPC call failed");
  }
  return payload.result;
}

export async function fetchSupplyFromRpc(): Promise<number> {
  const result = await rpcCall(TOTAL_SUPPLY);
  return decodeUint(result);
}

function isNftTransfer(log: RpcLog): boolean {
  return log.topics.length === 4 && log.topics[0] === TRANSFER_TOPIC;
}

export function ownersFromNftTransfers(logs: RpcLog[]): Map<string, string> {
  const sorted = [...logs].sort((a, b) => {
    const block = parseInt(a.blockNumber, 16) - parseInt(b.blockNumber, 16);
    if (block !== 0) return block;
    return parseInt(a.logIndex, 16) - parseInt(b.logIndex, 16);
  });

  const owners = new Map<string, string>();
  for (const log of sorted) {
    if (!isNftTransfer(log)) continue;
    const tokenId = BigInt(log.topics[3] ?? "0x0").toString();
    const to = topicAddress(log.topics[2] ?? ZERO);
    owners.set(tokenId, to);
  }
  return owners;
}

async function getLogsInRange(fromBlock: number, toBlock: number): Promise<RpcLog[]> {
  const ranges: Array<[number, number]> = [[fromBlock, toBlock]];
  const logs: RpcLog[] = [];

  while (ranges.length > 0) {
    const [from, to] = ranges.pop() as [number, number];
    const payload = await rpcRequest("eth_getLogs", [
      {
        address: CCFF00.contract,
        fromBlock: `0x${from.toString(16)}`,
        toBlock: `0x${to.toString(16)}`,
        topics: [TRANSFER_TOPIC],
      },
    ]);

    const message = payload.error?.message ?? "";
    if (message.toLowerCase().includes("limit") && from < to) {
      const mid = Math.floor((from + to) / 2);
      ranges.push([mid + 1, to], [from, mid]);
      await sleep(120);
      continue;
    }

    if (payload.error) {
      throw new Error(payload.error.message ?? "Log lookup failed");
    }

    logs.push(...((payload.result as RpcLog[] | undefined) ?? []));
    await sleep(80);
  }

  return logs;
}

export async function fetchHoldersFromRpc(): Promise<Holder[]> {
  const latestHex = await rpcRequest("eth_blockNumber", []);
  if (typeof latestHex.result !== "string") {
    throw new Error("Could not read the current block.");
  }

  const latest = parseInt(latestHex.result, 16);
  const logs: RpcLog[] = [];
  let emptyWindows = 0;
  let end = latest;

  while (end >= 0) {
    const start = Math.max(0, end - BLOCK_WINDOW + 1);
    const chunk = await getLogsInRange(start, end);
    const nftLogs = chunk.filter(isNftTransfer);
    logs.push(...nftLogs);

    if (nftLogs.length === 0) {
      emptyWindows += 1;
      if (emptyWindows >= 2 && logs.length > 0) break;
    } else {
      emptyWindows = 0;
    }

    if (start === 0) break;
    end = start - 1;
  }

  const nfts: NftOwnership[] = [];
  for (const [tokenId, owner] of ownersFromNftTransfers(logs)) {
    if (owner === ZERO) continue;
    nfts.push({ tokenId, owner, traits: [] });
  }

  return aggregateHoldersByWallet(nfts);
}

async function rpcBatchCalls(
  calls: { to: string; data: string }[],
): Promise<Array<{ result?: string }>> {
  const results: Array<{ result?: string }> = [];
  const batchSize = 20;

  for (let i = 0; i < calls.length; i += batchSize) {
    const slice = calls.slice(i, i + batchSize);
    const payload = slice.map((call, index) => ({
      jsonrpc: "2.0",
      id: index + 1,
      method: "eth_call",
      params: [call, "latest"],
    }));

    let attempt = 0;
    let response = await fetch(RPC, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    while (
      (response.status === 429 || response.status === 503) &&
      attempt < 8
    ) {
      attempt += 1;
      await sleep(400 * 2 ** (attempt - 1));
      response = await fetch(RPC, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
        cache: "no-store",
      });
    }

    if (!response.ok) {
      throw new Error(`RPC lookup failed (${response.status})`);
    }

    const json = (await response.json()) as Array<{ result?: string }> | {
      result?: string;
    };
    results.push(...(Array.isArray(json) ? json : [json]));
    await sleep(80);
  }

  return results;
}

function decodeTokenUri(data: string): string {
  if (!data || data === "0x") return "";
  const hex = data.slice(2);
  const offset = Number(BigInt(`0x${hex.slice(0, 64)}`)) * 2;
  const length = Number(BigInt(`0x${hex.slice(offset, offset + 64)}`));
  const body = hex.slice(offset + 64, offset + 64 + length * 2);
  return Buffer.from(body, "hex").toString("utf8");
}

export async function fetchNftsForWalletFromRpc(
  wallet: string,
  knownIds?: string[],
): Promise<NftOwnership[]> {
  const tokenIds =
    knownIds && knownIds.length > 0 ? knownIds.map(Number) : [];
  if (tokenIds.length === 0) return [];

  const calls = tokenIds.map((tokenId) => ({
    to: CCFF00.contract,
    data: `${TOKEN_URI}${encodeUint(tokenId)}`,
  }));
  const results = await rpcBatchCalls(calls);
  return tokenIds.map((tokenId, index) => {
    let traits: NftOwnership["traits"] = [];
    const uri = results[index]?.result
      ? decodeTokenUri(results[index].result as string)
      : "";
    if (uri.startsWith("data:application/json")) {
      const encoded = uri.split(",")[1] ?? "";
      try {
        const json = JSON.parse(
          Buffer.from(encoded, "base64").toString("utf8"),
        ) as { attributes?: { trait_type?: string; value?: string }[] };
        traits = (json.attributes ?? [])
          .filter((attr) => attr.trait_type && attr.value)
          .map((attr) => ({
            traitType: String(attr.trait_type),
            value: String(attr.value),
          }));
      } catch {
        traits = [];
      }
    }
    return { tokenId: String(tokenId), owner: wallet, traits };
  });
}

export async function ownerOfToken(tokenId: number): Promise<string | null> {
  const result = await rpcCall(`${OWNER_OF}${encodeUint(tokenId)}`);
  return decodeAddress(result);
}
