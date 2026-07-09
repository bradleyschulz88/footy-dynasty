# Feature Specification: AFLW Program (lean first slice)

**Feature Branch**: `010-aflw-program`
**Created**: 2026-07-09
**Status**: Draft
**Input**: A women's (AFLW) program for AFL-tier clubs — a lean first slice. Establish an AFLW side (small annual program cost); each season it plays an abstract, deterministic AFLW campaign and returns a result (ladder finish, record, premiership). Tier-1 only. Its own list/fixtures is a later expansion.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Establish an AFLW side and get a yearly result (Priority: P1)
As the manager of an AFL club, I establish an AFLW program; each season it plays a campaign and I get a result — where it finished, its record, and whether it won the flag — with a news line.

**Acceptance Scenarios**:
1. **Given** a T1 club with the AFLW program active, **When** the season ends, **Then** a result (position 1..N, wins, losses) is stored and a news line reports it.
2. **Given** the side finishes first and wins the decider, **When** the result resolves, **Then** an AFLW premiership is recorded and celebrated.
3. **Given** the program is inactive, **When** the season ends, **Then** no AFLW result or cost occurs.

### User Story 2 - Program visible in the club (Priority: P2)
As a manager, the club shows AFLW status — active/inactive, last result, premierships — with an Establish control.

**Acceptance Scenarios**:
1. **Given** a T1 career, **When** viewing the club overview, **Then** an AFLW panel shows status (and last result if active) with an Establish control when inactive.
2. **Given** a tier-2/3/4 career, **When** viewing the club, **Then** no AFLW program is offered.

### Edge Cases
- Not offered below tier 1. Old saves: no AFLW state; establishing seeds it. Result deterministic given season seed + strength. Cost charged only while active; may push cash negative (insolvency handles it); establishing never blocked.

## Requirements *(mandatory)*
- **FR-001**: A T1 club MUST be able to establish an AFLW program (stored on career); not offered below T1.
- **FR-002**: While active, each season MUST produce a deterministic abstract result — position (1..N), wins, losses, premiers — as a pure function of club strength + season seed.
- **FR-003**: A stronger club MUST, in expectation over seeds, finish higher than a weaker one.
- **FR-004**: A premiership MUST only be recorded at position 1; the career MUST track total AFLW premierships and the last result.
- **FR-005**: A small annual cost MUST be charged while active (scaled from existing constants), with a result/premiership news line each season.
- **FR-006**: The club UI MUST show status, last result, premiership count, and an Establish control (T1 only).
- **FR-007**: The simulation + helpers MUST be pure/deterministic (no global rng in the outcome).
- **FR-008**: Unit tests MUST cover result bounds, determinism, strength→position monotonic-in-expectation, premiers⇒position 1, tier gating, old-save safety.

### Key Entities
- **AFLW state**: `career.aflw = { active, lastResult: {season, position, wins, losses, premiers}|null, premierships }`.

## Success Criteria *(mandatory)*
- **SC-001**: An AFL-tier manager can run an AFLW side and read its yearly result.
- **SC-002**: Stronger clubs win the AFLW flag more often over time.
- **SC-003**: Non-AFL and inactive careers are unaffected.
- **SC-004**: Existing tests pass; new tests cover FR-008.

## Assumptions
- Abstract result only — full AFLW list/fixtures/management is a later expansion (documented ceiling). Strength abstracts from coach reputation / board confidence; cost anchors to a small share of tier constants; ladder ~10; seed from career season.
