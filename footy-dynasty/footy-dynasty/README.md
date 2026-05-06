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
  AFLManager.jsx   # The entire game — single component file
  main.jsx         # React entry point
  index.css        # Tailwind base
```

## Roadmap

See `AFL_Manager_Suggestions.md` for a detailed roadmap covering:
- Phase-based match engine
- Salary cap & list management (Total Player Payments)
- AI club personalities
- Youth pipeline (Coates Talent League, NextGen Academies)
- Themed rounds (Anzac Day, Dreamtime at the G, Showdown)
- Multi-season history book & Hall of Fame
