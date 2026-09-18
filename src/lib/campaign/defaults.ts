import { ROBINHOOD_CHAIN } from "@/lib/chains";
import type {
  CampaignRules,
  HoodlistCampaign,
  PartnerProject,
} from "./types";

export function emptyProject(): PartnerProject {
  return {
    name: "",
    campaignName: "",
    website: "",
    twitter: "",
    blockchain: ROBINHOOD_CHAIN.id,
    mintDate: "",
    totalSupply: "",
    logoDataUrl: "",
    description: "",
  };
}

export function defaultRules(): CampaignRules {
  return {
    eligibility: [{ type: "any_holder" }],
    reward: { type: "allowlist_spot" },
    allocation: { type: "one_per_wallet" },
    verification: { type: "snapshot", snapshotId: null },
  };
}

export function createDraftCampaign(): HoodlistCampaign {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    status: "draft",
    project: emptyProject(),
    rules: defaultRules(),
    createdAt: now,
    updatedAt: now,
    publishedAt: null,
    eligibleWalletCount: null,
    totalAllocation: null,
  };
}

export function pinCampaignToRobinhood(
  campaign: HoodlistCampaign,
): HoodlistCampaign {
  return {
    ...campaign,
    project: {
      ...campaign.project,
      blockchain: ROBINHOOD_CHAIN.id,
    },
  };
}
