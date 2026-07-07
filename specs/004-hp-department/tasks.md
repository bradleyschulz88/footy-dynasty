# Tasks: High-Performance / Sports-Science Department

**Input**: `/specs/004-hp-department/` (plan folded into this file + spec Assumptions). **Tests**: included (FR-007). Paths relative to `footy-dynasty/`.

**Plan (folded):** pure `hpEffects(level, tier)` → `{injuryRateMult, recoveryWeeksBonus, preseasonFitnessBonus, cost, label}` in NEW `src/lib/finance/highPerformance.js`; `HP_LEVELS` + `HP_COST_SHARE` in `finance/constants.js`; `career.hpLevel` (default 1 for T1/T2, forced 0/volunteer for T3/T4). Wire: injuryRateMult into `effectiveInjuryRate` (engine.js) via a career-derived factor; recoveryWeeksBonus into `applyTypedInjury` (~2452) + training-injury path (~1822) alongside the s6 medReduction; preseasonFitnessBonus into the pre-season/bye fitness gains (~2224); annual cost deducted in the season-start block (T1/T2). Panel with level control in ClubScreen `StaffTab`. Constitution: reuse medRating hooks, one pure fn, `career.hpLevel` only new field, one runnable check.

## Phase 1: Setup
- [x] T001 Branch `feat/hp-department` off latest `origin/main`

## Phase 2: Foundational
- [x] T002 `HP_LEVELS` (Minimal/Standard/Elite: injuryMult, recoveryBonus, fitnessBonus tuned monotonic+diminishing) + `HP_COST_SHARE` (of wageBudget, T1/T2 only) in `src/lib/finance/constants.js`
- [x] T003 NEW `src/lib/finance/highPerformance.js`: `hpLevelFor(career, tier)` (T3/T4→0 volunteer; default 1; clamp) + pure `hpEffects(level, tier)` → `{injuryRateMult, recoveryWeeksBonus, preseasonFitnessBonus, cost, label}` + `careerHpEffects(career, tier)`

## Phase 3: US1 — effects wired in (P1) 🎯 MVP
- [x] T004 [US1] Apply `injuryRateMult` in `effectiveInjuryRate` (engine.js) — accept an HP factor derived from career, or multiply at the two call sites in careerAdvance.js (match ~2448, training ~1817)
- [x] T005 [US1] Add `recoveryWeeksBonus` to the layoff reduction in `applyTypedInjury` (~2452) and the training-injury path (~1822), stacking with s6 medReduction (floor injured ≥ 1 week)
- [x] T006 [US1] Add `preseasonFitnessBonus` to pre-season/bye fitness gains (~2224) and deduct annual HP cost in the season-start block (T1/T2 only) with a news line
- [x] T007 [P] [US1] NEW `src/lib/__tests__/highPerformance.test.js`: monotonic (mult non-increasing, bonuses non-decreasing with level); diminishing returns; T3/T4→level 0, cost 0; cost rises with level & scales with tier; determinism; old-save default

## Phase 4: US2/US3 — Staff panel (P2/P3)
- [x] T008 [US2/US3] HP panel in ClubScreen `StaffTab`: level + cost + three effect figures; level buttons for T1/T2 (updateCareer hpLevel); fixed volunteer baseline shown for T3/T4

## Phase 5: Polish
- [x] T009 Full `npm run test -- --run` + `npm run build` green
- [x] T010 Commit, push `feat/hp-department`, open PR

Dependencies: T001→T002→T003→{T004,T005,T006,T007}→T008→T009→T010
