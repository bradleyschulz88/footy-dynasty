# Footy Dynasty — Improvement Research & Backlog

> Overnight research pass. Goal: benchmark every system against **real AFL / state-league / community footy** and produce a prioritized, costed improvement backlog. Scope per the brief: report + build the safe, high-value wins.

**Status legend:** ✅ shipped this pass · 🔨 in progress · 📋 backlog (not yet built)

---

## 0. Code health baseline

- `npm run test` → all tests passing.
- `npm run build` → clean.
- `npm run lint` → **0 errors, 11 warnings** (unused imports/vars, two `react-hooks/exhaustive-deps`). Files: `TaskList.jsx`, `BottomNav.jsx`, `NotificationBell.jsx`, `TopBar.jsx`, `careerAdvance.js`, `promotionPlayoff.js`, `CareersScreen.jsx`, `HubScreen.jsx`, `SquadScreen.jsx`. → cleanup folded into this pass.

---

## 1. Progression & development — what exists & gaps

**Exists:** 7-type training rotation with age/fitness/potential/intensity/focus scaling + staff bonus (`calendar.js`); annual aging & decline curve, potential set at generation (`careerAdvance.js`, `playerGen.js`); National Draft **tier-1 only** with scouting phase, snake order, AI needs-based picks (`draftSeed.js`, `draftEngine.js`); auto-delisting (age>36 / contract≤0 / walked); season awards (Brownlow weekly votes → B&F derived, Rising Star, leading goalkicker/disposals); 9-position model with secondary positions; dynasty quests + legacy milestones + club culture + season history archive.

**Top gaps vs real footy (ranked):**
1. **No reserves/VFL development league** — no path to blood fringe players / rookies.
2. **Tiers 2 & 3 get no draft at all** — recruitment pipeline bottleneck.
3. **No father-son / next-gen / academy** mechanics (flavour only).
4. **No club Best & Fairest voting** (derived from Brownlow, not its own count).
5. **No durability attribute / injury-proneness** — all injuries feel identical.
6. **No mid-career breakout/regression** — potential is static at generation.
7. **No positional development / retooling**; no position-specific training.
8. **No cumulative award/record prestige** (Brownlow tally, club records, honour board depth).

---

## 2. Management & finance — what exists & gaps

**Exists:** tiered income (gate/broadcast/sponsor/membership/fundraisers) + ladder/fan/stadium multipliers, daily cash tick, insolvency ladder, prize money, transfer budget w/ rollover (`finance/*`); wage cap per tier w/ difficulty overflow + over-cap forced delist + rookie-list-excluded; 5-member weighted board w/ confidence, objectives, throttled comms, mid-season meetings, vote of confidence (`board.js`); 10 staff blueprints + volunteers + renewals; contract renewal demand curve + EOS queue (tier-gated) + free agents (all "UFA"); recruitment = draft (T1) / trade+FA (T1-2) / word-of-mouth (T3, just shipped); sponsor generation/renewal w/ performance gating.

**Top gaps vs real footy (ranked):**
1. **No draft-pick trading** — removes a core team-building lever (T1/2).
2. **No restricted vs unrestricted free agency** (offer-matching, pre-contract).
3. **Sacking only fires on cash crisis (wk9)** — not end-of-season performance.
4. **No minimum cap spend** (real AFL ~95% floor) — clubs can hoard space.
5. **No assistant-coach / S&C / medical match or injury impact** — staff are training-only.
6. **No list lodgement deadlines** / delisting windows / structure.
7. **No TPP-vs-cap nuance**, veteran/COLA allowances (optional depth).
8. **Tier-2 has no draft** — only trade/FA.

---

## 3. Match, tactics & season — _sweep running_

(to be filled in)

---

## 4. UX, onboarding & flavour — _sweep running_

(to be filled in)

---

## 5. Prioritized build backlog

(compiled after all four sweeps — impact × effort, with the authentic-footy "must-haves" first)
