# Tasks: AFLW Program (lean first slice)
**Input**: `/specs/010-aflw-program/`. Tests included (FR-008). Paths relative to `footy-dynasty/`.
**Plan (folded):** NEW `src/lib/aflw.js` — `AFLW_LADDER_SIZE`, pure `simulateAflwSeason(strength, seed)`→{position,wins,losses,premiers} (deterministic Lehmer step, no global rng), `clubAflwStrength(career)`, `aflwProgramCost(tier)`, `establishAflw(career)`, `aflwActive(career)`. Wire finishSeason: if active → charge cost, sim(seed=season), store lastResult, ++premierships, news. Panel in ClubOverviewTab (T1).
## Phase 1: Setup
- [x] T001 Branch `feat/aflw-program` off latest origin/main
## Phase 2: Foundational
- [x] T002 NEW `src/lib/aflw.js`: simulateAflwSeason, clubAflwStrength, aflwProgramCost, establishAflw, aflwActive
## Phase 3: US1 (P1)
- [x] T003 [US1] Wire into finishSeason (careerAdvance)
- [x] T004 [P] [US1] NEW `src/lib/__tests__/aflw.test.js`
## Phase 4: US2 (P2)
- [x] T005 [US2] AFLW panel in ClubOverviewTab
## Phase 5: Polish
- [x] T006 test + build green
- [x] T007 commit, push, PR
