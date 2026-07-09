# Tasks: Sponsorship Tiers & Negotiation Stance
**Input**: `/specs/008-sponsorship/`. Tests included (FR-006). Paths relative to `footy-dynasty/`.
**Plan (folded):** NEW `src/lib/finance/sponsorTiers.js` — pure `sponsorTier(offer)` → {key,label,color}; `negotiateStance(offer, stance)` → {annualValue, yearsLeft} (balanced/value/term, term floor 1, NaN-safe); `SPONSOR_STANCES` const for the UI. Wire a stance 3-way toggle + tier badge into `SponsorOfferCard` (ClubScreen); accept uses the stance-adjusted offer. Preserve existing counter/clause.

## Phase 1: Setup
- [x] T001 Branch `feat/sponsorship-tiers` off latest `origin/main`
## Phase 2: Foundational
- [x] T002 NEW `src/lib/finance/sponsorTiers.js`: `sponsorTier(offer)`, `negotiateStance(offer, stance)`, exported `SPONSOR_STANCES` list ({key,label,desc})
## Phase 3: US1 — stance trade-off (P1) 🎯 MVP
- [x] T003 [US1] In `SponsorOfferCard` (ClubScreen ~1740): stance toggle (Balanced/Front-loaded/Long-term); display + accept use `negotiateStance(offer, stance)`; keep counter/clause working on the adjusted base
- [x] T004 [P] [US1+US2] NEW `src/lib/__tests__/sponsorTiers.test.js`: value stance ↑value/↓term(floor1); term stance ↓value/↑term; balanced identity; NaN/zero safe; tier classification Major/Apparel/Minor; determinism
## Phase 4: US2 — tier badge (P2)
- [x] T005 [US2] Tier badge in `SponsorOfferCard` header and (if simple) the signed-sponsor list row
## Phase 5: Polish
- [x] T006 Full test + build green
- [x] T007 Commit, push, PR
Dependencies: T001→T002→{T003,T004,T005}→T006→T007
