# Tasks: Member Numbers as a First-Class Metric

**Input**: `/specs/003-member-numbers/` (small feature: plan folded into spec Assumptions + this file). **Tests**: included (FR-006). **Paths** relative to `footy-dynasty/`.

Plan notes (folded): pure `memberCount(tier, membershipBase)` + `careerMemberCount(career, tier)` in NEW `src/lib/finance/membership.js`; `MEMBER_BASE = {1:55_000, 2:4_500, 3:300, 4:60}` in `finance/constants.js`; season-start tally/record block in `careerAdvance.js` beside the distribution payment (writes `lastMemberCount {count,tier}` + `memberRecord`); Finances stat in `ClubScreen.jsx`. Constitution: pure fn, reuse membershipBase machinery, 2 persisted fields only, one runnable check.

## Phase 1: Setup
- [x] T001 Branch `feat/member-numbers` off latest `origin/main`

## Phase 2: Foundational
- [x] T002 `MEMBER_BASE` constants in `src/lib/finance/constants.js`
- [x] T003 NEW `src/lib/finance/membership.js`: pure `memberCount(tier, membershipBase)` (clamped 0.5–2.5 like engine, NaN-safe) + `careerMemberCount(career, tier)`

## Phase 3: US1 — visible count (P1) 🎯 MVP
- [x] T004 [US1] Member-count stat on the Finances screen in `src/screens/club/ClubScreen.jsx`

## Phase 4: US2+US3 — tally news, delta, record (P2/P3)
- [x] T005 [US2] Season-start tally block in `src/lib/careerAdvance.js`: news `📈 Membership tally: N` with YoY delta when `lastMemberCount.tier` matches current tier; update `lastMemberCount`; suppress delta across tier change
- [x] T006 [US3] Record handling in same block: `🎉 Club record membership: N!` when count > `memberRecord` (seed silently on first season); persist new record

## Phase 5: Tests + polish
- [x] T007 [P] NEW `src/lib/__tests__/membership.test.js`: tier scaling; proportional to membershipBase; clamp; NaN/old-save safety; determinism
- [x] T008 Full `npm run test -- --run` + `npm run build` green
- [x] T009 Commit, push, PR

Dependencies: T001 → T002 → T003 → {T004, T005+T006, T007} → T008 → T009
