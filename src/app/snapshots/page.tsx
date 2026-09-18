"use client";

import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  fetchSnapshotById,
  useStore,
} from "@/components/providers/StoreProvider";
import { downloadCsv } from "@/lib/csv";
import { formatDate, formatNumber } from "@/lib/format";
import type { HolderSnapshot, HolderSnapshotMeta } from "@/lib/holders/types";
import { useState } from "react";

function snapshotToCsv(snapshot: HolderSnapshot) {
  downloadCsv(`hoodlist-snapshot-${snapshot.uniqueWallets}-wallets.csv`, [
    ["wallet", "ccff00_held", "token_ids"],
    ...snapshot.holders.map((holder) => [
      holder.wallet,
      String(holder.balance),
      holder.tokenIds.map((id) => `#${id}`).join(" "),
    ]),
  ]);
}

export default function SnapshotsPage() {
  const { snapshots, takeSnapshot } = useStore();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onTake = async () => {
    setBusy(true);
    setError(null);
    try {
      await takeSnapshot();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Snapshot failed");
    } finally {
      setBusy(false);
    }
  };

  const onDownload = async (meta: HolderSnapshotMeta) => {
    setError(null);
    try {
      snapshotToCsv(await fetchSnapshotById(meta.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Download failed");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="display text-4xl">Snapshots</h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-muted">
            Frozen CCFF00 holder lists are stored on Hoodlist and shared across
            devices. Open one to look through the wallets, or download the CSV.
            Use Exports if you want a list shaped by a Hoodlist campaign.
          </p>
        </div>
        <Button onClick={() => void onTake()} disabled={busy}>
          {busy ? "Taking snapshot…" : "Take snapshot"}
        </Button>
      </div>
      {error ? <p className="text-sm text-red-400">{error}</p> : null}
      {snapshots.length === 0 ? (
        <EmptyState
          title="No snapshot yet"
          body="Take a snapshot to lock unique CCFF00 wallets, balances, and token IDs."
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-line">
          {snapshots.map((snapshot) => (
            <div
              key={snapshot.id}
              className="grid gap-3 border-b border-line px-4 py-4 last:border-b-0 sm:grid-cols-[1.4fr_1fr_auto]"
            >
              <div>
                <p className="text-sm">{snapshot.label}</p>
                <p className="font-mono text-xs text-muted">
                  {snapshot.contract}
                </p>
              </div>
              <p className="text-sm text-muted">
                {formatNumber(snapshot.uniqueWallets)} wallets ·{" "}
                {formatNumber(snapshot.totalNfts)} CCFF00 ·{" "}
                {formatDate(snapshot.createdAt)}
              </p>
              <div className="flex flex-wrap gap-2">
                <Button href={`/snapshots/${snapshot.id}`} variant="secondary">
                  View wallets
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => void onDownload(snapshot)}
                >
                  Download CSV
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
