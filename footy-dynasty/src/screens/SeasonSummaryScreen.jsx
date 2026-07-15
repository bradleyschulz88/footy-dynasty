import React, { useEffect, useState } from "react";
import confetti from "canvas-confetti";
import { DollarSign, AlertCircle } from "lucide-react";
import { fmtK } from "../lib/format.js";
import { css } from "../components/primitives.jsx";

const CONFETTI_COLORS = ["#FFD700", "#4AE89A", "#C8FF3D", "#E84A6F", "#A78BFA", "#FF9A3C"];

/** Pure-CSS celebration confetti — used for premierships and promotions. */
function Confetti({ count = 28 }) {
  const pieces = Array.from({ length: count }, (_, i) => ({
    left: (i * 37) % 100,
    delay: ((i * 13) % 30) / 10,
    duration: 3 + ((i * 7) % 25) / 10,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    size: 6 + (i % 3) * 3,
    spin: i % 2 === 0 ? 1 : -1,
  }));
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
      <style>{`
        @keyframes fdConfettiFall {
          0%   { transform: translateY(-40px) rotate(0deg); opacity: 1; }
          85%  { opacity: 1; }
          100% { transform: translateY(110vh) rotate(720deg); opacity: 0; }
        }
      `}</style>
      {pieces.map((p, i) => (
        <span
          key={i}
          style={{
            position: "absolute",
            top: 0,
            left: `${p.left}%`,
            width: p.size,
            height: p.size * 0.45,
            background: p.color,
            borderRadius: 2,
            animation: `fdConfettiFall ${p.duration}s linear ${p.delay}s infinite`,
            transform: `rotate(${p.spin * 25}deg)`,
          }}
        />
      ))}
    </div>
  );
}

function EosFinTile({ label, value, accent = "var(--A-accent)", sub }) {
  return (
    <div className="rounded-xl p-3" style={{ background: "var(--A-panel-2)", border: "1px solid var(--A-line)" }}>
      <div className={css.label}>{label}</div>
      <div className="font-display text-2xl mt-1" style={{ color: accent }}>
        {value}
      </div>
      {sub && <div className="text-[10px] text-atext-mute mt-1">{sub}</div>}
    </div>
  );
}

export default function SeasonSummaryScreen({
  summary,
  club,
  retiredThisSeason = [],
  eosFinance = null,
  onContinue,
}) {
  const posColor =
    summary.position <= 1
      ? "#FFD700"
      : summary.position <= 4
        ? "#4AE89A"
        : summary.position <= summary.totalTeams / 2
          ? "var(--A-accent)"
          : "#E84A6F";
  const tierColors = { 1: "#E84A6F", 2: "var(--A-accent)", 3: "var(--A-accent-2)" };
  const tierColor = tierColors[summary.leagueTier] || "var(--A-accent)";

  const outcomeText = `Finished ${summary.position}${summary.position === 1 ? "st" : summary.position === 2 ? "nd" : summary.position === 3 ? "rd" : "th"} of ${summary.totalTeams}`;
  const outcomeIcon = summary.champion
    ? "🏆"
    : summary.promoted
      ? "⬆️"
      : summary.relegated
        ? "⬇️"
        : summary.position <= 4
          ? "✅"
          : "📊";
  const outcomeSub = summary.champion
    ? "PREMIERS — " + summary.leagueShort + " Champions!"
    : summary.promoted
      ? "Promoted to the next division"
      : summary.relegated
        ? "Relegated — bounce back next season"
        : outcomeText;

  const AwardCard = ({ icon, label, name, stat, sub }) => (
    <div
      className="rounded-2xl p-4 flex items-center gap-4"
      style={{ background: "var(--A-panel-2)", border: "1px solid var(--A-line)" }}
    >
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
        style={{ background: "rgba(232,154,74,0.15)", border: "1px solid rgba(232,154,74,0.3)" }}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[9px] font-bold uppercase tracking-[0.2em] text-atext-mute">{label}</div>
        <div className="font-bold text-atext truncate">{name || "—"}</div>
        <div className="text-sm font-display text-aaccent">{stat}</div>
      </div>
      {sub && <div className="text-[10px] text-atext-mute text-right leading-tight">{sub}</div>}
    </div>
  );

  const celebrate = summary.champion || summary.promoted;

  const [copied, setCopied] = useState(false);

  function buildShareText(s, clubName) {
    const pos = s.position;
    const ordinal = pos === 1 ? "st" : pos === 2 ? "nd" : pos === 3 ? "rd" : "th";
    const outcomeFlag = s.champion
      ? "🏆 Premiers!"
      : s.promoted
        ? "↑ Promoted"
        : s.relegated
          ? "↓ Relegated"
          : null;
    const lines = [
      `🏉 Season ${s.season} with ${clubName}`,
      `${s.leagueName} — ${pos}${ordinal} place`,
      `${s.W}W ${s.L}L ${s.D}D`,
    ];
    if (outcomeFlag) lines.push(outcomeFlag);
    lines.push("", "Play Footy Dynasty → footydynasty.app");
    return lines.join("\n");
  }

  async function handleShare() {
    const text = buildShareText(summary, club.name);
    try {
      if (navigator.share) {
        await navigator.share({ title: "Footy Dynasty", text });
      } else {
        await navigator.clipboard.writeText(text + "\nhttps://footydynasty.app");
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      // user cancelled or API unavailable — do nothing
    }
  }

  useEffect(() => {
    if (summary.champion) {
      confetti({ particleCount: 120, spread: 70, origin: { x: 0.2, y: 0.6 } });
      setTimeout(() => confetti({ particleCount: 120, spread: 70, origin: { x: 0.8, y: 0.6 } }), 300);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen flex flex-col relative" style={{ background: "linear-gradient(160deg, var(--A-bg) 0%, var(--A-bg-2) 100%)" }}>
      {celebrate && <Confetti />}
      <div className="text-center px-6 py-10 relative" style={{ borderBottom: "1px solid var(--A-line)" }}>
        <div className="text-5xl mb-4">{outcomeIcon}</div>
        <div className="text-[11px] font-bold uppercase tracking-[0.3em] mb-2" style={{ color: tierColor }}>
          {summary.leagueName} · Season {summary.season}
        </div>
        <div className="font-display text-6xl leading-none text-atext mb-2">
          {summary.leagueShort} {summary.season}
        </div>
        <div className="font-bold text-xl" style={{ color: posColor }}>
          {outcomeSub}
        </div>

        <div className="flex items-center justify-center gap-6 mt-8">
          {[
            { label: "Position", value: `#${summary.position}`, color: posColor },
            { label: "Wins", value: summary.W, color: "#4AE89A" },
            { label: "Losses", value: summary.L, color: "#E84A6F" },
            { label: "Draws", value: summary.D, color: "var(--A-accent)" },
            { label: "Points", value: summary.pts, color: "#A78BFA" },
            { label: "Pct", value: `${summary.pct}%`, color: "var(--A-accent-2)" },
          ].map(({ label, value, color }) => (
            <div key={label} className="text-center">
              <div className="font-display text-4xl leading-none" style={{ color }}>
                {value}
              </div>
              <div className="text-[9px] font-bold uppercase tracking-widest text-atext-mute mt-1">{label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 px-6 py-8 max-w-2xl mx-auto w-full space-y-3">
        <div className="text-[10px] font-bold uppercase tracking-[0.25em] text-atext-mute mb-4">Season Awards</div>

        {summary.champion && (
          <div
            className="rounded-2xl p-4 text-center mb-4"
            style={{
              background: "linear-gradient(135deg,rgba(255,215,0,0.15),rgba(232,154,74,0.1))",
              border: "2px solid rgba(255,215,0,0.4)",
            }}
          >
            <div className="text-4xl mb-2">🏆</div>
            <div className="font-display text-3xl text-[#FFD700]">PREMIERS!</div>
            <div className="text-sm text-atext-dim mt-1">
              {club.name} are the {summary.season} {summary.leagueShort} Champions
            </div>
          </div>
        )}

        <AwardCard
          icon="🥇"
          label="Best & Fairest"
          name={summary.baf?.name}
          stat={summary.baf ? `${summary.baf.overall} rating · ${summary.baf.games} games` : "—"}
        />
        <AwardCard
          icon="🏉"
          label="Top Goal Kicker"
          name={summary.topScorer?.name}
          stat={summary.topScorer ? `${summary.topScorer.goals} goals` : "—"}
          sub={summary.topScorer ? `${summary.topScorer.games} games` : null}
        />
        <AwardCard
          icon="🤝"
          label="Disposal King"
          name={summary.topDisposal?.name}
          stat={summary.topDisposal ? `${summary.topDisposal.disposals} disposals` : "—"}
          sub={summary.topDisposal ? `${summary.topDisposal.games} games` : null}
        />

        <AwardCard
          icon="🥇"
          label="Brownlow Medal"
          name={summary.brownlow?.name || "—"}
          stat={summary.brownlow ? `${summary.brownlow.votes} votes` : "Not awarded"}
          sub={summary.brownlow
            ? `${summary.brownlow.club}${summary.brownlow.isMine ? " · your club" : ""}`
            : undefined}
        />

        {summary.coleman && (
          <AwardCard
            icon="🎯"
            label="Coleman Medal"
            name={summary.coleman.name}
            stat={`${summary.coleman.goals} goals`}
            sub={`${summary.coleman.club}${summary.coleman.isMine ? " · your club" : ""}`}
          />
        )}

        {summary.clubChampion && (
          <AwardCard
            icon="🏅"
            label="Club Champion"
            name={summary.clubChampion.name}
            stat={`${summary.clubChampion.votes} Brownlow votes`}
          />
        )}

        {summary.normSmith && (
          <AwardCard
            icon="🏆"
            label="Norm Smith Medal"
            name={summary.normSmith.name}
            stat="Best on ground — Grand Final"
          />
        )}

        {summary.risingStar && (
          <AwardCard
            icon="🌟"
            label="Rising Star"
            name={summary.risingStar.name}
            stat={`${summary.risingStar.overall} rating · age ${summary.risingStar.age}`}
            sub={summary.risingStar.club
              ? `${summary.risingStar.club}${summary.risingStar.isMine ? " · your club" : ""}`
              : summary.risingStar.games != null ? `${summary.risingStar.games} games` : undefined}
          />
        )}

        {summary.allAustralian && summary.allAustralian.length > 0 && (
          <div
            className="rounded-2xl p-4 mt-2"
            style={{ background: "rgba(245,178,58,0.07)", border: "1px solid rgba(245,178,58,0.3)" }}
          >
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#F5B23A] mb-3">
              ⭐ All-Australian Team
            </div>
            {["DEF", "MID", "RUCK", "FWD", "UTIL"].map((line) => {
              const lineLabel = { DEF: "Backs", MID: "Midfield", RUCK: "Ruck", FWD: "Forwards", UTIL: "Utility" }[line];
              const players = summary.allAustralian.filter((p) => !p.bench && p.line === line);
              if (!players.length) return null;
              return (
                <div key={line} className="mb-2 last:mb-0">
                  <div className="text-[9px] font-mono uppercase tracking-widest text-atext-mute mb-1">{lineLabel}</div>
                  <div className="flex flex-wrap gap-1.5">
                    {players.map((p) => (
                      <span
                        key={`${p.name}-${p.club}`}
                        className="text-[11px] px-2 py-0.5 rounded-md"
                        style={{
                          background: p.isMine ? "rgba(44,168,240,0.16)" : "var(--A-panel-2)",
                          color: p.isMine ? "var(--A-accent)" : "var(--A-text)",
                          border: "1px solid var(--A-line)",
                        }}
                      >
                        {p.name} <span className="text-atext-mute">· {p.club}</span>
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
            {summary.allAustralian.some((p) => p.bench) && (
              <div className="mt-2">
                <div className="text-[9px] font-mono uppercase tracking-widest text-atext-mute mb-1">Interchange</div>
                <div className="flex flex-wrap gap-1.5">
                  {summary.allAustralian.filter((p) => p.bench).map((p) => (
                    <span
                      key={`${p.name}-${p.club}`}
                      className="text-[11px] px-2 py-0.5 rounded-md"
                      style={{
                        background: p.isMine ? "rgba(44,168,240,0.16)" : "var(--A-panel-2)",
                        color: p.isMine ? "var(--A-accent)" : "var(--A-text)",
                        border: "1px solid var(--A-line)",
                      }}
                    >
                      {p.name} <span className="text-atext-mute">· {p.club}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {retiredThisSeason && retiredThisSeason.length > 0 && (
          <div
            className="rounded-2xl p-4 mt-2"
            style={{ background: "rgba(168,139,250,0.08)", border: "1px solid rgba(168,139,250,0.3)" }}
          >
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#A78BFA] mb-3">
              Retirements & Departures
            </div>
            <div className="space-y-1.5">
              {retiredThisSeason.map((r, i) => (
                <div key={r.id || i} className="flex items-center justify-between text-sm">
                  <span className="text-atext font-semibold">{r.name}</span>
                  <span className="text-[11px] text-atext-mute">
                    {r.reason === "retired" ? `🏁 retired @ ${r.age}` : `📤 released`} · {r.career.gamesPlayed}{" "}
                    games · {r.career.goals} goals
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {summary.promoted && (
          <div
            className="rounded-2xl p-5 mt-2 text-center"
            style={{
              background: "linear-gradient(135deg,rgba(74,232,154,0.18),rgba(74,219,232,0.10))",
              border: "2px solid rgba(74,232,154,0.45)",
            }}
          >
            <div className="text-4xl mb-2">🎉</div>
            <div className="font-display text-3xl text-aaccent">PROMOTED!</div>
            <div className="text-sm text-atext-dim mt-1">
              {club.name} are going up — the whole town will talk about this one for years.
            </div>
            <div className="text-xs text-atext-mute mt-2">
              A new challenge awaits in the division above. Bigger crowds, bigger budgets, bigger stage.
            </div>
          </div>
        )}
        {summary.relegated && (
          <div
            className="rounded-2xl p-4 mt-2"
            style={{
              background: "rgba(232,74,111,0.1)",
              border: "1px solid rgba(232,74,111,0.3)",
            }}
          >
            <div className="font-bold text-base" style={{ color: "#E84A6F" }}>
              ⬇️ Relegated
            </div>
            <div className="text-sm text-atext-mute mt-1">
              Time to rebuild and fight back up.
            </div>
          </div>
        )}

        {summary.highlights?.length > 0 && (
          <div className="rounded-2xl p-4 mt-2"
            style={{ background: "var(--A-panel-2)", border: "1px solid var(--A-line)" }}>
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] mb-3"
              style={{ color: "var(--A-accent)" }}>
              Season Moments
            </div>
            <div className="space-y-1.5">
              {summary.highlights.map((h, i) => (
                <div key={i} className="text-[12px] text-atext-mute leading-snug py-0.5 border-b last:border-0"
                  style={{ borderColor: "var(--A-line)" }}>
                  {h.text}
                </div>
              ))}
            </div>
          </div>
        )}

        {eosFinance && (
          <div className="rounded-2xl p-5 mt-2" style={{ background: "var(--A-panel)", border: "1px solid var(--A-line-2)" }}>
            <div className="flex items-center gap-2 mb-3">
              <DollarSign className="w-5 h-5 text-aaccent" />
              <div className="font-display text-2xl tracking-wide text-atext">FINANCIAL YEAR</div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <EosFinTile
                label="Cash on hand"
                value={fmtK(eosFinance.cashEnd)}
                accent={eosFinance.cashEnd >= 0 ? "#4AE89A" : "#E84A6F"}
              />
              <EosFinTile label="Prize money" value={`+${fmtK(eosFinance.prizeMoney)}`} accent="#FFD200" />
              <EosFinTile
                label="Transfer refill"
                value={`+${fmtK(eosFinance.transferBudgetRefill)}`}
                accent="var(--A-accent-2)"
              />
              <EosFinTile
                label="Sponsors lost"
                value={eosFinance.sponsorsExpired}
                accent={eosFinance.sponsorsExpired > 0 ? "#E84A6F" : "#4AE89A"}
                sub={`${eosFinance.sponsorsActive} active now`}
              />
            </div>
            {eosFinance.cashCrisis > 0 && (
              <div className="mt-3 text-xs text-[#E84A6F] flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> Cash crisis level {eosFinance.cashCrisis} carries into next
                season
              </div>
            )}
            {eosFinance.ripple && (
              <div className="mt-3 text-xs text-atext-dim">
                {eosFinance.ripple.promoted
                  ? `Promotion ripple: sponsor values +30%, board confidence +20.`
                  : `Relegation ripple: sponsor values cut to half, board confidence -25.`}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="px-6 py-6" style={{ borderTop: "1px solid var(--A-line)" }}>
        <div className="max-w-2xl mx-auto space-y-3">
          <button
            onClick={handleShare}
            className="w-full py-3 rounded-2xl font-bold text-base tracking-wide transition-all flex items-center justify-center gap-2"
            style={{
              background: "var(--A-panel-2)",
              color: "var(--A-accent)",
              border: "1px solid var(--A-line)",
            }}
          >
            📤 Share my season
          </button>
          {copied && (
            <div
              className="text-center text-sm py-1.5 rounded-xl"
              style={{ color: "#4AE89A", background: "rgba(74,232,154,0.1)", border: "1px solid rgba(74,232,154,0.25)" }}
            >
              ✓ Copied to clipboard
            </div>
          )}
          <button
            onClick={onContinue}
            className="w-full py-4 rounded-2xl font-display text-xl tracking-widest transition-all"
            style={{
              background: "var(--A-accent)",
              color: "var(--fd-on-accent, #0A0D0C)",
              boxShadow: "0 4px 24px color-mix(in srgb, var(--A-accent) 35%, transparent)",
            }}
          >
            START SEASON {summary.season + 1} →
          </button>
        </div>
      </div>
    </div>
  );
}
