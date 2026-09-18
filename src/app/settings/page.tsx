"use client";

import { CCFF00 } from "@/lib/collection";

export default function SettingsPage() {
  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="display text-4xl">Settings</h1>
        <p className="mt-2 text-sm leading-6 text-muted">
          Hoodlist currently reads CCFF00 ownership from Robinhood Chain. Holder
          data is grouped by wallet before any campaign rules run.
        </p>
      </div>
      <div className="space-y-3 rounded-2xl border border-line bg-card p-5">
        <Row label="Product" value={CCFF00.productName} />
        <Row label="Parent brand" value={CCFF00.parentBrand} />
        <Row label="Holder collection" value={CCFF00.name} />
        <Row label="Contract" value={CCFF00.contract} />
        <Row label="Collection site" value={CCFF00.site} />
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 border-b border-line py-3 last:border-b-0 sm:flex-row sm:justify-between">
      <p className="text-xs uppercase tracking-[0.14em] text-muted">{label}</p>
      <p className="break-all font-mono text-sm">{value}</p>
    </div>
  );
}
