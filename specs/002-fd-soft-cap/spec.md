# Feature Specification: Football-Department Soft Cap & Luxury Tax

**Feature Branch**: `002-fd-soft-cap`

**Created**: 2026-07-03

**Status**: Draft

**Input**: User description: "A second cap, separate from the player salary cap, governing football-department (staff/coaching) spend. Clubs may exceed the soft cap but pay a luxury tax (~75% of the excess) at season end. Tier-scaled for T1/T2, absent for T3/T4 volunteer clubs. Visible gauge in the Staff area; hiring surfaces the cap position but never blocks. Deterministic, unit-tested."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Luxury tax on over-cap spend (Priority: P1)

As a manager who stacked an elite coaching panel, at season end my club pays a football-department tax of ~75% of the amount my staff wages exceeded the soft cap — with a news item spelling it out. Spending big on the football department becomes a genuine strategic trade-off (edge on the field vs cash off it), mirroring the AFL's real soft-cap policy.

**Why this priority**: The tax is the mechanic; without a consequence the cap is decoration.

**Independent Test**: Run a season end with staff wages above the cap → cash drops by 75% of the excess and news explains it. At/under the cap → nothing happens.

**Acceptance Scenarios**:

1. **Given** a tier-1 club whose staff wages exceed the soft cap by $400k, **When** the season ends, **Then** club cash decreases by ~$300k and news reads "🧾 Football department tax: $400k over the soft cap → $300k levy".
2. **Given** staff wages at or under the cap, **When** the season ends, **Then** no levy is charged and no tax news appears.
3. **Given** a tier-3/4 club (volunteer staff), **When** the season ends, **Then** no cap applies and nothing is charged, regardless of staff spend.

---

### User Story 2 - Cap gauge in the Staff area (Priority: P2)

As a manager on the Staff screen, I can always see "Football Dept: $X / $Y cap" with a fill bar that turns warning-coloured when I'm over — so the tax never feels like a surprise.

**Why this priority**: Visibility makes the trade-off playable; without it the tax feels random.

**Independent Test**: Open Squad → Staff in a T1 career: gauge shows spend vs cap with correct colour state. T3/T4 career: no gauge.

**Acceptance Scenarios**:

1. **Given** a tier-1/2 career, **When** viewing the Staff area, **Then** a gauge shows current staff wages vs the soft cap, green/neutral under cap and warning-coloured when over, including the projected levy when over.
2. **Given** a tier-3/4 career, **When** viewing the Staff area, **Then** no cap gauge is shown.

---

### User Story 3 - Informed hiring, never blocked (Priority: P3)

As a manager hiring or upgrading staff from the market, I can see how the hire moves me relative to the cap (e.g. "takes you $180k over the soft cap") before confirming — but the game never stops me. Soft cap = tax, not a hard stop.

**Why this priority**: Decision-time context completes the loop; the mechanic still works without it.

**Independent Test**: With spend near the cap, open the staff market: each candidate shows its cap impact; hiring over the cap succeeds.

**Acceptance Scenarios**:

1. **Given** a staff-market candidate whose wage would push total spend over the cap, **When** viewing the candidate, **Then** the over-cap consequence is visible before hiring.
2. **Given** any cap position, **When** I confirm a hire, **Then** the hire always completes (no hard block).

---

### Edge Cases

- Staff list empty or wages missing → spend 0, never NaN; no tax.
- The cap is evaluated at season end against the league the club played that season.
- The levy charges cash normally even if it sends cash negative — the existing insolvency system already handles negative cash.
- Old saves: everything derives from current staff wages; no migration.
- Levy rounding: whole dollars.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST define a football-department soft cap for tier-1 and tier-2 clubs, derived from existing tier finance scales (no new absolute dollar constants), and no cap (null) for tiers 3–4.
- **FR-002**: At season end, staff wages above the cap MUST incur a levy of 75% of the excess, charged to club cash once, with the news item "🧾 Football department tax: $X over the soft cap → $Y levy".
- **FR-003**: At/under the cap MUST incur nothing (no levy, no news).
- **FR-004**: The Staff area MUST show a spend-vs-cap gauge for tier-1/2 (warning state + projected levy when over) and hide it for tier-3/4.
- **FR-005**: Staff hiring/upgrading MUST surface the cap impact of the decision but MUST NOT block any hire.
- **FR-006**: The cap and levy calculation MUST be a deterministic pure function of tier and staff-wage total.
- **FR-007**: Unit tests MUST cover: cap null for T3/T4; zero levy at/under cap; 75% levy on excess; determinism; NaN-safety on empty staff.

### Key Entities

- **Soft cap snapshot**: derived per tier — `{ cap, spend, over, levy }`; nothing persisted.
- **Career state touched**: `career.finance.cash` (levy at season end), `career.news` (tax item); staff spend read from existing `career.staff[].wage`.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A manager can state their cap position ("$1.86M of $2.1M") directly from the Staff screen at any time.
- **SC-002**: Exceeding the cap by $X always costs exactly 0.75·X at season end — verifiable from the news item and cash delta.
- **SC-003**: T3/T4 community careers are entirely unaffected (no gauge, no levy, no news).
- **SC-004**: No hire is ever prevented by the cap; all existing tests keep passing; new tests cover FR-007.

## Assumptions

- The cap anchors to the tier's staff-wage economy: cap ≈ 130% of a typical full staff bill for the tier, expressed as a share of existing `TIER_FINANCE.wageBudget` — a club with a standard panel sits comfortably under; only deliberate premium panels go over.
- The levy charges in the existing season-end finance flow (same place other end-of-season money moves), once per season.
- The player salary cap remains completely separate and untouched.
- AI clubs are not levied (the finance engine models the player's club only), consistent with the rest of the economy.
