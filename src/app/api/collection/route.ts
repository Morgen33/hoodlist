import { NextResponse } from "next/server";
import { fetchCollectionSummary } from "@/lib/holders/blockscout";
import { peekCachedHolders } from "@/lib/holders/cache";

export async function GET() {
  try {
    const summary = await fetchCollectionSummary();
    const cached = peekCachedHolders();
    return NextResponse.json({
      ...summary,
      uniqueWallets: cached?.holders.length ?? null,
      fetchedAt: cached?.fetchedAt ?? null,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not load collection.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
