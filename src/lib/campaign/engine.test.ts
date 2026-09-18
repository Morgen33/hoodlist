import { test } from "node:test";
import assert from "node:assert/strict";
import { buildAllowlist } from "../campaign/engine";
import { defaultRules } from "../campaign/defaults";
import type { Holder } from "../holders/types";

const holders: Holder[] = [
  { wallet: "0xaaa", balance: 10, tokenIds: ["1"], traits: [], ens: null },
  { wallet: "0xbbb", balance: 2, tokenIds: ["2"], traits: [], ens: null },
  { wallet: "0xccc", balance: 1, tokenIds: ["3"], traits: [], ens: null },
];

test("min balance filters wallets, not individual NFTs", () => {
  const rules = defaultRules();
  rules.eligibility = [{ type: "min_balance", min: 3 }];
  const list = buildAllowlist(holders, rules);
  assert.equal(list.length, 1);
  assert.equal(list[0]?.wallet, "0xaaa");
  assert.equal(list[0]?.allocation, 1);
});

test("per NFT allocation uses wallet balance", () => {
  const rules = defaultRules();
  rules.allocation = { type: "per_nft", unitsPerNft: 2 };
  const list = buildAllowlist(holders, rules);
  assert.equal(list[0]?.allocation, 20);
});

test("capped campaigns limit how many wallets get in", () => {
  const rules = defaultRules();
  rules.allocation = { type: "capped", maxSpots: 2 };
  const list = buildAllowlist(holders, rules);
  assert.equal(list.length, 2);
});
