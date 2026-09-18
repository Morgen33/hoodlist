import { CCFF00 } from "@/lib/collection";
import { aggregateHoldersByWallet, mergeHolderPages } from "./aggregate";
import { fetchHoldersFromRpc, fetchSupplyFromRpc } from "./rpc";
import type { Holder, NftOwnership, NftTrait } from "./types";

const DEFAULT_BASE = "https://robinhoodchain.blockscout.com/api/v2";

type BlockscoutAddress = {
  hash?: string;
  ens_domain_name?: string | null;
};

type HolderRow = {
  address?: BlockscoutAddress;
  value?: string;
};

type InstanceRow = {
  id?: string;
  owner?: BlockscoutAddress;
  metadata?: {
    attributes?: { trait_type?: string; value?: string }[];
  };
};

type Page<T> = {
  items?: T[];
  next_page_params?: Record<string, string | number | null> | null;
};

function explorerBase(): string {
  return process.env.BLOCKSCOUT_API_URL ?? DEFAULT_BASE;
}

function toQuery(params: Record<string, string | number | null | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    search.set(key, String(value));
  }
  const encoded = search.toString();
  return encoded ? `?${encoded}` : "";
}

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`${explorerBase()}${path}`, {
    headers: {
      accept: "application/json",
      "user-agent": "Hoodlist/1.0 (https://hoodlist-six.vercel.app)",
    },
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`Holder lookup failed (${response.status})`);
  }
  return (await response.json()) as T;
}

export async function fetchCollectionSummary() {
  try {
    const token = await getJson<{
      name?: string;
      holders_count?: string;
      total_supply?: string;
      address_hash?: string;
    }>(`/tokens/${CCFF00.contract}`);

    return {
      name: token.name ?? CCFF00.name,
      contract: token.address_hash ?? CCFF00.contract,
      totalSupply: Number(token.total_supply ?? 0),
    };
  } catch {
    const totalSupply = await fetchSupplyFromRpc();
    return {
      name: CCFF00.name,
      contract: CCFF00.contract,
      totalSupply,
    };
  }
}

function mapHolderRow(row: HolderRow): Holder | null {
  const wallet = row.address?.hash;
  const balance = Number(row.value ?? 0);
  if (!wallet || balance <= 0) return null;
  return {
    wallet,
    balance,
    tokenIds: [],
    traits: [],
    ens: row.address?.ens_domain_name ?? null,
  };
}

export async function fetchHoldersByWallet(): Promise<Holder[]> {
  try {
    return await fetchHoldersFromExplorer();
  } catch {
    return fetchHoldersFromRpc();
  }
}

async function fetchHoldersFromExplorer(): Promise<Holder[]> {
  const pages: Holder[][] = [];
  let query = "";
  let guard = 0;

  while (guard < 400) {
    guard += 1;
    const page = await getJson<Page<HolderRow>>(
      `/tokens/${CCFF00.contract}/holders${query}`,
    );
    const mapped = (page.items ?? [])
      .map(mapHolderRow)
      .filter((holder): holder is Holder => holder !== null);
    pages.push(mapped);
    if (!page.next_page_params) break;
    query = toQuery(page.next_page_params);
  }

  return mergeHolderPages(pages);
}

function traitsFromInstance(row: InstanceRow): NftTrait[] {
  return (row.metadata?.attributes ?? [])
    .filter((attr) => attr.trait_type && attr.value)
    .map((attr) => ({
      traitType: String(attr.trait_type),
      value: String(attr.value),
    }));
}

export async function fetchNftsForWallet(wallet: string): Promise<NftOwnership[]> {
  try {
    return await fetchNftsForWalletFromExplorer(wallet);
  } catch {
    return [];
  }
}

async function fetchNftsForWalletFromExplorer(wallet: string): Promise<NftOwnership[]> {
  const nfts: NftOwnership[] = [];
  let query = toQuery({ holder_address_hash: wallet });
  let guard = 0;

  while (guard < 200) {
    guard += 1;
    const page = await getJson<Page<InstanceRow>>(
      `/tokens/${CCFF00.contract}/instances${query}`,
    );
    for (const item of page.items ?? []) {
      if (!item.id || !item.owner?.hash) continue;
      nfts.push({
        tokenId: String(item.id),
        owner: item.owner.hash,
        traits: traitsFromInstance(item),
      });
    }
    if (!page.next_page_params) break;
    query = toQuery({
      holder_address_hash: wallet,
      ...page.next_page_params,
    });
  }

  return nfts;
}

export async function enrichHolderWithTokens(holder: Holder): Promise<Holder> {
  const nfts = await fetchNftsForWallet(holder.wallet);
  const aggregated = aggregateHoldersByWallet(nfts)[0];
  if (!aggregated) {
    return { ...holder, tokenIds: [], traits: [] };
  }
  return {
    ...holder,
    balance: aggregated.balance || holder.balance,
    tokenIds: aggregated.tokenIds,
    traits: aggregated.traits,
  };
}
