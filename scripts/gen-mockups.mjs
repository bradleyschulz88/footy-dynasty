#!/usr/bin/env node
// Generate Footy Dynasty redesign mockups via Google Gemini image models.
// Usage:
//   node scripts/gen-mockups.mjs            # generate all screens
//   node scripts/gen-mockups.mjs player     # generate one by key
// Reads GEMINI_API_KEY from .env.local (gitignored).

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dir = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dir, "..");
const OUT = resolve(ROOT, "mockups/ai");

// ── load key ───────────────────────────────────────────────
function loadKey() {
  if (process.env.GEMINI_API_KEY) return process.env.GEMINI_API_KEY;
  const envPath = resolve(ROOT, ".env.local");
  if (existsSync(envPath)) {
    for (const line of readFileSync(envPath, "utf8").split("\n")) {
      const m = line.match(/^\s*GEMINI_API_KEY\s*=\s*(.+?)\s*$/);
      if (m) return m[1];
    }
  }
  throw new Error("GEMINI_API_KEY not found (set env or .env.local)");
}
const KEY = loadKey();
const MODEL = process.env.GEMINI_IMAGE_MODEL || "gemini-3-pro-image";

// ── shared style preamble (calibrated to the approved Hub render) ──
const STYLE = `High-fidelity mobile game UI mockup, a single iPhone-style portrait screen (9:16), \
for an Australian Rules Football (AFL) manager game called FOOTY DYNASTY. \
Visual style: near-black background (#0B0E0D) with a moody, cinematic night AFL stadium photo \
faintly visible behind the UI; glassmorphic cards with frosted translucency, soft rounded corners, \
and thin glowing lime-green (#C8FF3D) hairline borders; a soft lime glow top-left and a cool blue \
glow bottom-right. Typography: bold condensed display caps for big numbers and titles, clean sans-serif \
(Inter) for body, monospace for small stat labels; wide-tracked uppercase micro-labels in muted grey. \
Accent lime for active/positive elements, blue for secondary, pink-red for warnings. iOS status bar at top \
(9:41, signal, wifi, battery) and a home indicator at the bottom. \
Crisp, perfectly legible realistic text, pixel-sharp, premium Figma/Dribbble quality, no lorem ipsum, no watermark.`;

// ── screen prompts ─────────────────────────────────────────
const SCREENS = {
  hub: `${STYLE}
SCREEN: CAREER HUB.
Top bar: Geelong Cats crest at left, "GEELONG CATS" in large lime caps, subtitle "SEASON 2026 · ROUND 12", \
and at the right a "BOARD CONFIDENCE" label above a row of lime pip blocks (about 7 of 10 filled).
A large glassmorphic NEXT MATCH card: small "NEXT MATCH" label and a "5 DAYS" calendar chip; \
Geelong Cats crest vs Richmond Tigers crest with "VS" between them and "MCG" underneath; \
a divider, then "OUR CHANCE TO WIN" with a big lime "67%".
A row of three smaller stat cards: "LADDER" with a bar icon and big "4TH" / "POSITION"; \
"CAP SPACE" with a $ icon and "$1.8M" / "AVAILABLE"; "SQUAD" with a people icon and "22" FIT / "2" INJURED.
An "INBOX" card with a "VIEW ALL" link and three news rows with small icons and timestamps: \
"Tom Stewart named in Team of the Week — 2H AGO", "Mark Blicavs progressing well in his recovery — 5H AGO", \
"Contract talks set to begin with key mid — 1D AGO".
A big glowing lime "ADVANCE SEASON »" button.
Bottom tab bar with 5 icons: Hub (active, lime), Squad, Match, Recruit, Club.`,

  match: `${STYLE}
SCREEN: MATCH DAY (live game).
A bright green AFL oval pitch in perspective fills the upper portion, floodlit, with two small glowing \
player position markers (one lime, one blue).
Top live scoreboard bar: Geelong Cats crest with score "8.6 (54)" in lime, a centre "Q3 · 12:40" quarter clock, \
a red pulsing "LIVE" dot, and Richmond Tigers crest with score "7.9 (51)".
A thin "MOMENTUM" bar split ~62% lime / 38% blue.
A glassmorphic "PLAY-BY-PLAY" card with four timestamped commentary rows: \
"Q3 12:40 — Dangerfield snaps truly from 40 — GOAL" (GOAL in green), \
"Q3 11:02 — Stewart intercepts in the back half", \
"Q3 09:48 — Tigers behind, narrows the margin", \
"Q3 08:15 — Ruck contest to Cats, centre clearance".
A "TACTICS" card with three chips: Defensive, Balanced, Attacking (Attacking highlighted in lime).
An "INTERCHANGE BENCH" card with four small player chips (navy number squares + names).
A glowing lime "SIM TO NEXT EVENT »" button.
Bottom tab bar with 5 icons: Hub, Squad, Match (active, lime), Recruit, Club.`,

  squad: `${STYLE}
SCREEN: SQUAD LIST.
Top bar: "SQUAD" in condensed caps with subtitle "42 listed · 22 selected", a search icon at right.
A filter chip row: All (active, lime), Def, Mid, Fwd, Ruck.
A "SALARY CAP" card: big "$11.2M / $13.0M", a "$1.8M FREE" green badge, and a lime progress bar ~86% full.
A vertical list of 6 player rows in glassmorphic cards. Each row: a circular position badge (MID lime, \
DEF blue, FWD pink, RUC gold), player name + "age · height" in monospace, a small green form sparkline, \
and an OVR rating in a rounded square (lime square for 80+). \
Players: "P. Dangerfield · MID · 88 · Capt", "T. Stewart · DEF · 86", "J. Cameron · FWD · 84", \
"R. Stanley · RUC · 79", "M. Holmes · MID · 77".
The top (Dangerfield) row is expanded to show four attribute mini-bars: Speed 90, Marking 85, Kicking 88, Tackling 79.
Bottom tab bar with 5 icons: Hub, Squad (active, lime), Match, Recruit, Club.`,

  player: `${STYLE}
SCREEN: PLAYER PROFILE with a hero collectible card.
Top bar: back arrow, "Player Profile" title, subtitle "Geelong Cats · #35", a share icon.
CENTER: a premium FUT-style collectible player card with a dark brushed-metal and lime-accent frame and \
glowing lime corner brackets. Top-left of the card: large rating "88" in lime, position "MID", club tag "GEE". \
A stylized AFL player figure wearing a navy (#1B3B7A) and gold (#FFD200) hooped Geelong guernsey with number 35. \
Name plate "P. DANGERFIELD" across the lower third. \
Six attribute stats in a grid at the bottom of the card: PAC 90, MRK 85, KCK 88, HBL 82, TCK 79, WRK 91.
BELOW the card: a glassmorphic season-stats card with three columns "24 GOALS / 312 DISPOSALS / 68 TACKLES"; \
a "CONTRACT" row "2 yrs · $720k/yr" with a lime "RE-SIGN" badge; \
a "FORM · LAST 5" row showing "▲ EXCELLENT" in green with a small sparkline.
Bottom tab bar with 5 icons: Hub, Squad (active, lime), Match, Recruit, Club.`,
};

// ── generate ───────────────────────────────────────────────
async function generate(name, prompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;
  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { responseModalities: ["IMAGE"], imageConfig: { aspectRatio: "9:16" } },
  };
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": KEY },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`HTTP ${res.status} for ${name}: ${txt.slice(0, 500)}`);
  }
  const json = await res.json();
  const parts = json?.candidates?.[0]?.content?.parts || [];
  const img = parts.find((p) => p.inlineData?.data);
  if (!img) {
    throw new Error(`No image in response for ${name}: ${JSON.stringify(json).slice(0, 400)}`);
  }
  mkdirSync(OUT, { recursive: true });
  const file = resolve(OUT, `${name}.png`);
  writeFileSync(file, Buffer.from(img.inlineData.data, "base64"));
  return file;
}

const argv = process.argv.slice(2);
const targets = argv.length ? argv : Object.keys(SCREENS);
console.log(`Model: ${MODEL} · generating: ${targets.join(", ")}`);
for (const name of targets) {
  if (!SCREENS[name]) { console.error(`! unknown screen: ${name}`); continue; }
  try {
    const f = await generate(name, SCREENS[name]);
    console.log(`✓ ${name} → ${f}`);
  } catch (e) {
    console.error(`✗ ${name}: ${e.message}`);
  }
}
