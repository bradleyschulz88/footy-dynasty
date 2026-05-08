// ---------------------------------------------------------------------------
// Sacking Sequence (Spec Section 3F)
// Five-screen narrative: Call → Captain's Message → Headline → Legacy → Job Market.
// Driven by career.sackingStep (0..4). Step 4 hands off to JobMarket.
// ---------------------------------------------------------------------------
import React, { useState, useMemo } from "react";
import { ChevronRight, Trophy, AlertCircle, Newspaper, Award, Briefcase, Star } from "lucide-react";
import { css } from "../components/primitives.jsx";
import { getJobInterviewQuestion, getJobFollowUpInterview } from "../lib/coachReputation.js";

const STEPS = [
  { key: 'call',      title: 'THE CALL' },
  { key: 'captain',   title: 'THE CAPTAIN\u2019S MESSAGE' },
  { key: 'headline',  title: 'THE HEADLINE' },
  { key: 'legacy',    title: 'YOUR LEGACY' },
  { key: 'market',    title: 'JOB MARKET' },
];

export default function SackingSequence({ career, club, onAdvanceStep, onAcceptJob, onTakeSeasonOff, onRerollJobMarket }) {
  const step = Math.max(0, Math.min(STEPS.length - 1, career.sackingStep ?? 0));
  const stepKey = STEPS[step].key;
  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(160deg, #07101F 0%, #1E293B 100%)' }}>
      {/* Step indicator */}
      <div className="px-6 py-4 flex items-center justify-center gap-2 flex-wrap">
        {STEPS.map((s, i) => (
          <div key={s.key} className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold font-mono transition`}
              style={{
                background: i === step ? 'var(--A-accent)' : i < step ? 'rgba(0,224,255,0.15)' : 'var(--A-panel-2)',
                color:      i === step ? '#001520' : i < step ? 'var(--A-accent)' : 'var(--A-text-mute)',
                border:     `1px solid ${i === step ? 'var(--A-accent)' : 'var(--A-line)'}`,
              }}>{i + 1}</div>
            {i < STEPS.length - 1 && <ChevronRight className="w-3 h-3 text-atext-mute" />}
          </div>
        ))}
      </div>

      <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
        {stepKey === 'call'     && <CallStep     career={career} club={club} onNext={() => onAdvanceStep(1)} />}
        {stepKey === 'captain'  && <CaptainStep  career={career} club={club} onNext={() => onAdvanceStep(2)} />}
        {stepKey === 'headline' && <HeadlineStep career={career} club={club} onNext={() => onAdvanceStep(3)} />}
        {stepKey === 'legacy'   && <LegacyStep   career={career} club={club} onNext={() => onAdvanceStep(4)} />}
        {stepKey === 'market'   && <JobMarketStep career={career} onAcceptJob={onAcceptJob} onTakeSeasonOff={onTakeSeasonOff} onRerollJobMarket={onRerollJobMarket} />}
      </div>
    </div>
  );
}

// =============================================================================
// Step 1 — The Call
// =============================================================================
function CallStep({ career, club, onNext }) {
  const chairmanName = career.gameOver?.chairmanName || `${club.short} Board`;
  const stats = career.coachStats || {};
  return (
    <div className="max-w-xl w-full text-center anim-in">
      <div className="mb-3 text-[11px] font-mono font-bold uppercase tracking-[0.3em] text-atext-mute">Monday Morning · The Chairman&apos;s Office</div>
      <AlertCircle className="w-10 h-10 mx-auto text-aaccent mb-4" />
      <h1 className="font-display text-5xl sm:text-6xl text-atext mb-6 leading-none">YOU&apos;VE BEEN SACKED</h1>
      <div className="text-xs font-mono uppercase tracking-widest text-atext-mute mb-3">{club.name} · Season {career.gameOver?.season || career.season}</div>
      <div className="font-mono text-sm text-atext-dim mb-6">
        {`${stats.totalWins || 0}W · ${stats.totalLosses || 0}L · ${stats.totalDraws || 0}D`}
      </div>
      <div className="rounded-2xl p-6 mb-6 text-left" style={{ background: 'var(--A-panel)', border: '1px solid var(--A-line-2)' }}>
        <p className="text-atext leading-relaxed">
          <span className="text-aaccent">&ldquo;</span>{career.managerName}, on behalf of the board of {club.name}, I want to thank you for your service. After careful consideration, the board has decided to make a change in the coaching department. Your contract has been terminated, effective immediately. We wish you well in your next chapter.<span className="text-aaccent">&rdquo;</span>
        </p>
        <div className="text-right mt-4 text-[11px] uppercase tracking-widest text-atext-mute font-mono">— {chairmanName}, Chairman, {club.name}</div>
      </div>
      <button onClick={onNext} className={`${css.btnPrimary} px-8 py-3`}>READ ON →</button>
    </div>
  );
}

// =============================================================================
// Step 2 — Captain's Message
// =============================================================================
function CaptainStep({ career, club, onNext }) {
  const captain = (career.squad || [])[0];
  const captainName = captain ? `${captain.firstName} ${captain.lastName}` : 'Your captain';
  const tenureBoard = career.finance?.boardConfidence ?? 30;
  const wonPremiership = (career.coachStats?.premierships || 0) > 0;
  const message = wonPremiership
    ? `We'll always have ${career.gameOver?.premiership || 'that flag'}. Thanks for that. Genuinely.`
    : tenureBoard >= 50
    ? `Coach — it's been an honour. What we built here won't be forgotten. Good luck out there.`
    : `Thanks for everything. Best of luck with whatever comes next.`;
  return (
    <div className="max-w-xl w-full text-center anim-in">
      <div className="mb-3 text-[11px] font-mono font-bold uppercase tracking-[0.3em] text-atext-mute">Tuesday Evening · A Private Message</div>
      <h2 className="font-display text-4xl sm:text-5xl text-atext mb-6 leading-none">FROM THE CAPTAIN</h2>
      <div className="rounded-2xl p-6 mb-6 text-left" style={{ background: 'var(--A-panel)', border: '1px solid var(--A-line-2)' }}>
        <p className="text-atext leading-relaxed text-lg">
          <span className="text-aaccent">&ldquo;</span>{message}<span className="text-aaccent">&rdquo;</span>
        </p>
        <div className="text-right mt-4 text-[11px] uppercase tracking-widest text-atext-mute font-mono">— {captainName}, Captain, {club.name}</div>
      </div>
      <button onClick={onNext} className={`${css.btnPrimary} px-8 py-3`}>NEXT →</button>
    </div>
  );
}

// =============================================================================
// Step 3 — The Headline
// =============================================================================
function HeadlineStep({ career, club, onNext }) {
  const j = career.journalist || { name: 'The Press', satisfaction: 50 };
  const sat = j.satisfaction ?? 50;
  const seasons = career.coachStats?.seasonsManaged || 1;
  const tone = sat >= 65 ? 'supportive' : sat <= 35 ? 'critical' : 'neutral';
  const headline = tone === 'supportive'
    ? `${career.managerName} axed in shock decision — insiders question board's patience`
    : tone === 'critical'
    ? `Long-awaited change at ${club.short} — ${career.managerName} pays price for poor run of form`
    : `${career.managerName} parts ways with ${club.short} after ${seasons} season${seasons === 1 ? '' : 's'}`;
  const paragraph = tone === 'supportive'
    ? `Sources close to the club have voiced surprise at this morning's announcement. ${career.managerName} had been working with limited resources but was widely seen as the right person for the long-term project.`
    : tone === 'critical'
    ? `The mood inside ${club.name} had shifted weeks ago. A run of disappointing results combined with friction at board level made the position untenable.`
    : `The board cited "results over the past 12 months" in a statement issued shortly after the meeting. ${career.managerName} could not be reached for comment.`;
  return (
    <div className="max-w-2xl w-full anim-in">
      <div className="mb-3 text-[11px] font-mono font-bold uppercase tracking-[0.3em] text-atext-mute text-center">The Morning Paper</div>
      <h2 className="font-display text-3xl text-atext mb-2 text-center leading-none">FRONT PAGE</h2>
      <div className="rounded-2xl p-6 mb-6" style={{ background: '#F5EFE2', border: '1px solid #C4B79B', color: '#1A1A1A' }}>
        <div className="flex items-center gap-2 mb-2 pb-2" style={{ borderBottom: '2px solid #1A1A1A' }}>
          <Newspaper className="w-5 h-5" />
          <span className="font-display text-2xl tracking-wide">FOOTY DAILY</span>
          <span className="ml-auto text-[10px] uppercase tracking-widest">Sport · Page 1</span>
        </div>
        <h3 className="font-display text-3xl sm:text-4xl leading-tight mb-3">{headline}</h3>
        <p className="text-sm leading-relaxed font-serif">{paragraph}</p>
        <div className="text-right mt-3 text-[11px] uppercase tracking-widest font-mono italic">By {j.name}</div>
      </div>
      <div className="text-center">
        <button onClick={onNext} className={`${css.btnPrimary} px-8 py-3`}>NEXT →</button>
      </div>
    </div>
  );
}

// =============================================================================
// Step 4 — Your Legacy
// =============================================================================
function LegacyStep({ career, club, onNext }) {
  const stats = career.coachStats || {};
  const games = (stats.totalWins || 0) + (stats.totalLosses || 0) + (stats.totalDraws || 0);
  const winPct = games > 0 ? Math.round((stats.totalWins || 0) / games * 100) : 0;
  const repBefore = (career.coachReputation ?? 30) + 12; // we already subtracted 12 on sacking
  const repAfter  = career.coachReputation ?? 30;
  const repDelta  = repAfter - repBefore;
  return (
    <div className="max-w-2xl w-full anim-in">
      <div className="mb-3 text-[11px] font-mono font-bold uppercase tracking-[0.3em] text-atext-mute text-center">Your Time at {club.name}</div>
      <h2 className="font-display text-4xl sm:text-5xl text-atext mb-6 leading-none text-center">YOUR LEGACY</h2>
      <div className="rounded-2xl p-6 mb-6" style={{ background: 'var(--A-panel)', border: '1px solid var(--A-line-2)' }}>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <LegacyTile label="Seasons" value={stats.seasonsManaged || 1} />
          <LegacyTile label="Record" value={`${stats.totalWins || 0}-${stats.totalLosses || 0}-${stats.totalDraws || 0}`} />
          <LegacyTile label="Win %" value={`${winPct}%`} accent={winPct >= 50 ? '#4AE89A' : winPct >= 35 ? 'var(--A-accent)' : '#E84A6F'} />
          <LegacyTile label="Premierships" value={stats.premierships || 0} accent="#FFD200" icon={Trophy} />
          <LegacyTile label="Promotions" value={stats.promotions || 0} accent="#4AE89A" />
          <LegacyTile label="Relegations" value={stats.relegations || 0} accent="#E84A6F" />
        </div>
        <div className="mt-5 pt-4" style={{ borderTop: '1px solid var(--A-line)' }}>
          <div className="flex items-center justify-between text-sm">
            <div>
              <div className={css.label}>Coach Reputation</div>
              <div className="font-display text-2xl text-atext">{repAfter} <span className="text-atext-mute text-base">/ 100</span></div>
            </div>
            <div className="text-right">
              <div className={css.label}>Tier</div>
              <div className="font-display text-2xl text-aaccent">{career.coachTier || 'Journeyman'}</div>
            </div>
            <div className="text-right">
              <div className={css.label}>Change</div>
              <div className="font-display text-2xl" style={{ color: '#E84A6F' }}>{repDelta}</div>
            </div>
          </div>
        </div>
      </div>
      <div className="text-center">
        <button onClick={onNext} className={`${css.btnPrimary} px-8 py-3`}>FIND A NEW JOB →</button>
      </div>
    </div>
  );
}

function LegacyTile({ label, value, accent = 'var(--A-accent)', icon: Icon }) {
  return (
    <div className="rounded-xl p-3" style={{ background: 'var(--A-panel-2)', border: '1px solid var(--A-line)' }}>
      {Icon && <Icon className="w-4 h-4 mb-1 opacity-60" style={{ color: accent }} />}
      <div className={css.label}>{label}</div>
      <div className="font-display text-2xl" style={{ color: accent }}>{value}</div>
    </div>
  );
}

// =============================================================================
// Step 5 — Job Market
// =============================================================================
function JobMarketStep({ career, onAcceptJob, onTakeSeasonOff, onRerollJobMarket }) {
  const offers = career.jobOffers || [];
  const coachRep = career.coachReputation ?? 30;
  const [starredIds, setStarredIds] = useState([]);
  const [stage, setStage] = useState("list");
  const [focusOffer, setFocusOffer] = useState(null);
  const [round1Bonus, setRound1Bonus] = useState(0);
  const [round2Bonus, setRound2Bonus] = useState(0);
  const [pickedOption, setPickedOption] = useState(null);
  const [pickedFollow, setPickedFollow] = useState(null);

  const sortedOffers = useMemo(() => {
    const arr = [...offers];
    const starScore = (o) => (starredIds.includes(o.clubId) ? 1 : 0);
    arr.sort((a, b) => {
      const sb = starScore(b) - starScore(a);
      if (sb !== 0) return sb;
      const fa = a.interestLabel === "Preferred candidate" ? 2 : a.interestLabel === "Shortlisted" ? 1 : 0;
      const fb = b.interestLabel === "Preferred candidate" ? 2 : b.interestLabel === "Shortlisted" ? 1 : 0;
      if (fb !== fa) return fb - fa;
      return a.leagueTier - b.leagueTier;
    });
    return arr;
  }, [offers, starredIds]);

  const toggleStar = (clubId) => {
    setStarredIds((prev) => {
      if (prev.includes(clubId)) return prev.filter((id) => id !== clubId);
      if (prev.length >= 2) return prev;
      return [...prev, clubId];
    });
  };

  const goInterview = (offer) => {
    setFocusOffer(offer);
    setRound1Bonus(0);
    setRound2Bonus(0);
    setPickedOption(null);
    setPickedFollow(null);
    setStage("interview");
  };

  const cancelInterview = () => {
    setFocusOffer(null);
    setStage("list");
  };

  const goFollowUp = () => {
    if (!pickedOption) return;
    setRound2Bonus(0);
    setPickedFollow(null);
    setStage("followup");
  };

  const confirmHire = () => {
    if (!focusOffer) return;
    const tier = focusOffer.leagueTier ?? 3;
    const total = tier <= 2 ? round1Bonus + round2Bonus : round1Bonus;
    onAcceptJob({ ...focusOffer, interviewStartingBoardBonus: total });
  };

  const needsFollowUp = focusOffer && (focusOffer.leagueTier ?? 3) <= 2;

  if (stage === "followup" && focusOffer) {
    const iv2 = getJobFollowUpInterview(focusOffer, career, round1Bonus);
    return (
      <div className="max-w-2xl w-full anim-in mx-auto">
        <div className="mb-3 text-[11px] font-mono font-bold uppercase tracking-[0.3em] text-atext-mute text-center">Follow-up</div>
        <h2 className="font-display text-3xl text-atext mb-2 text-center leading-none">{focusOffer.clubName}</h2>
        <div className={`${css.panel} p-5 mb-4`}>
          <p className="text-sm text-atext leading-relaxed">{iv2.question}</p>
        </div>
        <div className="space-y-2 mb-4">
          {iv2.options.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => {
                setPickedFollow(opt.id);
                setRound2Bonus(opt.startingBoardBonus ?? 0);
              }}
              className="w-full text-left rounded-xl p-3 text-sm transition"
              style={{
                border: `2px solid ${pickedFollow === opt.id ? "var(--A-accent)" : "var(--A-line)"}`,
                background: "var(--A-panel-2)",
              }}
            >
              {opt.label}
              <span className="block text-[10px] text-atext-mute mt-1 font-mono">
                Starting board confidence {(opt.startingBoardBonus ?? 0) >= 0 ? "+" : ""}{opt.startingBoardBonus ?? 0}
              </span>
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 justify-center">
          <button type="button" onClick={() => setStage("interview")} className={`${css.btnGhost} text-[11px] py-2 px-4`}>
            BACK
          </button>
          <button
            type="button"
            disabled={!pickedFollow}
            onClick={confirmHire}
            className={!pickedFollow ? "px-4 py-2 rounded-lg text-xs bg-apanel-2 text-atext-mute" : `${css.btnPrimary} text-[11px] py-2 px-4`}
          >
            SIGN CONTRACT →
          </button>
        </div>
      </div>
    );
  }

  if (stage === "interview" && focusOffer) {
    const iv = getJobInterviewQuestion(focusOffer, career);
    return (
      <div className="max-w-2xl w-full anim-in mx-auto">
        <div className="mb-3 text-[11px] font-mono font-bold uppercase tracking-[0.3em] text-atext-mute text-center">Interview panel</div>
        <h2 className="font-display text-3xl text-atext mb-2 text-center leading-none">{focusOffer.clubName}</h2>
        <div className={`${css.panel} p-5 mb-4`}>
          <p className="text-sm text-atext leading-relaxed">{iv.question}</p>
        </div>
        <div className="space-y-2 mb-4">
          {iv.options.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => {
                setPickedOption(opt.id);
                setRound1Bonus(opt.startingBoardBonus ?? 0);
              }}
              className="w-full text-left rounded-xl p-3 text-sm transition"
              style={{
                border: `2px solid ${pickedOption === opt.id ? "var(--A-accent)" : "var(--A-line)"}`,
                background: "var(--A-panel-2)",
              }}
            >
              {opt.label}
              <span className="block text-[10px] text-atext-mute mt-1 font-mono">
                Starting board confidence {(opt.startingBoardBonus ?? 0) >= 0 ? "+" : ""}{opt.startingBoardBonus ?? 0}
              </span>
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 justify-center">
          <button type="button" onClick={cancelInterview} className={`${css.btnGhost} text-[11px] py-2 px-4`}>
            BACK TO LISTINGS
          </button>
          <button
            type="button"
            disabled={!pickedOption}
            onClick={needsFollowUp ? goFollowUp : confirmHire}
            className={!pickedOption ? "px-4 py-2 rounded-lg text-xs bg-apanel-2 text-atext-mute" : `${css.btnPrimary} text-[11px] py-2 px-4`}
          >
            {needsFollowUp ? "NEXT QUESTION →" : "SIGN CONTRACT →"}
          </button>
        </div>
      </div>
    );
  }

  const canReroll = typeof onRerollJobMarket === "function" && (career.jobMarketRerolls ?? 0) < 1;

  return (
    <div className="max-w-4xl w-full anim-in">
      <div className="mb-3 text-[11px] font-mono font-bold uppercase tracking-[0.3em] text-atext-mute text-center">The Phone Is Ringing</div>
      <h2 className="font-display text-4xl sm:text-5xl text-atext mb-2 leading-none text-center">JOB MARKET</h2>
      <div className="text-center text-sm text-atext-dim mb-2">
        Coach Tier: <span className="text-aaccent font-bold">{career.coachTier || "Journeyman"}</span>
        <span className="text-atext-mute"> · </span>
        Reputation: <span className="text-aaccent font-bold">{coachRep}</span>
      </div>
      <p className="text-center text-[11px] text-atext-mute mb-4 max-w-xl mx-auto leading-snug">
        Star up to two clubs to pin them to the top. Tier 1–2 panels run a second question. Offers below your reputation bar are long-shots — doable, but the room starts cold.
      </p>
      {canReroll && (
        <div className="flex justify-center mb-4">
          <button type="button" onClick={onRerollJobMarket} className={`${css.btnGhost} text-[11px] py-2 px-4`}>
            Re-scan the market once (pulls deeper vacancies)
          </button>
        </div>
      )}

      {offers.length === 0 ? (
        <div className={`${css.panel} p-12 text-center`}>
          <Briefcase className="w-12 h-12 mx-auto mb-3 opacity-40 text-atext-mute" />
          <div className="text-sm text-atext-dim mb-2">No clubs are calling right now. The ladder may soften next season — or sit out and come back louder.</div>
          {canReroll && (
            <button type="button" onClick={onRerollJobMarket} className={`${css.btnPrimary} text-[11px] py-2 px-4 mt-2`}>
              TRY A DEEPER SCAN →
            </button>
          )}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3 mb-4">
          {sortedOffers.map((o) => (
            <JobOfferCard
              key={o.clubId}
              offer={o}
              coachRep={coachRep}
              isStarred={starredIds.includes(o.clubId)}
              onToggleStar={() => toggleStar(o.clubId)}
              onSelect={() => goInterview(o)}
            />
          ))}
        </div>
      )}

      <div className={`${css.panel} p-4 flex items-center justify-between flex-wrap gap-3 mt-3`}>
        <div>
          <div className={css.label}>Take a Season Off</div>
          <div className="text-sm text-atext leading-snug">Decline these offers. Reputation +5. Better jobs may appear next season.</div>
        </div>
        <button type="button" onClick={onTakeSeasonOff} className={`${css.btnGhost} text-[11px] py-2 px-4`}>
          SIT OUT THE SEASON
        </button>
      </div>
    </div>
  );
}

function JobOfferCard({ offer, onSelect, coachRep, isStarred, onToggleStar }) {
  const tierColor = offer.leagueTier === 1 ? "#FFD200" : offer.leagueTier === 2 ? "var(--A-accent)" : "#4ADE80";
  const heatColor = offer.mediaHeat === "high" ? "#E84A6F" : offer.mediaHeat === "med" ? "var(--A-accent-2)" : "#4AE89A";
  const longShot = coachRep < (offer.minReputation ?? 0);
  return (
    <div
      className={`${css.panel} p-4 flex flex-col transition`}
      style={{
        boxShadow: isStarred ? "0 0 0 2px rgba(0, 224, 255, 0.35)" : undefined,
      }}
    >
      <div className="h-1 -mx-4 -mt-4 mb-3" style={{ background: offer.color }} />
      <div className="flex items-start justify-between mb-2 flex-wrap gap-2">
        <div className="flex-1 min-w-0">
          <div className={css.label}>{offer.leagueShort} · Tier {offer.leagueTier}</div>
          <div className="font-bold text-atext leading-tight">{offer.clubName}</div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            type="button"
            className="p-1.5 rounded-lg transition"
            style={{ color: isStarred ? "#FFD200" : "var(--A-text-mute)", border: "1px solid var(--A-line)" }}
            aria-label={isStarred ? "Remove from shortlist" : "Add to shortlist"}
            onClick={(e) => {
              e.stopPropagation();
              onToggleStar();
            }}
          >
            <Star className="w-4 h-4" fill={isStarred ? "currentColor" : "none"} />
          </button>
          <span className="text-[10px] uppercase tracking-widest font-mono font-bold px-2 py-1 rounded-md" style={{ background: `${tierColor}18`, color: tierColor, border: `1px solid ${tierColor}40` }}>
            T{offer.leagueTier}
          </span>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 mb-2 text-[10px] font-mono">
        <span className="px-2 py-0.5 rounded" style={{ border: `1px solid ${heatColor}`, color: heatColor }}>Media {offer.mediaHeat}</span>
        <span className="px-2 py-0.5 rounded text-atext-dim" style={{ border: "1px solid var(--A-line)" }}>List {offer.rosterTag}</span>
        <span className="px-2 py-0.5 rounded text-aaccent" style={{ border: "1px solid var(--A-line)" }}>{offer.interestLabel}</span>
        {longShot && (
          <span className="px-2 py-0.5 rounded text-[#FFB347]" style={{ border: "1px solid #FFB34755" }}>Long shot vs bar</span>
        )}
      </div>
      <div className="text-[10px] text-atext-mute mb-2 leading-snug italic">{offer.vacancyReason}</div>
      <div className="grid grid-cols-2 gap-1 text-[11px] mb-3">
        <div className="text-atext-mute">Position</div>
        <div className="text-atext text-right font-mono">#{offer.ladderPos}</div>
        <div className="text-atext-mute">Form</div>
        <div className="text-atext text-right font-mono">{offer.recentForm.join("")}</div>
        <div className="text-atext-mute">Finances</div>
        <div className="text-atext text-right">{offer.finance}</div>
        <div className="text-atext-mute">Wage</div>
        <div className="text-aaccent text-right font-mono font-bold">${offer.wage.toLocaleString()}</div>
        <div className="text-atext-mute">Rep bar</div>
        <div className="text-atext text-right font-mono">{offer.minReputation ?? 0}+</div>
      </div>
      <div className="text-[11px] text-atext-dim italic mb-2 leading-snug">{offer.expectations}</div>
      <div className="text-[11px] text-atext leading-snug mb-3">{offer.chairmanLine}</div>
      <div className="mt-auto">
        <button type="button" onClick={onSelect} className={`${css.btnPrimary} w-full text-[11px] py-2`}>
          APPLY &amp; INTERVIEW →
        </button>
      </div>
    </div>
  );
}
