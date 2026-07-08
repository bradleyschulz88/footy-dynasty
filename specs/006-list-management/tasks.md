# Tasks: End-of-Season List Management
**Input**: `/specs/006-list-management/`. Tests included (FR-007). Paths relative to `footy-dynasty/`.
**Plan (folded):** `LIST_LIMITS` const per tier in finance/constants.js; pure `listStatus(size, tier)` + `trimToListMax(squad, max)` → `{kept, delisted}` in NEW `src/lib/listManagement.js`. Wire trim into finishSeason after `survivors` (~987) before `c.squad = survivors`: delisted → retiredThisYear reason 'delisted' + list-lodged news. Indicator in squad UI.

## Phase 1: Setup
- [x] T001 Branch `feat/list-management` off latest `origin/main`
## Phase 2: Foundational
- [x] T002 `LIST_LIMITS = {1:{max:44}, 2:{max:40}, 3:{max:40}, 4:{max:40}}` in `src/lib/finance/constants.js`
- [x] T003 NEW `src/lib/listManagement.js`: `listMax(tier)`, pure `listStatus(size, tier)` → `{size, max, over, room}`, pure `trimToListMax(squad, max)` → `{kept, delisted}` (sort overall desc, id tiebreak; delist the tail beyond max; no-op at/under)
## Phase 3: US1 — season-end trim (P1) 🎯 MVP
- [x] T004 [US1] In finishSeason after `survivors` (~987): `trimToListMax(survivors, listMax(newLeagueTier))`; push delisted into `retiredThisYear` with reason 'delisted'; `c.squad = kept`; add news `📋 List lodged: {kept}/{max} — {n} delisted`, in `src/lib/careerAdvance.js`
- [x] T005 [P] [US1] NEW `src/lib/__tests__/listManagement.test.js`: no trim at/under max; trims to exactly max; lowest-overall removed; deterministic tie-break; listMax by tier; listStatus over/room
## Phase 4: US2 — indicator (P2)
- [x] T006 [US2] List-size indicator (size / max, warning when over) in the squad Roster header, `src/screens/squad/SquadScreen.jsx`
## Phase 5: Polish
- [x] T007 Full test + build green
- [x] T008 Commit, push, PR
Dependencies: T001→T002→T003→{T004,T005}→T006→T007→T008
