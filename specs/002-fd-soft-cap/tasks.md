# Tasks: Football-Department Soft Cap & Luxury Tax

**Input**: `/specs/002-fd-soft-cap/` (plan.md folds research + data model)
**Tests**: included (FR-007). **Paths** relative to `footy-dynasty/`.

## Phase 1: Setup

- [x] T001 Create branch `feat/fd-soft-cap` off latest `origin/main` (repo root)

## Phase 2: Foundational

- [x] T002 Add `FOOTBALL_DEPT_CAP_SHARE = {1: 0.16, 2: 0.16}` (+ `FOOTBALL_DEPT_LEVY_RATE = 0.75`) in `src/lib/finance/constants.js`
- [x] T003 Create `footballDeptCap(tier)` (null for T3/T4/unknown) and pure `footballDeptLevy({tier, staffWages})` → `{cap, spend, over, levy}` (NaN-safe, whole dollars, `ponytail:` AI-clubs note) in NEW `src/lib/finance/footballDept.js`

## Phase 3: US1 — Luxury tax at season end (P1) 🎯 MVP

- [x] T004 [US1] Charge levy beside `applyPrizeMoney` (~line 1211–1225): compute from `career.staff` wage sum, `c.finance.cash -= levy` when > 0, news `🧾 Football department tax: $Xk over the soft cap → $Yk levy`, tier ≤ 2 only, in `src/lib/careerAdvance.js`
- [x] T005 [P] [US1] Tests in NEW `src/lib/__tests__/footballDeptCap.test.js`: cap null T3/T4/unknown; levy 0 at/under cap (incl. exactly-at); levy = round(0.75·excess); determinism; empty/NaN staff → 0; cap ≈ 0.16·wageBudget anchor

## Phase 4: US2 — Staff cap gauge (P2)

- [x] T006 [US2] Add "Football Dept: $X / $Y cap" gauge (fill bar; warning colour + projected levy when over; hidden T3/T4) in `StaffTab`, `src/screens/club/ClubScreen.jsx` (~2256)

## Phase 5: US3 — Informed hiring (P3)

- [x] T007 [US3] Per-candidate cap-impact line in the staff-market card ("within cap" / "takes you $Xk over → ~$Yk tax"), never blocking, in `src/screens/squad/SquadScreen.jsx` (~1854)

## Phase 6: Polish

- [x] T008 `npm run test -- --run` + `npm run build` green in `footy-dynasty/`
- [x] T009 Commit, push `feat/fd-soft-cap`, open PR

## Dependencies

T001 → all · T002 → T003 → {T004, T005 [P], T006, T007} → T008 → T009

## Strategy

MVP = Phases 1–3. US2/US3 are independent UI layers on the same pure fn.
