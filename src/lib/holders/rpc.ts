import { CCFF00 } from "@/lib/collection";
import { aggregateHoldersByWallet } from "./aggregate";
import type { Holder, NftOwnership } from "./types";

const RPC = process.env.ROBINHOOD_RPC_URL ?? "https://rpc.mainnet.chain.robinhood.com";
const OWNER_OF = "0x6352211e";
const TOTAL_SUPPLY = "0x18160ddd";
const TOKEN_URI = "0xc87b56dd";

type RpcResponse = {
  result?: string;
  error?: { message?: string };
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

async function rpcBatch(
  calls: { to: string; data: string }[],
): Promise<RpcResponse[]> {
  const payload = calls.map((call, index) => ({
    jsonrpc: "2.0",
    id: index + 1,
    method: "eth_call",
    params: [call, "latest"],
  }));
  const response = await fetch(RPC, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`RPC lookup failed (${response.status})`);
  }
  const json = (await response.json()) as RpcResponse[] | RpcResponse;
  return Array.isArray(json) ? json : [json];
}

async function rpcCall(data: string): Promise<string> {
  const [result] = await rpcBatch([{ to: CCFF00.contract, data }]);
  if (!result?.result) {
    throw new Error(result?.error?.message ?? "RPC call failed");
  }
  return result.result;
}

export async function fetchSupplyFromRpc(): Promise<number> {
  const result = await rpcCall(TOTAL_SUPPLY);
  return decodeUint(result);
}

export async function fetchHoldersFromRpc(): Promise<Holder[]> {
  const supply = await fetchSupplyFromRpc();
  const nfts: NftOwnership[] = [];
  const batchSize = 100;

  for (let start = 1; start <= supply; start += batchSize) {
    const end = Math.min(start + batchSize - 1, supply);
    const calls = [];
    for (let tokenId = start; tokenId <= end; tokenId += 1) {
      calls.push({
        to: CCFF00.contract,
        data: `${OWNER_OF}${encodeUint(tokenId)}`,
      });
    }
    const results = await rpcBatch(calls);
    results.forEach((item, index) => {
      const tokenId = String(start + index);
      const owner = item.result ? decodeAddress(item.result) : null;
      if (!owner || owner === "0x0000000000000000000000000000000000000000") {
        return;
      }
      nfts.push({ tokenId, owner, traits: [] });
    });
  }

  return aggregateHoldersByWallet(nfts);
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
    knownIds && knownIds.length > 0
      ? knownIds.map(Number)
      : [];
  if (tokenIds.length === 0) return [];

  const calls = tokenIds.map((tokenId) => ({
    to: CCFF00.contract,
    data: `${TOKEN_URI}${encodeUint(tokenId)}`,
  }));
  const results = await rpcBatch(calls);
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
