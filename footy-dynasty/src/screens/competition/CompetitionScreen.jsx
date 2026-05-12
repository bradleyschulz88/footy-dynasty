import React, { useMemo } from "react";
import {
  BarChart3,
  Calendar,
  Trophy,
  Crown,
  Sprout,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { PYRAMID, findClub } from "../../data/pyramid.js";
import { pyramidNoteForLeague } from "../../data/pyramidMeta.js";
import { sortedLadder } from "../../lib/leagueEngine.js";
import { turningPointRibbon } from "../../lib/gameDepth.js";
import TabNav from "../../components/TabNav.jsx";
import { css, Pill } from "../../components/primitives.jsx";

// ============================================================================
// COMPETITION SCREEN — Ladder / Fixtures / Pyramid
// ============================================================================
export default function CompetitionScreen({ career, club, league, tab, setTab, onOpenCalendar }) {
  const t = tab || "ladder";
  const tabs = [
    { key: "ladder", label: "Ladder", icon: BarChart3 },
    { key: "fixtures", label: "Fixtures", icon: Calendar },
    { key: "pyramid", label: "Pyramid", icon: Trophy },
  ];
  return (
    <div className="anim-in space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[11px] text-atext-dim max-w-xl leading-relaxed">
          <span className="text-atext font-semibold">Schedule</span> is your month view and event queue.{" "}
          <span className="text-atext font-semibold">Competition</span> is ladder, fixture list, and pyramid context.
        </p>
        {typeof onOpenCalendar === "function" && (
          <button type="button" onClick={() => onOpenCalendar()} className={`${css.btnGhost} text-[11px] px-3 py-2 whitespace-nowrap shrink-0`}>
            ← Season calendar
          </button>
        )}
      </div>
      <TabNav tabs={tabs} active={t} onChange={setTab} />
      {t === "ladder"   && <LadderTab career={career} club={club} league={league} />}
      {t === "fixtures" && <FixturesTab career={career} club={club} league={league} />}
      {t === "pyramid"  && <PyramidTab career={career} club={club} league={league} />}
    </div>
  );
}

function LadderTab({ career, club, league }) {
  const sorted = sortedLadder(career.ladder);
  const promoCutoff = league.tier > 1 ? 1 : 8; // top 1 promoted; top 8 finals at tier 1
  const relegCutoff = league.tier === 1 ? 999 : sorted.length; // bottom 1 relegated except tier 1
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className={`${css.h1} text-3xl`}>{league.short} LADDER</div>
          <div className="text-xs text-atext-dim">Round {career.week} of {career.fixtures.length} · {league.name}</div>
        </div>
        <div className="flex items-center gap-3">
          <Pill color="#4AE89A">{league.tier === 1 ? "Top 8 = Finals" : "Top 1 = Promoted"}</Pill>
          {league.tier > 1 && <Pill color="#E84A6F">Bottom = Relegated</Pill>}
        </div>
      </div>

      <div className="rounded-2xl overflow-hidden" style={{border:"1px solid var(--A-line)", background:"var(--A-panel)"}}>
        <div className="grid grid-cols-12 gap-2 px-4 py-3 text-[10px] uppercase tracking-[0.15em] text-atext-mute font-black border-b" style={{borderColor:"var(--A-line)",background:"var(--A-panel-2)"}}>
          <div className="col-span-1">#</div>
          <div className="col-span-4">Club</div>
          <div className="col-span-1 text-center">P</div>
          <div className="col-span-1 text-center">W</div>
          <div className="col-span-1 text-center">L</div>
          <div className="col-span-1 text-center">D</div>
          <div className="col-span-1 text-right">F</div>
          <div className="col-span-1 text-right">A</div>
          <div className="col-span-1 text-right">%</div>
        </div>
        {sorted.map((row, i) => {
          const c = findClub(row.id);
          const isMe = row.id === career.clubId;
          const pos = i + 1;
          const inPromo = pos <= promoCutoff;
          const inReleg = pos === relegCutoff && league.tier > 1;
          return (
            <div key={row.id} className={`grid grid-cols-12 gap-2 px-4 py-2.5 items-center border-b border-aline ${isMe ? "bg-aaccent/10" : "hover:bg-aaccent/5"} transition`}>
              <div className="col-span-1 flex items-center gap-1">
                <span className={`font-bold ${inPromo ? "text-[#4AE89A]" : inReleg ? "text-[#E84A6F]" : "text-atext-dim"}`}>{pos}</span>
                {inPromo && <ArrowUp className="w-3 h-3 text-[#4AE89A]" />}
                {inReleg && <ArrowDown className="w-3 h-3 text-[#E84A6F]" />}
              </div>
              <div className="col-span-4 flex items-center gap-2">
                <div className="w-2 h-6 rounded-sm" style={{background: c?.colors[0] || "var(--A-line)"}} />
                <span className={isMe ? "font-bold text-aaccent" : "font-semibold"}>{c?.name || row.id}</span>
                {isMe && <Crown className="w-3 h-3 text-aaccent" />}
              </div>
              <div className="col-span-1 text-center text-sm">{row.P}</div>
              <div className="col-span-1 text-center text-sm font-bold text-[#4AE89A]">{row.W}</div>
              <div className="col-span-1 text-center text-sm text-[#E84A6F]">{row.L}</div>
              <div className="col-span-1 text-center text-sm text-atext-dim">{row.D}</div>
              <div className="col-span-1 text-right text-sm font-mono">{row.F}</div>
              <div className="col-span-1 text-right text-sm font-mono text-atext-dim">{row.A}</div>
              <div className="col-span-1 text-right text-sm font-mono font-bold">{row.A > 0 ? ((row.F/row.A)*100).toFixed(1) : "—"}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function FixturesTab({ career, club, league }) {
  const { lastPlayedRoundIdx, nextRoundIdx } = useMemo(() => {
    let last = -1;
    for (const e of career.eventQueue || []) {
      if (e.type === 'round' && e.completed && e.round != null) {
        last = Math.max(last, e.round - 1);
      }
    }
    const n = (career.fixtures || []).length;
    const next = last < n - 1 ? last + 1 : Math.min(last, n - 1);
    return { lastPlayedRoundIdx: last, nextRoundIdx: Math.max(0, next) };
  }, [career.eventQueue, career.fixtures]);

  return (
    <div className="space-y-4">
      <div>
        <div className={`${css.h1} text-3xl`}>FIXTURES</div>
        <div className="text-xs text-atext-dim">Full season schedule · {career.fixtures.length} rounds · progress follows completed matches</div>
      </div>
      <div className="grid md:grid-cols-2 gap-3">
        {career.fixtures.map((round, ri) => {
          const isPlayed = ri <= lastPlayedRoundIdx;
          const isCurrent = ri === nextRoundIdx && ri < career.fixtures.length && !isPlayed;
          const crucialHere = (career.crucialFive || []).some((c) => c.round === ri + 1);
          return (
            <div key={ri} className={`${css.panel} p-4 ${isCurrent ? "ring-2 ring-[var(--A-accent)]" : ""} ${crucialHere ? "ring-1 ring-amber-500/50" : ""}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="font-bold tracking-wide">Round {ri+1}</div>
                <div className="flex flex-wrap gap-1 justify-end">
                  {crucialHere && <Pill color="#F59E0B">Crucial</Pill>}
                  {isPlayed && <Pill color="#64748B">Played</Pill>}
                  {isCurrent && <Pill color="var(--A-accent)">Up Next</Pill>}
                </div>
              </div>
              <div className="space-y-1.5">
                {round.map((m, mi) => {
                  const home = findClub(m.home);
                  const away = findClub(m.away);
                  const myMatch = m.home === career.clubId || m.away === career.clubId;
                  const oppId = myMatch ? (m.home === career.clubId ? m.away : m.home) : null;
                  const isBogey = myMatch && oppId && career.bogeyTeamId === oppId;
                  const result = isPlayed && m.result;
                  const tp = m.turningPoint ? turningPointRibbon(m.turningPoint) : null;
                  return (
                    <div key={mi} className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm ${myMatch ? "bg-aaccent/10 border border-aaccent/30" : "bg-apanel"}`}>
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div className="w-1.5 h-4 rounded-sm flex-shrink-0" style={{background: home?.colors[0] || "var(--A-line)"}} />
                        <span className={`truncate ${myMatch && m.home === career.clubId ? "font-bold" : ""}`}>{home?.short || m.home}</span>
                      </div>
                      <div className="flex flex-col items-center gap-0.5 px-1 flex-shrink-0">
                        {result ? (
                          <div className="font-mono font-bold text-xs">{result.hScore}–{result.aScore}</div>
                        ) : (
                          <div className="text-[10px] text-atext-dim">vs</div>
                        )}
                        {myMatch && tp && (
                          <span className="text-[9px] font-bold uppercase tracking-tight" title={tp.ribbon}>{tp.emoji} {tp.ribbon}</span>
                        )}
                        {myMatch && isBogey && (
                          <span className="text-[9px] font-bold text-[#E879F9]" title="Bogey opponent">👻 Bogey</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                        <span className={`truncate ${myMatch && m.away === career.clubId ? "font-bold" : ""}`}>{away?.short || m.away}</span>
                        <div className="w-1.5 h-4 rounded-sm flex-shrink-0" style={{background: away?.colors[0] || "var(--A-line)"}} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PyramidTab({ career, club, league }) {
  const myState = club.state;
  // Group leagues by tier
  const byTier = { 1: [], 2: [], 3: [] };
  Object.entries(PYRAMID).forEach(([key, l]) => {
    if (byTier[l.tier]) byTier[l.tier].push([key, l]);
  });
  const isMyState = (l) => l.state === myState || l.state === "NAT";

  return (
    <div className="space-y-4">
      <div>
        <div className={`${css.h1} text-3xl`}>{myState} FOOTBALL PYRAMID</div>
        <div className="text-xs text-atext-dim">Climb from grassroots to the AFL. You're currently in <span className="text-aaccent font-bold">{league.short} (Tier {league.tier})</span>.</div>
      </div>

      <div className="space-y-4">
        {/* TIER 1 */}
        <div className={`${css.panel} p-5`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2"><Crown className="w-5 h-5 text-[#FFD200]" /><div className={`${css.h1} text-2xl`}>TIER 1 · NATIONAL</div></div>
            <Pill color="#FFD200">Premier Competition</Pill>
          </div>
          {byTier[1].map(([key, l]) => (
            <div key={key} className={`p-4 rounded-xl ${career.leagueKey===key ? "bg-aaccent/15 border-2 border-[var(--A-accent)]" : "bg-gradient-to-r from-[#FFD200]/10 to-transparent border border-[#FFD200]/30"}`}>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <div className="font-bold text-lg">{l.name}</div>
                  <div className="text-xs text-atext-dim">{l.clubs.length} clubs · Australia-wide</div>
                  <div className="text-[11px] text-atext-mute mt-1.5 leading-snug max-w-2xl">{pyramidNoteForLeague(key, l.tier)}</div>
                </div>
                {career.leagueKey===key && <Pill color="var(--A-accent)">YOU ARE HERE</Pill>}
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {l.clubs.map(c => (
                  <div key={c.id} className={`px-2 py-1 rounded text-[10px] font-bold ${c.id === career.clubId ? "bg-aaccent text-[#001520]" : ""}`} style={c.id !== career.clubId ? {background: `${c.colors[0]}33`, color: c.colors[1] === "#FFFFFF" ? "var(--A-text)" : c.colors[1], border: `1px solid ${c.colors[0]}66`} : {}}>{c.short}</div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* TIER 2 */}
        <div className={`${css.panel} p-5`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2"><Trophy className="w-5 h-5 text-[#4ADBE8]" /><div className={`${css.h1} text-2xl`}>TIER 2 · STATE LEAGUES</div></div>
            <Pill color="#4ADBE8">Promotion to AFL</Pill>
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            {byTier[2].map(([key, l]) => {
              const myStateLeague = isMyState(l);
              const isCurrent = career.leagueKey === key;
              return (
                <div key={key} className={`p-3 rounded-xl ${isCurrent ? "bg-aaccent/15 border-2 border-aaccent" : myStateLeague ? "bg-aaccent-2/10 border border-aaccent-2/40" : "bg-apanel border border-aline opacity-60"}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold text-sm">{l.short}</div>
                      <div className="text-[10px] text-atext-dim">{l.state} · {l.clubs.length} clubs</div>
                      <div className="text-[10px] text-atext-mute mt-1 leading-snug line-clamp-2">{pyramidNoteForLeague(key, l.tier)}</div>
                    </div>
                    {isCurrent && <Pill color="var(--A-accent)">HERE</Pill>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* TIER 3 */}
        <div className={`${css.panel} p-5`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2"><Sprout className="w-5 h-5 text-[#4AE89A]" /><div className={`${css.h1} text-2xl`}>TIER 3 · COMMUNITY</div></div>
            <Pill color="#4AE89A">Grassroots</Pill>
          </div>
          {byTier[3].length === 0 ? (
            <div className="text-sm text-atext-dim py-4">No tier 3 leagues currently in this build.</div>
          ) : (
            <div className="grid md:grid-cols-3 gap-2">
              {byTier[3].map(([key, l]) => {
                const myStateLeague = isMyState(l);
                const isCurrent = career.leagueKey === key;
                return (
                  <div key={key} className={`p-3 rounded-lg ${isCurrent ? "bg-aaccent/15 border-2 border-aaccent" : myStateLeague ? "bg-apos/10 border border-apos/30" : "bg-apanel border border-aline opacity-60"}`}>
                    <div className="font-bold text-xs">{l.short}</div>
                    <div className="text-[10px] text-atext-dim">{l.clubs.length} clubs · {l.state}</div>
                    <div className="text-[10px] text-atext-mute mt-1 leading-snug line-clamp-3">{pyramidNoteForLeague(key, l.tier)}</div>
                    {isCurrent && <div className="mt-1"><Pill color="var(--A-accent)">HERE</Pill></div>}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className={`${css.inset} p-4 text-xs text-atext-dim`}>
        <span className="text-aaccent font-bold">PROMOTION:</span> Win your league to climb a tier. The AFL is the summit — once there, chase the flag. The game tracks your full journey, season-by-season, from grassroots to glory.
      </div>
    </div>
  );
}

