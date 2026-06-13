// ---------------------------------------------------------------------------
// CareersScreen — the always-available Job Centre. Browse vacancies that match
// your coach tier and apply: meeting a club's reputation bar earns an interview
// and an offer to sign; falling short is a polite rejection. Applications are
// capped per season (see lib/jobSearch.js).
//
// Signing moves you to the new club for next season — the same handoff the
// sacking flow uses (acceptNewJob), so the current campaign ends on signing.
// ---------------------------------------------------------------------------
import React, { useState, useEffect, useMemo } from "react";
import { Briefcase, RefreshCw, XCircle, TrendingUp, Award, Building2 } from "lucide-react";
import { css, Stat } from "../../components/primitives.jsx";
import {
  generateJobMarket,
  getJobInterviewQuestion,
  getJobFollowUpInterview,
} from "../../lib/coachReputation.js";
import { seedRng } from "../../lib/rng.js";
import { offerStartType, startTypeLabel } from "../../lib/jobMove.js";
import { JobOfferCard } from "./JobOfferCard.jsx";
import {
  MAX_APPLICATIONS_PER_SEASON,
  applicationsRemaining,
  applicationStatus,
  canApply,
  evaluateApplication,
  recordApplication,
} from "../../lib/jobSearch.js";

function hashStr(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

export default function CareersScreen({ career, club, league, updateCareer, onAcceptJob }) {
  const rep = career.coachReputation ?? 30;
  const coachTier = career.coachTier || "Journeyman";
  const remaining = applicationsRemaining(career);

  // Stable listings per season, persisted on the career so they don't reshuffle
  // every time you open the screen.
  const listings =
    career.jobMarketBrowse && career.jobMarketBrowseSeason === career.season
      ? career.jobMarketBrowse
      : null;

  useEffect(() => {
    if (listings) return;
    seedRng(hashStr(`${career.clubId}-${career.season}-jobs`));
    const offers = generateJobMarket(career);
    updateCareer({ jobMarketBrowse: offers, jobMarketBrowseSeason: career.season });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listings, career.clubId, career.season]);

  const offers = listings || [];

  // Interview / outcome flow.
  const [focus, setFocus] = useState(null);
  const [stage, setStage] = useState("list"); // list | rejected | interview | followup
  const [round1Bonus, setRound1Bonus] = useState(0);
  const [round2Bonus, setRound2Bonus] = useState(0);
  const [pickedOption, setPickedOption] = useState(null);
  const [pickedFollow, setPickedFollow] = useState(null);
  const [rejection, setRejection] = useState(null);

  const sortedOffers = useMemo(() => {
    const arr = [...offers];
    arr.sort((a, b) => {
      const fa = a.interestLabel === "Preferred candidate" ? 2 : a.interestLabel === "Shortlisted" ? 1 : 0;
      const fb = b.interestLabel === "Preferred candidate" ? 2 : b.interestLabel === "Shortlisted" ? 1 : 0;
      if (fb !== fa) return fb - fa;
      return a.leagueTier - b.leagueTier;
    });
    return arr;
  }, [offers]);

  const refresh = () => {
    seedRng((Date.now() % 100000) + 1);
    const next = generateJobMarket(career);
    updateCareer({ jobMarketBrowse: next, jobMarketBrowseSeason: career.season });
  };

  const apply = (offer) => {
    const res = evaluateApplication(career, offer);
    if (res.outcome === "rejected") {
      updateCareer(recordApplication(career, offer, "rejected"));
      setRejection({ clubName: offer.clubName, reason: res.reason });
      setStage("rejected");
      return;
    }
    setFocus(offer);
    setRound1Bonus(0);
    setRound2Bonus(0);
    setPickedOption(null);
    setPickedFollow(null);
    setStage("interview");
  };

  const backToList = () => {
    setStage("list");
    setFocus(null);
    setRejection(null);
  };

  const needsFollowUp = focus && (focus.leagueTier ?? 3) <= 2;
  const confirmHire = () => {
    if (!focus) return;
    const total = needsFollowUp ? round1Bonus + round2Bonus : round1Bonus;
    // acceptNewJob replaces the whole career, so no need to record the offer.
    onAcceptJob({ ...focus, interviewStartingBoardBonus: total }, offerStartType(focus, career));
  };

  // ---- Rejection screen ----------------------------------------------------
  if (stage === "rejected" && rejection) {
    return (
      <div className="anim-in max-w-xl mx-auto py-10">
        <div className={`${css.panel} p-6 text-center`}>
          <XCircle className="w-12 h-12 mx-auto mb-3 text-aneg opacity-80" />
          <h2 className="font-display text-2xl text-atext mb-2">Not this time</h2>
          <p className="text-sm text-atext-dim leading-relaxed mb-5">{rejection.reason}</p>
          <button type="button" onClick={backToList} className={`${css.btnGhost} text-[11px] py-2 px-5`}>
            BACK TO LISTINGS
          </button>
        </div>
      </div>
    );
  }

  // ---- Interview / follow-up ----------------------------------------------
  if ((stage === "interview" || stage === "followup") && focus) {
    const isFollow = stage === "followup";
    const iv = isFollow
      ? getJobFollowUpInterview(focus, career, round1Bonus)
      : getJobInterviewQuestion(focus, career);
    const picked = isFollow ? pickedFollow : pickedOption;
    const pick = (opt) => {
      if (isFollow) {
        setPickedFollow(opt.id);
        setRound2Bonus(opt.startingBoardBonus ?? 0);
      } else {
        setPickedOption(opt.id);
        setRound1Bonus(opt.startingBoardBonus ?? 0);
      }
    };
    return (
      <div className="max-w-2xl w-full anim-in mx-auto py-6">
        <div className="mb-3 text-[11px] font-mono font-bold uppercase tracking-[0.3em] text-atext-mute text-center">
          {isFollow ? "Follow-up" : "Interview panel"}
        </div>
        <h2 className="font-display text-3xl text-atext mb-1 text-center leading-none">{focus.clubName}</h2>
        <div className="text-center text-[11px] text-atext-mute mb-4">{focus.leagueShort} · Tier {focus.leagueTier}</div>
        <div className={`${css.panel} p-5 mb-4`}>
          <p className="text-sm text-atext leading-relaxed">{iv.question}</p>
        </div>
        <div className="space-y-2 mb-4">
          {iv.options.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => pick(opt)}
              className="w-full text-left rounded-xl p-3 text-sm transition"
              style={{ border: `2px solid ${picked === opt.id ? "var(--A-accent)" : "var(--A-line)"}`, background: "var(--A-panel-2)" }}
            >
              {opt.label}
              <span className="block text-[10px] text-atext-mute mt-1 font-mono">
                Starting board confidence {(opt.startingBoardBonus ?? 0) >= 0 ? "+" : ""}{opt.startingBoardBonus ?? 0}
              </span>
            </button>
          ))}
        </div>
        <div className="text-[11px] text-atext-mute text-center mb-3 leading-snug">
          {offerStartType(focus, career) === 'immediate'
            ? `Signing takes you to ${focus.clubShort} now — you'll pick up their season mid-run and leave ${club.short} behind.`
            : offerStartType(focus, career) === 'endOfSeason'
              ? `You'll finish the season with ${club.short}, then take over ${focus.clubShort} — agreed now, move at season's end.`
              : `Signing moves you to ${focus.clubShort} for next season — your campaign at ${club.short} ends here.`}
        </div>
        <div className="flex flex-wrap gap-2 justify-center">
          <button
            type="button"
            onClick={() => (isFollow ? setStage("interview") : backToList())}
            className={`${css.btnGhost} text-[11px] py-2 px-4`}
          >
            {isFollow ? "BACK" : "BACK TO LISTINGS"}
          </button>
          <button
            type="button"
            disabled={!picked}
            onClick={!isFollow && needsFollowUp ? () => setStage("followup") : confirmHire}
            className={!picked ? "px-4 py-2 rounded-lg text-xs bg-apanel-2 text-atext-mute" : `${css.btnPrimary} text-[11px] py-2 px-4`}
          >
            {!isFollow && needsFollowUp ? "NEXT QUESTION →" : "SIGN CONTRACT →"}
          </button>
        </div>
      </div>
    );
  }

  // ---- Listings ------------------------------------------------------------
  return (
    <div className="anim-in space-y-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className={`${css.h1} text-3xl`}>JOB CENTRE</h1>
          <p className="text-sm text-atext-dim mt-1 max-w-xl leading-snug">
            Browse vacancies that match your reputation and apply. Clear a club's reputation bar to earn an interview;
            fall short and they'll pass. You get {MAX_APPLICATIONS_PER_SEASON} applications a season.
          </p>
        </div>
        <button type="button" onClick={refresh} className={`${css.btnGhost} text-[11px] py-2 px-4 flex items-center gap-2 self-start sm:self-auto`}>
          <RefreshCw className="w-3.5 h-3.5" /> Refresh listings
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Coach tier" value={coachTier} accent="var(--A-accent-2)" icon={Award} />
        <Stat label="Reputation" value={rep} accent="var(--A-accent)" icon={TrendingUp} />
        <Stat label="Current club" value={club.short} sub={league.short} accent="var(--A-text-mute)" icon={Building2} />
        <Stat label="Applications left" value={remaining} sub={`of ${MAX_APPLICATIONS_PER_SEASON} this season`} accent={remaining > 0 ? "var(--A-pos)" : "var(--A-neg)"} icon={Briefcase} />
      </div>

      {sortedOffers.length === 0 ? (
        <div className={`${css.panel} p-12 text-center`}>
          <Briefcase className="w-12 h-12 mx-auto mb-3 opacity-40 text-atext-mute" />
          <div className="text-sm text-atext-dim">No clubs are advertising for a coach of your standing right now. Keep winning — vacancies open up every season.</div>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {sortedOffers.map((o) => {
            const status = applicationStatus(career, o.clubId);
            const allowed = canApply(career, o);
            const longShot = rep < (o.minReputation ?? 0);
            const startType = offerStartType(o, career);
            const timing = (
              <div
                className="text-[10px] font-bold mb-2 text-center"
                style={{ color: startType === 'immediate' ? 'var(--A-pos)' : 'var(--A-text-mute)' }}
              >
                {startType === 'immediate' ? '🪑 ' : '📆 '}{startTypeLabel(startType)}
              </div>
            );
            const footer =
              status === "rejected" ? (
                <div className="text-[11px] text-aneg font-bold mb-2 text-center">Passed on you this season</div>
              ) : remaining === 0 ? (
                <div className="text-[11px] text-atext-mute mb-2 text-center">No applications left this season</div>
              ) : timing;
            return (
              <JobOfferCard
                key={o.clubId}
                offer={o}
                coachRep={rep}
                onSelect={allowed ? () => apply(o) : undefined}
                disabled={!allowed}
                ctaLabel={status === "rejected" ? "ALREADY APPLIED" : longShot ? "APPLY (LONG SHOT) →" : "APPLY & INTERVIEW →"}
                statusFooter={footer}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
