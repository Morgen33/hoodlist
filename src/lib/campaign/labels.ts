import { assertNever } from "./assertNever";
import type {
  AllocationRule,
  EligibilityRule,
  RewardRule,
  VerificationRule,
} from "./types";

export function eligibilitySummary(rule: EligibilityRule): string {
  switch (rule.type) {
    case "any_holder":
      return "Any wallet that holds at least 1 CCFF00";
    case "min_balance":
      return `Wallets holding ${rule.min}+ CCFF00`;
    case "balance_range":
      return `Wallets holding ${rule.min}–${rule.max} CCFF00`;
    case "token_ids":
      return rule.tokenIds.length
        ? `Specific token IDs (${rule.tokenIds.length})`
        : "Specific token IDs";
    case "trait":
      return rule.traitType
        ? `Holders with ${rule.traitType}: ${rule.values.join(", ") || "any"}`
        : "Holders with a selected trait";
    default:
      return assertNever(rule);
  }
}

export function rewardSummary(rule: RewardRule): string {
  switch (rule.type) {
    case "allowlist_spot":
      return "Hoodlist spot (allowlist access)";
    case "free_mint":
      return `Free mint × ${rule.quantity}`;
    case "free_per_held":
      return "1 free mint per CCFF00 held";
    case "discount":
      return `${rule.percent}% discounted mint`;
    case "raffle_entry":
      return `Raffle entries (${rule.ticketsPerWallet} per wallet${rule.ticketsPerNft ? `, +${rule.ticketsPerNft} per NFT` : ""})`;
    case "custom":
      return rule.label.trim() || "Custom reward";
    default:
      return assertNever(rule);
  }
}

export function allocationSummary(rule: AllocationRule): string {
  switch (rule.type) {
    case "one_per_wallet":
      return "1 allocation per qualifying wallet";
    case "per_nft":
      return `${rule.unitsPerNft} per CCFF00 held`;
    case "tiered":
      return "Holder tiers based on how many CCFF00 they hold";
    case "fcfs":
      return `First come, first served — ${rule.maxSpots} Hoodlist spots`;
    case "capped":
      return `Capped at ${rule.maxSpots} Hoodlist spots`;
    default:
      return assertNever(rule);
  }
}

export function verificationSummary(rule: VerificationRule): string {
  switch (rule.type) {
    case "snapshot":
      return "Frozen snapshot of CCFF00 ownership";
    case "live":
      return "Check current CCFF00 ownership at claim time";
    case "snapshot_and_live":
      return "Must appear on the snapshot and still hold at claim time";
    default:
      return assertNever(rule);
  }
}
