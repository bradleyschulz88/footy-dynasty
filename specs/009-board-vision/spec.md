# Feature Specification: Board Vision / Multi-Year Mandate

**Feature Branch**: `009-board-vision`
**Created**: 2026-07-09
**Status**: Draft
**Input**: On top of the existing per-season board objectives, add a MULTI-SEASON mandate the board sets and judges you against — e.g. "reach the finals within three seasons". It has a deadline; achieving it early delights the board (big confidence boost) and a fresh, more ambitious mandate is set; missing it by the deadline erodes confidence. Community clubs get a survival-flavoured mandate. Visible in the Board screen with seasons remaining. Deterministic evaluation, unit-tested.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - The board sets a multi-year mandate and judges it (Priority: P1)
As a manager, the board gives me a multi-season mandate with a deadline; each season end it's checked. Meeting it (e.g. making finals) within the window lifts board confidence and earns a new, tougher mandate; letting the deadline pass unmet costs confidence — so my job has a horizon beyond next week's result.

**Independent Test**: Give a T1 career a "finals within 3 seasons" mandate; make finals → confidence rises, a fresh mandate is set. In another run, let 3 seasons pass without finals → confidence drops and a new mandate begins.

**Acceptance Scenarios**:
1. **Given** an active mandate "reach finals within 3 seasons", **When** the club makes finals within the window, **Then** board confidence rises, a "mandate achieved" news line fires, and a new (further-out) mandate is set.
2. **Given** the same mandate, **When** the deadline season passes without finals, **Then** board confidence falls, a "mandate failed" line fires, and a fresh mandate is set.
3. **Given** a mandate still inside its window and not yet met, **When** the season ends, **Then** it carries over unchanged (no confidence change, no news).

### User Story 2 - The mandate is visible with a horizon (Priority: P2)
As a manager on the Board screen, the current mandate shows its description and seasons remaining ("Mandate: reach the finals by 2028 — 2 seasons left"), so I can plan a rebuild against a real deadline.

**Independent Test**: Open the Board tab: the mandate and its remaining seasons are shown above the per-season objectives.

**Acceptance Scenarios**:
1. **Given** an active mandate, **When** viewing the Board tab, **Then** its description and seasons-left are shown, urgent-styled in the final season.

### Edge Cases
- No mandate on old saves: one is seeded at the next season resolve; no migration.
- Community tiers (T3/T4): the mandate is survival-flavoured (stay solvent/competitive), judged at the deadline.
- Early achievement: the mandate is considered met the first qualifying season, not held open to the deadline.
- Confidence is clamped 0–100 (reuses existing board confidence).

## Requirements *(mandatory)*
- **FR-001**: A multi-season board mandate MUST be stored on the career (`career.board.vision`) with a type, start season, target (deadline) season, and description.
- **FR-002**: At season end, the mandate MUST be evaluated deterministically against that season's outcome: achieved (goal met within the window), expired (deadline reached unmet), or ongoing.
- **FR-003**: Achieving the mandate MUST raise board confidence and set a fresh, further-out mandate; expiring MUST lower confidence and set a fresh mandate; ongoing MUST leave it unchanged.
- **FR-004**: Each transition (achieved / failed) MUST emit one news line.
- **FR-005**: A mandate MUST be seeded when absent; community tiers get a survival-flavoured mandate.
- **FR-006**: The Board screen MUST show the current mandate and seasons remaining.
- **FR-007**: The evaluation + summary MUST be pure/deterministic (no rng in the outcome).
- **FR-008**: Unit tests MUST cover: achieved (incl. early), expired at deadline, ongoing carry-over, tier-flavoured default, seasons-left summary, determinism.

### Key Entities
- **Board vision**: `career.board.vision = { type, description, startSeason, targetSeason, reward, penalty }`.
- **Evaluation ctx**: `{ madeFinals, champion, cash, season }` at season end.

## Success Criteria *(mandatory)*
- **SC-001**: A manager always has a visible multi-season target with a deadline.
- **SC-002**: Meeting the mandate is a clear, rewarded moment; missing it is a clear, costly one.
- **SC-003**: Existing board tests pass; new tests cover FR-008.

## Assumptions
- Mandate horizon is 3 seasons; reward/penalty are modest board-confidence deltas (e.g. +12 / −15).
- The mandate composes with (does not replace) the existing per-season objectives.
- T1/T2 default mandate is "reach the finals"; T3/T4 is "stay solvent and competitive", judged at the deadline.
