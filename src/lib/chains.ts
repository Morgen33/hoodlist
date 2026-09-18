export const BLOCKCHAINS = [
  { id: "ethereum", label: "Ethereum" },
  { id: "solana", label: "Solana" },
  { id: "polygon", label: "Polygon" },
  { id: "base", label: "Base" },
  { id: "arbitrum", label: "Arbitrum" },
  { id: "other", label: "Other" },
] as const;

export type BlockchainId = (typeof BLOCKCHAINS)[number]["id"];

export function blockchainLabel(id: BlockchainId): string {
  const match = BLOCKCHAINS.find((chain) => chain.id === id);
  return match?.label ?? "Other";
}
