# 🏉 Footy Dynasty

A Football Manager-style Australian rules football management game built in React.

Start at the grassroots community leagues and climb the pyramid all the way to the AFL.

## Features

- **Full Australian football pyramid** — AFL → State Leagues (VFL, SANFL, WAFL, TSL, NTFL, QAFL, AFLSyd) → Community leagues
- **Tier-relative ratings** — Every league feels competitive. A 90 OVR community legend is dominant in their league; climb to the AFL and the bar rises.
- **Squad management** — 32+ players, attributes, form/fitness tracking, lineup selection, contract management
- **Live match simulation** — Quarter-by-quarter live scoreboard with match feed
- **Club management** — Finances, sponsors, kit designer (5 patterns, full colour pickers), 6 upgradable facilities, 10-person staff
- **Recruitment** — Trade market, national draft, youth academy, local football scouting
- **Competition** — Full ladder, fixtures, pyramid view
- **Promotion & relegation** — Win your league to climb a tier; finish bottom and drop

## Tech Stack

- React 18
- Vite
- Tailwind CSS
- lucide-react

## Getting Started

```bash
npm install
npm run dev
```

Then open [http://localhost:5173](http://localhost:5173).

## Project Structure

```
src/
  AFLManager.jsx     # Career shell: routing, save IO, coordination
  main.jsx           # React entry
  index.css          # Tailwind base
  screens/           # Hub, squad, club, recruit, match day, etc.
  components/        # Shared UI (primitives, match preview, …)
  lib/               # Simulation: league, match engine, finance, calendar, AI
  data/              # Pyramid, grounds
docs/
  AFL_Manager_Suggestions.md   # Roadmap & improvement backlog
```

## Roadmap

See [docs/AFL_Manager_Suggestions.md](docs/AFL_Manager_Suggestions.md) for a living backlog covering match depth, TPP/list pressure, AI behaviours, youth pathways, themed content, and honours/history.
