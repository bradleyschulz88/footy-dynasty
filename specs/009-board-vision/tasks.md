# Tasks: Board Vision / Multi-Year Mandate
**Input**: `/specs/009-board-vision/`. Tests included (FR-008). Paths relative to `footy-dynasty/`.
**Plan (folded):** NEW `src/lib/boardVision.js` — pure `defaultVision(season, tier)`, `evaluateBoardVision(vision, ctx)` → {achieved, expired, lines, confidenceDelta, nextVision}, `visionSummary(vision, season)` → {text, seasonsLeft, urgent}. Seed on board (ensure absent). Resolve at season end beside resolveBoardObjectivesAtSeasonEnd (careerAdvance ~955) using ctx {madeFinals:(c.finalsFinalists||[]).includes(clubId), champion, cash, season:c.season}; apply confidenceDelta via applyBoardConfidenceDelta, set career.board.vision=nextVision, push lines. Board UI mandate line above Season objectives.

## Phase 1: Setup
- [x] T001 Branch `feat/board-vision` off latest `origin/main`
## Phase 2: Foundational
- [x] T002 NEW `src/lib/boardVision.js`: `VISION_TYPES`/`defaultVision(season, tier)`, `evaluateBoardVision(vision, ctx)`, `visionSummary(vision, season)`
## Phase 3: US1 — set + judge (P1) 🎯 MVP
- [x] T003 [US1] Wire into finishSeason (careerAdvance ~955): seed vision if absent; evaluate; apply confidenceDelta + news; roll to nextVision, in `src/lib/careerAdvance.js`
- [x] T004 [P] [US1] NEW `src/lib/__tests__/boardVision.test.js`: achieved (early) → +conf & fresh vision; expired at deadline → −conf & fresh; ongoing → unchanged; tier default flavour; visionSummary seasons-left/urgent; determinism
## Phase 4: US2 — Board UI (P2)
- [x] T005 [US2] Mandate line (description + seasons left, urgent style in final season) above "Season objectives" in the Board tab, `src/screens/club/ClubScreen.jsx`
## Phase 5: Polish
- [x] T006 Full test + build green
- [x] T007 Commit, push, PR
Dependencies: T001→T002→{T003,T004,T005}→T006→T007
