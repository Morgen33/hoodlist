"use client";

import { use, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { useStore } from "@/components/providers/StoreProvider";
import { blockchainLabel } from "@/lib/chains";
import { formatDate, formatNumber } from "@/lib/format";
import {
  allocationSummary,
  eligibilitySummary,
  rewardSummary,
  verificationSummary,
} from "@/lib/campaign/labels";

export default function CampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { campaigns, deleteCampaign, setDraft } = useStore();
  const campaign = useMemo(
    () => campaigns.find((item) => item.id === id),
    [campaigns, id],
  );

  if (!campaign) {
    return (
      <EmptyState
        title="Campaign not found"
        body="This Hoodlist is not in local storage on this browser."
        action={<Button href="/campaigns">Back to campaigns</Button>}
      />
    );
  }

  const eligibility = campaign.rules.eligibility[0];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-muted">
            {campaign.status}
          </p>
          <h1 className="display mt-2 text-4xl">
            {campaign.project.campaignName}
          </h1>
          <p className="mt-2 text-sm text-muted">{campaign.project.name}</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={() => {
              setDraft(campaign);
              router.push("/create");
            }}
          >
            Edit
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              deleteCampaign(campaign.id);
              router.push("/campaigns");
            }}
          >
            Delete
          </Button>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Info label="Blockchain" value={blockchainLabel(campaign.project.blockchain)} />
        <Info label="Mint date" value={formatDate(campaign.project.mintDate)} />
        <Info
          label="Collection supply"
          value={campaign.project.totalSupply || "—"}
        />
        <Info
          label="Eligible wallets"
          value={
            campaign.eligibleWalletCount === null
              ? "Not built yet"
              : formatNumber(campaign.eligibleWalletCount)
          }
        />
      </div>
      <div className="grid gap-3">
        <Info
          label="Who qualifies"
          value={eligibility ? eligibilitySummary(eligibility) : "—"}
        />
        <Info label="What they receive" value={rewardSummary(campaign.rules.reward)} />
        <Info
          label="How much / how many"
          value={allocationSummary(campaign.rules.allocation)}
        />
        <Info
          label="Ownership check"
          value={verificationSummary(campaign.rules.verification)}
        />
      </div>
      {campaign.project.description ? (
        <p className="max-w-2xl text-sm leading-6 text-muted">
          {campaign.project.description}
        </p>
      ) : null}
      <Button href="/exports" variant="secondary">
        Export wallets
      </Button>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-line bg-card px-4 py-4">
      <p className="text-[11px] uppercase tracking-[0.16em] text-muted">
        {label}
      </p>
      <p className="mt-2 text-sm">{value}</p>
    </div>
  );
}
