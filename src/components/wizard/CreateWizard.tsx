"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Field, inputClass } from "@/components/ui/Field";
import { useStore } from "@/components/providers/StoreProvider";
import { BLOCKCHAINS } from "@/lib/chains";
import {
  allocationSummary,
  eligibilitySummary,
  rewardSummary,
  verificationSummary,
} from "@/lib/campaign/labels";
import type {
  AllocationRule,
  EligibilityRule,
  HoodlistCampaign,
  RewardRule,
  VerificationRule,
} from "@/lib/campaign/types";
import { canLeaveProjectStep, WIZARD_STEPS } from "@/lib/campaign/wizard";
import { assertNever } from "@/lib/campaign/assertNever";

function OptionCard({
  selected,
  title,
  body,
  onSelect,
}: {
  selected: boolean;
  title: string;
  body: string;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`rounded-2xl border px-4 py-4 text-left transition ${
        selected
          ? "border-accent bg-elevated"
          : "border-line hover:border-accent/40"
      }`}
    >
      <p className="text-sm font-medium">{title}</p>
      <p className="mt-1 text-sm text-muted">{body}</p>
    </button>
  );
}

function ProjectStep({
  campaign,
  onChange,
}: {
  campaign: HoodlistCampaign;
  onChange: (next: HoodlistCampaign) => void;
}) {
  const project = campaign.project;
  return (
    <div className="grid gap-5">
      <Field label="Project name">
        <input
          className={inputClass}
          value={project.name}
          placeholder="Weth Bandits"
          onChange={(event) =>
            onChange({
              ...campaign,
              project: { ...project, name: event.target.value },
            })
          }
        />
      </Field>
      <Field label="Campaign name">
        <input
          className={inputClass}
          value={project.campaignName}
          placeholder="Weth Bandits x CCFF00"
          onChange={(event) =>
            onChange({
              ...campaign,
              project: { ...project, campaignName: event.target.value },
            })
          }
        />
      </Field>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Project website">
          <input
            className={inputClass}
            value={project.website}
            placeholder="https://"
            onChange={(event) =>
              onChange({
                ...campaign,
                project: { ...project, website: event.target.value },
              })
            }
          />
        </Field>
        <Field label="Project X / Twitter">
          <input
            className={inputClass}
            value={project.twitter}
            placeholder="@project"
            onChange={(event) =>
              onChange({
                ...campaign,
                project: { ...project, twitter: event.target.value },
              })
            }
          />
        </Field>
      </div>
      <div className="grid gap-5 sm:grid-cols-3">
        <Field label="Blockchain" hint="More chains can be added later.">
          <select
            className={inputClass}
            value={project.blockchain}
            onChange={(event) =>
              onChange({
                ...campaign,
                project: {
                  ...project,
                  blockchain: event.target.value as typeof project.blockchain,
                },
              })
            }
          >
            {BLOCKCHAINS.map((chain) => (
              <option key={chain.id} value={chain.id}>
                {chain.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Mint date">
          <input
            type="date"
            className={inputClass}
            value={project.mintDate}
            onChange={(event) =>
              onChange({
                ...campaign,
                project: { ...project, mintDate: event.target.value },
              })
            }
          />
        </Field>
        <Field label="Total collection supply">
          <input
            className={inputClass}
            value={project.totalSupply}
            placeholder="3333"
            onChange={(event) =>
              onChange({
                ...campaign,
                project: { ...project, totalSupply: event.target.value },
              })
            }
          />
        </Field>
      </div>
      <Field label="Project logo" hint="Optional. PNG or JPG.">
        <input
          type="file"
          accept="image/*"
          className="text-sm text-muted file:mr-3 file:rounded-full file:border-0 file:bg-accent file:px-3 file:py-1.5 file:text-accent-ink"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = () => {
              onChange({
                ...campaign,
                project: {
                  ...project,
                  logoDataUrl: String(reader.result ?? ""),
                },
              });
            };
            reader.readAsDataURL(file);
          }}
        />
        {project.logoDataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={project.logoDataUrl}
            alt=""
            className="mt-3 h-16 w-16 rounded-xl object-cover"
          />
        ) : null}
      </Field>
      <Field label="Description" hint="Optional">
        <textarea
          className={`${inputClass} min-h-28`}
          value={project.description}
          onChange={(event) =>
            onChange({
              ...campaign,
              project: { ...project, description: event.target.value },
            })
          }
        />
      </Field>
    </div>
  );
}

function EligibilityStep({
  campaign,
  onChange,
}: {
  campaign: HoodlistCampaign;
  onChange: (next: HoodlistCampaign) => void;
}) {
  const rule = campaign.rules.eligibility[0] ?? { type: "any_holder" as const };
  const setRule = (eligibility: EligibilityRule) =>
    onChange({
      ...campaign,
      rules: { ...campaign.rules, eligibility: [eligibility] },
    });

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">
        Qualification is based on the wallet, not each NFT as a separate entry.
        A wallet with 10 CCFF00 still counts as one holder with a balance of 10.
      </p>
      <div className="grid gap-3">
        <OptionCard
          selected={rule.type === "any_holder"}
          title="Any CCFF00 holder"
          body="Every wallet that currently holds at least one CCFF00."
          onSelect={() => setRule({ type: "any_holder" })}
        />
        <OptionCard
          selected={rule.type === "min_balance"}
          title="Minimum held"
          body="Only wallets holding a set number of CCFF00 or more."
          onSelect={() => setRule({ type: "min_balance", min: 3 })}
        />
        <OptionCard
          selected={rule.type === "balance_range"}
          title="Holder range"
          body="Wallets within a min and max CCFF00 count."
          onSelect={() =>
            setRule({ type: "balance_range", min: 1, max: 10 })
          }
        />
        <OptionCard
          selected={rule.type === "token_ids"}
          title="Specific token IDs"
          body="Only wallets that hold listed CCFF00 token IDs."
          onSelect={() => setRule({ type: "token_ids", tokenIds: [] })}
        />
        <OptionCard
          selected={rule.type === "trait"}
          title="Trait (when available)"
          body="Qualify holders by NFT traits if the collection exposes them."
          onSelect={() =>
            setRule({ type: "trait", traitType: "Color", values: ["#CCFF00"] })
          }
        />
      </div>
      {rule.type === "min_balance" ? (
        <Field label="Minimum CCFF00 held">
          <input
            type="number"
            min={1}
            className={inputClass}
            value={rule.min}
            onChange={(event) =>
              setRule({ type: "min_balance", min: Number(event.target.value) })
            }
          />
        </Field>
      ) : null}
      {rule.type === "balance_range" ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Minimum">
            <input
              type="number"
              min={1}
              className={inputClass}
              value={rule.min}
              onChange={(event) =>
                setRule({ ...rule, min: Number(event.target.value) })
              }
            />
          </Field>
          <Field label="Maximum">
            <input
              type="number"
              min={1}
              className={inputClass}
              value={rule.max}
              onChange={(event) =>
                setRule({ ...rule, max: Number(event.target.value) })
              }
            />
          </Field>
        </div>
      ) : null}
      {rule.type === "token_ids" ? (
        <Field
          label="Token IDs"
          hint="Comma separated. Example: 22, 48, 91"
        >
          <input
            className={inputClass}
            value={rule.tokenIds.join(", ")}
            onChange={(event) =>
              setRule({
                type: "token_ids",
                tokenIds: event.target.value
                  .split(",")
                  .map((id) => id.trim().replace(/^#/, ""))
                  .filter(Boolean),
              })
            }
          />
        </Field>
      ) : null}
      {rule.type === "trait" ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Trait">
            <input
              className={inputClass}
              value={rule.traitType}
              onChange={(event) =>
                setRule({ ...rule, traitType: event.target.value })
              }
            />
          </Field>
          <Field label="Values" hint="Comma separated">
            <input
              className={inputClass}
              value={rule.values.join(", ")}
              onChange={(event) =>
                setRule({
                  ...rule,
                  values: event.target.value
                    .split(",")
                    .map((value) => value.trim())
                    .filter(Boolean),
                })
              }
            />
          </Field>
        </div>
      ) : null}
    </div>
  );
}

function RewardStep({
  campaign,
  onChange,
}: {
  campaign: HoodlistCampaign;
  onChange: (next: HoodlistCampaign) => void;
}) {
  const rule = campaign.rules.reward;
  const setRule = (reward: RewardRule) =>
    onChange({ ...campaign, rules: { ...campaign.rules, reward } });

  return (
    <div className="grid gap-3">
      <OptionCard
        selected={rule.type === "allowlist_spot"}
        title="Hoodlist spot"
        body="Allowlist access to the partner mint."
        onSelect={() => setRule({ type: "allowlist_spot" })}
      />
      <OptionCard
        selected={rule.type === "free_mint"}
        title="Free mint"
        body="Qualified wallets can claim without paying the mint price."
        onSelect={() => setRule({ type: "free_mint", quantity: 1 })}
      />
      <OptionCard
        selected={rule.type === "discount"}
        title="Discounted mint"
        body="A percentage off the public mint price."
        onSelect={() => setRule({ type: "discount", percent: 20 })}
      />
      <OptionCard
        selected={rule.type === "raffle_entry"}
        title="Raffle entry"
        body="Entries into a drawing instead of a guaranteed mint."
        onSelect={() =>
          setRule({ type: "raffle_entry", ticketsPerWallet: 1, ticketsPerNft: 0 })
        }
      />
      <OptionCard
        selected={rule.type === "custom"}
        title="Community reward"
        body="A custom reward you describe."
        onSelect={() => setRule({ type: "custom", label: "" })}
      />
      {rule.type === "free_mint" ? (
        <Field label="Free mints per allocation">
          <input
            type="number"
            min={1}
            className={inputClass}
            value={rule.quantity}
            onChange={(event) =>
              setRule({ type: "free_mint", quantity: Number(event.target.value) })
            }
          />
        </Field>
      ) : null}
      {rule.type === "discount" ? (
        <Field label="Discount percent">
          <input
            type="number"
            min={1}
            max={100}
            className={inputClass}
            value={rule.percent}
            onChange={(event) =>
              setRule({ type: "discount", percent: Number(event.target.value) })
            }
          />
        </Field>
      ) : null}
      {rule.type === "raffle_entry" ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Entries per wallet">
            <input
              type="number"
              min={0}
              className={inputClass}
              value={rule.ticketsPerWallet}
              onChange={(event) =>
                setRule({
                  ...rule,
                  ticketsPerWallet: Number(event.target.value),
                })
              }
            />
          </Field>
          <Field label="Extra entries per CCFF00">
            <input
              type="number"
              min={0}
              className={inputClass}
              value={rule.ticketsPerNft}
              onChange={(event) =>
                setRule({
                  ...rule,
                  ticketsPerNft: Number(event.target.value),
                })
              }
            />
          </Field>
        </div>
      ) : null}
      {rule.type === "custom" ? (
        <Field label="Reward">
          <input
            className={inputClass}
            value={rule.label}
            placeholder="Early access merch drop"
            onChange={(event) =>
              setRule({ type: "custom", label: event.target.value })
            }
          />
        </Field>
      ) : null}
    </div>
  );
}

function AllocationStep({
  campaign,
  onChange,
}: {
  campaign: HoodlistCampaign;
  onChange: (next: HoodlistCampaign) => void;
}) {
  const rule = campaign.rules.allocation;
  const setRule = (allocation: AllocationRule) =>
    onChange({ ...campaign, rules: { ...campaign.rules, allocation } });

  return (
    <div className="grid gap-3">
      <p className="text-sm text-muted">
        This answers how much each qualifying wallet receives, and how many
        people can participate.
      </p>
      <OptionCard
        selected={rule.type === "one_per_wallet"}
        title="One per wallet"
        body="Every qualifying wallet gets a single Hoodlist allocation."
        onSelect={() => setRule({ type: "one_per_wallet" })}
      />
      <OptionCard
        selected={rule.type === "per_nft"}
        title="Based on how many they hold"
        body="Allocation scales with CCFF00 balance."
        onSelect={() => setRule({ type: "per_nft", unitsPerNft: 1 })}
      />
      <OptionCard
        selected={rule.type === "tiered"}
        title="Holder tiers"
        body="Different allocations for 1, 3, 5+ holders, and so on."
        onSelect={() =>
          setRule({
            type: "tiered",
            tiers: [
              { minBalance: 1, allocation: 1 },
              { minBalance: 3, allocation: 2 },
              { minBalance: 5, allocation: 3 },
            ],
          })
        }
      />
      <OptionCard
        selected={rule.type === "fcfs"}
        title="First come, first served"
        body="A limited number of Hoodlist spots, filled in order."
        onSelect={() => setRule({ type: "fcfs", maxSpots: 500 })}
      />
      <OptionCard
        selected={rule.type === "capped"}
        title="Capped Hoodlist"
        body="Limit total spots while still ranking by holder size."
        onSelect={() => setRule({ type: "capped", maxSpots: 1000 })}
      />
      {rule.type === "per_nft" ? (
        <Field label="Allocations per CCFF00 held">
          <input
            type="number"
            min={1}
            className={inputClass}
            value={rule.unitsPerNft}
            onChange={(event) =>
              setRule({
                type: "per_nft",
                unitsPerNft: Number(event.target.value),
              })
            }
          />
        </Field>
      ) : null}
      {rule.type === "fcfs" || rule.type === "capped" ? (
        <Field label="Hoodlist spots">
          <input
            type="number"
            min={1}
            className={inputClass}
            value={rule.maxSpots}
            onChange={(event) =>
              setRule({ type: rule.type, maxSpots: Number(event.target.value) })
            }
          />
        </Field>
      ) : null}
      {rule.type === "tiered" ? (
        <div className="space-y-3">
          {rule.tiers.map((tier, index) => (
            <div key={`${tier.minBalance}-${index}`} className="grid grid-cols-2 gap-3">
              <Field label="Min CCFF00 held">
                <input
                  type="number"
                  min={1}
                  className={inputClass}
                  value={tier.minBalance}
                  onChange={(event) => {
                    const tiers = rule.tiers.map((item, itemIndex) =>
                      itemIndex === index
                        ? { ...item, minBalance: Number(event.target.value) }
                        : item,
                    );
                    setRule({ type: "tiered", tiers });
                  }}
                />
              </Field>
              <Field label="Allocation">
                <input
                  type="number"
                  min={0}
                  className={inputClass}
                  value={tier.allocation}
                  onChange={(event) => {
                    const tiers = rule.tiers.map((item, itemIndex) =>
                      itemIndex === index
                        ? { ...item, allocation: Number(event.target.value) }
                        : item,
                    );
                    setRule({ type: "tiered", tiers });
                  }}
                />
              </Field>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function VerificationStep({
  campaign,
  onChange,
}: {
  campaign: HoodlistCampaign;
  onChange: (next: HoodlistCampaign) => void;
}) {
  const rule = campaign.rules.verification;
  const snapshots = useStore().snapshots;
  const setRule = (verification: VerificationRule) =>
    onChange({ ...campaign, rules: { ...campaign.rules, verification } });

  return (
    <div className="grid gap-3">
      <OptionCard
        selected={rule.type === "snapshot"}
        title="Use a snapshot"
        body="Freeze the CCFF00 holder list at a moment in time."
        onSelect={() =>
          setRule({
            type: "snapshot",
            snapshotId: snapshots[0]?.id ?? null,
          })
        }
      />
      <OptionCard
        selected={rule.type === "live"}
        title="Check live ownership"
        body="Confirm the wallet still holds CCFF00 when they claim."
        onSelect={() => setRule({ type: "live" })}
      />
      <OptionCard
        selected={rule.type === "snapshot_and_live"}
        title="Snapshot + still holding"
        body="Must be on the snapshot and still hold at claim time."
        onSelect={() =>
          setRule({
            type: "snapshot_and_live",
            snapshotId: snapshots[0]?.id ?? null,
          })
        }
      />
      {rule.type === "snapshot" || rule.type === "snapshot_and_live" ? (
        <Field
          label="Snapshot"
          hint={
            snapshots.length === 0
              ? "No snapshot yet. You can publish now and attach one later from Snapshots."
              : "Choose which frozen holder list this Hoodlist uses."
          }
        >
          <select
            className={inputClass}
            value={rule.snapshotId ?? ""}
            onChange={(event) =>
              setRule({
                ...rule,
                snapshotId: event.target.value || null,
              })
            }
          >
            <option value="">Attach later</option>
            {snapshots.map((snapshot) => (
              <option key={snapshot.id} value={snapshot.id}>
                {snapshot.label} · {snapshot.uniqueWallets} wallets
              </option>
            ))}
          </select>
        </Field>
      ) : null}
    </div>
  );
}

function ReviewStep({ campaign }: { campaign: HoodlistCampaign }) {
  const eligibility = campaign.rules.eligibility[0];
  const rows = [
    ["Project", campaign.project.name || "—"],
    ["Campaign", campaign.project.campaignName || "—"],
    ["Who qualifies", eligibility ? eligibilitySummary(eligibility) : "—"],
    ["What they receive", rewardSummary(campaign.rules.reward)],
    ["How much / how many", allocationSummary(campaign.rules.allocation)],
    ["Ownership check", verificationSummary(campaign.rules.verification)],
  ];
  return (
    <div className="overflow-hidden rounded-2xl border border-line">
      {rows.map(([label, value]) => (
        <div
          key={label}
          className="grid gap-1 border-b border-line px-4 py-3 last:border-b-0 sm:grid-cols-[180px_1fr]"
        >
          <p className="text-xs uppercase tracking-[0.14em] text-muted">
            {label}
          </p>
          <p className="text-sm">{value}</p>
        </div>
      ))}
    </div>
  );
}

function PublishStep({ campaign }: { campaign: HoodlistCampaign }) {
  return (
    <div className="space-y-4">
      <p className="text-sm leading-6 text-muted">
        Publishing {campaign.project.campaignName || "this Hoodlist"} makes it
        available in Campaigns. You can still export the eligible wallet list
        after a snapshot is attached.
      </p>
      <ReviewStep campaign={campaign} />
    </div>
  );
}

function renderStep(
  id: (typeof WIZARD_STEPS)[number]["id"],
  campaign: HoodlistCampaign,
  onChange: (next: HoodlistCampaign) => void,
) {
  switch (id) {
    case "project":
      return <ProjectStep campaign={campaign} onChange={onChange} />;
    case "eligibility":
      return <EligibilityStep campaign={campaign} onChange={onChange} />;
    case "reward":
      return <RewardStep campaign={campaign} onChange={onChange} />;
    case "allocation":
      return <AllocationStep campaign={campaign} onChange={onChange} />;
    case "verification":
      return <VerificationStep campaign={campaign} onChange={onChange} />;
    case "review":
      return <ReviewStep campaign={campaign} />;
    case "publish":
      return <PublishStep campaign={campaign} />;
    default:
      return assertNever(id);
  }
}

export function CreateWizard() {
  const router = useRouter();
  const { draft, startDraft, setDraft, saveCampaign } = useStore();
  const [index, setIndex] = useState(0);
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    if (!draft && !publishing) startDraft();
  }, [draft, startDraft, publishing]);

  if (!draft) return null;
  const campaign = draft;
  const step = WIZARD_STEPS[index] ?? WIZARD_STEPS[0];

  const update = (next: HoodlistCampaign) => {
    setDraft({ ...next, updatedAt: new Date().toISOString() });
  };

  const nextDisabled =
    step.id === "project" && !canLeaveProjectStep(campaign);

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <p className="text-xs uppercase tracking-[0.22em] text-muted">
          Create Hoodlist
        </p>
        <h1 className="display mt-2 text-4xl">{step.question}</h1>
      </div>
      <ol className="flex flex-wrap gap-2">
        {WIZARD_STEPS.map((item, itemIndex) => (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => {
                if (itemIndex > 0 && !canLeaveProjectStep(campaign)) return;
                setIndex(itemIndex);
              }}
              className={`rounded-full px-3 py-1 text-xs uppercase tracking-[0.12em] ${
                itemIndex === index
                  ? "bg-accent text-accent-ink"
                  : itemIndex < index
                    ? "border border-accent/40 text-accent"
                    : "border border-line text-muted"
              }`}
            >
              {item.number}. {item.label}
            </button>
          </li>
        ))}
      </ol>
      {renderStep(step.id, campaign, update)}
      <div className="flex items-center justify-between pt-2">
        <Button
          variant="ghost"
          disabled={index === 0}
          onClick={() => setIndex((value) => Math.max(0, value - 1))}
        >
          Back
        </Button>
        {step.id === "publish" ? (
          <Button
            onClick={() => {
              const published: HoodlistCampaign = {
                ...campaign,
                status: "published",
                publishedAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              };
              setPublishing(true);
              saveCampaign(published);
              router.push(`/campaigns/${published.id}`);
            }}
          >
            Publish Hoodlist
          </Button>
        ) : (
          <Button
            disabled={nextDisabled}
            onClick={() =>
              setIndex((value) => Math.min(WIZARD_STEPS.length - 1, value + 1))
            }
          >
            Continue
          </Button>
        )}
      </div>
    </div>
  );
}
