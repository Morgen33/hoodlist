"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { inputClass } from "@/components/ui/Field";
import { formatNumber, formatTokenIds, shortWallet } from "@/lib/format";
import type { Holder } from "@/lib/holders/types";

type HoldersResponse = {
  uniqueWallets: number;
  totalNfts: number;
  fetchedAt: string;
  holders: Holder[];
  error?: string;
};

export default function HoldersPage() {
  const [data, setData] = useState<HoldersResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [details, setDetails] = useState<Record<string, Holder>>({});

  const [page, setPage] = useState(1);
  const pageSize = 250;

  const load = (refresh = false) => {
    setLoading(true);
    setError(null);
    fetch(`/api/holders${refresh ? "?refresh=1" : ""}`)
      .then(async (response) => {
        const json = (await response.json()) as HoldersResponse;
        if (!response.ok) throw new Error(json.error ?? "Lookup failed");
        setData(json);
        setPage(1);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Lookup failed");
      })
      .finally(() => setLoading(false));
  };

  const filtered = useMemo(() => {
    const holders = data?.holders ?? [];
    const q = query.trim().toLowerCase();
    if (!q) return holders;
    return holders.filter(
      (holder) =>
        holder.wallet.toLowerCase().includes(q) ||
        (holder.ens ?? "").toLowerCase().includes(q),
    );
  }, [data, query]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const visible = filtered.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  const downloadAll = () => {
    if (!data) return;
    const rows = [
      ["wallet", "ccff00_held", "token_ids"],
      ...data.holders.map((holder) => [
        holder.wallet,
        String(holder.balance),
        holder.tokenIds.map((id) => `#${id}`).join(" "),
      ]),
    ];
    const csv = rows
      .map((row) =>
        row
          .map((cell) =>
            cell.includes(",") || cell.includes('"')
              ? `"${cell.replaceAll('"', '""')}"`
              : cell,
          )
          .join(","),
      )
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `ccff00-holders-${data.uniqueWallets}-wallets.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const openWallet = async (wallet: string) => {
    setExpanded((current) => (current === wallet ? null : wallet));
    if (details[wallet]) return;
    const response = await fetch(`/api/holders/${wallet}`);
    const json = (await response.json()) as { holder?: Holder; error?: string };
    if (json.holder) {
      setDetails((current) => ({ ...current, [wallet]: json.holder as Holder }));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="display text-4xl">CCFF00 Holders</h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-muted">
            Each row is a wallet. If someone holds 10 CCFF00, they appear once
            with a balance of 10 — never as 10 separate entries.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => load(true)} disabled={loading}>
            {loading ? "Loading…" : data ? "Refresh" : "Pull holders"}
          </Button>
          {data ? (
            <Button variant="secondary" onClick={downloadAll}>
              Download all wallets
            </Button>
          ) : null}
        </div>
      </div>

      {data ? (
        <div className="grid gap-3 sm:grid-cols-3">
          <Stat label="Unique wallets" value={formatNumber(data.uniqueWallets)} />
          <Stat label="CCFF00 held" value={formatNumber(data.totalNfts)} />
          <Stat
            label="Last pulled"
            value={new Date(data.fetchedAt).toLocaleString()}
          />
        </div>
      ) : null}

      <input
        className={inputClass}
        placeholder="Search wallet"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setPage(1);
        }}
      />

      {error ? (
        <EmptyState
          title="Could not pull holders"
          body={error}
          action={
            <Button variant="secondary" onClick={() => load(true)}>
              Try again
            </Button>
          }
        />
      ) : null}

      {!error && !loading && !data ? (
        <EmptyState
          title="No holder pull yet"
          body="Pull current CCFF00 wallets. Each wallet appears once, with how many NFTs it holds."
          action={
            <Button onClick={() => load(false)} disabled={loading}>
              Pull holders
            </Button>
          }
        />
      ) : null}

      {!error && !loading && data && filtered.length === 0 ? (
        <EmptyState
          title="No holders yet"
          body="When CCFF00 holder data is available, unique wallets will appear here."
        />
      ) : null}

      {filtered.length > 0 ? (
        <div className="overflow-hidden rounded-2xl border border-line">
          <div className="grid grid-cols-[1.2fr_100px_1fr] border-b border-line px-4 py-2 text-[11px] uppercase tracking-[0.14em] text-muted">
            <span>Wallet</span>
            <span>CCFF00 held</span>
            <span>Token IDs</span>
          </div>
          {visible.map((holder) => {
            const extra = details[holder.wallet];
            const open = expanded === holder.wallet;
            const tokenIds = extra?.tokenIds ?? holder.tokenIds;
            return (
              <button
                type="button"
                key={holder.wallet}
                onClick={() => void openWallet(holder.wallet)}
                className="grid w-full grid-cols-[1.2fr_100px_1fr] border-b border-line px-4 py-3 text-left last:border-b-0 hover:bg-elevated"
              >
                <span className="font-mono text-sm">
                  {shortWallet(holder.wallet)}
                  {holder.ens ? (
                    <span className="ml-2 text-xs text-muted">{holder.ens}</span>
                  ) : null}
                </span>
                <span className="font-mono text-sm">
                  {formatNumber(holder.balance)}
                </span>
                <span className="text-sm text-muted">
                  {open
                    ? formatTokenIds(tokenIds, 20)
                    : tokenIds.length
                      ? formatTokenIds(tokenIds)
                      : "Open to load token IDs"}
                </span>
              </button>
            );
          })}
        </div>
      ) : null}
      {filtered.length > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted">
          <p>
            Showing {formatNumber((currentPage - 1) * pageSize + 1)}–
            {formatNumber(Math.min(currentPage * pageSize, filtered.length))} of{" "}
            {formatNumber(filtered.length)} wallets
            {data && filtered.length === data.holders.length
              ? " — complete CCFF00 holder set"
              : ""}
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

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-line bg-card px-4 py-4">
      <p className="text-[11px] uppercase tracking-[0.16em] text-muted">
        {label}
      </p>
      <p className="mt-2 font-mono text-lg">{value}</p>
    </div>
  );
}
