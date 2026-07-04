# Data Model: AFL Central Distributions

## Distribution (derived, never persisted)

```
seasonDistribution({ tier, ladderPos, ladderSize, annualIncome }) → {
  base:         number  // tier-scaled guaranteed component ($)
  equalisation: number  // need-based top-up ($), ≥ 0
  total:        number  // base + equalisation
}
```

| Input | Type | Source | Default / validation |
|---|---|---|---|
| `tier` | 1–4 | `leagueTierOf(career)` (finance/engine.js) | tiers 3–4 → `{0,0,0}` |
| `ladderPos` | int ≥ 1 | `career.history[last].position` | first season → `ceil(ladderSize/2)`; clamped to `[1, ladderSize]` |
| `ladderSize` | int ≥ 2 | competition club count (`competitionClubsForCareer(...).length` or league size) | fallback 18 (T1) / 10 (T2) |
| `annualIncome` | number | `career.finance.annualIncome` | missing/NaN → `TIER_FINANCE[tier].annualIncome` (revenue need = 0) |

### Derivation rules

- `ladderNeed = (ladderPos − 1) / (ladderSize − 1)` ∈ [0, 1]
- `revenueNeed = clamp(1 − annualIncome / TIER_FINANCE[tier].annualIncome, 0, 1)`
- `base = TIER_FINANCE[tier].annualIncome × BASE_SHARE[tier]`
- `equalisation = TIER_FINANCE[tier].annualIncome × EQ_MAX_SHARE[tier] × (0.7·ladderNeed + 0.3·revenueNeed)`
- All outputs rounded to whole dollars; deterministic (no rng).

### Constants (new, in finance/constants.js)

```
DISTRIBUTION_SHARES = {
  1: { base: 0.40, eqMax: 0.18 },   // premier ≈ 40% of annualIncome; spooner ≈ 52–58%
  2: { base: 0.25, eqMax: 0.10 },
}   // ponytail: T3/T4 intentionally absent — community clubs get grants, not league distributions.
```

## Touched career state

| Field | Change |
|---|---|
| `career.finance.cash` | `+ total` once, in the season-start finance block |
| `career.news` | one info item, spec-format string |
| `incomeBreakdown(career)` return | new `distribution` line + included in `grandTotal` |

No new persisted fields; no save-format migration needed.
