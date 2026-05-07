## Summary

End-to-end rebuild of the Footy Dynasty finance system: kills five real bugs, wires every difficulty multiplier into the engine, adds a proper weekly cashflow loop, and introduces sponsor + contract lifecycles, prize money, promotion/relegation ripple, insolvency events, and a Tier-3 fundraiser pressure-valve. New `lib/finance/*` modules carry the logic; `AFLManager.jsx` wires it in; `SAVE_VERSION` bumps to 4 with a v3 → v4 migrator.

### Bugs fixed
- **Stadium schema corruption** — `facilities.stadium` was being stamped as the integer `1` in three places, breaking ground-condition floor and `stadium.level` reads. Migrator repairs existing saves.
- **Difficulty multipliers ignored** — `injuryMultiplier`, `scoutAccuracyBonus`, `capOverflow`, `transferBudgetMultiplier` were read at career creation only, then discarded. Now wired into the actual code paths.
- **Wage cap bypassed** — only `TradeTab` enforced the cap. Now every signing path uses `canAffordSigning(career, wage)` (trade, draft, youth promote, rookie promote, local sign, accept-trade-offer, contract renewal).
- **Sponsors never expired** — `yearsLeft` was set at generation and only ever incremented. Now decrements at season end, expired ones drop with news.
- **Transfer budget never refilled** — once spent, gone for life. Now refilled each season with a 30% rollover of unused budget.
- **Cashflow only ticked on rounds** — wages and sponsors weren't paid during the ~13-week pre-season. Now ticks every ISO week.

### New modules
- `lib/finance/constants.js` — single source of truth for tier baselines, prize money, fundraiser ranges, contract demand curves, insolvency thresholds.
- `lib/finance/engine.js` — `tickWeeklyCashflow`, `recomputeAnnualIncome`, `effectiveWageCap`, `canAffordSigning`, `refillTransferBudget`, `applyPrizeMoney`, `applyPromotionRipple`, `cashCrisisLevel`, `effectiveInjuryRate`, `scoutedOverall`, `moraleClamp`.
- `lib/finance/sponsors.js` — `tickSponsorYears`, performance-weighted `proposalForRenewal` and `generateSponsorOffers`.
- `lib/finance/contracts.js` — age + form-driven `proposeRenewal`, `buildRenewalQueue`, cap-checked `applyRenewal`.

### New gameplay
- **Prize money** — premiership / runner-up / finals / wooden-spoon (tier-scaled).
- **Promotion ripple** — sponsors +30%, board confidence +20, transfer/cap refresh.
- **Relegation ripple** — sponsors halved, board confidence -25.
- **Insolvency event chain** (level 0–4) — warning → forced player sale → bank loan + sponsor flees → instant sacking trigger.
- **Tier-3 fundraisers** — random trivia night / sausage sizzle / working bee / raffle during pre-season training.
- **Community grant** — once per Tier-3 season if board confidence ≥ 60.
- **Player contract renewals** — players with `contract <= 1` enter a Renewals tab at season end with age + form-driven demands; reject = walk.

### UI
- **FinancesTab** rebuilt with cash-crisis banner, capOverflow indicator, full income breakdown, expense breakdown, bank-loan card, full-calendar weekly cashflow chart.
- **SponsorsTab** shows lost-last-season pills, renewal proposals, new offers, and the difficulty sponsor multiplier.
- **RenewalsTab** in the Squad screen.
- **SeasonSummaryScreen** Financial Year card (cash, prize money, refill, sponsors lost, ripple, crisis carry-over).
- "Renew soon" pill on the player detail panel.

### Numerical rebalance
All tier balance now lives in `finance/constants.js`. Tier 3 lifted from $90k → $180k starting cash so volunteer clubs aren't perpetually on the brink. Tier 1 cap tightened to $13M.

### Save versioning
`SAVE_VERSION = 4` with a v3 → v4 migrator that repairs broken `facilities.stadium`, defaults all new fields, and is forward-compatible.

## Test plan

- [x] Production build succeeds (543 KB JS / 33 KB CSS, 144/7 KB gzipped)
- [x] Full vitest run green: **366 tests passing across 19 files** (+53 new tests)
  - `financeEngine.test.js` — 47 tests covering cashflow tick, cap enforcement, prize money, promotion ripple, insolvency thresholds, difficulty hooks
  - `financeSponsors.test.js` — sponsor tick / proposal / acceptance / decline
  - `financeContracts.test.js` — age band demand curves, renewal application, cap-aware affordability
  - `save.test.js` — updated for v4 incl. broken-stadium repair
  - `defaults.test.js` — updated for the rebalanced tier numbers
- [ ] Manual smoke test: load an existing v3 save → confirm migrator repairs the stadium and defaults the new fields
- [ ] Manual smoke test: play a season at Tier 3 grassroots difficulty → confirm fundraisers fire, weekly cashflow is visible in FinancesTab, sponsor renewals surface at season end
- [ ] Manual smoke test: run cash to negative for 9+ weeks → confirm insolvency event chain fires correctly
