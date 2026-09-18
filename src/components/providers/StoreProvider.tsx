"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { createDraftCampaign } from "@/lib/campaign/defaults";
import type { HoodlistCampaign } from "@/lib/campaign/types";
import type { HolderSnapshot } from "@/lib/holders/types";
import { readJson, STORE_KEYS, writeJson } from "@/lib/storage";

type StoreState = {
  campaigns: HoodlistCampaign[];
  snapshots: HolderSnapshot[];
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
  writeJson(STORE_KEYS.snapshots, next.snapshots);
  writeJson(STORE_KEYS.draft, next.draft);
  emit();
}

function load(): StoreState {
  return {
    campaigns: readJson<HoodlistCampaign[]>(STORE_KEYS.campaigns, []),
    snapshots: readJson<HolderSnapshot[]>(STORE_KEYS.snapshots, []),
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
  saveSnapshot: (snapshot: HolderSnapshot) => void;
};

const StoreContext = createContext<StoreApi | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

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

  const saveSnapshot = useCallback((snapshot: HolderSnapshot) => {
    persist({
      ...memory,
      snapshots: [snapshot, ...memory.snapshots],
    });
  }, []);

  const value = useMemo<StoreApi>(
    () => ({
      ...state,
      hydrate,
      setDraft,
      startDraft,
      saveCampaign,
      deleteCampaign,
      saveSnapshot,
    }),
    [
      state,
      hydrate,
      setDraft,
      startDraft,
      saveCampaign,
      deleteCampaign,
      saveSnapshot,
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
