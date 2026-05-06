// ---------------------------------------------------------------------------
// Post-Match Summary overlay (Spec Section 3E)
// Renders on top of MatchDayScreen after the score is revealed.
// REVIEW MATCH → returns to MatchDayScreen so the player can scroll the feed.
// NEXT WEEK    → clears the match-day state and advances to the main app.
// ---------------------------------------------------------------------------
import React from "react";
import { Award, Trophy, Newspaper, Users, ChevronRight } from "lucide-react";
import { css } from "../components/primitives.jsx";

export default function PostMatchSummary({ summary, career, club, onReview, onContinue }) {
  if (!summary) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-8" style={{ background: 'rgba(7, 16, 31, 0.92)', backdropFilter: 'blur(8px)' }}>
      <div className="max-w-3xl w-full anim-in" style={{ background: 'var(--A-panel)', border: '1px solid var(--A-line-2)', borderRadius: 16, boxShadow: '0 30px 80px rgba(0, 0, 0, 0.55)' }}>
        {/* Header */}
        <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--A-line)' }}>
          <div>
            <div className="text-[10px] font-mono font-bold uppercase tracking-[0.3em] text-aaccent">{summary.label}</div>
            <div className="font-display text-3xl tracking-wide leading-tight">FULL TIME</div>
          </div>
          <div className="text-right">
            <div className="text-[10px] font-mono font-bold uppercase tracking-widest text-atext-mute">Result</div>
            <div className="font-display text-3xl leading-tight" style={{ color: summary.resultColor }}>{summary.result}</div>
          </div>
        </div>

        {/* Scoreboard */}
        <div className="px-6 py-6 flex items-center justify-between gap-6" style={{ borderBottom: '1px solid var(--A-line)' }}>
          <div className="flex-1 text-center">
            <div className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center font-display text-2xl mb-2" style={{ background: `linear-gradient(135deg, ${summary.myColor}, ${summary.myColor}aa)`, color: '#fff' }}>{summary.myShortName}</div>
            <div className="font-display text-4xl tabular-nums">{summary.myScore}</div>
          </div>
          <div className="text-2xl font-display text-atext-mute">vs</div>
          <div className="flex-1 text-center">
            <div className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center font-display text-2xl mb-2" style={{ background: `linear-gradient(135deg, ${summary.oppColor}, ${summary.oppColor}aa)`, color: '#fff' }}>{summary.oppShortName}</div>
            <div className="font-display text-4xl tabular-nums">{summary.oppScore}</div>
          </div>
        </div>

        <div className="px-6 py-3 text-center font-mono text-[11px] tracking-widest text-atext-dim uppercase" style={{ borderBottom: '1px solid var(--A-line)' }}>
          {summary.result === 'WIN'  && `Won by ${summary.margin} ${summary.margin === 1 ? 'point' : 'points'}`}
          {summary.result === 'LOSS' && `Lost by ${summary.margin} ${summary.margin === 1 ? 'point' : 'points'}`}
          {summary.result === 'DRAW' && 'Match drawn'}
          {' · '}{summary.crowd.toLocaleString()} in attendance
        </div>

        {/* Best on ground + Top scorer */}
        <div className="px-6 py-4 grid sm:grid-cols-2 gap-3" style={{ borderBottom: '1px solid var(--A-line)' }}>
          <SummaryCard icon={Award} label="Best on Ground" accent="#FFD200">
            {summary.bog
              ? <div><div className="font-bold text-atext leading-tight">{summary.bog.firstName} {summary.bog.lastName}</div>
                     <div className="text-[11px] text-atext-dim">{summary.bog.position} · OVR {summary.bog.overall}</div></div>
              : <div className="text-atext-dim text-sm">—</div>}
          </SummaryCard>
          <SummaryCard icon={Trophy} label="Top Scorer" accent="var(--A-accent)">
            {summary.topScorer
              ? <div><div className="font-bold text-atext leading-tight">{summary.topScorer.firstName} {summary.topScorer.lastName}</div>
                     <div className="text-[11px] text-atext-dim">{summary.topGoals} goal{summary.topGoals === 1 ? '' : 's'}</div></div>
              : <div className="text-atext-dim text-sm">No goalkickers from your squad</div>}
          </SummaryCard>
        </div>

        {/* Reactions */}
        <div className="px-6 py-4 space-y-2" style={{ borderBottom: '1px solid var(--A-line)' }}>
          <ReactionRow icon={Users} label="Board" tone={summary.boardReaction.emoji}>{summary.boardReaction.text}</ReactionRow>
          <ReactionRow icon={Newspaper} label="Press">{summary.journalistLine}</ReactionRow>
          {summary.committeeReaction && <ReactionRow icon={Users} label="Committee">{summary.committeeReaction}</ReactionRow>}
        </div>

        {/* Actions */}
        <div className="px-6 py-4 flex flex-col sm:flex-row gap-3 justify-end">
          <button onClick={onReview} className={`${css.btnGhost} flex items-center gap-2 justify-center`}>
            REVIEW MATCH
          </button>
          <button onClick={onContinue} className={`${css.btnPrimary} flex items-center gap-2 justify-center`}>
            NEXT WEEK <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ icon: Icon, label, accent, children }) {
  return (
    <div className="rounded-xl p-3 flex items-start gap-3" style={{ background: 'var(--A-panel-2)', border: '1px solid var(--A-line)' }}>
      <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${accent}15`, color: accent }}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[10px] font-mono font-bold uppercase tracking-widest text-atext-mute mb-1">{label}</div>
        {children}
      </div>
    </div>
  );
}

function ReactionRow({ icon: Icon, label, tone, children }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-base" style={{ background: 'var(--A-panel-2)', border: '1px solid var(--A-line)' }}>
        {tone || <Icon className="w-4 h-4 text-atext-dim" />}
      </div>
      <div className="flex-1 text-sm leading-snug">
        <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-atext-mute mr-2">{label}</span>
        <span className="text-atext">{children}</span>
      </div>
    </div>
  );
}
