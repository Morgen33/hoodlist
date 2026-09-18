import type { Holder, NftOwnership, NftTrait } from "./types";

function mergeTraits(existing: NftTrait[], incoming: NftTrait[]): NftTrait[] {
  const seen = new Set(
    existing.map((trait) => `${trait.traitType}:${trait.value}`),
  );
  const merged = [...existing];
  for (const trait of incoming) {
    const key = `${trait.traitType}:${trait.value}`;
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(trait);
  }
  return merged;
}

export function aggregateHoldersByWallet(
  nfts: NftOwnership[],
): Holder[] {
  const byWallet = new Map<string, Holder>();

  for (const nft of nfts) {
    const wallet = nft.owner.trim();
    if (!wallet) continue;
    const key = wallet.toLowerCase();
    const current = byWallet.get(key);

    if (!current) {
      byWallet.set(key, {
        wallet,
        balance: 1,
        tokenIds: [nft.tokenId],
        traits: [...nft.traits],
        ens: null,
      });
      continue;
    }

    current.balance += 1;
    current.tokenIds.push(nft.tokenId);
    current.traits = mergeTraits(current.traits, nft.traits);
  }

  return [...byWallet.values()]
    .map((holder) => ({
      ...holder,
      tokenIds: [...holder.tokenIds].sort(
        (a, b) => Number(a) - Number(b),
      ),
    }))
    .sort((a, b) => b.balance - a.balance || a.wallet.localeCompare(b.wallet));
}

export function mergeHolderPages(pages: Holder[][]): Holder[] {
  const byWallet = new Map<string, Holder>();

  for (const page of pages) {
    for (const holder of page) {
      const key = holder.wallet.toLowerCase();
      const current = byWallet.get(key);
      if (!current) {
        byWallet.set(key, {
          ...holder,
          tokenIds: [...holder.tokenIds],
          traits: [...holder.traits],
        });
        continue;
      }
      current.balance += holder.balance;
      current.tokenIds.push(...holder.tokenIds);
      current.traits = mergeTraits(current.traits, holder.traits);
      if (!current.ens && holder.ens) current.ens = holder.ens;
    }
  }

  return [...byWallet.values()]
    .map((holder) => ({
      ...holder,
      tokenIds: [...new Set(holder.tokenIds)].sort(
        (a, b) => Number(a) - Number(b),
      ),
    }))
    .sort((a, b) => b.balance - a.balance || a.wallet.localeCompare(b.wallet));
}
