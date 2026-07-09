# Tasks: Stadium Naming Rights
**Input**: `/specs/007-stadium-naming/`. Tests included (FR-006). Paths relative to `footy-dynasty/`.
**Plan (folded):** `NAMING_RIGHTS` const (share of annualIncome + per-stadium-level factor + term) in finance/constants.js; pure `namingRightsValue(tier, stadiumLevel)` + `signNamingRights(career, tier)` (→ new deal object w/ generated name) + `activeNamingRights(career)` in NEW `src/lib/finance/namingRights.js`. Season-start: pay value + decrement/expire in careerAdvance.js (beside distribution block ~1377). Income line in engine.incomeBreakdown + ClubScreen row. Sign/re-sign panel in FacilitiesTab.

## Phase 1: Setup
- [x] T001 Branch `feat/stadium-naming` off latest `origin/main`
## Phase 2: Foundational
- [x] T002 `NAMING_RIGHTS = {baseShare, perLevel, termYears, minTier}` in `src/lib/finance/constants.js`
- [x] T003 NEW `src/lib/finance/namingRights.js`: pure `namingRightsValue(tier, stadiumLevel)` (0 for T3/T4; scales with tier annualIncome + stadium level, deterministic), `generateSponsorName()` (deterministic-ish list index — accept a name arg or pick[0] for purity in tests), `signNamingRights(career, tier)` → `{name, annualValue, yearsLeft}`, `activeNamingRights(career)` → deal|null
## Phase 3: US1 — pay + expiry (P1) 🎯 MVP
- [x] T004 [US1] Season-start (careerAdvance ~1377, T1/T2): if `career.namingRights` active → `cash += annualValue`, news; decrement `yearsLeft`; at 0 clear + expiry news
- [x] T005 [P] [US1] NEW `src/lib/__tests__/namingRights.test.js`: tier scaling; stadium-level monotonic; 0 for T3/T4; determinism; sign returns valid deal; re-sign at higher level worth more
## Phase 4: US2 — finances + sign UI (P2)
- [x] T006 [US2] `naming` line in `incomeBreakdown()` (engine.js) + conditional "Naming Rights" income row in ClubScreen
- [x] T007 [US2] Naming-rights panel in `FacilitiesTab` (ClubScreen): show active deal (name/value/years) or a Sign button with the offered value; re-sign replaces
## Phase 5: Polish
- [x] T008 Full test + build green
- [x] T009 Commit, push, PR
Dependencies: T001→T002→T003→{T004,T005,T006,T007}→T008→T009
