# Footy Dynasty — Redesign Mockup Prompt Pack (Higgsfield)

Ready-to-run `higgsfield generate create` commands for a **full redesign concept board**:
Hub, Match Day, Squad, and Player Card screens.

> **Why this file exists:** the agent environment blocks all `*.higgsfield.ai` hosts at the
> network egress layer (HTTP 403 "Host not in allowlist"), so generation can't run from there.
> Run these from any machine where Higgsfield is reachable and you're logged in.

## Prerequisites

```bash
npm install -g @higgsfield/cli      # or: curl -fsSL https://raw.githubusercontent.com/higgsfield-ai/cli/main/install.sh | sh
higgsfield auth login               # browser device login (needs network access to fnf-device-auth.higgsfield.ai)
higgsfield account status           # confirm authenticated + credits
```

Model: **GPT Image 2** (`gpt_image_2`) — the skill's default for UI, typography, and on-image text.
Aspect: `9:16` (mobile), resolution `2k`. Each command blocks via `--wait` and prints the result URL.

## Shared art-direction (from `design/tokens.json` + `mockups/hub.html`)

Bake this style block into every prompt for a consistent board. Default is the **Stitch** direction
(black + lime); A/B swaps are in the Variants section at the bottom.

- **Frame:** single iPhone-style mobile screen, 390×844 portrait, 44px rounded corners, subtle device bezel.
- **Palette (Stitch):** near-black background `#0B0E0D`, raised panels `#161C1A`, hairline borders
  `rgba(200,255,61,0.24)`, primary text `#F7FAF8`, dim text `#9CA89F`, **lime accent `#C8FF3D`**,
  positive `#5EFFA8`, negative `#FF5A7C`, club navy `#1B3B7A`, club gold `#FFD200`.
- **Material:** glassmorphism — frosted translucent cards, 18px radius, soft inner glow, 24px blur.
- **Atmosphere:** dim AFL oval field rendered in faint perspective behind the content, two soft radial
  glows (lime top-left, blue bottom-right), heavy vignette.
- **Type:** Inter for UI, condensed display face (Bebas Neue / Oswald) for big numbers and screen titles,
  monospace for stat labels. Uppercase micro-labels with wide letter-spacing.
- **Quality tags:** `high-fidelity product UI mockup, crisp legible text, pixel-sharp, dribbble/figma quality, no lorem ipsum, realistic data`.

---

## 1 — Career Hub (dashboard)

```bash
higgsfield generate create gpt_image_2 --aspect_ratio 9:16 --resolution 2k --wait --prompt \
"High-fidelity mobile game UI mockup, single iPhone-style portrait screen (390x844, 44px rounded \
corners) for an Australian Rules Football manager game called FOOTY DYNASTY. Near-black background \
#0B0E0D with a dim AFL oval field in faint 3D perspective behind frosted glass cards, soft lime \
#C8FF3D glow top-left and blue glow bottom-right. TOP BAR: club name in lime uppercase, season label \
'SEASON 2026 - ROUND 7', a thin board-confidence pip meter. MAIN STACK of glassmorphic cards (18px \
radius, frosted, hairline lime borders): (1) NEXT MATCH card with two club badges, 'vs', venue and \
day; (2) LADDER POSITION card showing '4th' large condensed numeral with a mini standings strip; \
(3) SQUAD MORALE + INJURY summary row with small progress bars; (4) INBOX card with two news \
headlines. Bottom tab bar with 5 icons (Hub, Squad, Match, Recruit, Club), Hub active in lime. \
Inter typography, condensed display face for big numbers, monospace stat labels, wide-tracked \
uppercase micro-labels. crisp legible realistic text, pixel-sharp, figma/dribbble quality, no lorem ipsum."
```

## 2 — Match Day (live match)

```bash
higgsfield generate create gpt_image_2 --aspect_ratio 9:16 --resolution 2k --wait --prompt \
"High-fidelity mobile game UI mockup, single iPhone-style portrait screen for an Australian Rules \
Football manager game, MATCH DAY live screen. Near-black #0B0E0D background, an AFL oval pitch \
rendered in dim green perspective filling the upper-middle, two glowing player position markers, \
soft lime #C8FF3D and blue radial glows, heavy vignette. TOP: live scoreboard bar with two club \
badges and AFL-style score '8.6.54  vs  7.9.51', a quarter clock 'Q3 12:40' in lime. MIDDLE: the \
oval field with a momentum/possession arc. LOWER glassmorphic cards: live PLAY-BY-PLAY commentary \
feed (3 timestamped lines), a TACTICS quick-control row (chips: Defensive / Balanced / Attacking, \
Attacking highlighted in lime), and an INTERCHANGE bench strip with small player chips. Inter + \
condensed display numerals + monospace labels, wide uppercase micro-labels. crisp legible realistic \
text, pixel-sharp, figma/dribbble quality, no lorem ipsum."
```

## 3 — Squad / List Management

```bash
higgsfield generate create gpt_image_2 --aspect_ratio 9:16 --resolution 2k --wait --prompt \
"High-fidelity mobile game UI mockup, single iPhone-style portrait screen for an Australian Rules \
Football manager game, SQUAD LIST screen. Near-black #0B0E0D background with faint oval field and \
soft lime/blue glows behind frosted glass. TOP: title 'SQUAD' in condensed display caps, a filter \
chip row (All / Defenders / Midfielders / Forwards / Rucks) with one chip active in lime, and a \
salary-cap bar showing '$11.2M / $13.0M'. MAIN: a vertical list of 6 player rows in glassmorphic \
cards, each row = circular position badge, player name, age, an OVR rating number in a lime rounded \
square (e.g. 84, 79, 88), a small form sparkline, and a fitness/heart icon. One row expanded to \
show attribute mini-bars (Speed, Marking, Kicking, Tackling). Bottom tab bar, Squad tab active in \
lime. Inter UI type, condensed numerals, monospace stat labels, wide uppercase micro-labels. crisp \
legible realistic text, pixel-sharp, figma/dribbble quality, no lorem ipsum."
```

## 4 — Player Card (hero / FUT-style)

```bash
higgsfield generate create gpt_image_2 --aspect_ratio 9:16 --resolution 2k --wait --prompt \
"High-fidelity mobile game UI mockup, single iPhone-style portrait screen for an Australian Rules \
Football manager game, PLAYER PROFILE with a hero collectible card centered. Near-black #0B0E0D \
background, dim oval field and soft lime #C8FF3D + blue glows, heavy vignette. CENTER: a premium \
FUT-style player card with a brushed dark-metal + lime accent frame, large OVR rating '88' top-left \
in condensed display, position 'MID', a stylized AFL player silhouette in club navy #1B3B7A and \
gold #FFD200 guernsey, player name plate 'J. CAREY' along the bottom, and six attribute stats in \
two columns (PAC 90, MRK 85, KCK 88, HBL 82, TCK 79, WRK 91). BELOW the card: glassmorphic cards \
for season stats (goals, disposals, tackles) and a contract row ('2 yrs - $720k/yr'). Top back-arrow \
and share icon. Inter + condensed display + monospace. crisp legible realistic text, pixel-sharp, \
premium trading-card lighting, figma/dribbble quality, no lorem ipsum."
```

---

## Optional — animate the board (image-to-video)

Turn any generated still into a short hero loop for a pitch/demo:

```bash
# use the result URL or job id from a step above as --start-image
higgsfield generate create seedance_2_0 --duration 5 --aspect_ratio 9:16 --wait \
  --start-image <hub-job-id-or-url> \
  --prompt "subtle parallax: the oval field glows breathe, cards drift up gently, lime accents pulse, \
            UI feels alive, no text distortion, premium app reveal"
```

## Variants (swap the palette block per direction)

| Direction | Background | Panel | Accent | Accent 2 | Notes |
|-----------|-----------|-------|--------|----------|-------|
| **Stitch** (default) | `#0B0E0D` | `#161C1A` | lime `#C8FF3D` | `#E8FF7A` | most distinctive |
| **A** | `#07101F` | `#101F33` | cyan `#00E0FF` | amber `#FFB347` | classic sports-app, navy/cyan |
| **B** | `#0A0A0A` | `#161616` | orange `#FF5A1F` | gold `#FFD84D` | warm, broadcast-TV feel |

To generate the A or B board, find/replace the Stitch palette line in each prompt with the row above.

## Tips

- Generate all four sequentially, then drop the URLs into a single 2×2 board for review.
- If text comes out garbled, regenerate (GPT Image 2 is strong on text but not perfect) or add
  `keep all text short and in clean sans-serif` and reduce the number of labels in the prompt.
- For face/identity-consistent player art across cards, chain `higgsfield-soul-id` and pass `--soul-id`.
