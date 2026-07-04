# Research: AFL Central Distributions & Equalisation Funding

No open NEEDS CLARIFICATION items — every decision resolves from the existing codebase or the spec. Decisions recorded for the record:

## D1 — Where the money lands
- **Decision**: Pay in the existing season-start finance block in `src/lib/careerAdvance.js` (~line 1355–1380), alongside the T3/T4 registration-fee branches, as a new T1/T2 branch.
- **Rationale**: That block already runs exactly once per season start and already writes `c.finance.cash` + a news item — reusing it satisfies the "exactly once" edge case with zero new timing infrastructure.
- **Alternatives**: Weekly drip via `continuousAnnualIncome` (rejected — real distributions are lump/quarterly and the news moment is part of the feature); paying in `finishSeason` (rejected — belongs to the *new* season's tier after promotion/relegation).

## D2 — Calculation shape
- **Decision**: Pure function `seasonDistribution({ tier, ladderPos, ladderSize, annualIncome })` → `{ base, equalisation, total }` in a new small module `src/lib/finance/distribution.js`.
- **Rationale**: Pure + deterministic (FR-008), trivially unit-testable (FR-009), club-agnostic (spec assumption for future AI use). New file keeps `engine.js` from growing; constants imported from `finance/constants.js`.
- **Alternatives**: Method inside `engine.js` (acceptable, but engine.js is already long and this is a self-contained calculation).

## D3 — Scale anchors
- **Decision**: `base = TIER_FINANCE[tier].annualIncome × BASE_SHARE[tier]`, equalisation up to `× EQ_MAX_SHARE[tier]`, with T1 shares chosen so base+midtable-equalisation ≈ 45–55% of annual income (FR-005) and wooden-spooner ≥ premier +15% (SC-002). T2 gets smaller shares; T3/T4 → `{0,0,0}`.
- **Rationale**: Multiplying the existing tier constants (not new absolute dollars) keeps the economy balanced if tiers are retuned — per spec assumption.

## D4 — Equalisation inputs
- **Decision**: Ladder need = `(ladderPos − 1) / (ladderSize − 1)` (0 for premier, 1 for wooden spoon — normalises any ladder size); revenue need = `clamp(1 − annualIncome / TIER_FINANCE[tier].annualIncome, 0, 1)`. Equalisation = `EQ_MAX × (0.7 × ladderNeed + 0.3 × revenueNeed)`. Monotonic in ladderPos by construction (FR-003).
- **Prior ladder source**: `career.history[last].position` (written by `finishSeason`); first season defaults to mid-table `ceil(ladderSize / 2)`.
- **Rationale**: Linear blend is the simplest monotonic form; 70/30 weights ladder as the primary AFL signal with revenue as secondary support.

## D5 — UI + news
- **Decision**: Add `distribution` to `incomeBreakdown()`'s returned object + `grandTotal`; render via the existing conditional-row pattern in `ClubScreen.jsx` (`...(inc.distribution > 0 ? [{ label: "AFL Distribution", ... }] : [])`). News uses the spec string, "League distribution" wording for T2.
- **Rationale**: Exactly the pattern used for bar/canteen/regFees rows — no new UI machinery.
