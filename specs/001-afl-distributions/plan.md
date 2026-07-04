# Implementation Plan: AFL Central Distributions & Equalisation Funding

**Branch**: `001-afl-distributions` | **Date**: 2026-07-03 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-afl-distributions/spec.md`

## Summary

Tier-1/2 clubs receive an annual league distribution at season start — a tier-scaled base plus a need-based equalisation top-up (weighted 70% prior ladder finish, 30% revenue weakness). Implemented as a pure `seasonDistribution()` function in a new `src/lib/finance/distribution.js`, paid once in the existing season-start finance block of `careerAdvance.js`, surfaced as an `AFL Distribution` row in `incomeBreakdown()` / ClubScreen and a season-start news item. All scale derives from existing `TIER_FINANCE` constants; T3/T4 are untouched.

## Technical Context

**Language/Version**: JavaScript (ES2022), React 18 — plain JSX, no TS

**Primary Dependencies**: none new; reuses `finance/constants.js`, `finance/engine.js`, `careerAdvance.js`, `ClubScreen.jsx`

**Storage**: none new — derived values only; lands in existing `career.finance.cash` + `career.news`

**Testing**: vitest (`npm run test -- --run`), new `src/lib/__tests__/distribution.test.js`

**Target Platform**: web (Vite PWA), mobile-first

**Project Type**: single-page game app

**Performance Goals**: n/a — one pure calculation per season start

**Constraints**: deterministic (FR-008); zero impact on T3/T4 economy (SC-003); minimal diff per repo CLAUDE.md

**Scale/Scope**: 3 code files edited + 1 new lib file + 1 new test file

## Constitution Check

`.specify/memory/constitution.md` is an unfilled template, so the operative constitution is the repo root `CLAUDE.md` ("Ponytail, lazy senior dev"). Gates:

| Gate | Verdict |
|---|---|
| Reuse before writing (rung 2/5) | ✅ multiplies `TIER_FINANCE`, reuses season-start block, conditional-row UI pattern, `leagueTierOf`, `clamp` |
| No unrequested abstractions | ✅ one pure function + one constants entry; no service/class layers |
| Fewest files / smallest diff | ✅ 1 new lib file (justified: engine.js already long), 1 test file, 3 edits |
| Intentional shortcuts marked `ponytail:` | ✅ T3/T4 absence + AI-clubs-not-paid noted in constants |
| Non-trivial logic leaves one runnable check | ✅ `distribution.test.js` (six behaviours, FR-009) |
| Deterministic / no `Math.random` | ✅ pure function, no rng at all |

**Post-design re-check**: PASS — design adds no violations.

## Project Structure

### Documentation (this feature)

```text
specs/001-afl-distributions/
├── plan.md              # this file
├── research.md          # D1–D5 decisions (done)
├── data-model.md        # formulas, inputs, constants (done)
├── quickstart.md        # validation guide (done)
└── tasks.md             # /speckit-tasks output (next)
```

`contracts/` intentionally omitted — internal game logic, no external interface.

### Source Code (repository root)

```text
footy-dynasty/src/
├── lib/
│   ├── finance/
│   │   ├── constants.js        # EDIT: + DISTRIBUTION_SHARES
│   │   ├── distribution.js     # NEW: seasonDistribution() pure fn
│   │   └── engine.js           # EDIT: incomeBreakdown() + distribution line
│   ├── careerAdvance.js        # EDIT: season-start block pays T1/T2 + news
│   └── __tests__/
│       └── distribution.test.js # NEW: FR-009 behaviours
└── screens/club/ClubScreen.jsx # EDIT: conditional "AFL Distribution" income row
```

## Phase 0 — Research

Complete → [research.md](./research.md). No NEEDS CLARIFICATION remained; five decisions (payment site, pure-function shape, scale anchors, equalisation inputs, UI/news pattern) all resolved from the codebase.

## Phase 1 — Design

Complete → [data-model.md](./data-model.md) (formulas, input table, new constants) and [quickstart.md](./quickstart.md) (validation guide). Key invariants: ladder-need normalised by ladder size; equalisation monotonic by construction; missing `annualIncome` degrades to revenue-need 0, never NaN; single payment guaranteed by reusing the once-per-season block.

## Phase 2 — planning handoff

`/speckit-tasks` should slice by user story: US1 (calc fn + constants + payment + news) → US2 (equalisation already inside the calc; tests prove monotonicity) → US3 (engine + ClubScreen row), then the test file and full-suite/build verification per quickstart.
