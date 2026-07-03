# Quickstart: validating AFL Distributions

## Prerequisites
```bash
cd footy-dynasty && npm ci
```

## Unit validation (primary check)
```bash
npm run test -- --run src/lib/__tests__/distribution.test.js
```
Expected: green tests covering — T3/T4 → 0 · ladder monotonicity (equalisation never decreases as position worsens) · revenue-need weighting · first-season mid-table default · T1 total ∈ 40–60% of `TIER_FINANCE[1].annualIncome` · spooner ≥ premier × 1.15.

## Full suite + build
```bash
npm run test -- --run && npm run build
```
Expected: everything passes (848+ tests), clean build.

## Manual end-to-end
1. `npm run dev`, start (or load) a **tier-1** career.
2. Advance through to a new season start.
3. **News feed**: "💰 AFL distribution received: $X.XM (incl. $Y equalisation support)" appears once.
4. **Club → Finances**: income breakdown shows an **AFL Distribution** row; cash jumped by the same amount.
5. Repeat with a **tier-3/4** community career: no news item, no row, economy unchanged (SC-003).
6. (Tilt spot-check) Finish a season last vs first with save states: the wooden-spoon distribution is visibly larger (SC-002).

## References
- Spec: [spec.md](./spec.md) · Model & formulas: [data-model.md](./data-model.md) · Decisions: [research.md](./research.md)
