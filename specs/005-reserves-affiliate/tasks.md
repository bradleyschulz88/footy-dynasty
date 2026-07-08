# Tasks: VFL / Reserves Affiliate

**Input**: `/specs/005-reserves-affiliate/` (plan folded here + spec Assumptions). **Tests**: included (FR-008). Paths relative to `footy-dynasty/`.

**Plan (folded):** pure per-player `reservesGame(player, rolls)` + round orchestrator `playReservesRound(players)` (uses seeded `rng`/`rand` from rng.js) in NEW `src/lib/reserves.js` → returns `{updates: Map<id, patch>, standout}`. Wire into the `!playedThisWeek` branch of `applyPlayerMatchEffects` (careerAdvance.js ~2352): T1/T2 + available → apply reserves patch (lastReserves line, bounded form move, u23 dev tick, softened morale sting every 3rd week instead of every week ≥2); standout news line after the map. Depth view: show `p.lastReserves` line on out-of-23 rows in `DepthRow` (SquadScreen.jsx). Constitution: one new lib + one test file, hook into the existing branch, no new career-level state.

## Phase 1: Setup
- [x] T001 Branch `feat/reserves-affiliate` off latest `origin/main`

## Phase 2: Foundational
- [x] T002 NEW `src/lib/reserves.js`: `reservesGame(player)` — ability-scaled disposals/goals via `rand`, rating 0–10; bounded form delta (−4…+6); u23 dev tick (small overall/potential-capped bump); returns patch. `playReservesRound(players)` maps available players, picks standout (best rating, min threshold). Deterministic under `seedRng`.

## Phase 3: US1 — weekly reserves round (P1) 🎯 MVP
- [x] T003 [US1] Wire into `applyPlayerMatchEffects` `!playedThisWeek` branch (~2352): tier ≤ 2 and available → apply reserves patch + soften benched-morale sting (only every 3rd week out); T3/T4 and unavailable unchanged. Standout news `🏉 Reserves: {name} {d} disposals, {g} goals — knocking on the door.` after the squad map, in `src/lib/careerAdvance.js`
- [x] T004 [P] [US1+US3] NEW `src/lib/__tests__/reserves.test.js`: determinism under seedRng; form delta within band; u23 dev tick present, veteran absent; standout = highest rating & null when no players; injured/suspended excluded by orchestrator; stat lines scale with overall

## Phase 4: US2 — Depth view line (P2)
- [x] T005 [US2] Show `p.lastReserves` ("{d}d {g}g" micro-stat) on out-of-23 rows only, in `DepthRow`, `src/screens/squad/SquadScreen.jsx`

## Phase 5: Polish
- [x] T006 Full `npm run test -- --run` + `npm run build` green
- [x] T007 Commit, push, PR

Dependencies: T001→T002→{T003, T004}→T005→T006→T007
