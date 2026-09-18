"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Field, inputClass } from "@/components/ui/Field";
import {
  fetchSnapshotById,
  useStore,
} from "@/components/providers/StoreProvider";
import { buildAllowlist, summarizeAllowlist } from "@/lib/campaign/engine";
import { downloadCsv } from "@/lib/csv";
import { formatNumber } from "@/lib/format";
import type { HolderSnapshot } from "@/lib/holders/types";

export default function ExportsPage() {
  const { campaigns, snapshots, saveCampaign } = useStore();
  const [campaignId, setCampaignId] = useState<string | null>(null);
  const [snapshotId, setSnapshotId] = useState<string | null>(null);
  const [snapshot, setSnapshot] = useState<HolderSnapshot | null>(null);

  const selectedCampaignId = campaignId ?? campaigns[0]?.id ?? "";
  const selectedSnapshotId = snapshotId ?? snapshots[0]?.id ?? "";

  const campaign = campaigns.find((item) => item.id === selectedCampaignId) ?? null;

  useEffect(() => {
    if (!selectedSnapshotId) {
      setSnapshot(null);
      return;
    }
    let cancelled = false;
    void fetchSnapshotById(selectedSnapshotId)
      .then((next) => {
        if (!cancelled) setSnapshot(next);
      })
      .catch(() => {
        if (!cancelled) setSnapshot(null);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedSnapshotId]);

  const entries = useMemo(() => {
    if (!campaign || !snapshot) return [];
    return buildAllowlist(snapshot.holders, campaign.rules);
  }, [campaign, snapshot]);

  const summary = summarizeAllowlist(entries);

  const download = () => {
    if (!campaign) return;
    downloadCsv(`${campaign.project.campaignName || "hoodlist"}.csv`, [
      ["wallet", "ccff00_held", "allocation", "token_ids"],
      ...entries.map((entry) => [
        entry.wallet,
        String(entry.balance),
        String(entry.allocation),
        entry.tokenIds.map((id) => `#${id}`).join(" "),
      ]),
    ]);
    saveCampaign({
      ...campaign,
      eligibleWalletCount: summary.wallets,
      totalAllocation: summary.allocations,
      updatedAt: new Date().toISOString(),
    });
  };

  if (campaigns.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="display text-4xl">Exports</h1>
        <EmptyState
          title="Nothing to export"
          body="Create and publish a Hoodlist first, then export the eligible wallet list."
          action={<Button href="/create">Create Hoodlist</Button>}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="display text-4xl">Exports</h1>
        <p className="mt-2 max-w-xl text-sm leading-6 text-muted">
          Build a wallet list from a Hoodlist&apos;s rules and a CCFF00 snapshot.
          One row per wallet.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Hoodlist">
          <select
            className={inputClass}
            value={selectedCampaignId}
            onChange={(event) => setCampaignId(event.target.value)}
          >
            {campaigns.map((item) => (
              <option key={item.id} value={item.id}>
                {item.project.campaignName}
              </option>
            ))}
          </select>
        </Field>
        <Field
          label="Snapshot"
          hint={
            snapshots.length === 0
              ? "Take a snapshot before exporting."
              : undefined
          }
        >
          <select
            className={inputClass}
            value={selectedSnapshotId}
            onChange={(event) => setSnapshotId(event.target.value)}
          >
            {snapshots.length === 0 ? (
              <option value="">No snapshots</option>
            ) : (
              snapshots.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))
            )}
          </select>
        </Field>
      </div>
      {snapshot && campaign ? (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-line bg-card px-4 py-4">
          <p className="text-sm text-muted">
            {formatNumber(summary.wallets)} wallets ·{" "}
            {formatNumber(summary.allocations)} allocations
          </p>
          <Button onClick={download} disabled={entries.length === 0}>
            Download CSV
          </Button>
        </div>
      ) : (
        <EmptyState
          title="Snapshot needed"
          body="Exports run against a frozen holder list so every partner gets a consistent allowlist."
          action={<Button href="/snapshots">Go to Snapshots</Button>}
        />
      )}
    </div>
  );
}
