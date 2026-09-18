import { test } from "node:test";
import assert from "node:assert/strict";
import { parseSnapshot, parseSnapshotMeta } from "./snapshot";
import type { HolderSnapshot } from "./types";

const snapshot: HolderSnapshot = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  createdAt: "2026-09-18T00:00:00.000Z",
  label: "CCFF00",
  source: "live",
  collectionName: "CCFF00",
  contract: "0xabc",
  uniqueWallets: 1,
  totalNfts: 2,
  holders: [
    {
      wallet: "0x123",
      balance: 2,
      tokenIds: ["1", "2"],
      traits: [],
      ens: null,
    },
  ],
};

test("parses snapshot metadata and full snapshots", () => {
  assert.equal(parseSnapshotMeta(snapshot)?.id, snapshot.id);
  assert.equal(parseSnapshot(snapshot)?.holders.length, 1);
  assert.equal(parseSnapshot({ ...snapshot, holders: "nope" }), null);
  assert.equal(parseSnapshotMeta({ ...snapshot, id: "../secret" }), null);
});
