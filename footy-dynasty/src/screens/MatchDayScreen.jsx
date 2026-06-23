import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, useAnimationControls } from "motion/react";
import { useCareer } from "../lib/careerStore.js";
import { formatDate } from "../lib/calendar.js";
import { COACHING_CALLS } from "../lib/coachingCalls.js";
import { playCrowdCheer, playSiren, playWhistle, soundEnabled } from "../lib/sound.js";

// ── Count-up animated number ────────────────────────────────────────────────
// Rolls the displayed value up/down to `value` over ~600ms via rAF.
// Pure presentational: no side-effects beyond its own local state.
function AnimatedScore({ value, duration = 600 }) {
  const [display, setDisplay] = useState(value);
  const fromRef = useRef(value);
  const rafRef = useRef(null);

  useEffect(() => {
    const target = typeof value === "number" ? value : 0;
    const start = typeof fromRef.current === "number" ? fromRef.current : 0;
    if (start === target) {
      setDisplay(target);
      return undefined;
    }
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced || typeof requestAnimationFrame === "undefined") {
      fromRef.current = target;
      setDisplay(target);
      return undefined;
    }
    let startTime = null;
    const tick = (now) => {
      if (startTime == null) startTime = now;
      const t = Math.min(1, (now - startTime) / duration);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - t, 3);
      const current = Math.round(start + (target - start) * eased);
      setDisplay(current);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = target;
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      fromRef.current = target;
    };
  }, [value, duration]);

  return <>{display}</>;
}

// Plain-English tactical effect descriptions for each coaching call
const CALL_TACTICAL_EFFECTS = {
  attack_surge:    "Opens up the game — your forwards get more looks but so do theirs. Best when you need to close a gap fast.",
  defensive_lock:  "Clamps their attack and protects your lead, but you'll score less too. Holds a margin, risks leaving points on the board.",
  midfield_grind:  "Your runners win the contested ball and generate clean possessions. Steady, reliable edge with no real downside.",
  spray:           "High risk, high reward. If the rooms respond (60% chance) you'll come out flying — if it falls flat, heads drop.",
  steady:          "No changes. Trust the structure, stay composed, and let the plan do its job.",
};

// Which call to highlight based on margin (positive = you're winning)
function getRecommendedCall(margin) {
  if (margin >= 5) return "defensive_lock";
  if (margin <= -10) return "attack_surge";
  if (Math.abs(margin) <= 12) return "midfield_grind";
  return "steady";
}

export default function MatchDayScreen({ result, liveMatch, squad, lineup, league, club, onContinue, onCoachCall, onQ3Decision }) {
  const career = useCareer();
  const [revealed, setRevealed] = useState(0);
  const [showEvents, setShowEvents] = useState(true);
  const [show3qtNote, setShow3qtNote] = useState(true);
  const [q3CallId, setQ3CallId] = useState("steady");
  const [q3SubOut, setQ3SubOut] = useState(null);
  const [q3SubIn, setQ3SubIn] = useState(null);
  // Pre-match brief: shown once on first render of a live match, dismissed by player.
  const [briefDismissed, setBriefDismissed] = useState(false);
  // Live match: only the first half exists — the coach's call sims the rest.
  const isLive = !!result.live;
  // Q3 decision phase: half-time call has been made, Q3 just finished, Q4 awaits.
  const isQ3Phase = liveMatch?.matchPhase === 'after_q3';
  const showPreBrief = isLive && !briefDismissed && !isQ3Phase;
  const sound = soundEnabled(career);

  const revealNextQuarter = () => {
    setRevealed((r) => {
      const next = Math.min(r + 1, (result.quarters || []).length);
      if (sound) {
        const q = (result.quarters || [])[next - 1];
        const goals = (q?.homeGoals ?? 0) + (q?.awayGoals ?? 0);
        if (!isLive && next >= (result.quarters || []).length) playSiren();
        else playCrowdCheer(Math.min(1, 0.35 + goals * 0.08));
      }
      // When revealing Q4, dismiss the 3QT note
      if (next === 4) setShow3qtNote(false);
      return next;
    });
  };

  const qLabels = ["Q1", "Q2", "Q3", "Q4"];

  const { cumHome, cumAway, quarters } = useMemo(() => {
    const list = result.quarters || [];
    const cumH = [];
    const cumA = [];
    let hG = 0;
    let hB = 0;
    let aG = 0;
    let aB = 0;
    for (const q of list) {
      hG += q.homeGoals;
      hB += q.homeBehinds;
      aG += q.awayGoals;
      aB += q.awayBehinds;
      cumH.push({ g: hG, b: hB, total: hG * 6 + hB });
      cumA.push({ g: aG, b: aB, total: aG * 6 + aB });
    }
    return { cumHome: cumH, cumAway: cumA, quarters: list };
  }, [result.quarters]);

  const visibleQuarter = revealed === 0 ? 0 : Math.min(revealed, quarters.length);
  const eventFeed = (result.events || []).filter((ev) => ev.q <= visibleQuarter);

  const playerLookup = useMemo(() => {
    const map = {};
    (career.squad || []).forEach((p) => {
      map[p.id] = p;
    });
    return map;
  }, [career.squad]);

  const momentumEnd = quarters.length
    ? quarters[Math.min(visibleQuarter, quarters.length) - 1]?.momentumEnd ?? 0
    : 0;
  const momentumPct = ((momentumEnd + 1) / 2) * 100;

  const homeClub = result.isHome ? club : result.opp;
  const awayClub = result.isHome ? result.opp : club;
  const myColor = club?.colors?.[0] || "var(--A-accent)";
  const oppColor = result.opp?.colors?.[0] || "#64748B";

  const won = result.won;
  const drew = result.drew;
  const resultColor = won ? "var(--A-pos)" : drew ? "var(--A-accent)" : "var(--A-neg)";

  const atHalfTime = isLive && revealed >= 2;
  const fullTime = !isLive && (quarters.length === 0 || revealed >= quarters.length);
  const scoreIdx = fullTime
    ? quarters.length - 1
    : revealed > 0
      ? Math.min(revealed, quarters.length) - 1
      : -1;
  const headerHome =
    scoreIdx >= 0 && cumHome[scoreIdx] ? cumHome[scoreIdx].total : null;
  const headerAway =
    scoreIdx >= 0 && cumAway[scoreIdx] ? cumAway[scoreIdx].total : null;
  const headerScore =
    headerHome != null && headerAway != null ? `${headerHome} – ${headerAway}` : "— – —";
  const headerStatus = fullTime
    ? won
      ? "WIN"
      : drew
        ? "DRAW"
        : "LOSS"
    : atHalfTime
      ? "HALF TIME"
      : revealed === 0
        ? "READY"
        : `END Q${revealed}`;
  const headerColor = fullTime ? resultColor : "var(--A-accent)";

  // ── Cinematic goal flash / shake / cheer ──────────────────────────────────
  // Fires only when the *cumulative goal count* actually increases, guarded by
  // refs so React re-renders alone never re-trigger it.
  const [scoreFlash, setScoreFlash] = useState(0); // bump to re-fire keyframe
  const scoreboardCtrl = useAnimationControls();
  const totalGoals = useMemo(() => {
    let g = 0;
    for (const ev of eventFeed) if (ev.kind === "goal") g += 1;
    return g;
  }, [eventFeed]);
  const prevGoalsRef = useRef(totalGoals);

  useEffect(() => {
    const prev = prevGoalsRef.current;
    prevGoalsRef.current = totalGoals;
    // Only celebrate genuinely new goals (not the very first paint / decrease).
    if (totalGoals <= prev) return undefined;
    // Re-fire the scoreFlash CSS keyframe by bumping a key.
    setScoreFlash((n) => n + 1);
    if (sound) playCrowdCheer(0.8);
    // Brief screen-shake on the scoreboard container.
    scoreboardCtrl.start({
      x: [0, -5, 5, -4, 4, 0],
      y: [0, 3, -3, 2, -2, 0],
      transition: { duration: 0.25, ease: "easeInOut" },
    });
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalGoals]);

  const commentary =
    result.isAFL
      ? [
          won
            ? `${club?.name ?? 'Your side'} put in a dominant performance today.`
            : drew
              ? "An even contest — both sides had their chances."
              : `A tough day at the office for ${club?.name ?? 'your side'}.`,
          result.myTotal > 80
            ? "The forward line was electric, converting at a high rate."
            : result.myTotal > 60
              ? "A solid if unremarkable offensive effort."
              : "The team struggled to convert inside 50.",
          won && result.myTotal - result.oppTotal > 30
            ? "It was never in doubt from the third quarter on."
            : won
              ? "They held on for a hard-fought victory."
              : "",
          result.isPreseason
            ? "Pre-season result — ladders unaffected."
            : `${league.short} Round ${result.label.replace("Round ", "")}.`,
        ].filter(Boolean)
      : [];

  const matchWeather = career.weeklyWeather?.[career.week] ?? null;

  function weatherEmoji(condition) {
    if (!condition) return '🌤️';
    const c = condition.toLowerCase();
    if (c === 'sunny' || c === 'fine') return '☀️';
    if (c === 'cloudy' || c === 'overcast') return '⛅️';
    if (c === 'windy' || c === 'wind') return '💨';
    if (c === 'rainy' || c === 'wet' || c === 'rain') return '🌧️';
    if (c === 'stormy') return '⛈️';
    return '🌤️';
  }

  // ── Half-time score margin from my perspective ──────────────────────────────
  const htScoreIdx = 1; // Q2 cumulative
  const htHomeScore = cumHome[htScoreIdx]?.total ?? null;
  const htAwayScore = cumAway[htScoreIdx]?.total ?? null;
  const htMargin =
    htHomeScore != null && htAwayScore != null
      ? result.isHome
        ? htHomeScore - htAwayScore
        : htAwayScore - htHomeScore
      : null;

  const recommendedCallId = htMargin != null ? getRecommendedCall(htMargin) : "steady";

  function htMomentumBlurb(margin) {
    if (margin == null) return "";
    if (margin > 0) return `You're up by ${margin} at the main break.`;
    if (margin < 0) return `You're down by ${Math.abs(margin)} at the main break.`;
    return "Level at the main break — it's all to play for.";
  }

  // ── Three-quarter time note ─────────────────────────────────────────────────
  const show3qtCard = !isLive && revealed === 3 && show3qtNote && quarters.length >= 3;

  function build3qtNote() {
    if (!cumHome[1] || !cumAway[1] || !cumHome[2] || !cumAway[2]) return null;
    const myQ2 = result.isHome ? cumHome[1].total : cumAway[1].total;
    const oppQ2 = result.isHome ? cumAway[1].total : cumHome[1].total;
    const myQ3 = result.isHome ? cumHome[2].total : cumAway[2].total;
    const marginAfterQ2 = myQ2 - oppQ2;
    const marginAfterQ3 = myQ3 - (result.isHome ? cumAway[2].total : cumHome[2].total);
    const swing = marginAfterQ3 - marginAfterQ2;
    let headline = "";
    let detail = "";
    if (swing >= 12) {
      headline = "Strong third quarter — you're building something here.";
      detail = `You outscored them by ${swing} in the third. Keep the foot down.`;
    } else if (swing >= 5) {
      headline = "A handy third quarter — slight edge gained.";
      detail = `You picked up ${swing} points on them. The momentum is with you.`;
    } else if (swing <= -12) {
      headline = "They dominated the third quarter — time to respond.";
      detail = `You conceded ${Math.abs(swing)} points in the third. The last quarter is everything.`;
    } else if (swing <= -5) {
      headline = "They edged the third — don't let it slip further.";
      detail = `They gained ${Math.abs(swing)} points on you. Fourth quarter is where seasons are won.`;
    } else {
      headline = "An even third quarter — it's all still in the balance.";
      detail = "Neither side could break away. The fourth quarter decides it.";
    }
    if (marginAfterQ3 > 0) {
      detail += ` You lead by ${marginAfterQ3} heading into the last.`;
    } else if (marginAfterQ3 < 0) {
      detail += ` You trail by ${Math.abs(marginAfterQ3)} — the game is still alive.`;
    } else {
      detail += " Scores are level.";
    }
    return { headline, detail };
  }

  const tqtNote = build3qtNote();

  // Determine which side is leading for momentum label
  const homeLeading = momentumEnd > 0.15;
  const awayLeading = momentumEnd < -0.15;
  const leadingClubShort = homeLeading
    ? (result.isHome ? club?.short : result.opp?.short) || "Home"
    : awayLeading
      ? (result.isHome ? result.opp?.short : club?.short) || "Away"
      : null;

  // ── Pre-Match Tactical Brief ─────────────────────────────────────────────
  if (showPreBrief) {
    const opp = result.opp;
    const oppName = opp?.name ?? "Opponent";
    const oppShort = opp?.short ?? "OPP";
    const oppColors = opp?.colors ?? ["#334155", "#0f172a"];
    const h2h = career.headToHead?.[opp?.id];
    const h2hGames = h2h ? (h2h.wins + h2h.losses + h2h.draws) : 0;
    const streak = h2h?.streak ?? 0;
    const isBogey = h2hGames >= 3 && streak <= -3;
    const isDominated = h2hGames >= 3 && streak >= 3;
    const clubColors = club?.colors ?? ["var(--A-accent)", "var(--A-accent-2)"];
    const clubShort = club?.short ?? "US";
    const tacticLabels = { balanced: "Balanced", attacking: "Attacking", defensive: "Defensive", contested: "Contested" };
    const currentTactic = career.tacticChoice || "balanced";

    return (
      <div className="min-h-screen flex flex-col" style={{ background: "linear-gradient(160deg, var(--A-bg) 0%, var(--A-bg-2) 100%)" }}>
        {/* Header */}
        <div className="px-4 pt-6 pb-5 text-center" style={{ borderBottom: "1px solid var(--A-line)" }}>
          <div className="text-[10px] font-mono uppercase tracking-widest text-atext-mute mb-3">{result.label ?? "Match Day"}</div>
          <div className="flex items-center justify-center gap-5 mb-3">
            {/* Us */}
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center font-display text-xl font-black flex-shrink-0"
              style={{ background: `linear-gradient(135deg, ${clubColors[0]}, ${clubColors[1] ?? clubColors[0]})`, color: clubColors[2] ?? "#fff" }}>
              {clubShort}
            </div>
            <div className="font-display text-3xl text-atext-mute">vs</div>
            {/* Them */}
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center font-display text-xl font-black flex-shrink-0"
              style={{ background: `linear-gradient(135deg, ${oppColors[0]}, ${oppColors[1] ?? oppColors[0]})`, color: oppColors[2] ?? "#fff" }}>
              {oppShort}
            </div>
          </div>
          <div className="text-sm font-semibold text-atext">{oppName}</div>
          {result.isHome !== undefined && (
            <div className="text-[11px] text-atext-mute mt-0.5">{result.isHome ? "Home game" : "Away game"}</div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-5 max-w-2xl mx-auto w-full space-y-4">
          {/* H2H Intel */}
          {h2hGames >= 2 && (
            <div className="rounded-2xl p-4" style={{ background: "var(--A-panel)", border: "1px solid var(--A-line)" }}>
              <div className="text-[10px] font-mono uppercase tracking-widest text-aaccent mb-2">Head to Head</div>
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div className="font-display text-2xl" style={{ color: "var(--A-pos)" }}>{h2h?.wins ?? 0}</div>
                  <div className="text-[10px] text-atext-mute">Wins</div>
                </div>
                <div className="text-center">
                  <div className="font-display text-2xl text-atext-dim">{h2h?.draws ?? 0}</div>
                  <div className="text-[10px] text-atext-mute">Draws</div>
                </div>
                <div className="text-center">
                  <div className="font-display text-2xl" style={{ color: "var(--A-neg)" }}>{h2h?.losses ?? 0}</div>
                  <div className="text-[10px] text-atext-mute">Losses</div>
                </div>
                <div className="flex-1" />
                {isBogey && <div className="text-xs px-2 py-1 rounded-lg font-bold" style={{ background: "color-mix(in srgb, var(--A-neg) 12%, transparent)", color: "var(--A-neg)", border: "1px solid color-mix(in srgb, var(--A-neg) 30%, transparent)" }}>⚠ Bogey team</div>}
                {isDominated && <div className="text-xs px-2 py-1 rounded-lg font-bold" style={{ background: "color-mix(in srgb, var(--A-pos) 12%, transparent)", color: "var(--A-pos)", border: "1px solid color-mix(in srgb, var(--A-pos) 30%, transparent)" }}>★ Dominated</div>}
                {!isBogey && !isDominated && <div className="text-xs text-atext-mute">{streak > 0 ? `${streak}W streak` : streak < 0 ? `${Math.abs(streak)}L streak` : "Evenly matched"}</div>}
              </div>
            </div>
          )}

          {/* Current tactic */}
          <div className="rounded-2xl p-4" style={{ background: "var(--A-panel)", border: "1px solid var(--A-line)" }}>
            <div className="text-[10px] font-mono uppercase tracking-widest text-aaccent mb-2">Going in with</div>
            <div className="flex items-center gap-3">
              <div className="font-display text-lg text-atext">{tacticLabels[currentTactic] ?? currentTactic}</div>
              <div className="text-xs text-atext-mute">
                {currentTactic === "attacking" ? "High risk — more scoring, more conceding." :
                 currentTactic === "defensive" ? "Safety first — protect the lead, limit conceding." :
                 currentTactic === "contested" ? "Win the hard ball — midfield grind." :
                 "Trust the structure. Balanced across the ground."}
              </div>
            </div>
            {isBogey && (
              <div className="mt-2 text-[11px]" style={{ color: "var(--A-neg)" }}>
                ⚠ They've had your measure lately. Your ratings take a small hit going in. Break the streak.
              </div>
            )}
          </div>

          {/* Opponent scout if purchased */}
          {career.oppositionReport?.[opp?.id]?.tier >= 1 && (
            <div className="rounded-2xl p-4" style={{ background: "var(--A-panel)", border: "1px solid var(--A-line)" }}>
              <div className="text-[10px] font-mono uppercase tracking-widest text-aaccent mb-2">Scout Report</div>
              <div className="text-xs text-atext-dim leading-relaxed">
                {career.oppositionReport[opp.id].matchupNote ?? "No key intel available."}
              </div>
            </div>
          )}
        </div>

        <div className="px-4 pb-6 pt-3 border-t border-aline">
          <button type="button" onClick={() => setBriefDismissed(true)}
            className="w-full py-4 rounded-xl font-display text-xl tracking-widest"
            style={{
              background: "linear-gradient(135deg, var(--A-accent), var(--A-accent-2))",
              color: "var(--fd-on-accent, #0A0D0C)",
              boxShadow: "0 4px 24px color-mix(in srgb, var(--A-accent) 35%, transparent)",
            }}>
            PLAY MATCH →
          </button>
        </div>
      </div>
    );
  }

  // ── Q3 Decision Screen ───────────────────────────────────────────────────
  if (isQ3Phase) {
    const snap = liveMatch.q3Snapshot || {};
    const margin = snap.margin ?? 0;
    const marginAbs = Math.abs(margin);
    const leading = margin > 0;
    const tied = margin === 0;
    const marginLabel = tied ? "All square" : `${leading ? "Up" : "Down"} by ${marginAbs} point${marginAbs === 1 ? "" : "s"}`;
    const urgency = !leading && marginAbs > 24 ? "danger" : !leading && marginAbs > 12 ? "behind" : leading && marginAbs > 18 ? "protect" : "contest";
    const urgencyColor = urgency === "danger" ? "var(--A-neg)" : urgency === "behind" ? "#F59E0B" : urgency === "protect" ? "var(--A-pos)" : "var(--A-accent)";
    const recQ4Call = margin >= 12 ? "defensive_lock" : margin <= -18 ? "attack_surge" : margin <= -8 ? "spray" : "steady";

    // Bench players available for sub (fit, not already in lineup, not substituted)
    const lineupSet = new Set(lineup || []);
    const benchAvail = (squad || []).filter(p => !lineupSet.has(p.id) && !p.substituted && !p.injured && p.fitness >= 60);
    // Lineup players eligible to come off (those with low fitness or form)
    const lineupPlayers = (squad || []).filter(p => lineupSet.has(p.id) && !p.substituted);

    return (
      <div className="min-h-screen flex flex-col" style={{ background: "linear-gradient(160deg, var(--A-bg) 0%, var(--A-bg-2) 100%)" }}>
        {/* Header */}
        <div className="px-4 pt-5 pb-4 text-center" style={{ borderBottom: "1px solid var(--A-line)", background: `linear-gradient(180deg, color-mix(in srgb, ${urgencyColor} 6%, var(--A-panel)) 0%, transparent 100%)` }}>
          <div className="text-[10px] font-mono uppercase tracking-widest text-atext-mute mb-1">3 Quarter Time</div>
          <div className="font-display text-5xl md:text-6xl mb-1">
            <span style={{ color: leading || tied ? "var(--A-pos)" : "var(--A-neg)" }}>{snap.myTotal ?? "—"}</span>
            <span className="text-atext-mute mx-2 text-3xl">vs</span>
            <span className="text-atext-dim">{snap.oppTotal ?? "—"}</span>
          </div>
          <div className="text-sm font-bold mt-1" style={{ color: urgencyColor }}>{marginLabel}</div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-5 max-w-2xl mx-auto w-full space-y-5">
          {/* Q4 tactical call */}
          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-aaccent mb-2">Q4 Tactical Call</div>
            <div className="text-xs text-atext-dim mb-3">One final adjustment before the siren. Choose how the side attacks the last quarter.</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {COACHING_CALLS.map((call) => {
                const isRec = call.id === recQ4Call;
                const isSel = q3CallId === call.id;
                return (
                  <button key={call.id} type="button" onClick={() => setQ3CallId(call.id)}
                    className="rounded-xl p-3 text-left transition-all"
                    style={{
                      background: isSel ? "color-mix(in srgb, var(--A-accent) 10%, var(--A-panel))" : "var(--A-panel)",
                      border: isSel ? "1px solid var(--A-accent)" : isRec ? "1px solid color-mix(in srgb, var(--A-accent) 35%, var(--A-line))" : "1px solid var(--A-line)",
                      transform: isSel ? "translateY(-1px)" : "",
                      boxShadow: isSel ? "0 4px 16px color-mix(in srgb, var(--A-accent) 15%, transparent)" : "",
                    }}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-base">{call.icon}</span>
                      <span className="font-bold text-sm text-atext">{call.label}</span>
                      {isRec && !isSel && <span className="text-[9px] px-1.5 py-0.5 rounded font-mono uppercase" style={{ background: "color-mix(in srgb, var(--A-accent) 15%, transparent)", color: "var(--A-accent)" }}>✦ Rec</span>}
                      {isSel && <span className="text-[9px] px-1.5 py-0.5 rounded font-mono uppercase" style={{ background: "color-mix(in srgb, var(--A-accent) 20%, transparent)", color: "var(--A-accent)" }}>Selected</span>}
                    </div>
                    <div className="text-[11px] text-atext-dim leading-snug">{CALL_TACTICAL_EFFECTS[call.id]}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Substitution (optional) */}
          {benchAvail.length > 0 && lineupPlayers.length > 0 && (
            <div>
              <div className="text-[10px] font-mono uppercase tracking-widest text-aaccent mb-2">Make a Substitution <span className="text-atext-mute normal-case tracking-normal">(optional)</span></div>
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <div className="text-[10px] text-atext-mute mb-1.5">Take off</div>
                  <div className="space-y-1 max-h-40 overflow-y-auto [scrollbar-width:thin]">
                    {[{ id: null, label: "No sub" }, ...lineupPlayers.slice().sort((a,b) => (a.fitness ?? 100) - (b.fitness ?? 100)).slice(0, 8).map(p => ({ id: p.id, label: `${p.firstName ? p.firstName[0]+". "+p.lastName : p.name}  ${p.fitness ?? "—"}% fit` }))].map(opt => (
                      <button key={opt.id ?? "none"} type="button" onClick={() => setQ3SubOut(opt.id)}
                        className="w-full text-left px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                        style={{
                          background: q3SubOut === opt.id ? "color-mix(in srgb, var(--A-neg) 10%, var(--A-panel))" : "var(--A-panel)",
                          border: q3SubOut === opt.id ? "1px solid color-mix(in srgb, var(--A-neg) 50%, transparent)" : "1px solid var(--A-line)",
                          color: q3SubOut === opt.id ? "var(--A-neg)" : "var(--A-text)",
                        }}>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-atext-mute mb-1.5">Bring on</div>
                  <div className="space-y-1 max-h-40 overflow-y-auto [scrollbar-width:thin]">
                    {[{ id: null, label: "No sub" }, ...benchAvail.slice().sort((a,b) => (b.overall ?? 0) - (a.overall ?? 0)).slice(0, 8).map(p => ({ id: p.id, label: `${p.firstName ? p.firstName[0]+". "+p.lastName : p.name}  OVR ${p.overall}` }))].map(opt => (
                      <button key={opt.id ?? "none"} type="button" onClick={() => setQ3SubIn(opt.id)}
                        className="w-full text-left px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                        style={{
                          background: q3SubIn === opt.id ? "color-mix(in srgb, var(--A-pos) 10%, var(--A-panel))" : "var(--A-panel)",
                          border: q3SubIn === opt.id ? "1px solid color-mix(in srgb, var(--A-pos) 50%, transparent)" : "1px solid var(--A-line)",
                          color: q3SubIn === opt.id ? "var(--A-pos)" : "var(--A-text)",
                        }}>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* CTA */}
        <div className="px-4 pb-6 pt-3 border-t border-aline">
          <button type="button"
            onClick={() => onQ3Decision?.({ callId: q3CallId, subOutId: q3SubOut, subInId: q3SubIn })}
            className="w-full py-4 rounded-xl font-display text-xl tracking-widest"
            style={{
              background: `linear-gradient(135deg, ${urgencyColor}, color-mix(in srgb, ${urgencyColor} 70%, var(--A-accent-2)))`,
              color: "#fff",
              boxShadow: `0 4px 24px color-mix(in srgb, ${urgencyColor} 35%, transparent)`,
            }}>
            PLAY Q4 →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "linear-gradient(160deg, var(--A-bg) 0%, var(--A-bg-2) 100%)" }}
    >
      {/* ── Match Header / Hero scoreboard ── */}
      <div
        className="px-4 pt-5 pb-4 text-center"
        style={{
          borderBottom: "1px solid var(--A-line)",
          background: "color-mix(in srgb, var(--A-panel) 60%, transparent)",
          backdropFilter: "blur(8px)",
        }}
      >
        {/* Match label + date chip */}
        <div className="flex items-center justify-center gap-2 mb-3">
          <div
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full"
            style={{
              background: "color-mix(in srgb, var(--A-accent) 10%, var(--A-panel))",
              border: "1px solid color-mix(in srgb, var(--A-accent) 25%, var(--A-line))",
            }}
          >
            <span
              className="text-[11px] font-bold uppercase tracking-[0.28em] font-mono"
              style={{ color: "var(--A-accent)" }}
            >
              {result.label}
            </span>
            {career.currentDate && (
              <>
                <span className="text-[10px] text-atext-mute">·</span>
                <span className="text-[10px] text-atext-mute font-mono">{formatDate(career.currentDate)}</span>
              </>
            )}
            {result.isPreseason && (
              <>
                <span className="text-[10px] text-atext-mute">·</span>
                <span className="text-[10px] text-atext-mute font-mono">Pre-Season</span>
              </>
            )}
          </div>
        </div>

        {/* Weather */}
        {matchWeather && (
          <div className="text-[10px] text-atext-mute mb-3 font-mono">
            {weatherEmoji(matchWeather)} <span className="capitalize">{matchWeather}</span>
          </div>
        )}

        {/* Teams + Scoreboard */}
        <motion.div animate={scoreboardCtrl} className="flex items-center justify-center gap-4 md:gap-8">
          {/* Home team */}
          <div className="text-center flex-1">
            <div
              className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center font-display text-2xl mb-2"
              style={{
                background: `linear-gradient(135deg,${homeClub?.colors?.[0] || "var(--A-accent)"},${homeClub?.colors?.[1] || "#D07A2A"})`,
                color: homeClub?.colors?.[2] || "#FFF",
                boxShadow: `0 6px 20px ${homeClub?.colors?.[0] || "var(--A-accent)"}44`,
              }}
            >
              {homeClub?.short}
            </div>
            <div className="text-atext font-bold text-sm leading-tight">{homeClub?.name}</div>
            <div
              className="text-[9px] font-mono uppercase tracking-[0.2em] mt-0.5 px-2 py-0.5 rounded-full inline-block"
              style={{
                background: "color-mix(in srgb, var(--A-text-mute) 10%, transparent)",
                color: "var(--A-text-mute)",
              }}
            >HOME</div>
          </div>

          {/* Live score — hero element */}
          <div className="text-center px-2 flex-shrink-0">
            {/* Score — very large, monospace */}
            <div
              key={`flash-${scoreFlash}`}
              className={`font-display leading-none tabular-nums${scoreFlash > 0 ? " score-flash" : ""}`}
              style={{
                fontSize: "clamp(3rem, 12vw, 5.5rem)",
                color: headerColor,
                fontVariantNumeric: "tabular-nums",
                filter: fullTime
                  ? `drop-shadow(0 0 24px color-mix(in srgb, ${headerColor} 55%, transparent))`
                  : "none",
                transition: "color 0.4s ease, filter 0.4s ease",
                letterSpacing: "-0.02em",
              }}
            >
              {headerHome != null && headerAway != null ? (
                <>
                  <AnimatedScore value={headerHome} />
                  {" – "}
                  <AnimatedScore value={headerAway} />
                </>
              ) : (
                headerScore
              )}
            </div>

            {/* Status chip */}
            <div className="mt-2 inline-flex items-center justify-center">
              <span
                className="text-[11px] font-black uppercase tracking-[0.22em] font-mono px-3 py-1 rounded-full"
                style={{
                  background: `color-mix(in srgb, ${headerColor} 14%, var(--A-panel))`,
                  color: headerColor,
                  border: `1px solid color-mix(in srgb, ${headerColor} 30%, var(--A-line))`,
                  boxShadow: fullTime ? `0 0 14px color-mix(in srgb, ${headerColor} 30%, transparent)` : "none",
                }}
              >
                {headerStatus}
              </span>
            </div>
          </div>

          {/* Away team */}
          <div className="text-center flex-1">
            <div
              className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center font-display text-2xl mb-2"
              style={{
                background: `linear-gradient(135deg,${awayClub?.colors?.[0] || "#64748B"},${awayClub?.colors?.[1] || "#475569"})`,
                color: awayClub?.colors?.[2] || "#FFF",
                boxShadow: `0 6px 20px ${awayClub?.colors?.[0] || "#64748B"}44`,
              }}
            >
              {awayClub?.short}
            </div>
            <div className="text-atext font-bold text-sm leading-tight">{awayClub?.name}</div>
            <div
              className="text-[9px] font-mono uppercase tracking-[0.2em] mt-0.5 px-2 py-0.5 rounded-full inline-block"
              style={{
                background: "color-mix(in srgb, var(--A-text-mute) 10%, transparent)",
                color: "var(--A-text-mute)",
              }}
            >AWAY</div>
          </div>
        </motion.div>
      </div>

      {/* ── Momentum / pressure bar ── */}
      {result.events && result.events.length > 0 && (
        <div className="px-5 py-4 max-w-2xl mx-auto w-full">
          <div className="flex items-center justify-between mb-2">
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-atext-mute font-mono">
              Momentum
              {visibleQuarter > 0 && (
                <span
                  className="ml-2 px-1.5 py-0.5 rounded font-mono"
                  style={{
                    background: "color-mix(in srgb, var(--A-accent) 10%, transparent)",
                    color: "var(--A-accent)",
                    border: "1px solid color-mix(in srgb, var(--A-accent) 20%, transparent)",
                  }}
                >
                  {qLabels[visibleQuarter - 1]}
                </span>
              )}
            </div>
            <div
              className="text-[10px] font-mono font-bold"
              style={{
                color: leadingClubShort ? "var(--A-accent)" : "var(--A-text-mute)",
              }}
            >
              {leadingClubShort ? `${leadingClubShort} on top` : "Even contest"}
            </div>
          </div>
          {/* Gradient momentum bar with rounded caps and center tick */}
          <div className="relative h-3 rounded-full overflow-hidden momentum-bar" style={{ background: "var(--A-panel-2)", border: "1px solid var(--A-line)" }}>
            {/* Home side fill */}
            <div
              className="absolute top-0 left-0 h-full"
              style={{
                width: `${momentumPct}%`,
                background: `linear-gradient(90deg, ${myColor}99, ${myColor})`,
                borderRadius: "9999px 0 0 9999px",
              }}
            />
            {/* Away side fill (from right) */}
            <div
              className="absolute top-0 right-0 h-full"
              style={{
                width: `${100 - momentumPct}%`,
                background: `linear-gradient(90deg, ${oppColor}, ${oppColor}99)`,
                borderRadius: "0 9999px 9999px 0",
              }}
            />
            {/* Center tick */}
            <div
              className="absolute top-0 bottom-0 w-0.5"
              style={{
                left: "50%",
                transform: "translateX(-50%)",
                background: "var(--A-bg)",
                opacity: 0.6,
              }}
            />
          </div>
          <div className="flex justify-between mt-1">
            <div className="text-[9px] text-atext-mute font-mono">{homeClub?.short}</div>
            <div className="text-[9px] text-atext-mute font-mono">{awayClub?.short}</div>
          </div>
        </div>
      )}

      {/* ── Broadcast feed ── */}
      {result.events && result.events.length > 0 && (
        <div className="px-5 max-w-2xl mx-auto w-full">
          <button
            onClick={() => setShowEvents((s) => !s)}
            className="text-[10px] font-bold uppercase tracking-[0.2em] flex items-center gap-1.5 mb-2"
            style={{ color: "var(--A-accent)" }}
          >
            <span>{showEvents ? "▾" : "▸"}</span>
            <span>Broadcast Feed</span>
            {result.events.filter((e) => e.kind === "moment").length > 0 && (
              <span className="text-[9px] text-atext-mute ml-1 font-normal normal-case tracking-normal">
                {result.events.filter((e) => e.kind === "moment").length} key moments
              </span>
            )}
          </button>
          {showEvents && (
            <div
              className="rounded-2xl p-3 max-h-64 overflow-y-auto space-y-0.5"
              style={{ background: "var(--A-panel-2)", border: "1px solid var(--A-line)" }}
            >
              {eventFeed.length === 0 && (
                <div className="text-xs text-atext-mute text-center py-3">Waiting for first quarter…</div>
              )}
              {(() => {
                // Build running score as we scan events chronologically
                let runH = 0, runA = 0;
                const withScore = [...eventFeed].map(ev => {
                  if (ev.kind === 'goal') {
                    if (ev.side === 'home') runH += 6; else runA += 6;
                  } else if (ev.kind === 'behind') {
                    if (ev.side === 'home') runH += 1; else runA += 1;
                  }
                  return { ...ev, snapH: runH, snapA: runA };
                });
                return withScore.slice().reverse().map((ev, i) => {
                  const player = ev.scorer
                    ? playerLookup[ev.scorer]
                    : ev.playerId
                      ? playerLookup[ev.playerId]
                      : null;
                  const sideMine = (result.isHome ? "home" : "away") === ev.side;
                  const isGoal = ev.kind === "goal";
                  const evColor =
                    isGoal
                      ? sideMine ? "var(--A-pos)" : "var(--A-neg)"
                      : ev.kind === "behind"
                        ? "var(--A-accent)"
                        : ev.kind === "moment"
                          ? "#A78BFA"
                          : "var(--A-text-mute)";
                  const icon =
                    isGoal ? "⚽" : ev.kind === "behind" ? "○" : ev.kind === "miss" ? "·" : "✦";
                  const playerLabel = player
                    ? `${player.firstName ? player.firstName + " " : ""}${player.lastName || player.name || ""}`
                    : null;
                  let label = "";
                  if (isGoal) label = playerLabel ? `${playerLabel} — GOAL` : "GOAL";
                  else if (ev.kind === "behind") label = playerLabel ? `${playerLabel} — Behind` : "Behind";
                  else if (ev.kind === "miss") label = "Out on the full";
                  else if (ev.kind === "moment") label = ev.text;
                  // Running score display for goals/behinds
                  const mySnap = result.isHome ? ev.snapH : ev.snapA;
                  const oppSnap = result.isHome ? ev.snapA : ev.snapH;
                  const scoreSnap = (isGoal || ev.kind === "behind") ? `${mySnap}–${oppSnap}` : null;
                  return (
                    <motion.div
                      key={i}
                      initial={isGoal ? { opacity: 0, x: -12, scale: 0.97 } : { opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      transition={{ duration: isGoal ? 0.4 : 0.3, ease: [0.2, 0.7, 0.3, 1] }}
                      className={`feed-item flex items-center gap-2 px-2 rounded-lg ${isGoal ? 'py-2' : 'py-1'}`}
                      style={{
                        background: isGoal && i === 0
                          ? `color-mix(in srgb, ${evColor} 16%, var(--A-panel))`
                          : isGoal
                            ? `color-mix(in srgb, ${evColor} 8%, transparent)`
                            : 'transparent',
                        borderLeft: isGoal ? `3px solid ${evColor}` : `2px solid ${i === 0 ? evColor : 'transparent'}`,
                        boxShadow: isGoal && i === 0 ? `0 2px 12px color-mix(in srgb, ${evColor} 22%, transparent)` : 'none',
                      }}
                    >
                      <span className="text-[9px] font-mono text-atext-mute w-14 flex-shrink-0 tabular-nums">
                        Q{ev.q} {String(ev.minute % 25).padStart(2, "0")}{"'"}
                      </span>
                      <span style={{ color: evColor }} className={`flex-shrink-0 text-center ${isGoal ? 'text-[15px]' : 'text-xs'}`}>
                        {icon}
                      </span>
                      <span
                        className="text-[10px] uppercase tracking-wider font-black w-12 flex-shrink-0 font-mono"
                        style={{ color: sideMine ? "var(--A-pos)" : "var(--A-neg)" }}
                      >
                        {sideMine ? club?.short : result.opp?.short || "OPP"}
                      </span>
                      <span
                        className={`flex-1 truncate ${isGoal ? 'text-[13px] font-bold text-atext tracking-wide' : 'text-[11px] text-atext-dim'}`}
                        style={isGoal ? { textShadow: `0 0 12px color-mix(in srgb, ${evColor} 35%, transparent)` } : undefined}
                      >
                        {label}
                      </span>
                      {scoreSnap && (
                        <span className={`font-mono font-bold tabular-nums flex-shrink-0 ${isGoal ? 'text-[11px]' : 'text-[10px]'}`}
                          style={{ color: mySnap > oppSnap ? 'var(--A-pos)' : mySnap < oppSnap ? 'var(--A-neg)' : 'var(--A-accent)' }}>
                          {scoreSnap}
                        </span>
                      )}
                    </motion.div>
                  );
                });
              })()}
            </div>
          )}
        </div>
      )}

      {/* ── Quarter-by-quarter breakdown ── */}
      <div className="flex-1 px-5 py-5 max-w-2xl mx-auto w-full">
        <div className="mb-4">
          <div
            className="text-[10px] font-bold uppercase tracking-[0.22em] font-mono mb-3"
            style={{ color: "var(--A-text-mute)" }}
          >
            Quarter by Quarter
          </div>
          {quarters.length === 0 && (
            <div className="text-atext-mute text-sm text-center py-4">No quarter data available.</div>
          )}
          <div className="space-y-2.5">
            {quarters.map((q, i) => {
              const isShowing = i < revealed || revealed === quarters.length;
              const hCum = cumHome[i] || { g: 0, b: 0, total: 0 };
              const aCum = cumAway[i] || { g: 0, b: 0, total: 0 };
              const qWinner = hCum.total > aCum.total ? "home" : aCum.total > hCum.total ? "away" : "draw";
              const myWon = qWinner === (result.isHome ? "home" : "away");
              const qMomentum = q.momentumEnd ?? 0;
              const myMomentumUp = result.isHome ? qMomentum > 0.1 : qMomentum < -0.1;
              const myMomentumDown = result.isHome ? qMomentum < -0.1 : qMomentum > 0.1;
              const momentumArrow = myMomentumUp ? "↑" : myMomentumDown ? "↓" : "→";
              const momentumArrowColor = myMomentumUp ? "var(--A-pos)" : myMomentumDown ? "var(--A-neg)" : "var(--A-text-mute)";
              return (
                <motion.div
                  key={i}
                  initial={false}
                  animate={isShowing ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
                  transition={{ duration: 0.4, ease: [0.2, 0.7, 0.3, 1], delay: isShowing ? Math.min(i, 3) * 0.06 : 0 }}
                  className="rounded-2xl p-4"
                  style={{
                    background: "var(--A-panel-2)",
                    border: isShowing && myWon
                      ? `1px solid color-mix(in srgb, var(--A-pos) 22%, var(--A-line))`
                      : "1px solid var(--A-line)",
                    pointerEvents: isShowing ? "auto" : "none",
                  }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      {/* Quarter label as scoreboard chip */}
                      <span
                        className="text-[10px] font-black uppercase tracking-[0.2em] font-mono px-2.5 py-0.5 rounded-full"
                        style={{
                          background: "color-mix(in srgb, var(--A-accent) 10%, var(--A-panel))",
                          color: "var(--A-accent)",
                          border: "1px solid color-mix(in srgb, var(--A-accent) 20%, var(--A-line))",
                        }}
                      >
                        {qLabels[i]}
                      </span>
                      {isShowing && (
                        <span
                          className="text-[11px] font-bold"
                          style={{ color: momentumArrowColor }}
                          title={myMomentumUp ? "Momentum with you" : myMomentumDown ? "Momentum against you" : "Even momentum"}
                        >
                          {momentumArrow}
                        </span>
                      )}
                    </div>
                    {isShowing && (
                      <div className="text-[10px] text-atext-mute font-mono">
                        {q.homeGoals}.{String(q.homeBehinds).padStart(2, "0")} — {q.awayGoals}.{String(q.awayBehinds).padStart(2, "0")} <span className="opacity-60">qtr</span>
                      </div>
                    )}
                  </div>
                  {isShowing && (
                    <div className="flex items-center gap-4 mt-2">
                      <div className="text-right flex-1">
                        <span
                          className="font-display tabular-nums leading-none"
                          style={{
                            fontSize: "2rem",
                            color: result.isHome ? myColor : oppColor,
                            fontVariantNumeric: "tabular-nums",
                          }}
                        >
                          {hCum.total}
                        </span>
                        <div className="text-[10px] text-atext-mute font-mono">
                          {hCum.g}.{String(hCum.b).padStart(2, "0")}
                        </div>
                      </div>
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                        style={{
                          background: myWon
                            ? "color-mix(in srgb, var(--A-pos) 13%, transparent)"
                            : "color-mix(in srgb, var(--A-text-mute) 13%, transparent)",
                          color: myWon ? "var(--A-pos)" : "var(--A-text-mute)",
                          border: myWon
                            ? "1px solid color-mix(in srgb, var(--A-pos) 25%, transparent)"
                            : "1px solid color-mix(in srgb, var(--A-text-mute) 15%, transparent)",
                        }}
                      >
                        {qWinner === "draw" ? "=" : myWon ? "▲" : "▼"}
                      </div>
                      <div className="text-left flex-1">
                        <span
                          className="font-display tabular-nums leading-none"
                          style={{
                            fontSize: "2rem",
                            color: result.isHome ? oppColor : myColor,
                            fontVariantNumeric: "tabular-nums",
                          }}
                        >
                          {aCum.total}
                        </span>
                        <div className="text-[10px] text-atext-mute font-mono">
                          {aCum.g}.{String(aCum.b).padStart(2, "0")}
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* ── Three-quarter time tactical note ── */}
          {show3qtCard && tqtNote && (
            <div
              className="mt-4 rounded-2xl p-4"
              style={{
                background: "color-mix(in srgb, #A78BFA 7%, var(--A-panel-2))",
                border: "1px solid color-mix(in srgb, #A78BFA 30%, transparent)",
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div
                    className="text-[10px] font-bold uppercase tracking-[0.2em] mb-1"
                    style={{ color: "#A78BFA" }}
                  >
                    Coach's Assessment · 3QT
                  </div>
                  <div className="text-sm font-bold text-atext mb-1">{tqtNote.headline}</div>
                  <div className="text-[12px] text-atext-dim leading-snug">{tqtNote.detail}</div>
                </div>
                <button
                  onClick={() => setShow3qtNote(false)}
                  className="text-[11px] text-atext-mute hover:text-atext flex-shrink-0 mt-0.5"
                  aria-label="Dismiss note"
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          {quarters.length > 0 && revealed < quarters.length && (
            <button
              onClick={revealNextQuarter}
              className="mt-4 w-full rounded-xl py-3 text-sm font-bold uppercase tracking-widest transition-all"
              style={{
                background: "color-mix(in srgb, var(--A-accent) 10%, transparent)",
                color: "var(--A-accent)",
                border: "1px solid color-mix(in srgb, var(--A-accent) 25%, transparent)",
              }}
            >
              Show {qLabels[revealed]} →
            </button>
          )}

          {/* ── Half-time: the coach's call ── */}
          {atHalfTime && (
            <div
              className="mt-4 rounded-2xl p-5"
              style={{
                background: "color-mix(in srgb, var(--A-accent) 7%, var(--A-panel-2))",
                border: "2px solid color-mix(in srgb, var(--A-accent) 35%, transparent)",
              }}
            >
              <div className="font-display text-xl text-aaccent mb-1">HALF-TIME — COACH'S CALL</div>

              {/* Score summary + momentum assessment */}
              <div
                className="rounded-xl px-3 py-2 mb-3"
                style={{
                  background: "color-mix(in srgb, var(--A-accent) 10%, transparent)",
                  border: "1px solid color-mix(in srgb, var(--A-accent) 20%, transparent)",
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-atext-mute">Half-time score</div>
                  {htHomeScore != null && htAwayScore != null && (
                    <div className="font-display text-lg" style={{ color: "var(--A-accent)" }}>
                      {htHomeScore} – {htAwayScore}
                    </div>
                  )}
                </div>
                {htHomeScore != null && htAwayScore != null && cumHome[0] && cumAway[0] && (
                  <div className="text-[11px] text-atext-mute mt-0.5 font-mono">
                    Q1: {result.isHome ? cumHome[0].g : cumAway[0].g}.{String(result.isHome ? cumHome[0].b : cumAway[0].b).padStart(2,"0")} ({result.isHome ? cumHome[0].total : cumAway[0].total})
                    {"  "}Q2: {result.isHome ? cumHome[1].g : cumAway[1].g}.{String(result.isHome ? cumHome[1].b : cumAway[1].b).padStart(2,"0")} ({result.isHome ? cumHome[1].total : cumAway[1].total})
                  </div>
                )}
                <div
                  className="text-[12px] font-bold mt-1"
                  style={{
                    color: htMargin != null && htMargin > 0
                      ? "var(--A-pos)"
                      : htMargin != null && htMargin < 0
                        ? "var(--A-neg)"
                        : "var(--A-accent)",
                  }}
                >
                  {htMomentumBlurb(htMargin)}
                </div>
              </div>

              <div className="text-xs text-atext-dim mb-3">
                One call shapes the second half — choose how the rooms respond.
              </div>
              {/* Premium action cards for coaching calls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {COACHING_CALLS.map((call) => {
                  const isRecommended = call.id === recommendedCallId;
                  return (
                    <button
                      key={call.id}
                      onClick={() => { if (sound) playWhistle(); onCoachCall?.(call.id); }}
                      className="rounded-xl p-3.5 text-left transition-all touch-manipulation relative"
                      style={{
                        background: isRecommended
                          ? "color-mix(in srgb, var(--A-accent) 8%, var(--A-panel))"
                          : "var(--A-panel)",
                        border: isRecommended
                          ? "1px solid color-mix(in srgb, var(--A-accent) 45%, transparent)"
                          : "1px solid var(--A-line)",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = "color-mix(in srgb, var(--A-accent) 40%, var(--A-line))";
                        e.currentTarget.style.background = "color-mix(in srgb, var(--A-accent) 5%, var(--A-panel))";
                        e.currentTarget.style.transform = "translateY(-2px)";
                        e.currentTarget.style.boxShadow = "0 6px 20px color-mix(in srgb, var(--A-accent) 12%, transparent)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = isRecommended ? "color-mix(in srgb, var(--A-accent) 45%, transparent)" : "var(--A-line)";
                        e.currentTarget.style.background = isRecommended ? "color-mix(in srgb, var(--A-accent) 8%, var(--A-panel))" : "var(--A-panel)";
                        e.currentTarget.style.transform = "";
                        e.currentTarget.style.boxShadow = "";
                      }}
                    >
                      {isRecommended && (
                        <div
                          className="absolute top-2 right-2 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full"
                          style={{
                            background: "color-mix(in srgb, var(--A-accent) 20%, transparent)",
                            color: "var(--A-accent)",
                            border: "1px solid color-mix(in srgb, var(--A-accent) 40%, transparent)",
                          }}
                        >
                          ✦ Best
                        </div>
                      )}
                      <div className="flex items-center gap-2.5 mb-1">
                        <span
                          className="text-xl w-8 h-8 flex items-center justify-center rounded-lg flex-shrink-0"
                          style={{
                            background: "color-mix(in srgb, var(--A-accent) 10%, transparent)",
                            border: "1px solid color-mix(in srgb, var(--A-accent) 18%, transparent)",
                          }}
                          aria-hidden
                        >{call.icon}</span>
                        <div className="font-bold text-sm text-atext leading-tight">{call.label}</div>
                      </div>
                      <div className="text-[11px] text-atext-dim leading-snug ml-10">{call.desc}</div>
                      {CALL_TACTICAL_EFFECTS[call.id] && (
                        <div className="text-[10px] mt-1.5 leading-snug ml-10" style={{ color: "var(--A-accent)", opacity: 0.8 }}>
                          {CALL_TACTICAL_EFFECTS[call.id]}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Coach's call result banner (second half) ── */}
          {!isLive && result.coachCall && revealed >= 2 && (
            <div
              className="mt-4 rounded-xl px-4 py-3 text-sm flex items-center gap-2.5"
              style={{
                background: "color-mix(in srgb, var(--A-accent) 8%, transparent)",
                border: "1px solid color-mix(in srgb, var(--A-accent) 25%, transparent)",
              }}
            >
              <span
                className="w-8 h-8 flex items-center justify-center rounded-lg text-lg flex-shrink-0"
                style={{
                  background: "color-mix(in srgb, var(--A-accent) 12%, transparent)",
                  border: "1px solid color-mix(in srgb, var(--A-accent) 20%, transparent)",
                }}
                aria-hidden
              >{result.coachCall.icon}</span>
              <span className="text-atext text-sm">
                <strong>{result.coachCall.label}</strong>
                {result.coachCall.note ? ` — ${result.coachCall.note}` : ""}
              </span>
            </div>
          )}
        </div>

        {result.isAFL && commentary.length > 0 && revealed === quarters.length && (
          <div
            className="rounded-2xl p-4 mt-2"
            style={{ background: "var(--A-panel-2)", border: "1px solid var(--A-line)" }}
          >
            <div
              className="text-[10px] font-bold uppercase tracking-[0.2em] font-mono mb-3"
              style={{ color: "var(--A-text-mute)" }}
            >
              Match Commentary
            </div>
            <div className="space-y-2.5">
              {commentary.map((line, i) => (
                <div key={i} className="flex gap-2.5 text-sm text-atext-dim">
                  <span className="text-aaccent flex-shrink-0">›</span>
                  <span className="leading-relaxed">{line}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Footer actions ── */}
      <div
        className="px-5 py-5"
        style={{
          borderTop: "1px solid var(--A-line)",
          background: "color-mix(in srgb, var(--A-panel) 50%, transparent)",
          backdropFilter: "blur(8px)",
        }}
      >
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          {!isLive && revealed < quarters.length && quarters.length > 0 ? (
            <button
              onClick={() => { if (sound) playSiren(); setRevealed(quarters.length); }}
              className="flex-1 py-3 rounded-xl text-sm font-bold text-atext-mute uppercase tracking-widest transition-all hover:text-atext"
              style={{ border: "1px solid var(--A-line-2)" }}
            >
              Skip to Full Time
            </button>
          ) : null}
          <button
            onClick={onContinue}
            disabled={!fullTime && quarters.length > 0}
            className="flex-1 py-3.5 rounded-xl font-bold uppercase tracking-widest text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: fullTime
                ? `linear-gradient(135deg,${resultColor}CC,${resultColor})`
                : "var(--A-panel-2)",
              boxShadow: fullTime ? `0 4px 24px color-mix(in srgb, ${resultColor} 40%, transparent)` : "none",
              color: fullTime ? "#fff" : "var(--A-text-mute)",
              border: fullTime ? "none" : "1px solid var(--A-line)",
            }}
          >
            {fullTime
              ? "Continue →"
              : atHalfTime
                ? "Make your half-time call above"
                : isLive
                  ? "Play the first half"
                  : "Reveal all quarters first"}
          </button>
        </div>
      </div>
    </div>
  );
}
