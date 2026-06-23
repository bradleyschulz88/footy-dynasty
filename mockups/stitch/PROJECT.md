# Stitch project — Footy Dynasty Redesign

Driven via `scripts/stitch.mjs` against the Google Stitch MCP
(`https://stitch.googleapis.com/mcp`). Key in `.env.local` (gitignored).

- **Project:** `projects/7848913645238773950`
- **View/export in browser:** https://stitch.withgoogle.com → "Footy Dynasty Redesign"

## Screens
| Screen | ID | Status |
|--------|----|--------|
| Career Hub Dashboard | `2668cf098dcd46d6911af8e1e2a5a965` | generated |

## Why files aren't in the repo
The Stitch API is reachable from the sandbox, but generated HTML/screenshots
are served from `contribution.usercontent.google.com` / `lh3.googleusercontent.com`,
which are egress-blocked. Export from the Stitch web UI, or allowlist those two
hosts to let the driver download them automatically.

## Commands
```bash
node scripts/stitch.mjs new-project "Footy Dynasty Redesign"
node scripts/stitch.mjs gen <projectId> "<prompt>"
node scripts/stitch.mjs screens <projectId>
node scripts/stitch.mjs screen <projectId> <screenId>
```
