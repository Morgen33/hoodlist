import { test } from "node:test";
import assert from "node:assert/strict";
import { ROBINHOOD_CHAIN, blockchainLabel } from "../chains";
import { createDraftCampaign, pinCampaignToRobinhood } from "./defaults";

test("campaigns stay on Robinhood Chain", () => {
  const campaign = createDraftCampaign();
  const pinned = pinCampaignToRobinhood({
    ...campaign,
    project: {
      ...campaign.project,
      blockchain: ROBINHOOD_CHAIN.id,
    },
  });
  assert.equal(pinned.project.blockchain, ROBINHOOD_CHAIN.id);
  assert.equal(blockchainLabel("ethereum"), ROBINHOOD_CHAIN.name);
});
