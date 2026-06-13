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

## 3. Match, tactics & season — what exists & gaps

**Exists:** steppable quarter-by-quarter sim w/ Poisson shots + accuracy tiers, form/fitness/morale/fatigue multipliers, home advantage (+4), weather × tactic, ground conditions, momentum (±9 rating swing), key moments, bench/rotation bonuses (`matchEngine.js`); 6 tactics (defensive/balanced/attack/flood/press/run) w/ goal/opp/risk/momentum + quarter patterns; half-time coaching calls (5, incl. a volatile "spray"); AI opponent tactic from club personality + rating heuristic; match-day 23 (18 + 3 followers + 5 bench), 9 positions + secondaries, lineup-balance modifier; season phases preseason/season/finals/offseason; **fixtures now a balanced double round-robin home-and-away**; themed rounds; final-8 (T1) / final-6 (T2-3); 4/2/0 ladder w/ percentage.

**Top gaps vs real footy (ranked):**
1. **AFL fixture isn't authentic** — now a full 2×(n−1) double round-robin (→ 34 rounds for 18 teams). Real AFL ≈ 23 rounds, **unbalanced**, with **bye rounds**. _(Full H&A is right for the smaller T2/T3 comps; T1 needs a capped, bye'd fixture.)_
2. **No bye rounds** anywhere.
3. **No specific player roles/archetypes** (tagger, sweeper, intercept, target forward) — all positions generic.
4. **No out-of-position penalties / positional line min-max** — can field 0 key forwards with no hit.
5. **AI tactics don't adapt to game state** (margin/momentum) — fixed pre-match.
6. **No medical sub / in-game subs / positional moves** — only one half-time call.
7. **No representative footy / state games**; thin off-season match calendar.
8. **Flat injury recovery** (1/week) — no recovery curves or durability.

---

## 4. UX, onboarding & flavour — what exists & gaps

**Exists:** multi-step setup wizard + challenge modes + difficulty meta; 6-step tutorial; arrival presser (`ArrivalBriefingFlow`); prominent ADVANCE w/ next-event context; rich TaskList (urgent/warning/suggestion deep-links); hub ground/weather/committee strips + match preview w/ scout intel, derby/bogey/finals-rivalry tags; themed rounds; news array; single journalist w/ satisfaction; tier-2/3 committee (5 volunteers, moods); 5-member board + meetings; premiership/promotion celebrations; season summary; post-match summary; coach reputation.

**Top gaps (immersion/clarity):**
1. **Journalist/media is a stub** — generated but barely surfaced; no match reports, no rivalry hype, no editorial pressure.
2. **News feed is a static bulletin** — no voice/byline, low prominence, no season-story framing.
3. **No season narrative arc** — hub shows the next step but not "3 wins from finals / board reviews in 4 weeks / run home."
4. **Rivalries/derby/bogey are flags with no storyline** — no revenge arcs, no head-to-head framing.
5. **Honours/legends thin or empty** — no club hall of fame, premiership history, B&F honour board, records.
6. **No coach legacy arc** — celebrations are one-shot; no multi-season dynasty framing/titles.
7. **Themed rounds cosmetic** — names only, no story beats.
8. **Post-match commentary generic** — same lines for every club, no rivalry callbacks.

---

## 5. Prioritized build backlog

Impact × effort. **Authentic-footy correctness first**, then depth, then flavour. Items marked ✅ are being built in this pass.

### Now (this pass — safe, high-value)
1. ✅ **Code-health cleanup** — clear the 11 lint warnings (unused imports/vars, hook deps). _0 risk._
2. ✅ **AFL fixture authenticity** — cap tier-1 to a realistic season (~22 rounds, unbalanced) instead of a 34-round double round-robin; keep full home-and-away for the smaller T2/T3 comps. _New seasons only; low save risk._
3. ✅ **AI tactics adapt to game state** — opponents shift defensive when protecting a late lead and attack when chasing, instead of a fixed pre-match tactic. _Improves every match; authentic._
4. ✅ **Season narrative arc on the hub** — an evolving 2–3 sentence "season story" (new era → finals push → run home → do-or-die) tied to ladder/board/rivalry. _Pure UI, high clarity._
5. ✅ **Club Best & Fairest (own count) + Honours board** — track a distinct club B&F across the season and populate the thin Honours tab with premierships, B&F winners, leading goalkickers and club records. _Dynasty depth._
6. ✅ **Richer match-report news** — a flavourful, rivalry/derby/margin-aware post-match line (journalist voice). _Immersion, low risk._

### Next (bigger, flagged for review)
- **Bye rounds** for tier 1 (scheduling realism).
- **Draft-pick trading** + **tier-2 draft access** + **RFA/UFA free agency** (recruitment depth).
- **Player roles/archetypes** (tagger/intercept/target) + **out-of-position penalties** + **positional line min/max**.
- **Reserves/VFL development league** + **father-son / academy** + **mid-career breakout/regression** + **durability attribute**.
- **Performance-based sacking** (end-of-season review, not only cash crisis) + **minimum cap spend**.
- **Media/journalist hub**, **pre-match build-up**, **rivalry/revenge quests**, **supporter voice**, **coach legacy titles**.
- **In-game subs / medical sub / quarter-time adjustments**.

_Notes:_ several "Next" items touch save format or core season flow — I'll flag those explicitly when built.
