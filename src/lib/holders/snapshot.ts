import type { Holder, HolderSnapshot, HolderSnapshotMeta } from "./types";

const SNAPSHOT_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isSnapshotId(value: string): boolean {
  return SNAPSHOT_ID.test(value);
}

export function toSnapshotMeta(snapshot: HolderSnapshot): HolderSnapshotMeta {
  return {
    id: snapshot.id,
    createdAt: snapshot.createdAt,
    label: snapshot.label,
    source: snapshot.source,
    collectionName: snapshot.collectionName,
    contract: snapshot.contract,
    uniqueWallets: snapshot.uniqueWallets,
    totalNfts: snapshot.totalNfts,
  };
}

function isHolder(value: unknown): value is Holder {
  if (!value || typeof value !== "object") return false;
  const holder = value as Record<string, unknown>;
  return (
    typeof holder.wallet === "string" &&
    typeof holder.balance === "number" &&
    Array.isArray(holder.tokenIds) &&
    holder.tokenIds.every((id) => typeof id === "string")
  );
}

export function parseSnapshotMeta(value: unknown): HolderSnapshotMeta | null {
  if (!value || typeof value !== "object") return null;
  const snapshot = value as Record<string, unknown>;
  if (typeof snapshot.id !== "string" || !isSnapshotId(snapshot.id)) return null;
  if (typeof snapshot.createdAt !== "string") return null;
  if (typeof snapshot.label !== "string") return null;
  if (snapshot.source !== "live") return null;
  if (typeof snapshot.collectionName !== "string") return null;
  if (typeof snapshot.contract !== "string") return null;
  if (typeof snapshot.uniqueWallets !== "number") return null;
  if (typeof snapshot.totalNfts !== "number") return null;
  return {
    id: snapshot.id,
    createdAt: snapshot.createdAt,
    label: snapshot.label,
    source: "live",
    collectionName: snapshot.collectionName,
    contract: snapshot.contract,
    uniqueWallets: snapshot.uniqueWallets,
    totalNfts: snapshot.totalNfts,
  };
}

export function parseSnapshot(value: unknown): HolderSnapshot | null {
  const meta = parseSnapshotMeta(value);
  if (!meta) return null;
  const holders = (value as { holders?: unknown }).holders;
  if (!Array.isArray(holders) || !holders.every(isHolder)) return null;
  return { ...meta, holders };
}
