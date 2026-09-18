import { NextResponse } from "next/server";
import { CCFF00 } from "@/lib/collection";
import { listSnapshotMetas, writeSnapshot } from "@/lib/holders/blob";
import { getCachedHolders } from "@/lib/holders/cache";
import { parseSnapshot } from "@/lib/holders/snapshot";
import type { HolderSnapshot } from "@/lib/holders/types";

export const maxDuration = 300;

export async function GET() {
  try {
    const snapshots = await listSnapshotMetas();
    return NextResponse.json({ snapshots });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not list snapshots.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

export async function POST(request: Request) {
  try {
    const text = await request.text();
    const body = text ? (JSON.parse(text) as { snapshot?: unknown }) : {};
    let snapshot: HolderSnapshot | null = null;

    if (body.snapshot) {
      snapshot = parseSnapshot(body.snapshot);
      if (!snapshot) {
        return NextResponse.json(
          { error: "Invalid snapshot payload." },
          { status: 400 },
        );
      }
    } else {
      const cached = await getCachedHolders(true);
      const uniqueWallets = cached.holders.length;
      const totalNfts = cached.holders.reduce(
        (sum, holder) => sum + holder.balance,
        0,
      );
      snapshot = {
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        label: `CCFF00 ${new Date().toLocaleString("en-US")}`,
        source: "live",
        collectionName: CCFF00.name,
        contract: CCFF00.contract,
        uniqueWallets,
        totalNfts,
        holders: cached.holders,
      };
    }

    const meta = await writeSnapshot(snapshot);
    return NextResponse.json({ snapshot: meta });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not save snapshot.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
