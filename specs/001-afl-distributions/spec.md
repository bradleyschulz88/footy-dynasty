# Feature Specification: AFL Central Distributions & Equalisation Funding

**Feature Branch**: `001-afl-distributions`

**Created**: 2026-07-03

**Status**: Draft

**Input**: User description: "AFL central distributions and equalisation funding — every club in the top two tiers receives an annual league distribution (the single biggest income line for most real AFL clubs), with a need-based equalisation tilt for clubs lower on the ladder / with weaker revenue; shown in the Finances income breakdown and season-start news; scaled against existing tier finance constants; deterministic; unit-tested."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Season-start distribution payment (Priority: P1)

As the manager of a tier-1 (AFL) or tier-2 (state league) club, at the start of each season my club receives the league's central distribution into club cash, and I'm told about it in the news feed — because in real footy this is the biggest single line of club income and its absence makes the economy feel like a soccer pyramid, not the AFL.

**Why this priority**: This is the core mechanic — money actually arriving. Without it nothing else in the feature exists.

**Independent Test**: Start a season with a tier-1 club; club cash increases by the distribution amount and a news item reports it. Repeat with a tier-3 club; nothing is paid and no news appears.

**Acceptance Scenarios**:

1. **Given** a tier-1 club at season start, **When** the new season begins, **Then** club cash increases by the full AFL distribution and a news item reads "💰 AFL distribution received: $X.XM (incl. $Y equalisation support)".
2. **Given** a tier-2 club at season start, **When** the new season begins, **Then** a smaller state-league distribution is paid and reported the same way.
3. **Given** a tier-3 or tier-4 club, **When** the new season begins, **Then** no distribution is paid and no distribution news appears.

---

### User Story 2 - Equalisation tilt for struggling clubs (Priority: P2)

As the manager of a club that finished low on the ladder, my distribution includes a need-based equalisation top-up — finishing last should come with a funding cushion, so a rebuild is viable rather than a death spiral, mirroring the AFL's real competitive-balance policy.

**Why this priority**: The tilt is what makes the distribution strategic rather than a flat constant; it softens relegation-battle death spirals.

**Independent Test**: Compute the distribution for the same club with last-place vs first-place prior ladder finishes; the last-place amount is strictly higher, and equalisation never decreases as ladder position worsens.

**Acceptance Scenarios**:

1. **Given** two otherwise identical tier-1 clubs, **When** one finished 18th and one finished 1st last season, **Then** the 18th-placed club receives a larger total distribution (base + bigger equalisation top-up) and the premier receives the base only (or minimal top-up).
2. **Given** any two ladder positions A < B (A finished higher), **When** distributions are computed, **Then** the equalisation component for B is greater than or equal to A's (monotonic — never punished for being lower).
3. **Given** a club in its first season (no prior ladder), **When** the distribution is computed, **Then** a sensible mid-table default applies rather than an error.

---

### User Story 3 - Distribution visible in club finances (Priority: P3)

As a manager reviewing Club → Finances, I can see "AFL Distribution" as its own labelled income line in the annual income breakdown for tier-1/2 clubs, so the income mix reads like a real AFL annual report.

**Why this priority**: Transparency/UI polish on top of the working mechanic.

**Independent Test**: Open Club → Finances with a tier-1 career; an "AFL Distribution" row appears with the correct amount. With a tier-3 career the row is absent.

**Acceptance Scenarios**:

1. **Given** a tier-1 career, **When** viewing the income breakdown, **Then** an "AFL Distribution" row shows the season's distribution amount.
2. **Given** a tier-3/4 career, **When** viewing the income breakdown, **Then** no distribution row is rendered (existing conditional-row pattern).

---

### Edge Cases

- First season of a career (no prior ladder record): use a mid-table equalisation default.
- Club promoted from tier 2 to tier 1 (or relegated): the distribution follows the tier the club is **in** for the new season.
- Ladder sizes differ by competition (e.g. 10-team state league vs 18-team AFL): the tilt normalises by ladder size, not absolute position.
- Missing/corrupt `annualIncome` on old saves: treat as tier baseline (no equalisation revenue tilt), never NaN.
- The payment must be applied exactly once per season (no double-pay on save/load or re-entering the season-start block).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST pay an annual league distribution to the club at season start for tier-1 and tier-2 competitions, and MUST NOT pay one for tier-3/4.
- **FR-002**: The distribution MUST consist of a tier-scaled base plus a need-based equalisation component.
- **FR-003**: The equalisation component MUST be monotonic in prior ladder finish — a club that finished lower never receives less equalisation than one that finished higher (all else equal).
- **FR-004**: The equalisation component MUST also weight club revenue need — clubs with weaker annual income receive more support; the strongest-revenue premier receives base only (or minimal top-up).
- **FR-005**: The total tier-1 distribution MUST be roughly 40–60% of a tier-1 club's typical annual income, scaled from the existing tier finance constants (not hardcoded absolute dollars).
- **FR-006**: The payment MUST appear in the news feed at season start in the format "💰 AFL distribution received: $X.XM (incl. $Y equalisation support)" (tier-2 wording may say "League distribution").
- **FR-007**: The income breakdown UI MUST show "AFL Distribution" as its own row for tier-1/2 careers and omit it for tier-3/4.
- **FR-008**: The calculation MUST be deterministic for a given career state (pure function of tier, prior ladder position, ladder size, and club annual income; no unseeded randomness).
- **FR-009**: Unit tests MUST cover tier gating (zero for T3/T4), ladder-tilt monotonicity, revenue-need weighting, first-season default, and the 40–60% income share for tier 1.

### Key Entities

- **Distribution**: `{ base, equalisation, total }` for a season — derived, not stored long-term; the paid amount lands in club cash and the news feed.
- **Career finance state**: existing `career.finance.cash`, `career.finance.annualIncome`, tier via the club's league; prior ladder finish from the season-end history/ladder already recorded.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A tier-1 club's season income visibly includes a distribution worth 40–60% of its annual income; managers can point to it in the Finances screen.
- **SC-002**: A wooden-spoon tier-1 club receives at least 15% more total distribution than the premier in the same season.
- **SC-003**: Tier-3/4 community careers see zero change to their economy (no new income line, no news).
- **SC-004**: All existing tests keep passing; new unit tests cover the five behaviours in FR-009.

## Assumptions

- The distribution is paid once, in the existing season-start finance block (where other annual items already happen), so no new timing infrastructure is needed.
- Prior-season ladder position comes from what the game already records at season end (career history / final ladder); a first season uses a mid-table default.
- Tier-2 distribution scales from tier-2 finance constants at a smaller share (state leagues distribute less than the AFL).
- Existing tier finance constants (`TIER_FINANCE`) remain the single source of scale — this feature multiplies them rather than introducing new absolute dollar constants.
- AI/off-screen clubs do not need individual cash tracking for this feature (the game models the player's club finances only), but the calculation must be club-agnostic so it can be applied to AI clubs later.
