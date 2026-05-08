# Stitch mockups (reference PNGs)

31 folders from Google Stitch; each contains `screen.png`.

## Figma (manual)

1. Create file **Footy Dynasty – Stitch reference**.
2. Add pages: `00_Shell`, `01_Career_setup`, `02_Hub_dashboard`, `03_Squad_match`, `04_Recruit_trade`, `05_Season_compete`, `06_Finals_draft`, `07_Aspirational`.
3. **Place** each `screen.png` on the matching page; rename the frame to the folder name (e.g. `club_dashboard`).
4. Lock a **References** layer; trace components on **Build** if needed.
5. Create Figma variables collection **Stitch** — eyedropper background, panel, neon accent, button text from the PNGs.
6. Paste Dev Mode specs into [`../../FIGMA_HANDOFF.md`](../../FIGMA_HANDOFF.md) when syncing code.

## Mock to app mapping (summary)

| Folder | App target |
|--------|------------|
| club_dashboard | Hub (Stitch theme layout) |
| club_headquarters | Club screen |
| team_selection_tactics, corrected_18_player_team_management | Squad |
| live_match_center, pre_match_strategy_briefing | Match day / preview |
| player_recruitment, scouting_recruitment_hub | Recruit |
| trade_negotiation_table | Trade tab |
| season_calendar_fixtures | Schedule |
| finances_sponsorships | Club → Finances / Sponsors |
| create_manager_profile, footy_dynasty_game_selection_* | Career setup |
| … | See plan Part C for full table |

In-game **Visual theme → Stitch (mockups)** uses palette aligned with these exports.
