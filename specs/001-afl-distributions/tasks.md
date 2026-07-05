# Tasks: AFL Central Distributions & Equalisation Funding

**Input**: Design documents from `/specs/001-afl-distributions/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md
**Tests**: included (explicitly required by FR-009)
**Paths**: app lives in `footy-dynasty/` — all `src/...` paths below are relative to it.

## Phase 1: Setup

- [x] T001 Create git feature branch `feat/afl-distributions` off latest `origin/main` (repo root)

## Phase 2: Foundational (blocking for all stories)

- [x] T002 Add `DISTRIBUTION_SHARES` constants (`{1:{base:0.40,eqMax:0.18},2:{base:0.25,eqMax:0.10}}` with `ponytail:` note for absent T3/T4) in `src/lib/finance/constants.js`
- [x] T003 Create pure `seasonDistribution({tier, ladderPos, ladderSize, annualIncome})` → `{base, equalisation, total}` per data-model.md formulas (ladder-need normalised, revenue-need clamped, 70/30 blend, whole-dollar rounding, `{0,0,0}` for T3/T4/unknown tier) in NEW `src/lib/finance/distribution.js`

## Phase 3: User Story 1 — Season-start distribution payment (P1) 🎯 MVP

**Goal**: T1/T2 clubs get paid once at season start, with the news moment. **Independent test**: start a T1 season → cash + news; T3 season → nothing.

- [x] T004 [US1] Add helper `careerSeasonDistribution(c, league)` glue (derive tier via `leagueTierOf`, prior `ladderPos` from `c.history` last entry `.position` with mid-table default `Math.ceil(ladderSize/2)`, `ladderSize` from competition club count with 18/10 fallback, `annualIncome` from `c.finance` with NaN guard) in `src/lib/finance/distribution.js`
- [x] T005 [US1] Pay the distribution in the season-start finance block (beside the T3/T4 regFees branches, ~line 1355–1380): `c.finance.cash += total`, push news `💰 AFL distribution received: $X.XM (incl. $Y equalisation support)` (T2 wording: "League distribution"), gated to tier ≤ 2, in `src/lib/careerAdvance.js`

## Phase 4: User Story 2 — Equalisation tilt (P2)

**Goal**: prove the need-based tilt behaves. (The maths ships inside T003 — this phase locks it with tests.) **Independent test**: run the test file alone.

- [x] T006 [P] [US2] Create `src/lib/__tests__/distribution.test.js` covering: T3/T4 → `{0,0,0}`; ladder monotonicity (equalisation non-decreasing as ladderPos worsens, strict increase spooner vs premier); revenue-need weighting (poorer club ≥ richer club, same ladder); first-season default handled by glue (mid-table); T1 total ∈ 40–60% of `TIER_FINANCE[1].annualIncome` across ladder range; wooden-spooner total ≥ premier total × 1.15 (SC-002); determinism (same inputs → identical output twice)

## Phase 5: User Story 3 — Finances UI row (P3)

**Goal**: the distribution reads like an annual-report line. **Independent test**: T1 career shows the row; T3 doesn't.

- [x] T007 [US3] Add `distribution` line (via `careerSeasonDistribution`) to `incomeBreakdown()` return + `grandTotal` in `src/lib/finance/engine.js`
- [x] T008 [US3] Render conditional income row `...(inc.distribution > 0 ? [{ label: "AFL Distribution", value: inc.distribution, color: "var(--A-accent)" }] : [])` in the income breakdown list (~line 1386 area) in `src/screens/club/ClubScreen.jsx`

## Phase 6: Polish & verification

- [x] T009 Run `npm run test -- --run` (all suites green, incl. financeEngine tests — fix any `incomeBreakdown` shape assertions) and `npm run build` in `footy-dynasty/`
- [x] T010 Manual quickstart pass (see quickstart.md) + commit, push `feat/afl-distributions`, open PR

## Dependencies

- T001 → all; T002 → T003 → {T004, T006}; T004 → T005 → (US1 done)
- T006 independent of US1/US3 once T003 exists ([P] with T004/T005)
- T007 → T008; US3 depends only on T003/T004, not on US1's payment
- T009/T010 last

## Parallel example

After T003: `T004+T005` (careerAdvance path), `T006` (tests), and `T007+T008` (UI path) are three independent files/streams — run in parallel, converge at T009.

## Implementation strategy

MVP = Phases 1–3 (payment + news). Tests (Phase 4) and UI row (Phase 5) layer on without touching each other's files. Whole feature is one small PR.
