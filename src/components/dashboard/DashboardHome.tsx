"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { useStore } from "@/components/providers/StoreProvider";
import { formatNumber } from "@/lib/format";
import { statsFromStore } from "@/lib/storage";

export function DashboardHome() {
  const { campaigns, snapshots } = useStore();
  const [liveHolders, setLiveHolders] = useState<number | null>(null);
  const [holderError, setHolderError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/collection")
      .then(async (response) => {
        if (!response.ok) throw new Error("failed");
        const data = (await response.json()) as { uniqueWallets?: number | null };
        if (!cancelled) setLiveHolders(data.uniqueWallets ?? null);
      })
      .catch(() => {
        if (!cancelled) setHolderError(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const stats = statsFromStore(campaigns, snapshots, liveHolders);
  const cards = [
    {
      label: "CCFF00 Holders",
      value: stats.ccff00Holders,
      note: holderError
        ? "Could not refresh live holders"
        : stats.ccff00Holders === null
          ? "Pull holders to load the live unique-wallet count"
          : "Unique wallets, not individual NFTs",
    },
    { label: "Active Hoodlists", value: stats.activeHoodlists },
    { label: "Partner Projects", value: stats.partnerProjects },
    { label: "Total Allocations", value: stats.totalAllocations },
    { label: "Total Wallets Rewarded", value: stats.totalWalletsRewarded },
  ];

  return (
    <div className="space-y-12">
      <section className="max-w-3xl">
        <p className="text-xs uppercase tracking-[0.22em] text-muted">
          Hoodstreet Media
        </p>
        <h1 className="display mt-3 text-6xl text-accent sm:text-7xl">
          Hoodlist
        </h1>
        <p className="mt-4 text-xl text-foreground">
          Turn CCFF00 ownership into access on Robinhood Chain.
        </p>
        <p className="mt-3 max-w-2xl text-base leading-7 text-muted">
          Build holder-based allowlists, mint allocations, discounts, free
          claims, raffles, and partner rewards using CCFF00 holders on
          Robinhood Chain. Campaigns, snapshots, and exports stay on this
          chain only.
        </p>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-muted">
          Hoodlist is Hoodstreet Media&apos;s holder-based allowlist system on
          Robinhood Chain. Partner projects mint on Robinhood. Hoodlist builds
          the CCFF00 wallet list.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button href="/create">Create Hoodlist</Button>
          <Button href="/campaigns" variant="secondary">
            View Campaigns
          </Button>
        </div>
      </section>

      <section>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {cards.map((card) => (
            <div
              key={card.label}
              className="rounded-2xl border border-line bg-card px-4 py-5"
            >
              <p className="text-[11px] uppercase tracking-[0.16em] text-muted">
                {card.label}
              </p>
              <p className="mt-3 font-mono text-3xl">
                {formatNumber(card.value ?? 0)}
              </p>
              {"note" in card && card.note ? (
                <p className="mt-2 text-xs text-muted">{card.note}</p>
              ) : null}
            </div>
          ))}
        </div>
      </section>

      {campaigns.length === 0 ? (
        <EmptyState
          title="No Hoodlists yet"
          body="Create a campaign to turn CCFF00 holders into mint access, rewards, or raffle entries."
          action={<Button href="/create">Create Hoodlist</Button>}
        />
      ) : (
        <section>
          <div className="mb-4 flex items-end justify-between">
            <h2 className="display text-2xl">Recent campaigns</h2>
            <Button href="/campaigns" variant="ghost">
              View all
            </Button>
          </div>
          <div className="divide-y divide-line rounded-2xl border border-line">
            {campaigns.slice(0, 5).map((campaign) => (
              <Link
                key={campaign.id}
                href={`/campaigns/${campaign.id}`}
                className="flex items-center justify-between px-4 py-4 hover:bg-elevated"
              >
                <div>
                  <p className="text-sm">{campaign.project.campaignName}</p>
                  <p className="text-xs text-muted">{campaign.project.name}</p>
                </div>
                <span className="text-xs uppercase tracking-[0.14em] text-muted">
                  {campaign.status}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
