#!/usr/bin/env node
// Driver for Google Stitch MCP (https://stitch.googleapis.com/mcp).
// Reads STITCH_API_KEY from .env.local (gitignored).
//
// Usage:
//   node scripts/stitch.mjs call <method> '<json-params>'
//   node scripts/stitch.mjs new-project "Title"
//   node scripts/stitch.mjs gen <projectId> "<prompt>" [designSystemId]
//   node scripts/stitch.mjs screens <projectId>
//   node scripts/stitch.mjs screen <projectId> <screenId>

import { readFileSync, existsSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const ENDPOINT = "https://stitch.googleapis.com/mcp";

function key() {
  if (process.env.STITCH_API_KEY) return process.env.STITCH_API_KEY;
  const p = resolve(ROOT, ".env.local");
  if (existsSync(p))
    for (const l of readFileSync(p, "utf8").split("\n")) {
      const m = l.match(/^\s*STITCH_API_KEY\s*=\s*(.+?)\s*$/);
      if (m) return m[1];
    }
  throw new Error("STITCH_API_KEY not found");
}
const KEY = key();
let _id = 1;

// MCP JSON-RPC over streamable HTTP. Responses may be SSE or JSON.
async function rpc(method, params = {}) {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "X-Goog-Api-Key": KEY,
      "Content-Type": "application/json",
      Accept: "application/json, text/event-stream",
    },
    body: JSON.stringify({ jsonrpc: "2.0", id: _id++, method, params }),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${text.slice(0, 800)}`);
  // SSE framing → pull the last data: line; else parse JSON
  let payload = text;
  if (text.startsWith("event:") || text.includes("\ndata:") || text.startsWith("data:")) {
    const datas = text.split("\n").filter((l) => l.startsWith("data:")).map((l) => l.slice(5).trim());
    payload = datas[datas.length - 1] || "{}";
  }
  const json = JSON.parse(payload);
  if (json.error) throw new Error(`RPC error: ${JSON.stringify(json.error).slice(0, 800)}`);
  return json.result;
}

async function callTool(name, args) {
  const r = await rpc("tools/call", { name, arguments: args });
  // tools/call wraps output in content[]; structuredContent holds the typed result
  if (r?.structuredContent) return r.structuredContent;
  const textPart = (r?.content || []).find((c) => c.type === "text");
  if (textPart) { try { return JSON.parse(textPart.text); } catch { return textPart.text; } }
  return r;
}

const [cmd, ...rest] = process.argv.slice(2);

function save(name, obj) {
  mkdirSync(resolve(ROOT, "mockups/stitch"), { recursive: true });
  const f = resolve(ROOT, "mockups/stitch", name);
  writeFileSync(f, typeof obj === "string" ? obj : JSON.stringify(obj, null, 2));
  return f;
}

try {
  if (cmd === "call") {
    const out = await callTool(rest[0], JSON.parse(rest[1] || "{}"));
    console.log(JSON.stringify(out, null, 2));
  } else if (cmd === "new-project") {
    const out = await callTool("create_project", { title: rest[0] || "Footy Dynasty Redesign" });
    console.log(JSON.stringify(out, null, 2));
  } else if (cmd === "gen") {
    const [projectId, prompt, ds] = rest;
    const args = { projectId, prompt, deviceType: "MOBILE", modelId: "GEMINI_3_1_PRO" };
    if (ds) args.designSystem = ds;
    const out = await callTool("generate_screen_from_text", args);
    console.log(JSON.stringify(out, null, 2));
  } else if (cmd === "screens") {
    console.log(JSON.stringify(await callTool("list_screens", { projectId: rest[0] }), null, 2));
  } else if (cmd === "screen") {
    const [projectId, screenId] = rest;
    const out = await callTool("get_screen", { name: `projects/${projectId}/screens/${screenId}`, projectId, screenId });
    console.log(JSON.stringify(out, null, 2));
  } else {
    console.error("unknown command:", cmd);
    process.exit(1);
  }
} catch (e) {
  console.error("ERROR:", e.message);
  process.exit(1);
}
