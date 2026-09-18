import type { Holder } from "./types";
import { fetchHoldersByWallet } from "./blockscout";

type CacheEntry = {
  holders: Holder[];
  fetchedAt: string;
};

const TTL_MS = 10 * 60 * 1000;
let cache: CacheEntry | null = null;
let inflight: Promise<CacheEntry> | null = null;

export function peekCachedHolders(): CacheEntry | null {
  return cache;
}

export async function getCachedHolders(force = false): Promise<CacheEntry> {
  if (
    !force &&
    cache &&
    Date.now() - new Date(cache.fetchedAt).getTime() < TTL_MS
  ) {
    return cache;
  }

  if (inflight) return inflight;

  inflight = fetchHoldersByWallet()
    .then((holders) => {
      cache = { holders, fetchedAt: new Date().toISOString() };
      return cache;
    })
    .finally(() => {
      inflight = null;
    });

  return inflight;
}
