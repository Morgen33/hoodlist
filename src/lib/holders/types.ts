export type NftTrait = {
  traitType: string;
  value: string;
};

export type NftOwnership = {
  tokenId: string;
  owner: string;
  traits: NftTrait[];
};

export type Holder = {
  wallet: string;
  balance: number;
  tokenIds: string[];
  traits: NftTrait[];
  ens: string | null;
};

export type HolderSnapshotMeta = {
  id: string;
  createdAt: string;
  label: string;
  source: "live";
  collectionName: string;
  contract: string;
  uniqueWallets: number;
  totalNfts: number;
};

export type HolderSnapshot = HolderSnapshotMeta & {
  holders: Holder[];
};
