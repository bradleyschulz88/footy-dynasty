import React, { useMemo, useState } from "react";
import { useCareer } from "../lib/careerStore.js";
import { formatDate } from "../lib/calendar.js";
import { COACHING_CALLS } from "../lib/coachingCalls.js";
import { playCrowdCheer, playSiren, playWhistle, soundEnabled } from "../lib/sound.js";

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

export default function MatchDayScreen({ result, league, club, onContinue, onCoachCall }) {
  const career = useCareer();
  const [revealed, setRevealed] = useState(0);
  const [showEvents, setShowEvents] = useState(true);
  const [show3qtNote, setShow3qtNote] = useState(true);
  // Live match: only the first half exists — the coach's call sims the rest.
  const isLive = !!result.live;
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

  const commentary =
    result.isAFL
      ? [
          won
            ? `${club.name} put in a dominant performance today.`
            : drew
              ? "An even contest — both sides had their chances."
              : `A tough day at the office for ${club.name}.`,
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
        <div className="flex items-center justify-center gap-4 md:gap-8">
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
              className="font-display leading-none tabular-nums"
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
              {headerScore}
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
        </div>
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
              className="rounded-2xl p-3 max-h-52 overflow-y-auto space-y-1"
              style={{ background: "var(--A-panel-2)", border: "1px solid var(--A-line)" }}
            >
              {eventFeed.length === 0 && (
                <div className="text-xs text-atext-mute text-center py-3">Waiting for first quarter…</div>
              )}
              {eventFeed
                .slice()
                .reverse()
                .map((ev, i) => {
                  const player = ev.scorer
                    ? playerLookup[ev.scorer]
                    : ev.playerId
                      ? playerLookup[ev.playerId]
                      : null;
                  const sideMine = (result.isHome ? "home" : "away") === ev.side;
                  const evColor =
                    ev.kind === "goal"
                      ? "var(--A-pos)"
                      : ev.kind === "behind"
                        ? "var(--A-accent)"
                        : ev.kind === "moment"
                          ? "#A78BFA"
                          : "var(--A-text-mute)";
                  const icon =
                    ev.kind === "goal" ? "⚽" : ev.kind === "behind" ? "○" : ev.kind === "miss" ? "×" : "✦";
                  let label = "";
                  if (ev.kind === "goal") label = "GOAL";
                  else if (ev.kind === "behind") label = "Behind";
                  else if (ev.kind === "miss") label = "Out on the full / OOB";
                  else if (ev.kind === "moment") label = ev.text;
                  return (
                    <div
                      key={i}
                      className="flex items-center gap-2 text-xs py-1.5 px-2 rounded-lg feed-item"
                      style={{
                        background: i === 0
                          ? `color-mix(in srgb, ${evColor} 8%, var(--A-panel))`
                          : "transparent",
                        borderLeft: `2px solid ${i === 0 ? evColor : "transparent"}`,
                      }}
                    >
                      {/* Monospace timestamp */}
                      <span className="text-[9px] font-mono text-atext-mute w-14 flex-shrink-0 tabular-nums">
                        Q{ev.q} {String(ev.minute % 25).padStart(2, "0")}{"'"}
                      </span>
                      <span style={{ color: evColor }} className="font-bold w-4 flex-shrink-0 text-center">
                        {icon}
                      </span>
                      <span
                        className="text-[10px] uppercase tracking-wider font-black w-12 flex-shrink-0 font-mono"
                        style={{ color: sideMine ? "var(--A-pos)" : "var(--A-neg)" }}
                      >
                        {sideMine ? club.short : result.opp?.short || "OPP"}
                      </span>
                      <span className="text-atext-dim flex-1 truncate text-[11px]">
                        {player
                          ? `${player.firstName ? player.firstName[0] + ". " : ""}${player.lastName || player.name || ""}: `
                          : ""}
                        {label}
                      </span>
                    </div>
                  );
                })}
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
                <div
                  key={i}
                  className={`rounded-2xl p-4 transition-all duration-300 ${isShowing ? "opacity-100" : "opacity-0 translate-y-2"}`}
                  style={{
                    background: "var(--A-panel-2)",
                    border: isShowing && myWon
                      ? `1px solid color-mix(in srgb, var(--A-pos) 22%, var(--A-line))`
                      : "1px solid var(--A-line)",
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
                </div>
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
