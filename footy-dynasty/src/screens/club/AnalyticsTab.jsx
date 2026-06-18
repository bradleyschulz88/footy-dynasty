// ============================================================================
// ANALYTICS TAB — read-only season data visualisation.
// Derives everything from existing career state. No mutations, no useUpdateCareer.
// ============================================================================
import React from "react";
import {
  LineChart, Line, BarChart, Bar as ReBar,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell, LabelList,
} from "recharts";
import { BarChart3, TrendingUp, Users, Activity } from "lucide-react";
import { css, Stat } from "../../components/primitives.jsx";
import { useCareer } from "../../lib/careerStore.js";

// Newest-first match results pulled from the news log (same pattern the season
// narrative uses). Returns items like { type: 'win'|'loss'|'draw', week, ... }.
function matchResultsFromNews(career, n = 12) {
  return (career.news || [])
    .filter((item) => item.type === "win" || item.type === "loss" || item.type === "draw")
    .slice(0, n);
}

function EmptyPanel({ icon: Icon = Activity, children }) {
  return (
    <div className="py-8 text-center">
      <Icon className="w-8 h-8 mx-auto mb-2 opacity-30 text-atext-mute" />
      <div className="text-sm text-atext-dim">{children}</div>
    </div>
  );
}

// ── Shared tooltip ─────────────────────────────────────────────────────────
function SimpleTooltip({ active, payload, label, suffix = "" }) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="text-[11px] rounded-xl p-3 shadow-lg space-y-0.5"
      style={{ background: "var(--A-panel)", border: "1px solid var(--A-line)", minWidth: 120 }}
    >
      <div className="font-bold text-atext mb-1">{label}</div>
      {payload.map((p) => (
        <div key={p.dataKey} style={{ color: p.color || p.fill || "var(--A-accent)" }}>
          {p.name}: {p.value}{suffix}
        </div>
      ))}
    </div>
  );
}

// ── 1. Season summary cards ──────────────────────────────────────────────────
function SeasonSummary({ myRow }) {
  const W = myRow?.W ?? 0;
  const L = myRow?.L ?? 0;
  const D = myRow?.D ?? 0;
  const played = W + L + D;
  const winPct = played > 0 ? Math.round((W / played) * 100) : 0;
  const pf = myRow?.F ?? 0;
  const pa = myRow?.A ?? 0;
  const pct = pa > 0 ? (pf / pa) * 100 : (pf > 0 ? 999 : 0);
  const avgMargin = played > 0 ? Math.round((pf - pa) / played) : 0;
  const marginAccent = avgMargin > 0 ? "var(--A-pos)" : avgMargin < 0 ? "var(--A-neg)" : "var(--A-accent)";

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
      <Stat label="Win %" value={`${winPct}%`} accent={winPct >= 50 ? "var(--A-pos)" : "var(--A-neg)"} sub={`${W}-${L}-${D}`} />
      <Stat label="Points For" value={pf} accent="var(--A-pos)" />
      <Stat label="Points Against" value={pa} accent="var(--A-neg)" />
      <Stat label="Percentage" value={`${Math.round(pct)}%`} accent="var(--A-accent)" sub="PF / PA × 100" />
      <Stat label="Avg Margin" value={`${avgMargin >= 0 ? "+" : ""}${avgMargin}`} accent={marginAccent} sub="per game" />
    </div>
  );
}

// ── 2. Form / cumulative wins line chart ─────────────────────────────────────
function FormChart({ career }) {
  // Newest-first → reverse to chronological. Plot cumulative ladder points
  // (W=4, D=2, L=0) across the recent run of results.
  const results = matchResultsFromNews(career, 12).slice().reverse();

  if (results.length < 2) {
    return (
      <div className={`${css.panel} p-5`}>
        <h3 className={`${css.h1} text-xl mb-1`}>FORM TREND</h3>
        <p className="text-[11px] text-atext-dim mb-2">Cumulative competition points across your recent results.</p>
        <EmptyPanel icon={TrendingUp}>Play a few rounds — your form trend builds as results come in.</EmptyPanel>
      </div>
    );
  }

  let cum = 0;
  const data = results.map((r, i) => {
    const gain = r.type === "win" ? 4 : r.type === "draw" ? 2 : 0;
    cum += gain;
    return {
      label: `G${i + 1}`,
      points: cum,
      result: r.type === "win" ? "W" : r.type === "draw" ? "D" : "L",
    };
  });

  const wins = results.filter((r) => r.type === "win").length;
  const formStr = results.map((r) => (r.type === "win" ? "W" : r.type === "draw" ? "D" : "L")).join("");

  return (
    <div className={`${css.panel} p-5`}>
      <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
        <h3 className={`${css.h1} text-xl`}>FORM TREND</h3>
        <span className="font-mono text-sm tracking-[0.2em] text-atext-dim">{formStr}</span>
      </div>
      <p className="text-[11px] text-atext-dim mb-3">
        Cumulative competition points across your last {results.length} results ({wins}W).
      </p>
      <ResponsiveContainer width="100%" height={160}>
        <LineChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--A-line)" strokeOpacity={0.5} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 9, fill: "var(--A-text-mute)" }}
            tickLine={false}
            axisLine={{ stroke: "var(--A-line)" }}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fontSize: 9, fill: "var(--A-text-mute)" }}
            tickLine={false}
            axisLine={false}
            width={32}
            allowDecimals={false}
          />
          <Tooltip content={<SimpleTooltip suffix=" pts" />} />
          <Line
            type="monotone"
            dataKey="points"
            name="Points"
            stroke="var(--A-accent)"
            strokeWidth={2.5}
            dot={{ r: 3, fill: "var(--A-accent)" }}
            activeDot={{ r: 5, fill: "var(--A-accent)" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── 3. Top performers (goals / disposals) ────────────────────────────────────
function TopPerformersPanel({ title, players, dataKey, unit, color }) {
  const data = [...players]
    .filter((p) => (p?.[dataKey] ?? 0) > 0)
    .sort((a, b) => (b[dataKey] ?? 0) - (a[dataKey] ?? 0))
    .slice(0, 5)
    .map((p) => ({
      name: `${(p.firstName?.[0] ?? "")}. ${p.lastName ?? ""}`.trim() || "Unknown",
      value: p[dataKey] ?? 0,
    }));

  return (
    <div className={`${css.panel} p-5`}>
      <h3 className={`${css.h1} text-xl mb-3`}>{title}</h3>
      {data.length === 0 ? (
        <EmptyPanel icon={Users}>No {unit} recorded yet this season.</EmptyPanel>
      ) : (
        <ResponsiveContainer width="100%" height={Math.max(140, data.length * 38)}>
          <BarChart data={data} layout="vertical" margin={{ top: 0, right: 28, left: 4, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--A-line)" strokeOpacity={0.4} horizontal={false} />
            <XAxis type="number" hide />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fontSize: 11, fill: "var(--A-text-dim)" }}
              tickLine={false}
              axisLine={false}
              width={88}
            />
            <Tooltip content={<SimpleTooltip suffix={` ${unit}`} />} cursor={{ fill: "var(--A-line)", fillOpacity: 0.2 }} />
            <ReBar dataKey="value" name={unit} fill={color} radius={[0, 4, 4, 0]} barSize={18}>
              <LabelList dataKey="value" position="right" style={{ fill: "var(--A-text-dim)", fontSize: 11, fontWeight: 700 }} />
            </ReBar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

// ── 4. Squad age profile ─────────────────────────────────────────────────────
function AgeProfile({ squad }) {
  const bands = [
    { label: "18-21", min: 18, max: 21 },
    { label: "22-25", min: 22, max: 25 },
    { label: "26-29", min: 26, max: 29 },
    { label: "30+", min: 30, max: 999 },
  ];
  const data = bands.map((b) => ({
    label: b.label,
    count: (squad || []).filter((p) => {
      const age = p?.age ?? 0;
      return age >= b.min && age <= b.max;
    }).length,
  }));
  const total = data.reduce((a, d) => a + d.count, 0);
  const colors = ["var(--A-pos)", "var(--A-accent)", "var(--A-accent-2)", "var(--A-neg)"];

  return (
    <div className={`${css.panel} p-5`}>
      <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
        <h3 className={`${css.h1} text-xl`}>AGE PROFILE</h3>
        <span className="text-[11px] text-atext-dim font-mono">{total} players</span>
      </div>
      <p className="text-[11px] text-atext-dim mb-3">List spread by age band — watch for an ageing core.</p>
      {total === 0 ? (
        <EmptyPanel icon={Users}>No squad data available.</EmptyPanel>
      ) : (
        <ResponsiveContainer width="100%" height={170}>
          <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barCategoryGap="25%">
            <CartesianGrid strokeDasharray="3 3" stroke="var(--A-line)" strokeOpacity={0.4} vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: "var(--A-text-dim)" }}
              tickLine={false}
              axisLine={{ stroke: "var(--A-line)" }}
            />
            <YAxis
              tick={{ fontSize: 9, fill: "var(--A-text-mute)" }}
              tickLine={false}
              axisLine={false}
              width={28}
              allowDecimals={false}
            />
            <Tooltip content={<SimpleTooltip suffix=" players" />} cursor={{ fill: "var(--A-line)", fillOpacity: 0.2 }} />
            <ReBar dataKey="count" name="Players" radius={[4, 4, 0, 0]}>
              {data.map((_, i) => <Cell key={i} fill={colors[i]} />)}
              <LabelList dataKey="count" position="top" style={{ fill: "var(--A-text-dim)", fontSize: 11, fontWeight: 700 }} />
            </ReBar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

// ── 5. Scoring by quarter (last match, if available) ─────────────────────────
function QuarterScoring({ career }) {
  const match = career.currentMatchResult;
  const quarters = match?.quarters;
  if (!Array.isArray(quarters) || quarters.length === 0) return null;

  const isHome = !!match.isHome;
  const data = quarters.map((q, i) => {
    const mine = isHome ? (q.homeTotal ?? 0) : (q.awayTotal ?? 0);
    const opp = isHome ? (q.awayTotal ?? 0) : (q.homeTotal ?? 0);
    return { label: `Q${i + 1}`, scored: mine, conceded: opp };
  });

  return (
    <div className={`${css.panel} p-5`}>
      <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
        <h3 className={`${css.h1} text-xl`}>SCORING BY QUARTER</h3>
        <span className="text-[11px] text-atext-dim font-mono">{match.label || "Last match"}</span>
      </div>
      <p className="text-[11px] text-atext-dim mb-3">Points scored vs conceded in each quarter of your most recent match.</p>
      <ResponsiveContainer width="100%" height={170}>
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barCategoryGap="20%">
          <CartesianGrid strokeDasharray="3 3" stroke="var(--A-line)" strokeOpacity={0.4} vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: "var(--A-text-dim)" }}
            tickLine={false}
            axisLine={{ stroke: "var(--A-line)" }}
          />
          <YAxis
            tick={{ fontSize: 9, fill: "var(--A-text-mute)" }}
            tickLine={false}
            axisLine={false}
            width={28}
            allowDecimals={false}
          />
          <Tooltip content={<SimpleTooltip suffix=" pts" />} cursor={{ fill: "var(--A-line)", fillOpacity: 0.2 }} />
          <ReBar dataKey="scored" name="Scored" fill="var(--A-pos)" fillOpacity={0.8} radius={[3, 3, 0, 0]} />
          <ReBar dataKey="conceded" name="Conceded" fill="var(--A-neg)" fillOpacity={0.8} radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
      <div className="flex gap-4 mt-2 text-[10px] text-atext-mute">
        <span className="flex items-center gap-1"><span style={{ background: "var(--A-pos)", borderRadius: 2, display: "inline-block", width: 10, height: 10 }} /> Scored</span>
        <span className="flex items-center gap-1"><span style={{ background: "var(--A-neg)", borderRadius: 2, display: "inline-block", width: 10, height: 10 }} /> Conceded</span>
      </div>
    </div>
  );
}

// ── Main tab ─────────────────────────────────────────────────────────────────
export default function AnalyticsTab() {
  const career = useCareer();
  const squad = Array.isArray(career?.squad) ? career.squad : [];
  const ladder = Array.isArray(career?.ladder) ? career.ladder : [];
  const myRow = ladder.find((r) => r?.id === career?.clubId) || null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <BarChart3 className="w-6 h-6 text-aaccent" />
        <div>
          <div className={`${css.h1} text-3xl`}>SEASON ANALYTICS</div>
          <div className="text-xs text-atext-dim">A read-only snapshot of your season — form, scoring and list profile.</div>
        </div>
      </div>

      <SeasonSummary myRow={myRow} />

      <FormChart career={career} />

      <div className="grid md:grid-cols-2 gap-4">
        <TopPerformersPanel title="TOP GOAL KICKERS" players={squad} dataKey="goals" unit="goals" color="var(--A-accent)" />
        <TopPerformersPanel title="MOST DISPOSALS" players={squad} dataKey="disposals" unit="disposals" color="var(--A-accent-2)" />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <AgeProfile squad={squad} />
        <QuarterScoring career={career} />
      </div>
    </div>
  );
}
