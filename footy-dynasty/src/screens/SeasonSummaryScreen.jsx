import React from "react";
import { DollarSign, AlertCircle } from "lucide-react";
import { fmtK } from "../lib/format.js";
import { css } from "../components/primitives.jsx";

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
  const tierColors = { 1: "#E84A6F", 2: "var(--A-accent)", 3: "#4ADBE8" };
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
      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
    >
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
        style={{ background: "rgba(232,154,74,0.15)", border: "1px solid rgba(232,154,74,0.3)" }}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400">{label}</div>
        <div className="font-bold text-white truncate">{name || "—"}</div>
        <div className="text-sm font-display text-aaccent">{stat}</div>
      </div>
      {sub && <div className="text-[10px] text-slate-500 text-right leading-tight">{sub}</div>}
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "linear-gradient(160deg,#0F172A 0%,#1E293B 100%)" }}>
      <div className="text-center px-6 py-10" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="text-5xl mb-4">{outcomeIcon}</div>
        <div className="text-[11px] font-bold uppercase tracking-[0.3em] mb-2" style={{ color: tierColor }}>
          {summary.leagueName} · Season {summary.season}
        </div>
        <div className="font-display text-6xl leading-none text-white mb-2">
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
            { label: "Pct", value: `${summary.pct}%`, color: "#4ADBE8" },
          ].map(({ label, value, color }) => (
            <div key={label} className="text-center">
              <div className="font-display text-4xl leading-none" style={{ color }}>
                {value}
              </div>
              <div className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mt-1">{label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 px-6 py-8 max-w-2xl mx-auto w-full space-y-3">
        <div className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-400 mb-4">Season Awards</div>

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
            <div className="text-sm text-slate-300 mt-1">
              {club.name} are the {summary.season} {summary.leagueShort} Champions
            </div>
          </div>
        )}

        <AwardCard
          icon="🥇"
          label="Best & Fairest"
          name={summary.baf?.name}
          stat={summary.baf ? `${summary.baf.overall} OVR · ${summary.baf.games} games` : "—"}
        />
        <AwardCard
          icon="⚽"
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
          stat={summary.brownlow ? `${summary.brownlow.votes} votes` : "Outside our club this year"}
          sub={summary.brownlow?.position}
        />

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
                  <span className="text-slate-200 font-semibold">{r.name}</span>
                  <span className="text-[11px] text-slate-400">
                    {r.reason === "retired" ? `🏁 retired @ ${r.age}` : `📤 released`} · {r.career.gamesPlayed}{" "}
                    games · {r.career.goals} goals
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {(summary.promoted || summary.relegated) && (
          <div
            className="rounded-2xl p-4 mt-2"
            style={{
              background: summary.promoted ? "rgba(74,232,154,0.1)" : "rgba(232,74,111,0.1)",
              border: `1px solid ${summary.promoted ? "rgba(74,232,154,0.3)" : "rgba(232,74,111,0.3)"}`,
            }}
          >
            <div className="font-bold text-base" style={{ color: summary.promoted ? "#4AE89A" : "#E84A6F" }}>
              {summary.promoted ? "⬆️ Promoted!" : "⬇️ Relegated"}
            </div>
            <div className="text-sm text-slate-400 mt-1">
              {summary.promoted
                ? "A new challenge awaits in the division above."
                : "Time to rebuild and fight back up."}
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
                accent="#4ADBE8"
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

      <div className="px-6 py-6" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="max-w-2xl mx-auto">
          <button
            onClick={onContinue}
            className="w-full py-4 rounded-2xl font-display text-xl tracking-widest text-white transition-all"
            style={{
              background: "linear-gradient(135deg,var(--A-accent),#D07A2A)",
              boxShadow: "0 4px 20px rgba(232,154,74,0.4)",
            }}
          >
            START SEASON {summary.season + 1} →
          </button>
        </div>
      </div>
    </div>
  );
}
