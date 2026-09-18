"use client";

import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { useStore } from "@/components/providers/StoreProvider";
import { CCFF00 } from "@/lib/collection";
import { downloadCsv } from "@/lib/csv";
import { formatDate, formatNumber } from "@/lib/format";
import type { Holder, HolderSnapshot } from "@/lib/holders/types";
import { useState } from "react";

function downloadSnapshot(snapshot: HolderSnapshot) {
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
  const { snapshots, saveSnapshot } = useStore();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const takeSnapshot = async () => {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/holders?refresh=1");
      const json = (await response.json()) as {
        holders?: Holder[];
        uniqueWallets?: number;
        totalNfts?: number;
        error?: string;
      };
      if (!response.ok) throw new Error(json.error ?? "Snapshot failed");
      saveSnapshot({
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        label: `CCFF00 ${new Date().toLocaleString()}`,
        source: "live",
        collectionName: CCFF00.name,
        contract: CCFF00.contract,
        uniqueWallets: json.uniqueWallets ?? json.holders?.length ?? 0,
        totalNfts: json.totalNfts ?? 0,
        holders: json.holders ?? [],
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Snapshot failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="display text-4xl">Snapshots</h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-muted">
            Frozen CCFF00 holder lists live in this browser. Open one to look
            through the wallets, or download the CSV. Use Exports if you want a
            list shaped by a Hoodlist campaign.
          </p>
        </div>
        <Button onClick={() => void takeSnapshot()} disabled={busy}>
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
                  onClick={() => downloadSnapshot(snapshot)}
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
