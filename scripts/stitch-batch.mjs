#!/usr/bin/env node
// Batch-generate every Footy Dynasty screen in the Stitch project, all sharing
// one design system. Resumable: skips screens already in the manifest.
// Usage: node scripts/stitch-batch.mjs

import { readFileSync, existsSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const ENDPOINT = "https://stitch.googleapis.com/mcp";
const PROJECT_ID = "7848913645238773950";
const DESIGN_SYSTEM = "assets/912c67c4f0194420b4e82f501cda215c";
const MANIFEST = resolve(ROOT, "mockups/stitch/manifest.json");

function key() {
  if (process.env.STITCH_API_KEY) return process.env.STITCH_API_KEY;
  for (const l of readFileSync(resolve(ROOT, ".env.local"), "utf8").split("\n")) {
    const m = l.match(/^\s*STITCH_API_KEY\s*=\s*(.+?)\s*$/);
    if (m) return m[1];
  }
  throw new Error("STITCH_API_KEY not found");
}
const KEY = key();
let _id = 1;

async function rpc(method, params = {}) {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "X-Goog-Api-Key": KEY, "Content-Type": "application/json", Accept: "application/json, text/event-stream" },
    body: JSON.stringify({ jsonrpc: "2.0", id: _id++, method, params }),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${text.slice(0, 300)}`);
  let payload = text;
  if (text.startsWith("event:") || text.includes("\ndata:") || text.startsWith("data:")) {
    const ds = text.split("\n").filter((l) => l.startsWith("data:")).map((l) => l.slice(5).trim());
    payload = ds[ds.length - 1] || "{}";
  }
  const json = JSON.parse(payload);
  if (json.error) throw new Error(`RPC: ${JSON.stringify(json.error).slice(0, 300)}`);
  return json.result;
}
async function callTool(name, args) {
  const r = await rpc("tools/call", { name, arguments: args });
  if (r?.structuredContent) return r.structuredContent;
  const t = (r?.content || []).find((c) => c.type === "text");
  if (t) { try { return JSON.parse(t.text); } catch { return t.text; } }
  return r;
}

const COMMON = "Mobile screen (9:16) for Footy Dynasty, an Australian Rules Football (AFL) manager game. Use the project design system (dark glassmorphism, lime-green primary, blue secondary, condensed display headings, monospace stats). Include the iOS status bar and a bottom tab bar (Hub, Squad, Match, Recruit, Club) where relevant. All text must be legible and realistic.";

const SCREENS = [
  ["squad", "Squad List", `${COMMON} SQUAD LIST screen: header "SQUAD" with "42 listed / 22 selected" and a search icon; filter chips (All, Def, Mid, Fwd, Ruck) with All active; a salary cap card "$11.2M / $13.0M" with a "$1.8M FREE" badge and a progress bar; a list of player rows each with a circular position badge, name, age/height, a small form sparkline and an OVR rating square (e.g. 88, 86, 84, 79, 77); the top row expanded to show attribute bars (Speed, Marking, Kicking, Tackling). Squad tab active.`],
  ["club", "Club HQ", `${COMMON} CLUB HQ / club management dashboard: header with club crest and "GEELONG CATS"; cards for FINANCES (balance, weekly wages, sponsorship), FACILITIES (training, medical, stadium with upgrade buttons and level pips), BOARD CONFIDENCE and FAN HAPPINESS gauges, and CLUB HONOURS (premierships count). Club tab active.`],
  ["schedule", "Schedule", `${COMMON} SCHEDULE / season calendar: header "SCHEDULE - SEASON 2026"; a horizontal round selector strip; a vertical list of fixture rows each showing round number, two club badges, date/venue, and result or "vs"; past games show scores with W/L tags in green/red, upcoming games show a countdown. A "Bye" row styled differently.`],
  ["compete", "Competition Ladder", `${COMMON} COMPETITION / LADDER screen: tab row (Ladder, Fixtures, Stats, Pyramid) with Ladder active; a full league ladder table with columns Pos, Club, P, W, L, D, PCT%, Pts; the user's club row highlighted in lime; top 8 separated by a finals line; small form dots (last 5) per club.`],
  ["careers", "Careers", `${COMMON} CAREERS / coach reputation screen: header with the coach's name, current club, and a reputation tier badge; a reputation progress bar; a "Job Offers" section with offer cards (club crest, league tier, contract length, salary, board expectation) each with View/Accept buttons; a career-history timeline below.`],
  ["settings", "Settings", `${COMMON} SETTINGS screen: header "SETTINGS"; a SAVE SLOTS section with three save-slot cards (club, season, last-played date) and Save/Load/Delete actions; PREFERENCES toggles (sound, autosave, match speed, difficulty, theme); a DATA section (export save, import save, new game); an About footer with version.`],
  ["matchday", "Match Day", `${COMMON} MATCH DAY live game: a green AFL oval pitch in perspective at the top with two glowing player markers; a live scoreboard bar "GEELONG 8.6 (54)" vs "RICHMOND 7.9 (51)" with a centre "Q3 12:40" clock and a pulsing red LIVE dot; a momentum bar; a PLAY-BY-PLAY commentary feed with timestamps and a green GOAL tag; a TACTICS chip row (Defensive, Balanced, Attacking - Attacking active); an interchange bench strip; a lime "SIM TO NEXT EVENT" button. Match tab active.`],
  ["postmatch", "Post-Match", `${COMMON} POST-MATCH SUMMARY: big final score "GEELONG 14.10 (94) def RICHMOND 9.8 (62)" with a green WIN banner; quarter-by-quarter score table; a BEST ON GROUND player card with votes; a team stats comparison (disposals, marks, tackles, inside 50s) as paired bars; a "Goal Kickers" list; a lime "Continue" button.`],
  ["player", "Player Profile", `${COMMON} PLAYER PROFILE: back arrow header "Player Profile / Geelong Cats #35"; a centered premium FUT-style collectible player card with a dark-metal+lime frame, rating "88", position "MID", an AFL player figure in a navy and gold guernsey number 35, name "P. DANGERFIELD", and six stats (PAC 90, MRK 85, KCK 88, HBL 82, TCK 79, WRK 91); below, cards for season stats (24 goals, 312 disposals, 68 tackles), contract (2 yrs $720k/yr) with a RE-SIGN badge, and form (last 5, excellent).`],
  ["recruit", "Recruit", `${COMMON} RECRUIT / scouting and trades: tab row (Scout, Trade, Free Agents, Draft) with Scout active; a search/filter bar (position, age, rating, price); target player cards each with name, club, position badge, OVR, estimated value, and a scouting progress bar; a shortlist panel; a "Make Offer" lime button.`],
  ["contracts", "Contracts", `${COMMON} CONTRACT RENEWALS: header "CONTRACTS"; a list of players with expiring contracts, each row showing name, position, age, current wage, contract end year, and a status chip (Negotiating / Wants more / Agreed); an expanded negotiation card with wage slider, contract length stepper, and the player's demand vs your offer; cap-impact summary at the bottom.`],
  ["draft", "Draft Room", `${COMMON} DRAFT ROOM: header "NATIONAL DRAFT - ROUND 1, PICK 4"; a draft board list of prospects with name, position, age, rating potential stars, and origin; the currently-on-the-clock pick highlighted in lime with a countdown timer; a "draft order" side strip; the selected prospect's mini profile; a lime "DRAFT PLAYER" button.`],
  ["landing", "Landing", `${COMMON} LANDING / TITLE screen: a dramatic dark AFL stadium background; a big bold "FOOTY DYNASTY" logo/title with a lime accent; a tagline "Build a footy dynasty from the ground up"; primary buttons "New Career", "Continue", "Load Game"; a small footer with version and credits. No bottom tab bar on this screen.`],
  ["setup", "Career Setup", `${COMMON} NEW CAREER SETUP wizard: a step indicator (1 Manager, 2 Club, 3 Difficulty) with step 2 active; a manager name field and avatar; a scrollable grid of selectable club cards (crest, name, league tier) with one selected and lime-ringed; a difficulty selector (Casual, Pro, Legend); a lime "Start Career" button. No bottom tab bar.`],
  ["board", "Board Meeting", `${COMMON} BOARD MEETING screen: a formal header "BOARD MEETING - END OF SEASON REVIEW"; the board's verdict card (confidence gauge, mood text); a "Season Objectives" checklist with met/unmet ticks; expectations for next season; a couple of dialogue/decision option buttons; a tone that feels consequential.`],
  ["premiership", "Premiership", `${COMMON} PREMIERSHIP / GRAND FINAL WIN celebration: a gold confetti and lime spotlight celebration; "2026 PREMIERS" in huge condensed caps; the club crest with a trophy; final grand final score; a "Premiership Cup" trophy graphic; player-of-the-final card; a lime "Continue" button. Triumphant mood. No bottom tab bar.`],
  ["seasonsummary", "Season Summary", `${COMMON} SEASON SUMMARY / awards: header "SEASON 2026 REVIEW"; final ladder position card; club season stats; an AWARDS section (Best & Fairest winner card with votes, leading goalkicker, rising star); key season moments timeline; a lime "Start Next Season" button.`],
];

function loadManifest() {
  if (existsSync(MANIFEST)) return JSON.parse(readFileSync(MANIFEST, "utf8"));
  // seed with the already-generated Hub
  return { projectId: PROJECT_ID, designSystem: DESIGN_SYSTEM, screens: [
    { key: "hub", title: "Career Hub Dashboard", screenId: "2668cf098dcd46d6911af8e1e2a5a965" },
  ] };
}

const manifest = loadManifest();
mkdirSync(dirname(MANIFEST), { recursive: true });
const done = new Set(manifest.screens.map((s) => s.key));

const idsOf = (list) => new Set((list.screens || []).map((s) => (s.name || "").split("/screens/")[1]).filter(Boolean));
const titleOf = (list, id) => (list.screens || []).find((s) => (s.name || "").endsWith(id))?.title;

console.log(`Resuming. Already done: ${[...done].join(", ") || "none"}`);
for (const [k, title, prompt] of SCREENS) {
  if (done.has(k)) { console.log(`= skip ${k}`); continue; }
  process.stdout.write(`+ generating ${k} (${title}) ... `);
  try {
    const before = idsOf(await callTool("list_screens", { projectId: PROJECT_ID }));
    await callTool("generate_screen_from_text", {
      projectId: PROJECT_ID, prompt, deviceType: "MOBILE", modelId: "GEMINI_3_1_PRO", designSystem: DESIGN_SYSTEM,
    });
    const after = await callTool("list_screens", { projectId: PROJECT_ID });
    const newId = [...idsOf(after)].find((id) => !before.has(id)) || null;
    manifest.screens.push({ key: k, title: titleOf(after, newId) || title, screenId: newId });
    writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2));
    console.log(`done → ${newId}`);
  } catch (e) {
    console.log(`FAILED: ${e.message}`);
    manifest.screens.push({ key: k, title, screenId: null, error: e.message });
    writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2));
  }
}
console.log("ALL DONE. Manifest:", MANIFEST);
