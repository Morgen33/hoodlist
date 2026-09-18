import type { HoodlistCampaign } from "@/lib/campaign/types";
import type { HolderSnapshot } from "@/lib/holders/types";

export const STORE_KEYS = {
  campaigns: "hoodlist:campaigns",
  snapshots: "hoodlist:snapshots",
  draft: "hoodlist:draft",
} as const;

export type PlatformStats = {
  ccff00Holders: number | null;
  activeHoodlists: number;
  partnerProjects: number;
  totalAllocations: number;
  totalWalletsRewarded: number;
};

export function statsFromStore(
  campaigns: HoodlistCampaign[],
  snapshots: HolderSnapshot[],
  liveHolderCount: number | null,
): PlatformStats {
  const published = campaigns.filter((campaign) => campaign.status === "published");
  const partners = new Set(
    published
      .map((campaign) => campaign.project.name.trim().toLowerCase())
      .filter(Boolean),
  );

  const snapshotHolders =
    snapshots.length > 0
      ? snapshots
          .slice()
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]?.uniqueWallets ??
        null
      : null;

  return {
    ccff00Holders: liveHolderCount ?? snapshotHolders,
    activeHoodlists: published.length,
    partnerProjects: partners.size,
    totalAllocations: published.reduce(
      (sum, campaign) => sum + (campaign.totalAllocation ?? 0),
      0,
    ),
    totalWalletsRewarded: published.reduce(
      (sum, campaign) => sum + (campaign.eligibleWalletCount ?? 0),
      0,
    ),
  };
}

export function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeJson(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}
