# Footy Dynasty — roadmap & suggestions

Living backlog aligned with current code. Priorities shift; tick items off as you ship.

## Match simulation

- [x] Quarter-by-quarter flow, momentum, key moments (in `matchEngine.js`)
- [x] Tactic families with quarter-by-quarter shape (late `run`/`attack` lift, early `defensive` edge)
- [x] Bench depth nudge in Q3–Q4 (strength from top bench vs starters)
- [ ] On-ball phases (centre bounce vs stoppage vs inside-50) as separate shot chains
- [ ] Interchange carousel UI (who sits, fatigue visibility)

## List & finance

- [x] Wage cap, `effectiveWageCap`, scaling (`lib/finance/engine.js`)
- [x] Hub cap % + tight-cap copy
- [ ] Hard cap breaches with forced delisting / penalties (board-driven)
- [ ] Rookie salary bands and SSP-style list spots by tier

## AI & world

- [x] Stable per-club tactical personality blended with rating-based heuristics (`lib/aiPersonality.js`)
- [ ] Trade/draft aggression tied to personality + ladder position
- [ ] Rival clubs remember past finals

## Calendar & flavour

- [x] Themed round tags on schedule events (`lib/themedRounds.js`)
- [ ] Derbies: auto-detect same-city pairs for flavour text
- [ ] Weather / travel fatigue by distance

## Career history

- [x] Season rows in `career.history` with ladder, flags, top scorer, Brownlow
- [ ] Finals brackets archived per year
- [ ] Club best-and-fairest from in-game votes

## Meta

- [ ] PWA offline conflict resolution for saves
- [ ] Expand automated tests around full season loops
