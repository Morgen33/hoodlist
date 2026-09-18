"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { useStore } from "@/components/providers/StoreProvider";
import { formatDate } from "@/lib/format";
import { rewardSummary } from "@/lib/campaign/labels";

export default function CampaignsPage() {
  const { campaigns } = useStore();

  if (campaigns.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="display text-4xl">Campaigns</h1>
        <EmptyState
          title="No campaigns"
          body="Published Hoodlists will appear here. Start by creating one for a partner project."
          action={<Button href="/create">Create Hoodlist</Button>}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="display text-4xl">Campaigns</h1>
          <p className="mt-2 text-sm text-muted">
            Every Hoodlist built for a partner project.
          </p>
        </div>
        <Button href="/create">Create Hoodlist</Button>
      </div>
      <div className="overflow-hidden rounded-2xl border border-line">
        {campaigns.map((campaign) => (
          <Link
            key={campaign.id}
            href={`/campaigns/${campaign.id}`}
            className="grid gap-2 border-b border-line px-4 py-4 last:border-b-0 hover:bg-elevated sm:grid-cols-[1.4fr_1fr_120px]"
          >
            <div>
              <p className="text-sm">{campaign.project.campaignName}</p>
              <p className="text-xs text-muted">{campaign.project.name}</p>
            </div>
            <p className="text-sm text-muted">
              {rewardSummary(campaign.rules.reward)}
            </p>
            <p className="text-xs uppercase tracking-[0.12em] text-muted">
              {campaign.status} · {formatDate(campaign.updatedAt)}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
