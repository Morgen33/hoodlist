export const ROBINHOOD_CHAIN = {
  id: "robinhood",
  name: "Robinhood Chain",
  chainId: 4663,
} as const;

export type BlockchainId = typeof ROBINHOOD_CHAIN.id;

export function blockchainLabel(_id?: string): string {
  return ROBINHOOD_CHAIN.name;
}

export function robinhoodChainId(): BlockchainId {
  return ROBINHOOD_CHAIN.id;
}
