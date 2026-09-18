import { NextResponse } from "next/server";
import { aggregateHoldersByWallet } from "@/lib/holders/aggregate";
import { fetchNftsForWallet } from "@/lib/holders/blockscout";
import { peekCachedHolders } from "@/lib/holders/cache";

export async function GET(
  _request: Request,
  context: { params: Promise<{ wallet: string }> },
) {
  const { wallet } = await context.params;
  if (!wallet) {
    return NextResponse.json({ error: "Wallet is required." }, { status: 400 });
  }

  const cached = peekCachedHolders()?.holders.find(
    (holder) => holder.wallet.toLowerCase() === wallet.toLowerCase(),
  );
  if (cached && cached.tokenIds.length > 0) {
    return NextResponse.json({ holder: cached });
  }

  try {
    const nfts = await fetchNftsForWallet(wallet);
    const holder = aggregateHoldersByWallet(nfts)[0] ??
      cached ?? {
        wallet,
        balance: 0,
        tokenIds: [],
        traits: [],
        ens: null,
      };
    return NextResponse.json({ holder });
  } catch (error) {
    if (cached) return NextResponse.json({ holder: cached });
    const message =
      error instanceof Error ? error.message : "Could not load token IDs.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
