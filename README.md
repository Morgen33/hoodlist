# Hoodlist

Hoodlist is Hoodstreet Media's holder-based allowlist system for the CCFF00 collection.

Partner projects choose who qualifies, what they receive, how much they receive, how many people can participate, and how ownership is verified. Hoodlist builds the wallet list from current CCFF00 holders.

Wallets are never duplicated per NFT. A wallet that holds 10 CCFF00 appears once with a balance of 10.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Architecture

Campaign rules live in `src/lib/campaign` and are independent of the UI. Holder aggregation lives in `src/lib/holders`. Adding a new eligibility, reward, allocation, or verification method means extending those discriminated unions and handling the new `type` in the engine — the wizard can then expose it as another option.

CCFF00 holder data is pulled from Robinhood Chain. The app tries Blockscout first, then falls back to the public RPC (`ownerOf` grouped by wallet) if the explorer is blocked. Results are cached for 10 minutes.

Campaigns and snapshots are stored in the browser until a backend is connected. Dashboard stats use that real local data, or zero when nothing has been created yet.
