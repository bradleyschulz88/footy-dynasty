# Feature Specification: End-of-Season List Management

**Feature Branch**: `006-list-management`
**Created**: 2026-07-06
**Status**: Draft
**Input**: Formal list-size limits with an end-of-season lodgement. Each tier has a maximum senior list size; after retirements/departures, a club over the max must trim to fit (lowest-rated fringe delisted), with a list-lodged summary. A visible list-size indicator lets managers manage toward the cap through the season.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - List trimmed to the cap at season end (Priority: P1)
As a manager whose list is over the maximum after re-signings and recruits, at season end my club is trimmed to the cap — the lowest-rated fringe players are delisted — with a clear summary, so the list obeys real AFL size rules.

**Independent Test**: End a season with a T1 list above the max → it's trimmed to exactly the max, the delisted players leave with a 'delisted' reason, and a list-lodged news line appears. A list at/under the cap is untouched.

**Acceptance Scenarios**:
1. **Given** a T1 club with more survivors than the list max, **When** the season ends, **Then** the list is reduced to the max by delisting the lowest-rated survivors, and a "📋 List lodged: N/max — X delisted" news line appears.
2. **Given** a list at or under the max, **When** the season ends, **Then** nobody is delisted for size and the summary reports N/max with 0 delisted.
3. **Given** a delisted player, **When** the season summary is read, **Then** they appear as 'delisted' (distinct from retired/released/walked).

### User Story 2 - Visible list-size indicator (Priority: P2)
As a manager, a list-size indicator ("List: 41 / 44") is visible in the squad area with a warning state when over the cap, so I can manage toward the limit before it's forced.

**Independent Test**: Open the squad in a T1 career: the indicator shows size / max, warning-coloured when over.

**Acceptance Scenarios**:
1. **Given** a T1/T2 career, **When** viewing the squad, **Then** a list-size indicator shows current size vs the tier max, warning-coloured when over.
2. **Given** a T3/T4 community career, **When** viewing the squad, **Then** the looser community limit (or none) is reflected without a punitive warning.

### Edge Cases
- Never delist below the minimum viable size (trim only removes the excess above max, never past it).
- Ties on rating: deterministic ordering (rating then id) so the trim is reproducible.
- Protected players: those with senior contract years remaining are trimmed last (fringe/expiring first); a club that is over the cap purely with contracted players still trims lowest-rated (list rules bind).
- Old saves: derives from the current squad; no migration.

## Requirements *(mandatory)*
- **FR-001**: Each tier MUST have a maximum senior list size (derived constant); community tiers use a looser cap.
- **FR-002**: At season end, after retirements/departures, a squad exceeding the max MUST be trimmed to exactly the max by delisting the lowest-rated players, deterministically.
- **FR-003**: Delisted players MUST be recorded with a distinct 'delisted' reason and included in the season's departures/hall-of-fame archive.
- **FR-004**: A season-end list-lodged summary news line MUST report final size vs max and the number delisted.
- **FR-005**: A squad-area indicator MUST show current list size vs the tier max with a warning state when over.
- **FR-006**: The trim MUST be a deterministic pure function of (squad, max); never remove below the max; stable tie-break.
- **FR-007**: Unit tests MUST cover: no trim at/under cap; trim to exactly max; lowest-rated removed; deterministic tie-break; tier limits.

## Success Criteria *(mandatory)*
- **SC-001**: No T1 club ever carries more than the list max into a new season.
- **SC-002**: A manager can read their list size vs cap from the squad at any time.
- **SC-003**: The delisted set is always the lowest-rated excess, reproducibly.
- **SC-004**: Existing tests pass; new tests cover FR-007.

## Assumptions
- Senior-list caps (T1 44, T2 40, T3/T4 40 loose) are the slice; a separate rookie list and pre-season/mature-age signing windows are out of scope here.
- Trim ranks by overall then id (stable) and removes the lowest first; contracted vs expiring is not separately protected in this slice (documented shortcut).
