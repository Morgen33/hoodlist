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

  const load = (refresh = false) => {
    setLoading(true);
    setError(null);
    fetch(`/api/holders${refresh ? "?refresh=1" : ""}`)
      .then(async (response) => {
        const json = (await response.json()) as HoldersResponse;
        if (!response.ok) throw new Error(json.error ?? "Lookup failed");
        setData(json);
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
    return holders.filter((holder) => holder.wallet.toLowerCase().includes(q));
  }, [data, query]);

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
        <Button variant="secondary" onClick={() => load(true)} disabled={loading}>
          {loading ? "Loading…" : data ? "Refresh" : "Pull holders"}
        </Button>
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
        onChange={(event) => setQuery(event.target.value)}
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
          {filtered.slice(0, 200).map((holder) => {
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
      {filtered.length > 200 ? (
        <p className="text-xs text-muted">
          Showing 200 of {formatNumber(filtered.length)} wallets. Search to
          narrow the list.
        </p>
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
