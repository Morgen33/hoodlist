"use client";

import { use, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { inputClass } from "@/components/ui/Field";
import { fetchSnapshotById } from "@/components/providers/StoreProvider";
import { downloadCsv } from "@/lib/csv";
import { formatNumber, formatTokenIds, shortWallet } from "@/lib/format";
import type { HolderSnapshot } from "@/lib/holders/types";

export default function SnapshotDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [snapshot, setSnapshot] = useState<HolderSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 250;

  useEffect(() => {
    let cancelled = false;
    void fetchSnapshotById(id)
      .then((next) => {
        if (!cancelled) setSnapshot(next);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Snapshot not found.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const filtered = useMemo(() => {
    if (!snapshot) return [];
    const q = query.trim().toLowerCase();
    if (!q) return snapshot.holders;
    return snapshot.holders.filter(
      (holder) =>
        holder.wallet.toLowerCase().includes(q) ||
        (holder.ens ?? "").toLowerCase().includes(q),
    );
  }, [snapshot, query]);

  if (error) {
    return (
      <EmptyState
        title="Snapshot not found"
        body="This snapshot is stored on Hoodlist. If the link is old, go back to Snapshots and open a current one."
        action={<Button href="/snapshots">Back to Snapshots</Button>}
      />
    );
  }

  if (!snapshot) {
    return (
      <EmptyState
        title="Loading snapshot"
        body="Pulling the frozen CCFF00 wallet list."
      />
    );
  }

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const visible = filtered.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  const download = () => {
    downloadCsv(`hoodlist-snapshot-${snapshot.uniqueWallets}-wallets.csv`, [
      ["wallet", "ccff00_held", "token_ids"],
      ...snapshot.holders.map((holder) => [
        holder.wallet,
        String(holder.balance),
        holder.tokenIds.map((id) => `#${id}`).join(" "),
      ]),
    ]);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-muted">
            Snapshot
          </p>
          <h1 className="display mt-2 text-4xl">{snapshot.label}</h1>
          <p className="mt-2 text-sm text-muted">
            {formatNumber(snapshot.uniqueWallets)} wallets ·{" "}
            {formatNumber(snapshot.totalNfts)} CCFF00
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" href="/snapshots">
            All snapshots
          </Button>
          <Button onClick={download}>Download CSV</Button>
        </div>
      </div>

      <input
        className={inputClass}
        placeholder="Search wallet"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setPage(1);
        }}
      />

      {visible.length === 0 ? (
        <EmptyState title="No wallets" body="Nothing in this snapshot matches that search." />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-line">
          <div className="grid grid-cols-[1.2fr_100px_1fr] border-b border-line px-4 py-2 text-[11px] uppercase tracking-[0.14em] text-muted">
            <span>Wallet</span>
            <span>CCFF00 held</span>
            <span>Token IDs</span>
          </div>
          {visible.map((holder) => (
            <div
              key={holder.wallet}
              className="grid grid-cols-[1.2fr_100px_1fr] border-b border-line px-4 py-3 last:border-b-0"
            >
              <span className="font-mono text-sm">
                {shortWallet(holder.wallet)}
              </span>
              <span className="font-mono text-sm">
                {formatNumber(holder.balance)}
              </span>
              <span className="text-sm text-muted">
                {formatTokenIds(holder.tokenIds)}
              </span>
            </div>
          ))}
        </div>
      )}

      {filtered.length > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted">
          <p>
            Showing {formatNumber((currentPage - 1) * pageSize + 1)}–
            {formatNumber(Math.min(currentPage * pageSize, filtered.length))} of{" "}
            {formatNumber(filtered.length)} wallets
          </p>
          {pageCount > 1 ? (
            <div className="flex gap-2">
              <Button
                variant="ghost"
                disabled={currentPage <= 1}
                onClick={() => setPage((value) => Math.max(1, value - 1))}
              >
                Previous
              </Button>
              <span className="self-center text-xs uppercase tracking-[0.12em]">
                Page {currentPage} of {pageCount}
              </span>
              <Button
                variant="ghost"
                disabled={currentPage >= pageCount}
                onClick={() =>
                  setPage((value) => Math.min(pageCount, value + 1))
                }
              >
                Next
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
