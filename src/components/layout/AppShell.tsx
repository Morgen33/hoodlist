"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { CCFF00 } from "@/lib/collection";
import { NAV_ITEMS } from "@/lib/nav";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-full lg:grid lg:grid-cols-[240px_1fr]">
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-[240px] border-r border-line bg-background px-5 py-6 transition lg:static ${
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <Link href="/" className="block" onClick={() => setOpen(false)}>
          <p className="display text-2xl text-accent">Hoodlist</p>
          <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-muted">
            {CCFF00.parentBrand}
          </p>
        </Link>
        <div className="mt-6 flex items-center gap-2 rounded-xl border border-line px-3 py-2">
          <span className="h-3 w-3 rounded-sm bg-accent" />
          <span className="text-xs text-muted">Holder collection</span>
          <span className="ml-auto font-mono text-xs">{CCFF00.name}</span>
        </div>
        <nav className="mt-8 space-y-1">
          {NAV_ITEMS.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`block rounded-lg px-3 py-2 text-sm transition ${
                  active
                    ? "bg-elevated text-accent"
                    : "text-muted hover:bg-elevated hover:text-foreground"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
      {open ? (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-black/60 lg:hidden"
          aria-label="Close navigation"
          onClick={() => setOpen(false)}
        />
      ) : null}
      <div className="min-h-full">
        <header className="flex items-center justify-between border-b border-line px-5 py-4 lg:hidden">
          <p className="display text-lg text-accent">Hoodlist</p>
          <button
            type="button"
            className="text-sm text-muted"
            onClick={() => setOpen(true)}
          >
            Menu
          </button>
        </header>
        <main className="mx-auto w-full max-w-6xl px-5 py-10 lg:px-10">
          {children}
        </main>
      </div>
    </div>
  );
}
