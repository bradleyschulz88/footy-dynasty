# Feature Specification: Stadium Naming Rights

**Feature Branch**: `007-stadium-naming`
**Created**: 2026-07-06
**Status**: Draft
**Input**: A stadium naming-rights deal the club can sign — an ongoing annual income stream whose value scales with tier and stadium size. Signing grants income for a fixed term; it expires and can be re-signed (usually for more as the stadium grows). Traditionalists can decline and keep the plain ground name. Tier-scaled (real value at T1/T2; negligible for community grounds). Deterministic valuation, unit-tested.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Sign a naming-rights deal for annual income (Priority: P1)
As a manager, I sign a naming-rights deal for my home ground; each season the club banks the naming-rights money, and the deal runs for a set term before I re-sign — turning the stadium into a revenue lever, not just a gate multiplier.

**Independent Test**: Sign a deal on a T1 club → each season start pays the naming-rights value; after the term it expires with a news line; re-signing (with a bigger stadium) is worth more.

**Acceptance Scenarios**:
1. **Given** a T1 club with no deal, **When** I sign a naming-rights deal, **Then** `career.namingRights` records the sponsor name, annual value and term, and each season start pays that value with a news line.
2. **Given** an active deal, **When** its term reaches zero at season roll-over, **Then** it expires with a news line and pays nothing until re-signed.
3. **Given** a larger stadium, **When** I re-sign, **Then** the offered annual value is higher than the previous deal (value scales with stadium level and tier).

### User Story 2 - Value visible in finances (Priority: P2)
As a manager, when a deal is active a "Naming Rights" income line shows in Club → Finances, so the revenue reads like a real club's annual report.

**Independent Test**: With an active deal, the income breakdown shows a Naming Rights line at the deal's value; with no deal, no line.

**Acceptance Scenarios**:
1. **Given** an active deal, **When** viewing the income breakdown, **Then** a "Naming Rights" line shows the annual value and is in the grand total.
2. **Given** no active deal (or a community club), **When** viewing finances, **Then** no naming-rights line appears.

### Edge Cases
- Decline / no deal: no income, plain ground name, no penalty.
- Community grounds (T3/T4): naming-rights value is negligible/zero — no meaningful deal offered.
- Old saves without the field: treated as no deal; no migration.
- Re-signing while a deal is active replaces it (fresh term at current value).

## Requirements *(mandatory)*
- **FR-001**: The system MUST offer a naming-rights deal whose annual value is a deterministic function of tier and stadium level (T1/T2 meaningful; T3/T4 ~zero).
- **FR-002**: Signing MUST store `{name, annualValue, yearsLeft}` on the career; the manager may decline (no deal, no penalty).
- **FR-003**: While a deal is active, its annual value MUST be paid once at season start with a news line, and the term decremented; at zero it MUST expire with a news line.
- **FR-004**: An active deal's value MUST appear as a "Naming Rights" income line in the finances breakdown and grand total.
- **FR-005**: The valuation MUST be a deterministic pure function; no unseeded randomness in the amount.
- **FR-006**: Unit tests MUST cover tier scaling, stadium-level scaling (bigger = more), zero for community tiers, and determinism.

### Key Entities
- **Naming-rights deal**: `career.namingRights = { name, annualValue, yearsLeft } | null`.
- **Career state touched**: `finance.cash` (season-start payment), `finance` income breakdown, `news`.

## Success Criteria *(mandatory)*
- **SC-001**: A signed T1 deal pays its value every season until the term ends, visible in finances.
- **SC-002**: Re-signing after a stadium upgrade is worth strictly more.
- **SC-003**: Community careers see no meaningful naming-rights money.
- **SC-004**: Existing tests pass; new tests cover FR-006.

## Assumptions
- Deal term is a fixed number of seasons (e.g. 4); a full negotiation mini-game is out of scope for this slice.
- Value anchors to `TIER_FINANCE.annualIncome` × a small share × stadium-level factor, so no new absolute dollars.
- The sponsor name is auto-generated on signing (a plausible corporate name); custom naming is a later nicety.
