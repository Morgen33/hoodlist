import { test } from "node:test";
import assert from "node:assert/strict";
import { aggregateHoldersByWallet } from "./aggregate";

test("groups many NFTs under one wallet", () => {
  const holders = aggregateHoldersByWallet([
    { tokenId: "22", owner: "0x123", traits: [] },
    { tokenId: "48", owner: "0x123", traits: [] },
    { tokenId: "91", owner: "0xABC", traits: [] },
  ]);

  assert.equal(holders.length, 2);
  assert.equal(holders[0]?.wallet, "0x123");
  assert.equal(holders[0]?.balance, 2);
  assert.deepEqual(holders[0]?.tokenIds, ["22", "48"]);
  assert.equal(holders[1]?.balance, 1);
});
