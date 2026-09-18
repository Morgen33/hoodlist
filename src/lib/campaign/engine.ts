import type { Holder } from "@/lib/holders/types";
import { assertNever } from "./assertNever";
import type {
  AllocationRule,
  AllowlistEntry,
  CampaignRules,
  EligibilityRule,
  RewardRule,
} from "./types";

function holderHasTrait(
  holder: Holder,
  traitType: string,
  values: string[],
): boolean {
  if (!traitType) return false;
  const wanted = values.map((value) => value.trim().toLowerCase()).filter(Boolean);
  return holder.traits.some((trait) => {
    if (trait.traitType.toLowerCase() !== traitType.trim().toLowerCase()) {
      return false;
    }
    if (wanted.length === 0) return true;
    return wanted.includes(trait.value.toLowerCase());
  });
}

export function holderMatchesRule(
  holder: Holder,
  rule: EligibilityRule,
): boolean {
  switch (rule.type) {
    case "any_holder":
      return holder.balance >= 1;
    case "min_balance":
      return holder.balance >= rule.min;
    case "balance_range":
      return holder.balance >= rule.min && holder.balance <= rule.max;
    case "token_ids": {
      if (rule.tokenIds.length === 0) return false;
      const owned = new Set(holder.tokenIds.map(String));
      return rule.tokenIds.some((id) => owned.has(String(id).replace(/^#/, "")));
    }
    case "trait":
      return holderHasTrait(holder, rule.traitType, rule.values);
    default:
      return assertNever(rule);
  }
}

export function holderQualifies(
  holder: Holder,
  rules: EligibilityRule[],
): boolean {
  if (rules.length === 0) return holder.balance >= 1;
  return rules.every((rule) => holderMatchesRule(holder, rule));
}

function allocationFromTiers(
  balance: number,
  tiers: { minBalance: number; allocation: number }[],
): number {
  const sorted = [...tiers].sort((a, b) => b.minBalance - a.minBalance);
  const match = sorted.find((tier) => balance >= tier.minBalance);
  return match?.allocation ?? 0;
}

export function allocationForHolder(
  holder: Holder,
  rule: AllocationRule,
): number {
  switch (rule.type) {
    case "one_per_wallet":
      return 1;
    case "per_nft":
      return holder.balance * rule.unitsPerNft;
    case "tiered":
      return allocationFromTiers(holder.balance, rule.tiers);
    case "fcfs":
      return 1;
    case "capped":
      return 1;
    default:
      return assertNever(rule);
  }
}

export function rewardUnitsForHolder(
  holder: Holder,
  reward: RewardRule,
  allocation: number,
): number {
  switch (reward.type) {
    case "allowlist_spot":
    case "discount":
    case "custom":
      return allocation;
    case "free_mint":
      return allocation * reward.quantity;
    case "raffle_entry":
      return (
        allocation *
        (reward.ticketsPerWallet + holder.balance * reward.ticketsPerNft)
      );
    default:
      return assertNever(reward);
  }
}

export function buildAllowlist(
  holders: Holder[],
  rules: CampaignRules,
): AllowlistEntry[] {
  const qualified = holders
    .filter((holder) => holderQualifies(holder, rules.eligibility))
    .sort((a, b) => b.balance - a.balance || a.wallet.localeCompare(b.wallet));

  const entries: AllowlistEntry[] = [];
  let remaining: number | null = null;

  if (rules.allocation.type === "fcfs" || rules.allocation.type === "capped") {
    remaining = rules.allocation.maxSpots;
  }

  for (const holder of qualified) {
    if (remaining !== null && remaining <= 0) break;
    let allocation = allocationForHolder(holder, rules.allocation);
    if (remaining !== null) {
      allocation = Math.min(allocation, remaining);
      remaining -= allocation;
    }
    if (allocation <= 0) continue;
    entries.push({
      wallet: holder.wallet,
      balance: holder.balance,
      tokenIds: holder.tokenIds,
      allocation,
    });
  }

  return entries;
}

export function summarizeAllowlist(entries: AllowlistEntry[]): {
  wallets: number;
  allocations: number;
} {
  return {
    wallets: entries.length,
    allocations: entries.reduce((sum, entry) => sum + entry.allocation, 0),
  };
}
