# Implementation Plan: Football-Department Soft Cap & Luxury Tax

**Branch**: `002-fd-soft-cap` | **Date**: 2026-07-03 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-fd-soft-cap/spec.md`

> Small feature: Phase-0 research and Phase-1 data model are folded into this file (decisions D1–D4 and the model table below) rather than separate documents.

## Summary

A second, staff-only cap: `footballDeptCap(tier)` (T1/T2 as a share of `TIER_FINANCE.wageBudget`, null for T3/T4) and pure `footballDeptLevy({tier, staffWages})` → `{cap, spend, over, levy}` with levy = 75% of the over-cap excess. Levy charged once at season end beside the existing prize-money cash movement (`careerAdvance.js` ~1211–1225) with the spec's news line. Gauge in Club → Staff tab; staff-market candidates in SquadScreen show their cap impact; hires never blocked.

## Technical Context

**Language/Version**: JavaScript (ES2022), React 18 · **Dependencies**: none new · **Storage**: none (derived; cash/news only) · **Testing**: vitest, new `src/lib/__tests__/footballDeptCap.test.js` · **Platform**: Vite PWA · **Constraints**: deterministic; zero T3/T4 impact; soft cap never blocks · **Scope**: 1 new lib file, 1 test file, 4 edits

## Decisions (research folded in)

- **D1 Cap anchor**: `FOOTBALL_DEPT_CAP_SHARE = { 1: 0.16, 2: 0.16 }` of `TIER_FINANCE.wageBudget` → T1 ≈ $2.08M (matches spec's "$2.1M cap" example, ~130% of a standard panel), T2 ≈ $224k. Shares of existing constants, no new absolute dollars (FR-001).
- **D2 Levy site**: season-end beside `applyPrizeMoney` (careerAdvance.js ~1217) — runs exactly once, same "end-of-season money" moment. Alternative (season start) rejected: tax should hit the season the spend occurred.
- **D3 Pure fn home**: new `src/lib/finance/footballDept.js` (constants stay in `finance/constants.js`).
- **D4 UI**: gauge in `ClubScreen.jsx` `StaffTab` (line ~2256) using the existing Bar/panel primitives; per-candidate cap impact line in SquadScreen's staff-market card (~1854). No blocking anywhere (FR-005).

## Data model (folded in)

| Fn | Inputs | Output |
|---|---|---|
| `footballDeptCap(tier)` | tier 1–4 | dollars or `null` (T3/T4/unknown) |
| `footballDeptLevy({tier, staffWages})` | staffWages ≥ 0 (NaN→0) | `{cap, spend, over, levy}`; `over = max(0, spend−cap)`, `levy = round(0.75·over)`; all-zero/cap-null for T3/T4 |

Career state touched: `finance.cash` (−levy at season end), `news` (tax item). Nothing persisted.

## Constitution Check (repo CLAUDE.md — the .specify constitution is an unfilled template)

| Gate | Verdict |
|---|---|
| Reuse (rung 2) | ✅ shares of `TIER_FINANCE.wageBudget`; existing staff-wage sum pattern; existing Bar/panel UI primitives; prize-money site |
| No unrequested abstractions | ✅ two pure functions, one constant |
| Fewest files / smallest diff | ✅ 1 lib + 1 test new; 4 surgical edits |
| `ponytail:` on shortcuts | ✅ AI-clubs-not-levied noted in footballDept.js |
| One runnable check | ✅ footballDeptCap.test.js (FR-007) |
| Deterministic | ✅ no rng anywhere |

**Post-design re-check**: PASS.

## Project Structure

```text
footy-dynasty/src/
├── lib/
│   ├── finance/
│   │   ├── constants.js         # EDIT: + FOOTBALL_DEPT_CAP_SHARE + LEVY rate
│   │   └── footballDept.js      # NEW: footballDeptCap(), footballDeptLevy()
│   ├── careerAdvance.js         # EDIT: season-end levy + news (beside applyPrizeMoney)
│   └── __tests__/footballDeptCap.test.js  # NEW
└── screens/
    ├── club/ClubScreen.jsx      # EDIT: StaffTab cap gauge (T1/T2 only)
    └── squad/SquadScreen.jsx    # EDIT: staff-market candidate cap-impact line
```

## Quickstart (validation)

`npm run test -- --run src/lib/__tests__/footballDeptCap.test.js` → green (T3/T4 null; zero at/under; 75% over; determinism; NaN-safe). Full: `npm run test -- --run && npm run build`. Manual: T1 career → Club → Staff shows "Football Dept: $X / $Y cap"; stack premium staff over cap → season end charges 75% with 🧾 news; T3 career shows no gauge, pays nothing.

## Phase 2 handoff

`/speckit-tasks`: US1 = constants + footballDept.js + season-end levy + tests; US2 = StaffTab gauge; US3 = staff-market impact line; polish = full suite/build + PR.
