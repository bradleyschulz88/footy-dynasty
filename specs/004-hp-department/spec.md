# Feature Specification: High-Performance / Sports-Science Department

**Feature Branch**: `004-hp-department`

**Created**: 2026-07-05

**Status**: Draft

**Input**: Turn the existing medical-staff injury reduction into a fundable department budget with an on-field payoff — the natural partner to the typed injury system. A per-season investment level (Minimal / Standard / Elite) costs money and scales three outputs: injury rate, recovery speed, and pre-season fitness gains. Tier-gated (T1/T2 real program; T3/T4 volunteer baseline). Deterministic, unit-tested.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Invest for fewer, shorter injuries (Priority: P1)

As a manager, I choose a sports-science investment level for the season; higher investment costs more cash but means fewer injuries, faster recoveries, and fitter players out of pre-season. It's a real budget trade-off — an edge on the field paid for off it.

**Why this priority**: This is the mechanic — money in, three measurable outputs out.

**Independent Test**: Set investment to Elite on a T1 club → cash is deducted, and across a season injuries are fewer and layoffs shorter than at Minimal.

**Acceptance Scenarios**:

1. **Given** a tier-1 club, **When** I raise HP investment from Standard to Elite, **Then** the annual cost rises, the injury-rate multiplier drops, the recovery bonus rises, and the pre-season fitness bonus rises.
2. **Given** any investment level, **When** an injury occurs, **Then** its layoff is shortened by the recovery bonus (stacking with existing medical staff), and injuries occur less often at higher investment.
3. **Given** pre-season, **When** players build fitness, **Then** higher HP investment adds a larger fitness bonus.

---

### User Story 2 - See exactly what my money buys (Priority: P2)

As a manager on the Staff screen, a High-Performance panel shows my current level, its annual cost, and its three effects in plain numbers ("Injury risk −18% · recovery +1.5wk · pre-season fitness +6"), so the spend is legible before I commit.

**Independent Test**: Open Squad → Staff (or Club → Staff) on a T1 career: the panel shows level, cost, and the three effect figures; changing level updates them.

**Acceptance Scenarios**:

1. **Given** a tier-1/2 career, **When** viewing the HP panel, **Then** the current level, its cost, and all three effect figures are shown, with controls to change level.
2. **Given** the strongest level, **When** compared to the weakest, **Then** every effect figure is at least as good (never worse) — diminishing returns, but monotonic.

---

### User Story 3 - Community clubs stay volunteer-run (Priority: P3)

As a manager of a tier-3/4 community club, I get a fixed volunteer-baseline HP program — a small, free, fixed effect — with no big-budget option, because grassroots clubs don't run high-performance departments.

**Independent Test**: On a T3/T4 career the HP panel shows a fixed volunteer baseline (or is hidden), costs nothing, and offers no paid upgrade.

**Acceptance Scenarios**:

1. **Given** a tier-3/4 career, **When** viewing HP, **Then** only the volunteer baseline applies — no cost, no paid levels.
2. **Given** a tier-3/4 club, **When** the season's costs are tallied, **Then** no HP spend is deducted.

---

### Edge Cases

- Missing/old-save HP level: default to the tier's standard baseline; never NaN; no retroactive charge.
- Cash can't cover Elite: the level is still selectable (informed choice); the deduction happens like any other cost and may push cash negative — the insolvency system already handles that. (No hard block, consistent with the soft-cap feature.)
- Promotion/relegation: the level's cost and available range follow the tier the club is in for the new season.
- The HP effect stacks with the existing medical-staff (s6) recovery reduction — it doesn't replace it.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: A per-season HP investment level MUST be stored on the career and settable by the manager for tier-1/2 clubs (at least three levels incl. a minimal option); tier-3/4 clubs are fixed to a free volunteer baseline.
- **FR-002**: The level MUST map, via a deterministic pure function, to three outputs — injury-rate multiplier (≤1, lower = fewer injuries), recovery-weeks bonus (≥0, shorter layoffs), and pre-season fitness bonus (≥0) — plus an annual cost.
- **FR-003**: All three outputs MUST be monotonic in investment (more never worsens any output) with diminishing returns, and cost MUST rise with level.
- **FR-004**: The injury-rate multiplier MUST reduce the effective injury probability; the recovery bonus MUST shorten injury layoffs (match and training paths), stacking with existing medical staff; the fitness bonus MUST add to pre-season fitness gains.
- **FR-005**: The annual HP cost MUST be deducted from club cash once per season for tier-1/2 (scaled from existing tier finance constants — no new absolute dollars); tier-3/4 costs nothing.
- **FR-006**: A Staff-area panel MUST show the current level, its cost, and its three effect figures, with controls to change level (tier-1/2); tier-3/4 shows the fixed baseline with no paid upgrade.
- **FR-007**: Unit tests MUST cover monotonicity, diminishing returns, tier gating (T3/T4 volunteer only, zero cost), cost scaling with level, and determinism.

### Key Entities

- **HP level**: an integer/enum on `career.hpLevel` (e.g. 0 Minimal, 1 Standard, 2 Elite); T3/T4 pinned to the volunteer baseline.
- **HP effects (derived)**: `{ injuryRateMult, recoveryWeeksBonus, preseasonFitnessBonus, cost }` — a pure function of level and tier; nothing else persisted.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Over a full season, an Elite-invested T1 club suffers measurably fewer injury-weeks lost than the same club at Minimal.
- **SC-002**: The manager can read the exact cost and the three effects from the Staff panel before committing.
- **SC-003**: T3/T4 community careers incur no HP cost and see only the fixed volunteer baseline.
- **SC-004**: All existing tests keep passing; new tests cover FR-007.

## Assumptions

- Cost scales from `TIER_FINANCE.wageBudget` (e.g. Elite ≈ a small % of the wage budget), so it competes with the football-department soft cap for cash without new absolute constants.
- Three levels for T1/T2 (Minimal/Standard/Elite) is enough; a continuous dollar slider is out of scope for this slice.
- The HP injury-rate multiplier is applied inside the existing effective-injury-rate path so match and training injuries both benefit; the recovery bonus extends the existing s6 medical reduction rather than replacing it.
- Default level for a new/old-save T1/T2 career is Standard; T3/T4 is always the volunteer baseline.
