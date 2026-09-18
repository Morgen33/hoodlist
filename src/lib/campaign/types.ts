import type { BlockchainId } from "@/lib/chains";

export type CampaignStatus = "draft" | "published" | "closed";

export type EligibilityRule =
  | { type: "any_holder" }
  | { type: "min_balance"; min: number }
  | { type: "balance_range"; min: number; max: number }
  | { type: "token_ids"; tokenIds: string[] }
  | { type: "trait"; traitType: string; values: string[] };

export type RewardRule =
  | { type: "allowlist_spot" }
  | { type: "free_mint"; quantity: number }
  | { type: "discount"; percent: number }
  | {
      type: "raffle_entry";
      ticketsPerWallet: number;
      ticketsPerNft: number;
    }
  | { type: "custom"; label: string };

export type AllocationTier = {
  minBalance: number;
  allocation: number;
};

export type AllocationRule =
  | { type: "one_per_wallet" }
  | { type: "per_nft"; unitsPerNft: number }
  | { type: "tiered"; tiers: AllocationTier[] }
  | { type: "fcfs"; maxSpots: number }
  | { type: "capped"; maxSpots: number };

export type VerificationRule =
  | { type: "snapshot"; snapshotId: string | null }
  | { type: "live" }
  | { type: "snapshot_and_live"; snapshotId: string | null };

export type CampaignRules = {
  eligibility: EligibilityRule[];
  reward: RewardRule;
  allocation: AllocationRule;
  verification: VerificationRule;
};

export type PartnerProject = {
  name: string;
  campaignName: string;
  website: string;
  twitter: string;
  blockchain: BlockchainId;
  mintDate: string;
  totalSupply: string;
  logoDataUrl: string;
  description: string;
};

export type HoodlistCampaign = {
  id: string;
  status: CampaignStatus;
  project: PartnerProject;
  rules: CampaignRules;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  eligibleWalletCount: number | null;
  totalAllocation: number | null;
};

export type AllowlistEntry = {
  wallet: string;
  balance: number;
  tokenIds: string[];
  allocation: number;
};
