import { NextResponse } from "next/server";
import { getCachedHolders } from "@/lib/holders/cache";
import { fetchCollectionSummary } from "@/lib/holders/blockscout";

export const maxDuration = 300;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const force = searchParams.get("refresh") === "1";

  try {
    const [summary, cached] = await Promise.all([
      fetchCollectionSummary(),
      getCachedHolders(force),
    ]);

    const uniqueWallets = cached.holders.length;
    const totalNfts = cached.holders.reduce(
      (sum, holder) => sum + holder.balance,
      0,
    );

    return NextResponse.json({
      collection: summary,
      uniqueWallets,
      totalNfts,
      fetchedAt: cached.fetchedAt,
      holders: cached.holders,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not load CCFF00 holders.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
