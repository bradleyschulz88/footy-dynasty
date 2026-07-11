# Footy Dynasty — Mobile (Expo / React Native)

Native mobile app for Footy Dynasty. Expo SDK 57 · React Native 0.86 · React 19.

It **shares the web game's deterministic engine** — squad generation, the club/
league pyramid, finance/season logic in `../footy-dynasty/src/lib` and
`../footy-dynasty/src/data` — instead of forking it.

## How engine sharing works

React Native's Metro bundler only reliably serves files inside the project, so a
tiny sync step mirrors the framework-agnostic engine (`lib` + `data` only — no
DOM/React screens) into `mobile/engine/`:

- Source of truth: `../footy-dynasty/src` (the web app).
- `scripts/sync-engine.mjs` copies `lib` + `data` → `mobile/engine/` (git-ignored).
- It runs automatically before `start` / `android` / `ios` / `web` / `export`
  (npm `pre*` hooks), so the copy never drifts. Run it manually with
  `npm run sync-engine`.

App code imports the engine like `import { generateSquad } from "./engine/lib/playerGen.js"`.

## Run

```bash
cd mobile
npm install
npm run ios       # or: npm run android | npm run web
```

`npm run export` produces a production JS bundle (used to verify the build in CI).

## Status

Starter screen only: it generates a real, deterministic squad on-device via the
shared `generateSquad` and lists it in the official-AFL style (navy / sky-blue /
white). Native screens (Hub, Squad, Match-day, …) are built up from here — the
game logic is already available through the shared engine.
