import React, { useMemo } from "react";
import { findClub } from "../data/pyramid.js";
import { teamRating, aiClubRating } from "../lib/matchEngine.js";
import { selectAiLineup, ensureSquadsForLeague } from "../lib/aiSquads.js";
import { groundConditionBand } from "../lib/community.js";
import { avgFacilities, avgStaff } from "../lib/format.js";
import { matchPrepStaffLine } from "../lib/staffModifiers.js";
import { turningPointRibbon } from "../lib/gameDepth.js";
import { DataTable, css } from "./primitives.jsx";

const TACTIC_LABEL = {
  balanced: "Balanced",
  defensive: "Defensive",
  attack: "Attacking",
  flood: "Flood",
  press: "Press",
  run: "Run & carry",
};

const NEUTRAL_TRAINING = { intensity: 60, focus: {} };

function nextMatchEvent(career) {
  return (career.eventQueue || []).find((e) => !e.completed && (e.type === "round" || e.type === "preseason_match"));
}

export default function MatchPreviewPanel({ career, league }) {
  const preview = useMemo(() => {
    const ev = nextMatchEvent(career);
    if (!ev) return null;

    let opp = null;
    let isHome = false;
    let label = "";
    let extraTags = [];

    if (ev.type === "round") {
      const m = (ev.matches || []).find((m2) => m2.home === career.clubId || m2.away === career.clubId);
      if (!m) return null;
      isHome = m.home === career.clubId;
      opp = findClub(isHome ? m.away : m.home);
      label = `Round ${ev.round} · ${isHome ? "vs" : "@"} ${opp?.short || ""}`;
      const tp = m.turningPoint ? turningPointRibbon(m.turningPoint) : null;
      const bogey = opp?.id && career.bogeyTeamId === opp.id;
      extraTags = [
        tp ? `${tp.emoji} ${tp.ribbon}` : null,
        bogey ? "👻 Bogey team" : null,
      ].filter(Boolean);
    } else {
      isHome = ev.homeId === career.clubId;
      const oppId = isHome ? ev.awayId : ev.homeId;
      opp = findClub(oppId);
      label = `${ev.label || "Practice match"} · ${isHome ? "vs" : "@"} ${opp?.short || ""}`;
    }
    if (!opp) return null;

    const aiSquads = ensureSquadsForLeague(career, league);
    const oppSquad = aiSquads?.[opp.id];
    const oppLineup = oppSquad ? selectAiLineup(oppSquad) : [];
    const myRating = teamRating(
      career.squad,
      career.lineup,
      career.training,
      avgFacilities(career.facilities),
      avgStaff(career.staff),
    );
    const oppRating = oppSquad?.length
      ? teamRating(oppSquad, oppLineup.map((p) => p.id), NEUTRAL_TRAINING, 1, 60)
      : aiClubRating(opp.id, league.tier);

    const playerTactic = career.tacticChoice || "balanced";
    const oppTacticKey = oppRating > myRating + 4 ? "attack" : oppRating < myRating - 4 ? "defensive" : "balanced";

    const band = groundConditionBand(career.groundCondition ?? 85);
    let condYou;
    let condOpp;
    if (isHome) {
      condYou = `${band.label} · shots ×${band.scoringMod?.toFixed(2) ?? "1.00"}`;
      condOpp = "Travelling — no home deck bonus";
    } else {
      condYou = "Away trip — neutral deck for you";
      condOpp = `${opp?.short || "Opponent"} hosts — home ground curve in-sim`;
    }

    const maxR = Math.max(myRating, oppRating, 1);
    const pct = (r) => Math.round((r / maxR) * 100);

    const staffPrep = matchPrepStaffLine(career.staff);

    const factorRows = [
      { factor: "Match strength", you: myRating.toFixed(1), opp: oppRating.toFixed(1) },
      {
        factor: "Tactics",
        you: TACTIC_LABEL[playerTactic] || TACTIC_LABEL.balanced,
        opp: TACTIC_LABEL[oppTacticKey] || TACTIC_LABEL.balanced,
      },
      { factor: "Deck / ground", you: condYou, opp: condOpp },
      ...(staffPrep
        ? [{ factor: "Staff prep", you: staffPrep, opp: "—" }]
        : []),
    ];

    return { label, factorRows, barYou: pct(myRating), barOpp: pct(oppRating), extraTags };
  }, [career, league]);

  if (!preview) return null;

  const columns = [
    { key: "factor", header: "Factor", render: (r) => <span className="font-semibold text-atext">{r.factor}</span> },
    { key: "you", header: "You", render: (r) => <span className="text-aaccent">{r.you}</span> },
    { key: "opp", header: "Opp", render: (r) => <span className="text-atext">{r.opp}</span> },
  ];

  return (
    <div className={`${css.panel} p-4 md:p-5 space-y-4`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-display text-lg text-atext tracking-wide">MATCH PREVIEW</h3>
        <div className="text-sm font-bold text-atext text-right">{preview.label}</div>
      </div>
      {preview.extraTags?.length > 0 && (
        <div className="flex flex-wrap gap-2 justify-end">
          {preview.extraTags.map((t) => (
            <span key={t} className="text-[11px] font-bold uppercase tracking-wide text-[#FB7185]">
              {t}
            </span>
          ))}
        </div>
      )}
      <div className="flex gap-4 md:gap-6 items-end">
        <div className="flex-1 min-w-0">
          <div className="text-[11px] text-atext-mute mb-1">You</div>
          <div className="h-2 rounded-full bg-apanel-2 border border-aline overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${preview.barYou}%`,
                background: "linear-gradient(90deg, var(--A-accent), #4ADBE8)",
              }}
            />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[11px] text-atext-mute mb-1">Opponent</div>
          <div className="h-2 rounded-full bg-apanel-2 border border-aline overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${preview.barOpp}%`,
                background: "linear-gradient(90deg, #64748B, #94A3B8)",
              }}
            />
          </div>
        </div>
      </div>
      <DataTable bare columns={columns} rows={preview.factorRows} rowKey={(r) => r.factor} />
    </div>
  );
}
