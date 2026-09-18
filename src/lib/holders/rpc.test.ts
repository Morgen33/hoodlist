import { test } from "node:test";
import assert from "node:assert/strict";
import { ownersFromNftTransfers } from "./rpc";

const TRANSFER =
  "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";

test("uses the latest NFT transfer, not ERC-20 transfers", () => {
  const owners = ownersFromNftTransfers([
    {
      topics: [
        TRANSFER,
        "0x0000000000000000000000000000000000000000000000000000000000000000",
        "0x000000000000000000000000aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
        "0x0000000000000000000000000000000000000000000000000000000000000016",
      ],
      blockNumber: "0x1",
      logIndex: "0x0",
    },
    {
      topics: [
        TRANSFER,
        "0x000000000000000000000000aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
        "0x000000000000000000000000bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
        "0x0000000000000000000000000000000000000000000000000000000000000016",
      ],
      blockNumber: "0x2",
      logIndex: "0x1",
    },
    {
      topics: [
        TRANSFER,
        "0x000000000000000000000000aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
        "0x000000000000000000000000cccccccccccccccccccccccccccccccccccccccc",
      ],
      blockNumber: "0x3",
      logIndex: "0x0",
    },
  ]);

  assert.equal(owners.size, 1);
  assert.equal(
    owners.get("22"),
    "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
  );
});
