# Feature Specification: VFL / Reserves Affiliate

**Feature Branch**: `005-reserves-affiliate`

**Created**: 2026-07-06

**Status**: Draft

**Input**: Give fringe players somewhere to BE. Every match week, available players outside the 23 automatically play for the club's reserves affiliate: they generate a stat line, their form moves on merit, young players develop faster than idling, and standouts push for senior recall. Abstract weekly resolution (no full second fixture), tier-gated to T1/T2 (real VFL/state-league affiliates), visible where recall decisions happen (the Depth view) plus a weekly standout news line.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Fringe players play reserves every week (Priority: P1)

As a manager, players I leave out of the 23 no longer rot: each match week the available ones turn out for the reserves, produce a believable stat line (disposals/goals), and their form rises or falls on that performance — so a fringe player can genuinely play his way into (or out of) my thinking.

**Why this priority**: This is the mechanic — the reserves round happening at all.

**Independent Test**: Advance a T1 match week; every uninjured, unsuspended non-23 player has a fresh reserves stat line, and their form moved plausibly. Injured/suspended players got nothing.

**Acceptance Scenarios**:

1. **Given** a T1/T2 club after a match week, **When** I inspect a fit non-23 player, **Then** they carry a reserves stat line from that round and their form changed within a plausible band.
2. **Given** an injured or suspended non-23 player, **When** the reserves round runs, **Then** they get no stat line and no form change from it.
3. **Given** a strong reserves performance, **When** the news feed updates, **Then** a standout line appears (e.g. "🏉 Reserves: J. Smith 32 disposals, 2 goals — knocking on the door").

---

### User Story 2 - Recall decisions informed in the Depth view (Priority: P2)

As a manager on the Squad → Depth view, each out-of-23 player's row shows their latest reserves line ("28d 2g"), so promotion decisions are made on current reserves output, not memory.

**Independent Test**: After a match week, open Depth: non-23 rows show the latest reserves line; players in the 23 don't show one.

**Acceptance Scenarios**:

1. **Given** the Depth view after a reserves round, **When** viewing a depth player's row, **Then** their latest reserves stat line is visible.
2. **Given** a player promoted into the 23, **When** viewing their row, **Then** no reserves line is shown for them (they're in the seniors now).

---

### User Story 3 - Reserves develop the kids (Priority: P3)

As a manager, young players (under 23) playing reserves develop meaningfully faster than they would sitting idle — the reserves are a development pathway, and being benched no longer stalls a prospect.

**Independent Test**: Simulate weeks with a 19-year-old outside the 23: attribute/overall growth exceeds the previous idle behaviour; a 30-year-old gets no such boost.

**Acceptance Scenarios**:

1. **Given** an under-23 player in the reserves round, **When** the week resolves, **Then** they receive a small development tick (bounded, deterministic given the seeded roll).
2. **Given** a veteran in the reserves, **When** the week resolves, **Then** form/fitness move but no youth development tick applies.

---

### Edge Cases

- Tier 3/4: no reserves affiliate — community clubs field one side; the existing weeks-without-game behaviour is unchanged there.
- Bye/pre-season weeks: reserves only run on senior match weeks (same trigger as the existing not-in-lineup processing).
- Empty bench (everyone in the 23): the round is a no-op, no news.
- Morale: reserves games soften the benched-morale sting (they're playing footy) but don't remove it — senior selection is still what players want.
- Old saves: no migration; the stat line simply appears after the next round.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: On each senior match week at tier 1/2, every available (not injured/suspended) player outside the 23 MUST receive a reserves stat line (disposals, goals) scaled to their ability, via the seeded random source.
- **FR-002**: Reserves performance MUST move the player's form within a bounded band (good games up, poor games down), replacing form stagnation for fringe players.
- **FR-003**: Players under 23 MUST receive a small bounded development tick from reserves minutes; older players MUST NOT.
- **FR-004**: The benched-morale penalty MUST be softened (not removed) for players who got reserves minutes; tier 3/4 behaviour is unchanged.
- **FR-005**: The round's best performer(s) MUST produce one news line per week (only when standouts exist).
- **FR-006**: The Depth view MUST show each out-of-23 player's latest reserves line; players in the 23 show none.
- **FR-007**: The reserves resolution MUST be deterministic under the seeded rng and a pure function of (player, roll) per player.
- **FR-008**: Unit tests MUST cover: tier gating (T3/T4 no-op), injured/suspended exclusion, form-band bounds, youth-only development, standout selection, determinism under seedRng.

### Key Entities

- **Reserves line (per player, transient)**: `p.lastReserves = { round, disposals, goals, rating }` — overwritten each round.
- **No new career-level state** beyond the per-player line; news uses the existing feed.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: After any senior match week at T1/T2, 100% of fit non-23 players carry a current reserves line.
- **SC-002**: A fringe player's form can climb into selection range purely through reserves output (observable in the Depth ordering).
- **SC-003**: Under-23 players outside the senior side develop measurably faster than the old idle behaviour; veterans are unchanged.
- **SC-004**: T3/T4 careers behave exactly as before; all existing tests keep passing; new tests cover FR-008.

## Assumptions

- Abstract resolution (stat line + effects), not a simulated second fixture — the affiliate's own ladder/results are out of scope for this slice.
- Reserves lines use the same statistical flavour as senior box scores (disposals/goals) so the language matches the rest of the game.
- The existing `weeksWithoutGame` counter still increments (players still want senior footy); only the morale sting is softened at T1/T2.
