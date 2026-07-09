# Feature Specification: Sponsorship Tiers & Negotiation Stance

**Feature Branch**: `008-sponsorship`
**Created**: 2026-07-09
**Status**: Draft
**Input**: Build on the existing sponsor system. Make sponsor TIERS meaningful (Major / Apparel / Minor — shown as a labelled badge), and add a negotiation STANCE trade-off to each offer: Balanced (as offered), Front-loaded (more cash now, shorter term), or Long-term (lower annual value, longer security). Pure, deterministic adjustment; the existing accept/counter/clause flow is preserved.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Choose a negotiation stance on an offer (Priority: P1)
As a manager weighing a sponsor offer, I pick a stance — take more money up front on a shorter deal, or lock in a longer, slightly cheaper deal for security — before signing, so sponsorship becomes a real trade-off, not just accept/decline.

**Independent Test**: On a sponsor offer, switch stance to Front-loaded → the annual value rises and the term shortens; Long-term → value drops and term lengthens; signing persists the adjusted deal.

**Acceptance Scenarios**:
1. **Given** a sponsor offer, **When** I select "Front-loaded", **Then** the displayed annual value is higher and the term is one year shorter than Balanced.
2. **Given** the same offer, **When** I select "Long-term", **Then** the annual value is lower and the term is longer than Balanced.
3. **Given** any stance, **When** I accept, **Then** the signed sponsor carries the stance-adjusted annual value and term.

### User Story 2 - Sponsor tier is legible (Priority: P2)
As a manager, each sponsor/offer shows a tier badge (Major / Apparel / Minor) so I can read the pecking order of my commercial book at a glance.

**Independent Test**: Offers and signed sponsors show a coloured tier badge derived from their type.

**Acceptance Scenarios**:
1. **Given** a "Major"/"Premier" sponsor, **When** viewing it, **Then** a Major tier badge shows.
2. **Given** an "Apparel" sponsor, **When** viewing it, **Then** an Apparel badge shows; others show Minor.

### Edge Cases
- Front-loaded never drops the term below 1 year.
- Missing/zero value: stance adjustment is a safe no-op (returns the base), never NaN.
- Unknown/absent type: classified as Minor.
- The existing counter-offer and clause flows are unchanged and compose with the chosen stance.

## Requirements *(mandatory)*
- **FR-001**: Each offer MUST support three negotiation stances via a deterministic pure function: Balanced (identity), Front-loaded (higher annual value, term −1, floored at 1), Long-term (lower annual value, term +N).
- **FR-002**: Accepting an offer under a stance MUST persist the stance-adjusted annual value and term.
- **FR-003**: Every sponsor/offer MUST map to a tier (Major / Apparel / Minor) via a deterministic pure function of its type; the tier MUST be shown as a labelled badge.
- **FR-004**: Stance adjustment MUST be NaN-safe and never reduce the term below 1.
- **FR-005**: Existing accept / counter / performance-clause behaviour MUST be preserved.
- **FR-006**: Unit tests MUST cover the three stance transforms (direction + term floor), tier classification, and determinism/NaN-safety.

### Key Entities
- **Sponsor tier**: `{ key, label, color }` derived from `offer.type`.
- **Stance**: `'balanced' | 'value' | 'term'` → transforms `{annualValue, yearsLeft}`.

## Success Criteria *(mandatory)*
- **SC-001**: A manager can convert an offer into a higher-cash-shorter or lower-cash-longer deal and sign it.
- **SC-002**: Every sponsor shows a readable tier badge.
- **SC-003**: Existing sponsor tests keep passing; new tests cover FR-006.

## Assumptions
- Front-loaded ≈ +18% value / −1yr; Long-term ≈ −10% value / +2yr (tunable constants), enough to make the choice matter without unbalancing the economy.
- Tier is presentational + ordering; it does not change base value (which the existing generator already varies).
