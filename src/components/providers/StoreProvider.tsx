"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { createDraftCampaign } from "@/lib/campaign/defaults";
import type { HoodlistCampaign } from "@/lib/campaign/types";
import { parseSnapshot } from "@/lib/holders/snapshot";
import type { HolderSnapshot, HolderSnapshotMeta } from "@/lib/holders/types";
import { readJson, STORE_KEYS, writeJson } from "@/lib/storage";

type StoreState = {
  campaigns: HoodlistCampaign[];
  snapshots: HolderSnapshotMeta[];
  draft: HoodlistCampaign | null;
};

const empty: StoreState = {
  campaigns: [],
  snapshots: [],
  draft: null,
};

let memory = empty;
let hydrated = false;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function persist(next: StoreState) {
  memory = next;
  writeJson(STORE_KEYS.campaigns, next.campaigns);
  writeJson(STORE_KEYS.draft, next.draft);
  emit();
}

function load(): StoreState {
  return {
    campaigns: readJson<HoodlistCampaign[]>(STORE_KEYS.campaigns, []),
    snapshots: [],
    draft: readJson<HoodlistCampaign | null>(STORE_KEYS.draft, null),
  };
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): StoreState {
  if (!hydrated) {
    memory = load();
    hydrated = true;
  }
  return memory;
}

function getServerSnapshot(): StoreState {
  return empty;
}

type StoreApi = StoreState & {
  hydrate: () => void;
  setDraft: (draft: HoodlistCampaign) => void;
  startDraft: () => HoodlistCampaign;
  saveCampaign: (campaign: HoodlistCampaign) => void;
  deleteCampaign: (id: string) => void;
  takeSnapshot: () => Promise<HolderSnapshotMeta>;
};

const StoreContext = createContext<StoreApi | null>(null);

async function fetchSnapshotList(): Promise<HolderSnapshotMeta[]> {
  const response = await fetch("/api/snapshots");
  const json = (await response.json()) as {
    snapshots?: HolderSnapshotMeta[];
    error?: string;
  };
  if (!response.ok) throw new Error(json.error ?? "Could not load snapshots.");
  return json.snapshots ?? [];
}

async function migrateLocalSnapshots(remote: HolderSnapshotMeta[]) {
  if (remote.length > 0) return remote;
  const local = readJson<unknown[]>(STORE_KEYS.snapshots, []);
  if (local.length === 0) return remote;

  const migrated: HolderSnapshotMeta[] = [];
  for (const item of local) {
    const snapshot = parseSnapshot(item);
    if (!snapshot) continue;
    const response = await fetch("/api/snapshots", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ snapshot }),
    });
    const json = (await response.json()) as {
      snapshot?: HolderSnapshotMeta;
      error?: string;
    };
    if (!response.ok || !json.snapshot) {
      throw new Error(json.error ?? "Could not migrate local snapshots.");
    }
    migrated.push(json.snapshot);
  }
  window.localStorage.removeItem(STORE_KEYS.snapshots);
  return migrated.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const remote = await fetchSnapshotList();
        const snapshots = await migrateLocalSnapshots(remote);
        if (!cancelled) persist({ ...memory, snapshots });
      } catch {
        if (!cancelled) emit();
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const hydrate = useCallback(() => {
    persist(load());
  }, []);

  const setDraft = useCallback((draft: HoodlistCampaign) => {
    persist({ ...memory, draft });
  }, []);

  const startDraft = useCallback(() => {
    const draft = memory.draft ?? createDraftCampaign();
    persist({ ...memory, draft });
    return draft;
  }, []);

  const saveCampaign = useCallback((campaign: HoodlistCampaign) => {
    const existing = memory.campaigns.some((item) => item.id === campaign.id);
    const campaigns = existing
      ? memory.campaigns.map((item) =>
          item.id === campaign.id ? campaign : item,
        )
      : [campaign, ...memory.campaigns];
    persist({ ...memory, campaigns, draft: null });
  }, []);

  const deleteCampaign = useCallback((id: string) => {
    persist({
      ...memory,
      campaigns: memory.campaigns.filter((item) => item.id !== id),
    });
  }, []);

  const takeSnapshot = useCallback(async () => {
    const response = await fetch("/api/snapshots", { method: "POST" });
    const json = (await response.json()) as {
      snapshot?: HolderSnapshotMeta;
      error?: string;
    };
    if (!response.ok || !json.snapshot) {
      throw new Error(json.error ?? "Snapshot failed");
    }
    persist({
      ...memory,
      snapshots: [
        json.snapshot,
        ...memory.snapshots.filter((item) => item.id !== json.snapshot?.id),
      ],
    });
    return json.snapshot;
  }, []);

  const value = useMemo<StoreApi>(
    () => ({
      ...state,
      hydrate,
      setDraft,
      startDraft,
      saveCampaign,
      deleteCampaign,
      takeSnapshot,
    }),
    [
      state,
      hydrate,
      setDraft,
      startDraft,
      saveCampaign,
      deleteCampaign,
      takeSnapshot,
    ],
  );

  return (
    <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}

export async function fetchSnapshotById(id: string): Promise<HolderSnapshot> {
  const response = await fetch(`/api/snapshots/${id}`);
  const json = (await response.json()) as {
    snapshot?: HolderSnapshot;
    error?: string;
  };
  if (!response.ok || !json.snapshot) {
    throw new Error(json.error ?? "Snapshot not found.");
  }
  const parsed = parseSnapshot(json.snapshot);
  if (!parsed) throw new Error("Snapshot not found.");
  return parsed;
}
