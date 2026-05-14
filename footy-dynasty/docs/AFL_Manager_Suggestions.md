# Footy Dynasty — roadmap & suggestions

Living backlog aligned with current code. Priorities shift; tick items off as you ship.

## Match simulation

- [x] Quarter-by-quarter flow, momentum, key moments (in `matchEngine.js`)
- [x] Tactic families with quarter-by-quarter shape (late `run`/`attack` lift, early `defensive` edge)
- [x] Bench depth nudge in Q3–Q4 (strength from top bench vs starters)
- [x] On-ball phases (centre bounce vs stoppage vs inside-50) as separate shot chains — stoppage clearances in `resolveStoppageQuarter`
- [x] Interchange rotation bonus Q2/Q4 (`interchangeRotationBonus`); 18+5 squad UI unchanged

## List & finance

- [x] Wage cap, `effectiveWageCap`, scaling (`lib/finance/engine.js`)
- [x] Hub cap % + tight-cap copy
- [x] Hard cap breaches with forced delisting / penalties (`listRules.capBreachSanctionPatch`)
- [x] Rookie salary bands and SSP-style list spots by tier (`listRules.js` senior/rookie caps)

## AI & world

- [x] Stable per-club tactical personality blended with rating-based heuristics (`lib/aiPersonality.js`)
- [x] Trade/draft aggression tied to personality + ladder position (`tradeEngine.js`, `draftEngine` needs bias)
- [x] Rival clubs remember past finals (`finalsRivalryLog`, trades, match preview, journo lines)

## Calendar & flavour

- [x] Themed round tags on schedule events (`lib/themedRounds.js`)
- [x] Derbies: auto-detect same-city pairs for flavour text (`derbies.js`)
- [x] Weather / travel fatigue by distance (`travelFatigue.js` — interstate away rating penalty)

## Career history

- [x] Season rows in `career.history` with ladder, flags, top scorer, Brownlow
- [x] Finals brackets archived per year (`finalsBracketArchiveSnapshot`)
- [x] Club best-and-fairest from in-game votes (Brownlow vote totals → season B&F)

## Meta

- [ ] PWA offline conflict resolution for saves
- [ ] Expand automated tests around full season loops

## Hub / prep

- [x] Opposition scout report + paid intel tiers (`oppositionScout.js`, `MatchPreviewPanel`)
- [x] Finals magic number widget (`magicNumber.js`, Hub)
- [x] Challenge scenarios at career setup (under the pump, flag or sack, rebuild, local hero)

## Finals

- [x] Tier-1 AFL final eight paths (QF → SF → PF → GF, 4 weeks, `finalsBracket.aflState`)
