# Feature Specification: Member Numbers as a First-Class Metric

**Feature Branch**: `003-member-numbers`

**Created**: 2026-07-03

**Status**: Draft

**Input**: User description: "Promote membership from the hidden membershipBase multiplier to a visible member COUNT — the off-field ladder of AFL club health. Season-start tally news with year-on-year delta, all-time club record moments, and a visible stat in the club finances. Derived from existing machinery (membershipBase × tier base), no new economy."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Visible member count (Priority: P1)

As a manager, I can see my club's membership number (e.g. "61,420 members") on the club Finances screen — the number AFL clubs and fans actually brag about, growing and shrinking with my on-field success through the existing milestone system.

**Why this priority**: The visible number IS the feature.

**Independent Test**: Open Club → Finances in any career: a member count shows, scaled sensibly for the tier (T1 tens of thousands, T4 dozens). Improve membershipBase (e.g. premiership milestone) → the count rises proportionally.

**Acceptance Scenarios**:

1. **Given** a tier-1 career with default membership health, **When** viewing Finances, **Then** a member count in the tens of thousands is shown.
2. **Given** membershipBase rises via an existing milestone (premiership/finals/promotion), **When** viewing again next season, **Then** the count is proportionally higher; relegation/wooden-spoon lowers it.

---

### User Story 2 - Season-start tally + year-on-year delta (Priority: P2)

As a manager at season start, the news feed reports the membership tally with the change since last season ("📈 Membership tally: 64,850 — up 2,300 on last year"), so the off-field consequence of my season is a moment, not a silent multiplier.

**Independent Test**: Advance across a season boundary → tally news appears with a correct delta vs the previous season's count.

**Acceptance Scenarios**:

1. **Given** a completed season with a finals appearance, **When** the new season starts, **Then** the tally news shows an increased count and positive delta.
2. **Given** the first season of a career (no prior tally), **When** the season starts, **Then** the tally shows without a delta.

---

### User Story 3 - All-time club record moments (Priority: P3)

As a manager, when membership passes the club's all-time record under my tenure, I get a record news moment ("🎉 Club record membership: 71,120!") — mirrored from the real AFL's yearly record announcements.

**Independent Test**: Push the count above the stored record across a season boundary → record news fires once and the new record persists; a lower following season fires nothing.

**Acceptance Scenarios**:

1. **Given** a season-start tally above the stored record, **When** the tally is reported, **Then** a record news item fires and the record updates.
2. **Given** a tally below the record, **When** reported, **Then** no record item fires and the record stands.

---

### Edge Cases

- First season: no delta, and the opening tally seeds the record baseline silently (no record news for merely existing).
- Old saves without the new fields: derive from current membershipBase; no migration, no NaN.
- Tier changes (promotion/relegation): count follows the new tier's scale — the news delta is suppressed across tier changes (comparing member counts across tiers is meaningless).
- T4 grassroots clubs: tiny counts (dozens) are fine and shown; the mechanic is identical.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Member count MUST be derived purely from existing state (tier scale × membershipBase) — no second source of truth for membership health.
- **FR-002**: The count MUST be visible on the club Finances screen for all tiers.
- **FR-003**: At season start, a tally news item MUST report the count, with a year-on-year delta when a comparable previous count exists (same tier), omitted otherwise.
- **FR-004**: An all-time club record MUST be tracked; beating it fires a record news item exactly once per new record.
- **FR-005**: The derivation MUST be deterministic and NaN-safe on old saves.
- **FR-006**: Unit tests MUST cover tier scaling, proportionality to membershipBase, delta/tier-change suppression, record fire-once semantics, and old-save safety.

### Key Entities

- **Member count**: derived — `round(MEMBER_BASE[tier] × membershipBase)`.
- **Persisted (2 small fields)**: `career.lastMemberCount` `{count, tier}` for the YoY delta; `career.memberRecord` for the all-time record.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A manager can quote their membership number from the Finances screen at any time, at any tier.
- **SC-002**: Every season start produces exactly one tally news item; records fire only when actually beaten.
- **SC-003**: A premiership visibly grows the count next season; relegation visibly shrinks it.
- **SC-004**: All existing tests keep passing; new tests cover FR-006.

## Assumptions

- MEMBER_BASE per tier anchors to realistic AFL scales (T1 ≈ 55k at health 1.0 → 27k–137k across the multiplier range, matching real records ~135k; T2 ≈ 4.5k; T3 ≈ 300; T4 ≈ 60).
- Membership *income* remains exactly as modelled today (INCOME_MIX share) — this feature adds the metric and its moments, not a new revenue formula.
- A pre-season membership-drive campaign (price vs volume) is deliberately out of scope for this slice; the existing milestone system remains the sole driver.
