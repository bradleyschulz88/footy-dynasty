import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  Trophy, Users, DollarSign, Dumbbell, Building2, Handshake, Shirt,
  UserCog, Repeat, Sprout, BarChart3, Calendar, ChevronRight, ChevronLeft,
  Home, Settings, Play, Pause, Save, ArrowUp, ArrowDown, ArrowRight,
  Star, Zap, Heart, Target, Activity, Flame, Sparkles, Crown,
  TrendingUp, TrendingDown, Plus, Minus, X, Check, Clock, MapPin,
  Newspaper, ShieldCheck, Gauge, Palette, Briefcase, GraduationCap,
  Map, Award, AlertCircle, ChevronsUp, FileText, RefreshCw
} from "lucide-react";
import { seedRng, rand, pick, rng, TIER_SCALE } from './lib/rng.js';
import { STATES, PYRAMID, LEAGUES_BY_STATE, ALL_CLUBS, findClub } from './data/pyramid.js';
import { POSITIONS, POSITION_NAMES, generatePlayer, generateSquad } from './lib/playerGen.js';
import { teamRating, simMatch, simMatchWithQuarters, aiClubRating } from './lib/matchEngine.js';
import { generateFixtures, blankLadder, applyResultToLadder, sortedLadder, getFinalsTeams, finalsLabel, pickPromotionLeague, pickRelegationLeague } from './lib/leagueEngine.js';
import { defaultFinance, DEFAULT_FACILITIES, DEFAULT_TRAINING, generateSponsors, generateStaff, defaultKits, generateTradePool } from './lib/defaults.js';
import { fmt, fmtK, clamp, avgFacilities, avgStaff } from './lib/format.js';
import { generateSeasonCalendar, applyTraining, TRAINING_INFO, formatDate, formatDateLong, formatMonth, addDays, daysInMonth, startOfMonth, getDayOfWeek, isSameMonth, prevMonth, nextMonth } from './lib/calendar.js';

const css = {
  panel: "bg-white rounded-2xl border border-[#E2E8F0] shadow-sm",
  panelHover: "bg-white rounded-2xl border border-[#E2E8F0] shadow-sm hover:shadow-md hover:border-[#CBD5E1] transition-all cursor-pointer",
  inset: "bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl",
  btn: "px-4 py-2.5 rounded-xl font-semibold transition-all tracking-wide",
  btnPrimary: "px-5 py-2.5 rounded-xl font-bold tracking-wide bg-[#E89A4A] hover:bg-[#F0A558] active:bg-[#D08838] text-white transition-all shadow-md shadow-[#E89A4A]/30",
  btnGhost: "px-5 py-2.5 rounded-xl font-semibold tracking-wide border border-[#E2E8F0] hover:border-[#CBD5E1] text-[#475569] hover:bg-[#F8FAFC] transition-all",
  btnDanger: "px-5 py-2.5 rounded-xl font-semibold tracking-wide bg-[#FEF2F2] border border-[#FECACA] hover:bg-[#FEE2E2] text-[#DC2626] transition-all",
  label: "text-[10px] uppercase tracking-[0.2em] text-[#94A3B8] font-bold",
  h1: "font-['Bebas_Neue'] tracking-wider text-[#0F172A]",
  num: "font-['Bebas_Neue'] tracking-wide",
  divider: "border-t border-[#E2E8F0]",
  tableHead: "px-4 py-3 text-[10px] uppercase tracking-[0.15em] text-[#94A3B8] font-bold border-b border-[#E2E8F0] bg-[#F8FAFC]",
  tableRow: "border-b border-[#F1F5F9] hover:bg-[#F8FAFC] transition-colors",
};

// Progress bar with optional label
const Bar = ({ value, color = "#E89A4A", small = false, showVal = false }) => (
  <div className="flex items-center gap-2 w-full">
    <div className={`flex-1 ${small ? "h-1.5" : "h-2.5"} bg-[#FFFFFF] rounded-full overflow-hidden`} style={{border:"1px solid #E2E8F0"}}>
      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.max(2,value)}%`, background: `linear-gradient(90deg, ${color}CC, ${color})` }} />
    </div>
    {showVal && <span className="text-[11px] font-bold w-7 text-right" style={{color}}>{value}</span>}
  </div>
);

const RatingDot = ({ value, size = "md" }) => {
  const c = value >= 85 ? "#4AE89A" : value >= 75 ? "#4ADBE8" : value >= 65 ? "#E89A4A" : value >= 55 ? "#E8D44A" : "#E84A6F";
  const sz = size === "lg" ? "w-12 h-12 text-base" : size === "sm" ? "w-7 h-7 text-[10px]" : "w-10 h-10 text-[13px]";
  return (
    <span className={`inline-flex items-center justify-center font-black ${sz} rounded-xl flex-shrink-0`}
      style={{ background: `linear-gradient(135deg, ${c}22, ${c}0A)`, color: c, border: `1.5px solid ${c}55`, boxShadow: `0 0 8px ${c}22` }}>
      {value}
    </span>
  );
};

const Pill = ({ children, color = "#64748B" }) => (
  <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-[0.12em] px-2.5 py-1 rounded-lg"
    style={{ background: `${color}18`, color, border: `1px solid ${color}40` }}>
    {children}
  </span>
);

const Stat = ({ label, value, sub, accent = "#E89A4A", icon: Icon }) => (
  <div className={`${css.panel} p-5 relative overflow-hidden`}>
    <div className="absolute top-0 left-0 w-1 h-full rounded-l-2xl" style={{background: accent}} />
    {Icon && <Icon className="w-5 h-5 mb-2 opacity-60" style={{color: accent}} />}
    <div className={css.label}>{label}</div>
    <div className={`${css.num} text-4xl mt-1.5 leading-none`} style={{ color: accent }}>{value}</div>
    {sub && <div className="text-xs text-[#64748B] mt-1.5 font-medium">{sub}</div>}
  </div>
);

// JerseyIcon: simple inline SVG kit preview
const Jersey = ({ kit, size = 64 }) => {
  const k = kit || { primary: "#E89A4A", secondary: "#FFFFFF", accent: "#E89A4A", pattern: "solid", numberColor: "#FFFFFF" };
  return (
    <svg viewBox="0 0 100 100" width={size} height={size}>
      <defs>
        <linearGradient id={`gr-${k.primary}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={k.primary} stopOpacity="1" />
          <stop offset="100%" stopColor={k.primary} stopOpacity="0.85" />
        </linearGradient>
      </defs>
      <path d="M20 20 L35 12 L50 18 L65 12 L80 20 L75 35 L72 35 L72 88 L28 88 L28 35 L25 35 Z"
        fill={`url(#gr-${k.primary})`} stroke="#000" strokeWidth="0.8" />
      {k.pattern === "stripes" && (
        <g fill={k.secondary} opacity="0.85">
          <rect x="42" y="20" width="6" height="68" />
          <rect x="52" y="20" width="6" height="68" />
        </g>
      )}
      {k.pattern === "v" && (
        <polygon points="35,20 50,42 65,20 50,28" fill={k.secondary} opacity="0.95" />
      )}
      {k.pattern === "sash" && (
        <polygon points="22,28 78,72 78,82 22,38" fill={k.secondary} opacity="0.95" />
      )}
      {k.pattern === "yoke" && (
        <path d="M28 20 L72 20 L72 38 L50 44 L28 38 Z" fill={k.secondary} opacity="0.95" />
      )}
      <text x="50" y="62" textAnchor="middle" fontSize="22" fontWeight="900" fontFamily="Bebas Neue, sans-serif" fill={k.numberColor}>9</text>
    </svg>
  );
};

// ============================================================================
// ERROR BOUNDARY
// ============================================================================
class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(e) { return { error: e }; }
  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-8">
          <div className="max-w-lg w-full rounded-2xl p-6" style={{background:'#1E293B', border:'1px solid #E84A6F44'}}>
            <div className="text-3xl mb-3">💥</div>
            <div className="font-['Bebas_Neue'] text-2xl text-[#E84A6F] mb-2">Something went wrong</div>
            <pre className="text-xs text-[#94A3B8] bg-[#0F172A] rounded-lg p-3 overflow-auto max-h-48 mb-4">{this.state.error?.message}{'\n'}{this.state.error?.stack}</pre>
            <div className="flex gap-2">
              <button onClick={() => this.setState({ error: null })}
                className="px-4 py-2 rounded-lg text-sm font-bold bg-[#E89A4A] text-white hover:bg-[#D07A2A]">
                Try again
              </button>
              <button onClick={() => { sessionStorage.removeItem('footy-dynasty-setup'); localStorage.removeItem('footy-dynasty-career'); this.setState({ error: null }); }}
                className="px-4 py-2 rounded-lg text-sm font-bold bg-[#E84A6F] text-white hover:bg-[#F06070]">
                Start new game
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// ============================================================================
// MAIN APP
// ============================================================================
export default function AFLManager() {
  return <ErrorBoundary><AFLManagerInner /></ErrorBoundary>;
}

const SAVE_KEY = 'footy-dynasty-career';
const SETUP_SS_KEY = 'footy-dynasty-setup';

function AFLManagerInner() {
  const [career, setCareer] = useState(() => {
    try {
      const saved = localStorage.getItem(SAVE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });
  const [screen, setScreen] = useState("hub");
  const [tab, setTab] = useState(null);

  useEffect(() => {
    try {
      if (career) {
        localStorage.setItem(SAVE_KEY, JSON.stringify(career));
        sessionStorage.removeItem(SETUP_SS_KEY);
      } else {
        localStorage.removeItem(SAVE_KEY);
      }
    } catch { /* quota exceeded — silently ignore */ }
  }, [career]);

  function handleNewGame() {
    if (!window.confirm('Abandon your current career and start a new game?')) return;
    sessionStorage.removeItem(SETUP_SS_KEY);
    localStorage.removeItem(SAVE_KEY);
    setCareer(null);
    setScreen('hub');
    setTab(null);
  }

  // ============== CAREER SETUP ==============
  if (!career) return <CareerSetup onStart={(c) => { setCareer(c); setScreen("hub"); }} />;

  const club = findClub(career.clubId);
  const league = PYRAMID[career.leagueKey];
  const myLineup = career.lineup;

  // ============== ADVANCE TO NEXT EVENT ==============
  function advanceToNextEvent() {
    const c = JSON.parse(JSON.stringify(career));

    // Finals override — keep old logic
    if (c.inFinals) {
      advanceFinalsWeek(c);
      setCareer(c);
      return;
    }

    // Check for end-of-season (all rounds done, not in finals yet)
    const anyIncomplete = (c.eventQueue || []).find(e => !e.completed);
    if (!anyIncomplete) {
      const finalists = getFinalsTeams(c.ladder, league.tier);
      if (finalists.length >= 2) {
        startFinals(c);
      } else {
        finishSeason(c);
      }
      setCareer(c);
      return;
    }

    const evIdx = (c.eventQueue || []).findIndex(e => !e.completed);
    if (evIdx === -1) { setCareer(c); return; }
    const ev = c.eventQueue[evIdx];
    c.currentDate = ev.date;
    c.phase = ev.phase || 'preseason';
    c.eventQueue[evIdx] = { ...ev, completed: true };

    // ── Training event ──
    if (ev.type === 'training') {
      const { squad, gains, staffName, staffRating, devNotes } = applyTraining(
        c.squad, c.lineup, ev.subtype, c.staff
      );
      c.squad = squad;
      const info = TRAINING_INFO[ev.subtype] || {};
      c.lastEvent = { type: 'training', subtype: ev.subtype, name: info.name || ev.subtype, date: ev.date, gains, staffName, staffRating, devNotes };
      setCareer(c);
      setScreen('hub');
      return;
    }

    // ── Key event ──
    if (ev.type === 'key_event') {
      const extraNews = [];
      // AI transfer activity
      if (ev.name === 'Transfer Window Opens') {
        const aiClubs = (league.clubs || []).filter(cl => cl.id !== c.clubId).slice(0, 4);
        aiClubs.forEach(cl => {
          const pool = c.tradePool || [];
          const target = pool[rand(0, Math.max(0, pool.length - 1))];
          if (target) extraNews.push({ week: c.week, type: 'info', text: `🔀 ${cl.name} linked with ${target.firstName} ${target.lastName} (${target.overall} OVR)` });
        });
      }
      if (ev.name === 'Transfer Window Closes') {
        // Refresh trade pool — simulate AI clubs completing signings
        c.tradePool = generateTradePool(c.leagueKey, c.season + ev.date.slice(0, 4) * 0);
        const aiClubs = (league.clubs || []).filter(cl => cl.id !== c.clubId).slice(0, 3);
        aiClubs.forEach(cl => {
          extraNews.push({ week: c.week, type: 'info', text: `✍️ ${cl.name} complete their pre-season recruitment` });
        });
      }
      c.lastEvent = { type: 'key_event', name: ev.name, description: ev.description, action: ev.action, date: ev.date };
      c.news = [
        { week: c.week, type: 'info', text: `📅 ${ev.name}: ${ev.description}` },
        ...extraNews,
        ...(c.news || []),
      ].slice(0, 20);
      setCareer(c);
      setScreen('hub');
      return;
    }

    // ── Pre-season match ──
    if (ev.type === 'preseason_match') {
      const isHome = ev.homeId === c.clubId;
      const oppId  = isHome ? ev.awayId : ev.homeId;
      const opp    = findClub(oppId);
      const myRating  = teamRating(c.squad, c.lineup, c.training, avgFacilities(c.facilities), avgStaff(c.staff));
      const oppRating = aiClubRating(oppId, league.tier);
      const result = simMatchWithQuarters(
        { rating: isHome ? myRating : oppRating },
        { rating: isHome ? oppRating : myRating },
        isHome, myRating
      );
      const myTotal  = isHome ? result.homeTotal : result.awayTotal;
      const oppTotal = isHome ? result.awayTotal : result.homeTotal;
      const won = myTotal > oppTotal;
      const drew = myTotal === oppTotal;

      c.squad = c.squad.map(p => {
        if (!c.lineup.includes(p.id)) return p;
        const fitDrop = rand(5, 12);
        const formChange = won ? rand(1, 4) : drew ? rand(-1, 2) : rand(-3, 1);
        const gAdd = (p.position === 'KF' || p.position === 'HF') ? rand(0, 2) : 0;
        return { ...p, fitness: clamp(p.fitness - fitDrop, 30, 100), form: clamp(p.form + formChange, 30, 100),
                 goals: p.goals + gAdd, behinds: p.behinds + rand(0, 1), disposals: p.disposals + rand(6, 18),
                 marks: p.marks + rand(1, 4), tackles: p.tackles + rand(1, 3), gamesPlayed: p.gamesPlayed + 1 };
      });
      c.news = [{ week: 0, type: won ? 'win' : drew ? 'draw' : 'loss',
        text: `${ev.label}: ${isHome ? 'vs' : '@'} ${opp?.short} ${myTotal}–${oppTotal} (${won ? 'W' : drew ? 'D' : 'L'})` }, ...(c.news || [])].slice(0, 15);
      c.lastEvent = { type: 'preseason_match', label: ev.label, date: ev.date, isHome, opp, result, myTotal, oppTotal, won, drew };
      c.inMatchDay = true;
      c.currentMatchResult = { ...result, isHome, opp, myTotal, oppTotal, won, drew, isPreseason: true, label: ev.label, isAFL: league.tier === 1 };
      setCareer(c);
      return;
    }

    // ── Regular season round ──
    if (ev.type === 'round') {
      const round   = ev.matches || [];
      const myMatch = round.find(m => m.home === c.clubId || m.away === c.clubId);
      let myResult  = null;

      round.forEach(m => {
        if (m.home === c.clubId || m.away === c.clubId) {
          const isHome = m.home === c.clubId;
          const opp    = findClub(isHome ? m.away : m.home);
          const myRating  = teamRating(c.squad, c.lineup, c.training, avgFacilities(c.facilities), avgStaff(c.staff));
          const oppRating = aiClubRating(opp.id, league.tier);
          const TACTIC_BONUS = { attack: 6, balanced: 0, defensive: -4, flood: -2 };
          const tacBonus = TACTIC_BONUS[c.tacticChoice || 'balanced'] || 0;
          const effRating = clamp(myRating + tacBonus, 20, 120);
          const result = simMatchWithQuarters(
            { rating: isHome ? effRating : oppRating },
            { rating: isHome ? oppRating : effRating },
            isHome, effRating
          );
          const myTotal  = isHome ? result.homeTotal : result.awayTotal;
          const oppTotal = isHome ? result.awayTotal : result.homeTotal;
          const won = myTotal > oppTotal;
          const drew = myTotal === oppTotal;
          c.ladder = applyResultToLadder(c.ladder, m.home, m.away, result.homeTotal, result.awayTotal);
          m.result = { hScore: result.homeTotal, aScore: result.awayTotal };
          myResult = { isHome, opp, result, myTotal, oppTotal, won, drew };

          c.squad = c.squad.map(p => {
            if (!c.lineup.includes(p.id)) return p;
            const fitDrop = rand(8, 18);
            const formChange = won ? rand(2, 6) : drew ? rand(-2, 2) : rand(-6, -1);
            const gAdd = (p.position === 'KF' || p.position === 'HF') ? rand(0, 3) : (p.position === 'C' || p.position === 'R') ? rand(0, 1) : 0;
            const dispAdd = (p.position === 'C' || p.position === 'R' || p.position === 'WG') ? rand(15, 32) : rand(8, 22);
            return { ...p, fitness: clamp(p.fitness - fitDrop, 30, 100), form: clamp(p.form + formChange, 30, 100),
                     goals: p.goals + gAdd, behinds: p.behinds + rand(0, 2), disposals: p.disposals + dispAdd,
                     marks: p.marks + rand(2, 7), tackles: p.tackles + rand(1, 5), gamesPlayed: p.gamesPlayed + 1 };
          });
          if (rng() < 0.18 && c.lineup.length > 0) {
            const injId = pick(c.lineup);
            c.squad = c.squad.map(p => p.id === injId ? { ...p, injured: rand(1, 4) } : p);
          }
        } else {
          const r1 = aiClubRating(m.home, league.tier);
          const r2 = aiClubRating(m.away, league.tier);
          const result = simMatch({ rating: r1 }, { rating: r2 }, false, r2);
          c.ladder = applyResultToLadder(c.ladder, m.home, m.away, result.homeTotal, result.awayTotal);
          m.result = { hScore: result.homeTotal, aScore: result.awayTotal };
        }
      });

      // Recover bench players
      c.squad = c.squad.map(p => {
        if (c.lineup.includes(p.id)) return p;
        return { ...p, fitness: clamp(p.fitness + rand(8, 14), 30, 100), injured: Math.max(0, p.injured - 1) };
      });

      // Finance for this round
      const isHomeMatch = myMatch && myMatch.home === c.clubId;
      const stadiumLevel = c.facilities.stadium.level;
      const baseAtt = league.tier === 1 ? 35000 : league.tier === 2 ? 4000 : 600;
      const att = Math.round(baseAtt * (0.6 + stadiumLevel * 0.15) * (0.7 + c.finance.fanHappiness / 200));
      const ticketRev = isHomeMatch ? Math.round(att * (league.tier === 1 ? 38 : league.tier === 2 ? 16 : 10)) : 0;
      const sponsorAccrual = Math.round(c.sponsors.reduce((a, s) => a + s.annualValue, 0) / 22);
      const wageWeekly = Math.round((c.squad.reduce((a, p) => a + p.wage, 0) + c.staff.reduce((a, s) => a + s.wage, 0)) / 52);
      const facilityCosts = Math.round(Object.values(c.facilities).reduce((a, f) => a + f.level * 2500, 0));
      c.finance.cash += ticketRev + sponsorAccrual - wageWeekly - facilityCosts;
      c.weeklyHistory = (c.weeklyHistory || []).slice(-15);
      c.weeklyHistory.push({ week: ev.round, profit: ticketRev + sponsorAccrual - wageWeekly - facilityCosts, cash: c.finance.cash });

      if (myResult) {
        c.finance.fanHappiness = clamp(c.finance.fanHappiness + (myResult.won ? 3 : myResult.drew ? 0 : -2), 10, 100);
        c.finance.boardConfidence = clamp(c.finance.boardConfidence + (myResult.won ? 2 : myResult.drew ? 0 : -1), 10, 100);
        c.news = [{ week: ev.round, type: myResult.won ? 'win' : myResult.drew ? 'draw' : 'loss',
          text: `Rd ${ev.round}: ${myResult.isHome ? 'vs' : '@'} ${myResult.opp?.short} ${myResult.myTotal}–${myResult.oppTotal} (${myResult.won ? 'W' : myResult.drew ? 'D' : 'L'})` },
          ...(c.news || [])].slice(0, 12);
      }

      c.week = ev.round;
      c.lastEvent = myResult ? { type: 'round', round: ev.round, date: ev.date, ...myResult } : null;

      // Check if all regular-season rounds complete
      const hasMoreRounds = (c.eventQueue || []).some(e => !e.completed && e.type === 'round' && e.phase === 'season');
      if (!hasMoreRounds) {
        const finalists = getFinalsTeams(c.ladder, league.tier);
        if (finalists.length >= 2) startFinals(c);
        else finishSeason(c);
      }

      if (myResult) {
        c.inMatchDay = true;
        c.currentMatchResult = { ...myResult.result, isHome: myResult.isHome, opp: myResult.opp,
          myTotal: myResult.myTotal, oppTotal: myResult.oppTotal, won: myResult.won, drew: myResult.drew,
          isPreseason: false, label: `Round ${ev.round}`, isAFL: league.tier === 1 };
      }
      setCareer(c);
      return;
    }

    setCareer(c);
  }

  function startFinals(c) {
    const finalists = getFinalsTeams(c.ladder, league.tier);
    const myPos = sortedLadder(c.ladder).findIndex(r => r.id === c.clubId) + 1;
    const inFinals = finalists.some(f => f.id === c.clubId);
    const totalRounds = Math.log2(finalists.length); // 8→3, 4→2
    c.inFinals = true;
    c.finalsRound = 0;
    c.finalsFinalists = finalists.map(f => f.id);
    c.finalsAlive = finalists.map(f => f.id); // clubs still alive
    c.finalsTotalRounds = Math.ceil(totalRounds);
    c.finalsResults = [];
    const news = inFinals
      ? `🏆 FINALS! Finished ${myPos}${myPos===1?"st":myPos===2?"nd":myPos===3?"rd":"th"} — into the ${finalsLabel(0, c.finalsTotalRounds)}!`
      : `Season over. Finished ${myPos}/${sortedLadder(c.ladder).length} — missed finals.`;
    c.news = [{ week: c.week, type: inFinals ? "win" : "draw", text: news }, ...c.news].slice(0,15);
    return c;
  }

  function advanceFinalsWeek(c) {
    // Sim this week's finals matches
    const alive = c.finalsAlive || [];
    if (alive.length <= 1) {
      // Grand Final winner — end season
      const winner = alive[0];
      const winnerClub = findClub(winner);
      const isMeChamp = winner === c.clubId;
      c.premiership = isMeChamp ? c.season : c.premiership;
      c.news = [{ week: c.week, type: isMeChamp ? "win" : "loss",
        text: isMeChamp ? `🏆🎉 PREMIERS! ${winnerClub?.name} are the ${c.season} champions!`
                        : `${winnerClub?.name} win the ${c.season} premiership.` }, ...c.news].slice(0,15);
      c.inFinals = false;
      return finishSeason(c);
    }

    // Pair alive clubs (seeded by original ladder position)
    const sorted = c.finalsFinalists.filter(id => alive.includes(id));
    const pairs = [];
    for (let i = 0; i < Math.floor(sorted.length / 2); i++) {
      pairs.push({ home: sorted[i], away: sorted[sorted.length - 1 - i] });
    }

    const newAlive = [];
    const myRating = teamRating(c.squad, c.lineup, c.training, avgFacilities(c.facilities), avgStaff(c.staff));
    const roundLabel = finalsLabel(c.finalsRound, c.finalsTotalRounds);

    for (const m of pairs) {
      const isPlayerMatch = m.home === c.clubId || m.away === c.clubId;
      const isHome = m.home === c.clubId;
      const homeR = m.home === c.clubId ? myRating : aiClubRating(m.home, league.tier);
      const awayR = m.away === c.clubId ? myRating : aiClubRating(m.away, league.tier);
      const result = isPlayerMatch
        ? simMatchWithQuarters({ rating: homeR }, { rating: awayR }, isHome, myRating)
        : simMatch({ rating: homeR }, { rating: awayR }, false, awayR);
      const winnerId = result.winner === "home" ? m.home : result.winner === "away" ? m.away : m.home;
      newAlive.push(winnerId);
      m.result = { hScore: result.homeTotal, aScore: result.awayTotal };

      if (isPlayerMatch) {
        const playerWon = (isHome && result.winner === "home") || (!isHome && result.winner === "away");
        const myScore  = isHome ? result.homeTotal : result.awayTotal;
        const oppScore = isHome ? result.awayTotal  : result.homeTotal;
        const opp = findClub(isHome ? m.away : m.home);
        c.news = [{ week: c.week, type: playerWon ? "win" : "loss",
          text: playerWon
            ? `✅ ${roundLabel} WIN! ${myScore} def ${opp?.short} ${oppScore}`
            : `❌ Eliminated in ${roundLabel}. ${opp?.short} ${oppScore} def ${myScore}` },
          ...c.news].slice(0, 15);
        c.inMatchDay = true;
        c.currentMatchResult = {
          ...result,
          isHome, opp,
          myTotal: myScore, oppTotal: oppScore,
          won: playerWon, drew: myScore === oppScore,
          isPreseason: false, label: roundLabel, isAFL: league.tier === 1,
        };
        c.lastEvent = { type: 'round', round: roundLabel, date: c.currentDate || '', isHome, opp,
          result, myTotal: myScore, oppTotal: oppScore, won: playerWon, drew: myScore === oppScore };
      }
      c.finalsResults.push({ round: c.finalsRound, label: roundLabel, ...m });
    }

    // If odd one out (bye), they advance automatically (top seed)
    if (sorted.length % 2 !== 0) newAlive.unshift(sorted[0]);

    c.finalsAlive = newAlive;
    c.finalsRound += 1;
    c.week += 1;
    return c;
  }

  function finishSeason(c) {
    const sorted = sortedLadder(c.ladder);
    const myPos = sorted.findIndex(r => r.id === c.clubId) + 1;
    const myRow = sorted.find(r => r.id === c.clubId) || {};
    let promoted = false, relegated = false;

    // Capture summary BEFORE resetting squad stats
    const pName = p => p.firstName ? `${p.firstName} ${p.lastName}` : (p.name || 'Unknown');
    const byGoals     = [...c.squad].sort((a, b) => (b.goals     || 0) - (a.goals     || 0));
    const byDisposals = [...c.squad].sort((a, b) => (b.disposals || 0) - (a.disposals || 0));
    const lineupSquad = c.squad.filter(p => c.lineup.includes(p.id));
    const bafPlayer   = [...lineupSquad].sort((a, b) => {
      const scoreA = (a.disposals || 0) / Math.max(1, a.gamesPlayed || 1);
      const scoreB = (b.disposals || 0) / Math.max(1, b.gamesPlayed || 1);
      return scoreB - scoreA;
    })[0] || null;
    const champion = c.premiership === c.season;
    const oldLeagueKey   = c.leagueKey;
    const oldLeagueName  = PYRAMID[oldLeagueKey]?.name  || '';
    const oldLeagueShort = PYRAMID[oldLeagueKey]?.short || '';

    // Game-fictional pyramid promo/releg
    if (league.tier > 1) {
      if (myPos === 1) {
        promoted = true;
        const newLeagueKey = pickPromotionLeague(league);
        if (newLeagueKey) {
          const newLeague = PYRAMID[newLeagueKey];
          c.leagueKey = newLeagueKey;
          c.fixtures = generateFixtures(newLeague.clubs);
          c.ladder = blankLadder(newLeague.clubs);
        }
      } else if (myPos === sorted.length) {
        relegated = true;
        if (league.tier < 3) {
          const newLeagueKey = pickRelegationLeague(league);
          if (newLeagueKey) {
            const newLeague = PYRAMID[newLeagueKey];
            c.leagueKey = newLeagueKey;
            c.fixtures = generateFixtures(newLeague.clubs);
            c.ladder = blankLadder(newLeague.clubs);
          }
        }
      } else {
        c.fixtures = generateFixtures(league.clubs);
        c.ladder = blankLadder(league.clubs);
      }
    } else {
      c.fixtures = generateFixtures(league.clubs);
      c.ladder = blankLadder(league.clubs);
    }

    // Season summary (saved before squad reset so stats are intact)
    c.seasonSummary = {
      season:      c.season,
      leagueName:  oldLeagueName,
      leagueShort: oldLeagueShort,
      leagueTier:  league.tier,
      position:    myPos,
      totalTeams:  sorted.length,
      W: myRow.W || 0, L: myRow.L || 0, D: myRow.D || 0,
      pts: myRow.pts || 0,
      pct: Math.round(myRow.pct || 0),
      F:   myRow.F   || 0, A: myRow.A || 0,
      promoted,  relegated, champion,
      topScorer:   byGoals[0]     ? { name: pName(byGoals[0]),     goals:     byGoals[0].goals     || 0, games: byGoals[0].gamesPlayed     || 0 } : null,
      topDisposal: byDisposals[0] ? { name: pName(byDisposals[0]), disposals: byDisposals[0].disposals || 0, games: byDisposals[0].gamesPlayed || 0 } : null,
      baf:         bafPlayer      ? { name: pName(bafPlayer),      overall:   bafPlayer.overall,    games: bafPlayer.gamesPlayed || 0 } : null,
    };
    c.showSeasonSummary = true;

    c.season += 1;
    c.week = 0;
    // Determine new league tier for recalibration
    const newLeagueTier = PYRAMID[c.leagueKey]?.tier || league.tier;
    const newTierScale = TIER_SCALE[newLeagueTier] || 1.0;
    // Age players, re-roll form/fitness, reduce contracts
    // Also recalibrate display overall when tier has changed
    c.squad = c.squad.map(p => {
      const newAge = p.age + 1;
      const decline = newAge >= 30 ? rand(2, 6) : newAge >= 27 ? rand(0, 3) : newAge <= 22 ? -rand(2, 6) : 0;
      // Keep trueRating stable; apply age decline there, then recalibrate display overall
      const newTrue = clamp((p.trueRating || p.overall) - Math.round(decline * (TIER_SCALE[p.tier||2]||1.0)), 25, 99);
      const newOverall = clamp(Math.round(newTrue / newTierScale) - (newLeagueTier < (p.tier||league.tier) ? rand(0,3) : 0), 30, 99);
      return { ...p, age: newAge, overall: newOverall, trueRating: newTrue, tier: newLeagueTier,
               contract: Math.max(0, p.contract - 1), form: rand(50, 80), fitness: rand(85, 100),
               goals: 0, behinds: 0, disposals: 0, marks: 0, tackles: 0, gamesPlayed: 0, injured: 0 };
    }).filter(p => p.age <= 36 && p.contract > 0);
    // Generate draft pool for off-season
    seedRng(c.season * 999 + 17);
    c.draftPool = Array.from({ length: 60 }, (_, i) => generatePlayer(2, 9000 + i + c.season * 100));
    c.tradePool = generateTradePool(c.leagueKey, c.season);
    c.news = [
      { week: 0, type: promoted ? "win" : relegated ? "loss" : "draw",
        text: promoted ? `🏆 Promoted! Finished ${myPos}st in ${league.short}.` : relegated ? `⬇️ Relegated. Finished ${myPos}/${sorted.length}.` : `Season complete: finished ${myPos}/${sorted.length}` },
      ...c.news
    ].slice(0, 15);
    // Regenerate event queue for the new season
    const nextLeague = PYRAMID[c.leagueKey];
    c.eventQueue = generateSeasonCalendar(c.season, nextLeague.clubs, c.fixtures, c.clubId);
    c.currentDate = `${c.season - 1}-12-01`;
    c.phase = 'preseason';
    c.lastEvent = null;
    c.inMatchDay = false;
    c.currentMatchResult = null;
    return c;
  }

  // ============== UPDATER ==============
  const updateCareer = (patch) => setCareer(c => ({ ...c, ...patch }));
  const updateField = (field, value) => setCareer(c => ({ ...c, [field]: value }));

  const myLadderPos = (() => {
    const s = sortedLadder(career.ladder);
    return s.findIndex(r => r.id === career.clubId) + 1;
  })();

  // ============== RENDER ==============
  const globalStyle = (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Sora:wght@300;400;500;600;700;800&display=swap');
      body, html { background:#F1F5F9; margin:0; }
      ::-webkit-scrollbar { width:5px; height:5px; }
      ::-webkit-scrollbar-track { background:#F1F5F9; }
      ::-webkit-scrollbar-thumb { background:#CBD5E1; border-radius:4px; }
      ::-webkit-scrollbar-thumb:hover { background:#94A3B8; }
      @keyframes pulseGlow { 0%,100%{box-shadow:0 0 0 0 rgba(232,154,74,0.3);}50%{box-shadow:0 0 14px 3px rgba(232,154,74,0.18);} }
      .glow { animation: pulseGlow 2.5s ease-in-out infinite; }
      @keyframes slideIn { from{opacity:0;transform:translateY(6px);}to{opacity:1;transform:translateY(0);} }
      .anim-in { animation: slideIn 0.2s ease-out; }
      select option { background:#FFF; color:#0F172A; }
      select { color:#0F172A; background:#FFF; }
      input[type=color] { padding:2px; cursor:pointer; border-radius:6px; }
      button:disabled { opacity:0.4; cursor:not-allowed; }
      * { box-sizing:border-box; }
    `}</style>
  );

  if (career.showSeasonSummary && career.seasonSummary) {
    return (
      <div className="font-['Sora',sans-serif]">
        {globalStyle}
        <SeasonSummaryScreen
          summary={career.seasonSummary}
          club={club}
          onContinue={() => updateCareer({ showSeasonSummary: false })}
        />
      </div>
    );
  }

  if (career.inMatchDay && career.currentMatchResult) {
    return (
      <div className="font-['Sora',sans-serif]">
        {globalStyle}
        <MatchDayScreen
          result={career.currentMatchResult}
          league={league}
          career={career}
          club={club}
          onContinue={() => updateCareer({ inMatchDay: false, currentMatchResult: null })}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F1F5F9] text-[#0F172A] font-['Sora',sans-serif] flex">
      {globalStyle}
      <Sidebar screen={screen} setScreen={(s)=>{setScreen(s);setTab(null);}} club={club} league={league} career={career} myLadderPos={myLadderPos} onNewGame={handleNewGame} />
      <main className="flex-1 overflow-y-auto">
        <TopBar career={career} club={club} league={league} myLadderPos={myLadderPos} onAdvance={advanceToNextEvent} />
        <div className="p-6 max-w-[1400px] mx-auto">
          {screen === "hub"      && <HubScreen career={career} club={club} league={league} myLadderPos={myLadderPos} setScreen={setScreen} onAdvance={advanceToNextEvent} />}
          {screen === "squad"    && <SquadScreen career={career} club={club} updateCareer={updateCareer} tab={tab} setTab={setTab} />}
          {screen === "schedule" && <ScheduleScreen career={career} club={club} league={league} />}
          {screen === "club"     && <ClubScreen career={career} club={club} updateCareer={updateCareer} tab={tab} setTab={setTab} />}
          {screen === "recruit"  && <RecruitScreen career={career} club={club} updateCareer={updateCareer} tab={tab} setTab={setTab} />}
          {screen === "compete"  && <CompetitionScreen career={career} club={club} league={league} tab={tab} setTab={setTab} />}
        </div>
      </main>
    </div>
  );
}


// ============================================================================
// CAREER SETUP SCREEN
// ============================================================================
function loadSetup() {
  try { return JSON.parse(sessionStorage.getItem(SETUP_SS_KEY) || '{}'); } catch { return {}; }
}
function saveSetup(patch) {
  try { sessionStorage.setItem(SETUP_SS_KEY, JSON.stringify({ ...loadSetup(), ...patch })); } catch {}
}

function CareerSetup({ onStart }) {
  const saved = loadSetup();
  const [step, _setStep] = useState(saved.step ?? 0);
  const [state, _setSelState] = useState(saved.state ?? null);
  const [tier, _setTier] = useState(saved.tier ?? null);
  const [leagueKey, _setLeagueKey] = useState(saved.leagueKey ?? null);
  const [clubId, _setClubId] = useState(saved.clubId ?? null);
  const [managerName, setManagerName] = useState(saved.managerName ?? "");
  const [loading, setLoading] = useState(false);

  const setStep      = (v) => { saveSetup({ step: v });      _setStep(v); };
  const setSelState  = (v) => { saveSetup({ state: v });     _setSelState(v); };
  const setTier      = (v) => { saveSetup({ tier: v });      _setTier(v); };
  const setLeagueKey = (v) => { saveSetup({ leagueKey: v }); _setLeagueKey(v); };
  const setClubId    = (v) => { saveSetup({ clubId: v });    _setClubId(v); };

  const availableLeagues = state ? LEAGUES_BY_STATE(state).filter(l => tier ? l.tier === tier : true) : [];
  const availableClubs = leagueKey ? PYRAMID[leagueKey].clubs : [];
  const tiersForState = state ? [1, 2, 3].filter(t => LEAGUES_BY_STATE(state).some(l => l.tier === t)) : [1, 2, 3];

  function start() {
    if (!clubId || !leagueKey || loading) return;
    setLoading(true);
    try {
    const club = findClub(clubId);
    const league = PYRAMID[leagueKey];
    if (!club) throw new Error(`Club not found: ${clubId}`);
    if (!league) throw new Error(`League not found: ${leagueKey}`);
    const SEASON = 2026;
    seedRng(clubId.split("").reduce((a,c)=>a + c.charCodeAt(0), 7) + 1);
    const squad = generateSquad(clubId, league.tier);
    const lineup = squad.slice().sort((a,b)=>b.overall-a.overall).slice(0, 22).map(p=>p.id);
    const fixtures = generateFixtures(league.clubs);
    const eventQueue = generateSeasonCalendar(SEASON, league.clubs, fixtures, clubId);
    onStart({
      managerName: managerName || "Coach",
      clubId,
      leagueKey,
      season: SEASON,
      week: 0,
      currentDate: `${SEASON - 1}-12-01`,
      phase: 'preseason',
      eventQueue,
      lastEvent: null,
      inMatchDay: false,
      currentMatchResult: null,
      squad,
      lineup,
      training: DEFAULT_TRAINING(),
      facilities: DEFAULT_FACILITIES(),
      finance: defaultFinance(league.tier),
      sponsors: generateSponsors(league.tier),
      staff: generateStaff(league.tier),
      kits: defaultKits(club.colors),
      ladder: blankLadder(league.clubs),
      fixtures,
      tradePool: (() => { seedRng(7777); return Array.from({ length: 25 }, (_, i) => { const p = generatePlayer(rand(1,3), 5000+i); return { ...p, fromClub: pick(ALL_CLUBS).short }; }); })(),
      draftPool: Array.from({ length: 60 }, (_, i) => generatePlayer(2, 9000 + i)),
      youth: { recruits: [], zone: club.state, programLevel: 1, scoutFocus: "All-rounders" },
      news: [{ week: 0, type: "draw", text: `${managerName || "Coach"} appointed at ${club.name}. Pre-season begins Dec 1.` }],
      weeklyHistory: [],
      inFinals: false,
      finalsRound: 0,
      finalsFixtures: [],
      finalsResults: [],
      premiership: null,
      tacticChoice: "balanced",
      seasonHistory: [],
    });
    } catch (err) {
      setLoading(false);
      alert(`Failed to start career: ${err.message}\n\nCheck browser console for details.`);
      console.error('[start] career init error:', err);
    }
  }

  return (
    <div className="min-h-screen bg-[#F1F5F9] text-[#0F172A] font-['Sora',sans-serif] flex flex-col">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Sora:wght@300;400;500;600;700;800&display=swap');
        @keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        .fade-up { animation: fadeUp 0.4s ease-out; }
      `}</style>
      {/* Hero */}
      <div className="relative overflow-hidden border-b border-[#E2E8F0]" style={{ background: "radial-gradient(circle at 30% 20%, #EEF2F6 0%, #F8FAFC 60%)" }}>
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, #E89A4A 1px, transparent 0)", backgroundSize: "32px 32px" }} />
        <div className="max-w-5xl mx-auto px-8 py-12 relative">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-[#E89A4A] flex items-center justify-center"><Trophy className="w-6 h-6 text-[#F8FAFC]" /></div>
            <span className="text-[12px] uppercase tracking-[0.3em] text-[#E89A4A] font-bold">Manager 2026</span>
          </div>
          <h1 className="font-['Bebas_Neue'] text-7xl tracking-wider leading-none">FOOTY <span className="text-[#E89A4A]">DYNASTY</span></h1>
          <p className="text-[#64748B] mt-3 text-lg max-w-2xl">Take a community side from the suburban grounds to the MCG. Real Australian rules football management — 7 states, full pyramid, every system you'd expect.</p>
        </div>
      </div>
      {/* Stepper */}
      <div className="flex-1 max-w-5xl mx-auto w-full px-8 py-8">
        <div className="flex items-center gap-2 mb-8">
          {["State", "Tier", "League", "Club", "You"].map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold transition ${step === i ? "bg-[#E89A4A] text-[#F8FAFC]" : i < step ? "bg-[#F1F5F9] text-[#E89A4A] border border-[#E89A4A]/40" : "bg-[#121826] text-[#64748B] border border-[#E2E8F0]"}`}>{i+1}</div>
              <span className={`text-sm font-semibold ${step === i ? "text-[#0F172A]" : "text-[#64748B]"}`}>{s}</span>
              {i < 4 && <ChevronRight className="w-4 h-4 text-[#E2E8F0] mx-1" />}
            </div>
          ))}
        </div>

        {step === 0 && (
          <div className="fade-up">
            <h2 className={`${css.h1} text-4xl mb-4`}>PICK A STATE</h2>
            <p className="text-[#64748B] mb-8">Where will your story begin? Each state has its own football culture and pyramid.</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {STATES.map(s => {
                const flag = { VIC: "🏉", SA: "🦘", WA: "🌅", TAS: "🍎", NT: "🐊", QLD: "🌴", NSW: "🌉", ACT: "🏛️" };
                const desc = { VIC: "The heartland. Most clubs.", SA: "SANFL country.", WA: "WAFL & two AFL sides.", TAS: "Tassie Devils incoming.", NT: "Top End footy.", QLD: "Sun, Suns, Lions.", NSW: "Swans & Giants country.", ACT: "Capital territory footy." };
                return (
                  <button key={s} onClick={()=>{setSelState(s); setStep(1);}} className={`${css.panelHover} p-6 text-left group`}>
                    <div className="text-4xl mb-2">{flag[s]}</div>
                    <div className={`${css.h1} text-3xl`}>{s}</div>
                    <div className="text-[12px] text-[#64748B] mt-1">{desc[s]}</div>
                    <div className="text-[10px] text-[#E89A4A] mt-3 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition">Choose →</div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="fade-up">
            <button onClick={()=>setStep(0)} className="text-[#64748B] text-sm mb-4 hover:text-[#0F172A] flex items-center gap-1"><ChevronLeft className="w-4 h-4" />Back</button>
            <h2 className={`${css.h1} text-4xl mb-4`}>CHOOSE YOUR DIFFICULTY</h2>
            <p className="text-[#64748B] mb-8">Start at the top, the middle, or the bottom of the pyramid. Showing tiers available in <strong>{state}</strong>.</p>
            <div className={`grid gap-4 ${tiersForState.length === 1 ? 'md:grid-cols-1 max-w-sm' : tiersForState.length === 2 ? 'md:grid-cols-2 max-w-2xl' : 'md:grid-cols-3'}`}>
              {tiersForState.includes(3) && (
                <button onClick={()=>{setTier(3); setLeagueKey(null); setClubId(null); setStep(2);}} className={`${css.panelHover} p-6 text-left`}>
                  <Pill color="#4ADBE8">Underdog</Pill>
                  <div className={`${css.h1} text-4xl mt-3`}>TIER 3</div>
                  <div className="text-sm text-[#0F172A] font-semibold mt-1">Community / Local</div>
                  <div className="text-[12px] text-[#64748B] mt-3">Suburban grounds. Tiny budgets. Long road. Most rewarding climb.</div>
                  <div className="text-[#4ADBE8] text-xs mt-4 font-bold uppercase tracking-widest">3 Promotions to AFL</div>
                </button>
              )}
              {tiersForState.includes(2) && (
                <button onClick={()=>{setTier(2); setLeagueKey(null); setClubId(null); setStep(2);}} className={`${css.panelHover} p-6 text-left`}>
                  <Pill color="#E89A4A">Established</Pill>
                  <div className={`${css.h1} text-4xl mt-3`}>TIER 2</div>
                  <div className="text-sm text-[#0F172A] font-semibold mt-1">State League</div>
                  <div className="text-[12px] text-[#64748B] mt-3">VFL, SANFL, WAFL etc. Real budgets. One step from the big show.</div>
                  <div className="text-[#E89A4A] text-xs mt-4 font-bold uppercase tracking-widest">1 Promotion to AFL</div>
                </button>
              )}
              {tiersForState.includes(1) && (
                <button onClick={()=>{setTier(1); setLeagueKey(null); setClubId(null); setStep(2);}} className={`${css.panelHover} p-6 text-left`}>
                  <Pill color="#E84A6F">Big Time</Pill>
                  <div className={`${css.h1} text-4xl mt-3`}>TIER 1</div>
                  <div className="text-sm text-[#0F172A] font-semibold mt-1">AFL</div>
                  <div className="text-[12px] text-[#64748B] mt-3">Premiership pressure. Salary caps. Trade weeks. Every game on TV.</div>
                  <div className="text-[#E84A6F] text-xs mt-4 font-bold uppercase tracking-widest">Win the Cup</div>
                </button>
              )}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="fade-up">
            <button onClick={()=>setStep(1)} className="text-[#64748B] text-sm mb-4 hover:text-[#0F172A] flex items-center gap-1"><ChevronLeft className="w-4 h-4" />Back</button>
            <h2 className={`${css.h1} text-4xl mb-4`}>PICK A LEAGUE</h2>
            <p className="text-[#64748B] mb-8">{state} • Tier {tier}</p>
            {availableLeagues.length === 0 ? (
              <div className={`${css.panel} p-8 text-center text-[#64748B]`}>No leagues at this tier in {state}. <button className="text-[#E89A4A] underline" onClick={()=>setStep(1)}>Pick a different tier</button>.</div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {availableLeagues.map(l => (
                  <button key={l.key} onClick={()=>{setLeagueKey(l.key); setClubId(null); setStep(3);}} className={`${css.panelHover} p-5 text-left flex items-center justify-between`}>
                    <div>
                      <div className="text-xs text-[#64748B] uppercase tracking-widest">Tier {l.tier}</div>
                      <div className={`${css.h1} text-2xl mt-1`}>{l.short}</div>
                      <div className="text-sm text-[#0F172A]">{l.name}</div>
                      <div className="text-[12px] text-[#64748B] mt-1">{l.clubs.length} clubs</div>
                    </div>
                    <ChevronRight className="w-6 h-6 text-[#E89A4A]" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="fade-up">
            <button onClick={()=>setStep(2)} className="text-[#64748B] text-sm mb-4 hover:text-[#0F172A] flex items-center gap-1"><ChevronLeft className="w-4 h-4" />Back</button>
            <h2 className={`${css.h1} text-4xl mb-4`}>CHOOSE YOUR CLUB</h2>
            <p className="text-[#64748B] mb-8">{PYRAMID[leagueKey].name}</p>
            <div className="grid md:grid-cols-3 gap-4">
              {availableClubs.map(c => (
                <button key={c.id} onClick={()=>{setClubId(c.id); setStep(4);}} className={`${css.panelHover} p-5 text-left`}>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center font-['Bebas_Neue'] text-xl" style={{ background: `linear-gradient(135deg, ${c.colors[0]}, ${c.colors[1]})`, color: c.colors[2] }}>{c.short}</div>
                    <div>
                      <div className="font-bold text-[#0F172A]">{c.name}</div>
                      <div className="text-[11px] text-[#64748B]">{c.state}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 4 && clubId && leagueKey && findClub(clubId) && (
          <div className="fade-up max-w-xl">
            <button onClick={()=>{ setClubId(null); setStep(3); }} disabled={loading} className="text-[#64748B] text-sm mb-4 hover:text-[#0F172A] flex items-center gap-1"><ChevronLeft className="w-4 h-4" />Back</button>
            <h2 className={`${css.h1} text-4xl mb-4`}>YOUR DETAILS</h2>
            <div className={`${css.panel} p-6 mb-4`}>
              {(() => { const c = findClub(clubId); return (
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-xl flex items-center justify-center font-['Bebas_Neue'] text-2xl" style={{ background: `linear-gradient(135deg, ${c.colors[0]}, ${c.colors[1]})`, color: c.colors[2] }}>{c.short}</div>
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-[#64748B]">Appointed at</div>
                  <div className="font-bold text-xl">{c.name}</div>
                  <div className="text-[12px] text-[#64748B]">{PYRAMID[leagueKey].name}</div>
                </div>
              </div>
              ); })()}
              <label className={css.label}>Manager Name</label>
              <input value={managerName} onChange={(e)=>setManagerName(e.target.value)} placeholder="Bluey McGee" className="w-full mt-2 bg-[#F8FAFC] border border-[#E2E8F0] focus:border-[#E89A4A] outline-none rounded-lg px-4 py-3 text-[#0F172A]" disabled={loading} />
            </div>
            <button onClick={start} disabled={loading} className={`${css.btnPrimary} w-full text-lg py-4 ${loading ? 'opacity-70' : 'glow'}`}>
              {loading ? '⏳ Starting career…' : 'START CAREER →'}
            </button>
          </div>
        )}
      </div>
      <div className="border-t border-[#E2E8F0] p-4 text-center text-[10px] text-[#64748B] uppercase tracking-widest">A Football Manager-style game for Australian rules</div>
    </div>
  );
}


// ============================================================================
// SIDEBAR + TOPBAR
// ============================================================================
function Sidebar({ screen, setScreen, club, league, career, myLadderPos, onNewGame }) {
  const season = career.season;
  const week   = career.week;
  const phase  = career.phase || 'preseason';
  const items = [
    { key: "hub",      label: "Hub",        icon: Home,      desc: "Overview" },
    { key: "squad",    label: "Squad",       icon: Users,     desc: "Players & Tactics" },
    { key: "schedule", label: "Schedule",    icon: Calendar,  desc: "Calendar & Fixtures" },
    { key: "club",     label: "Club",        icon: Building2, desc: "Finances & Ops" },
    { key: "recruit",  label: "Recruit",     icon: Repeat,    desc: "Trade & Draft" },
    { key: "compete",  label: "Competition", icon: Trophy,    desc: "Ladder & Fixtures" },
  ];
  return (
    <aside className="w-64 flex flex-col sticky top-0 h-screen shrink-0" style={{background:"#1E293B", borderRight:"1px solid #293548"}}>
      {/* Brand */}
      <div className="px-5 py-4" style={{borderBottom:"1px solid #293548"}}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{background:"linear-gradient(135deg,#E89A4A,#D07A2A)", boxShadow:"0 4px 12px #E89A4A33"}}>
            <Trophy className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="font-['Bebas_Neue'] text-[26px] tracking-[0.1em] leading-none text-white">DYNASTY</div>
            <div className="text-[9px] text-[#64748B] uppercase tracking-[0.25em] mt-0.5 text-slate-400">Footy Manager</div>
          </div>
        </div>
      </div>

      {/* Club identity card */}
      <div className="px-4 py-3" style={{borderBottom:"1px solid #293548"}}>
        <div className="rounded-2xl overflow-hidden" style={{background:"linear-gradient(135deg,#FFFFFF,#F1F5F9)"}}>
          <div className="h-1.5 w-full" style={{background:`linear-gradient(90deg, ${club.colors[0]}, ${club.colors[1]})`}} />
          <div className="p-3">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center font-['Bebas_Neue'] text-xl flex-shrink-0"
                style={{background:`linear-gradient(135deg,${club.colors[0]},${club.colors[1]})`, color:club.colors[2], boxShadow:`0 4px 12px ${club.colors[0]}44`}}>
                {club.short}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-bold text-sm truncate text-white leading-tight">{club.name}</div>
                <div className="text-[10px] mt-0.5" style={{color: club.colors[0] === '#FFFFFF' ? '#E89A4A' : club.colors[0]}}>{league.short}</div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-1 text-center">
              {[["SEASON", season], [phase === 'preseason' ? "PHASE" : "ROUND", phase === 'preseason' ? "PRE" : week], ["POS", myLadderPos||"—"]].map(([l,v])=>(
                <div key={l} className="rounded-lg py-1.5" style={{background:"#F1F5F9"}}>
                  <div className="text-[8px] text-[#64748B] uppercase tracking-widest font-bold">{l}</div>
                  <div className="font-['Bebas_Neue'] text-xl text-[#E89A4A] leading-tight">{v}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="p-3 flex-1 space-y-0.5 overflow-y-auto">
        {items.map(it => {
          const Icon = it.icon;
          const active = screen === it.key;
          return (
            <button key={it.key} onClick={()=>setScreen(it.key)}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all group`}
              style={active
                ? {background:"linear-gradient(135deg,#E89A4A22,#E89A4A08)", border:"1px solid #E89A4A50", color:"#E89A4A"}
                : {border:"1px solid transparent", color:"#7C93AB"}}>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all`}
                style={active ? {background:"#E89A4A22", color:"#E89A4A"} : {}}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="text-left min-w-0">
                <div className={`text-sm font-bold leading-tight ${active ? "text-[#E89A4A]" : "text-[#334155] group-hover:text-white"}`}>{it.label}</div>
                <div className="text-[9px] truncate" style={{color: active ? "#E89A4A88" : "#94A3B8"}}>{it.desc}</div>
              </div>
              {active && <ChevronRight className="w-3.5 h-3.5 ml-auto flex-shrink-0 text-[#E89A4A]" />}
            </button>
          );
        })}
      </nav>
      <div className="px-4 py-3 space-y-2" style={{borderTop:"1px solid #293548"}}>
        <button onClick={onNewGame} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[#94A3B8] hover:text-[#E84A6F] hover:bg-[#E84A6F10] transition text-xs font-bold uppercase tracking-widest">
          <RefreshCw className="w-3.5 h-3.5" /> New Career
        </button>
        <div className="text-[9px] text-[#475569] text-center uppercase tracking-widest">Footy Dynasty v2.0</div>
      </div>
    </aside>
  );
}

function TopBar({ career, club, league, myLadderPos, onAdvance }) {
  const nextEv = (career.eventQueue || []).find(e => !e.completed);
  const phaseColors = { preseason: '#4ADBE8', season: '#E89A4A', finals: '#E84A6F', offseason: '#A78BFA' };
  const phaseLabel  = { preseason: 'Pre-Season', season: 'Season', finals: 'Finals', offseason: 'Off-Season' };
  const phase = career.phase || 'preseason';

  let nextLabel = 'End of Season';
  let nextIcon  = null;
  if (career.inFinals) {
    nextLabel = 'Finals Match';
    nextIcon  = '🏆';
  } else if (nextEv) {
    if (nextEv.type === 'training') {
      const info = TRAINING_INFO[nextEv.subtype] || {};
      nextLabel = info.name || 'Training';
      nextIcon  = info.icon || '🏋️';
    } else if (nextEv.type === 'key_event') {
      nextLabel = nextEv.name;
      nextIcon  = '📅';
    } else if (nextEv.type === 'preseason_match') {
      nextLabel = nextEv.label;
      nextIcon  = '⚽';
    } else if (nextEv.type === 'round') {
      const myMatch = (nextEv.matches || []).find(m => m.home === career.clubId || m.away === career.clubId);
      if (myMatch) {
        const isHome = myMatch.home === career.clubId;
        const opp = findClub(isHome ? myMatch.away : myMatch.home);
        nextLabel = `Rd ${nextEv.round}: ${isHome ? 'vs' : '@'} ${opp?.short || ''}`;
        nextIcon  = '🏉';
      } else {
        nextLabel = `Round ${nextEv.round}`;
        nextIcon  = '🏉';
      }
    }
  }

  return (
    <header className="sticky top-0 z-20 px-6 py-0" style={{background:"rgba(255,255,255,0.97)", backdropFilter:"blur(12px)", borderBottom:"1px solid #E2E8F0", boxShadow:"0 1px 3px rgba(0,0,0,0.06)"}}>
      <div className="flex items-center justify-between max-w-[1400px] mx-auto h-16">
        {/* Left: date + phase + finance stats */}
        <div className="flex items-center gap-0">
          {/* Date + phase */}
          <div className="pr-4 mr-2" style={{borderRight:"1px solid #F1F5F9"}}>
            <div className="text-[10px] font-bold uppercase tracking-widest" style={{color: phaseColors[phase]}}>{phaseLabel[phase]}</div>
            <div className="font-['Bebas_Neue'] text-lg leading-tight text-[#0F172A]">{career.currentDate ? formatDate(career.currentDate) : '—'}</div>
          </div>
          {[
            { label: "Cash",     value: fmtK(career.finance.cash),           color: "#4AE89A" },
            { label: "Transfer", value: fmtK(career.finance.transferBudget), color: "#4ADBE8" },
            { label: "Board",    value: career.finance.boardConfidence,       color: "#E89A4A", bar: true },
            { label: "Fans",     value: career.finance.fanHappiness,          color: "#A78BFA", bar: true },
          ].map(({ label, value, color, bar }) => (
            <div key={label} className="flex items-center px-4 h-full" style={{borderRight:"1px solid #F1F5F9"}}>
              <div>
                <div className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#64748B]">{label}</div>
                {bar ? (
                  <div className="flex items-center gap-2 mt-0.5">
                    <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{background:"#F1F5F9", border:"1px solid #E2E8F0"}}>
                      <div className="h-full rounded-full" style={{width:`${value}%`, background:`linear-gradient(90deg,${color}88,${color})`}} />
                    </div>
                    <span className="font-['Bebas_Neue'] text-lg leading-none" style={{color}}>{value}</span>
                  </div>
                ) : (
                  <div className="font-['Bebas_Neue'] text-xl leading-tight" style={{color}}>{value}</div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Right: next event + advance button */}
        <div className="flex items-center gap-3">
          <div className="text-right hidden md:block">
            <div className="text-[9px] font-bold uppercase tracking-widest text-[#94A3B8]">Next Event</div>
            <div className="text-sm font-semibold text-[#0F172A]">{nextIcon} {nextLabel}</div>
          </div>
          <button onClick={onAdvance} className={`${css.btnPrimary} flex items-center gap-2 text-sm glow`}>
            <Play className="w-4 h-4" /> ADVANCE
          </button>
        </div>
      </div>
    </header>
  );
}

// ============================================================================
// HUB SCREEN
// ============================================================================
function HubScreen({ career, club, league, myLadderPos, setScreen, onAdvance }) {
  const sorted = sortedLadder(career.ladder);
  const top5 = sorted.slice(0, 5);
  const myRow = sorted.find(r => r.id === career.clubId);
  const recentNews = (career.news || []).slice(0, 6);
  const wagesAnnual = career.squad.reduce((a, p) => a + p.wage, 0) + career.staff.reduce((a, s) => a + s.wage, 0);
  const sponsorsAnnual = career.sponsors.reduce((a, s) => a + s.annualValue, 0);
  const squadAvg = career.squad.length ? Math.round(career.squad.reduce((a, p) => a + p.overall, 0) / career.squad.length) : 0;
  const posColor = myLadderPos <= 2 ? "#4AE89A" : myLadderPos <= 5 ? "#E89A4A" : "#E84A6F";

  // Next 7 upcoming events
  const upcoming7 = (career.eventQueue || []).filter(e => !e.completed).slice(0, 7);

  // Last event display
  const lastEv = career.lastEvent;

  return (
    <div className="anim-in space-y-5">
      {/* Hero Banner */}
      <div className="rounded-2xl overflow-hidden relative" style={{minHeight:160, background:`linear-gradient(135deg, ${club.colors[0]}55 0%, #F1F5F9 60%)`, border:"1px solid #E2E8F0"}}>
        <div className="absolute inset-0" style={{background:`radial-gradient(ellipse at 80% 50%, ${club.colors[1]}18, transparent 65%)`}} />
        <div className="absolute right-6 top-0 bottom-0 flex items-center opacity-25">
          <Jersey kit={career.kits.home} size={200} />
        </div>
        <div className="relative z-10 p-6 flex items-end justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#64748B] mb-1">{league.name} · Season {career.season}</div>
            <h1 className="font-['Bebas_Neue'] text-5xl tracking-wide text-white leading-none">{club.name.toUpperCase()}</h1>
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              <Pill color="#E89A4A">Tier {league.tier}</Pill>
              {career.phase === 'preseason'
                ? <Pill color="#4ADBE8">Pre-Season {career.season}</Pill>
                : career.inFinals
                  ? <Pill color="#E84A6F">Finals</Pill>
                  : <Pill color="#4ADBE8">Round {career.week}</Pill>}
              <Pill color={posColor}>#{myLadderPos || "—"} on Ladder</Pill>
              {myRow && <Pill color="#64748B">{myRow.W}W {myRow.L}L {myRow.D}D</Pill>}
            </div>
          </div>
          <div className="hidden md:flex flex-col items-end gap-1">
            <div className="font-['Bebas_Neue'] text-7xl leading-none" style={{color: posColor}}>
              {myRow?.pts || 0}
            </div>
            <div className="text-[10px] text-[#64748B] uppercase tracking-widest">Points</div>
          </div>
        </div>
      </div>

      {/* Last Event Result Card */}
      {lastEv && (
        <div className={`${css.panel} p-4 anim-in`}>
          {lastEv.type === 'training' && (
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0" style={{background:'#F0FDF4', border:'1px solid #BBF7D0'}}>
                {TRAINING_INFO[lastEv.subtype]?.icon || '🏋️'}
              </div>
              <div className="flex-1">
                <div className={css.label}>Last Session</div>
                <div className="font-bold text-[#0F172A]">{lastEv.name} <span className="text-[#64748B] font-normal text-sm">· {formatDate(lastEv.date)}</span></div>
                <div className="text-xs text-[#64748B] mt-1">Led by {lastEv.staffName} (Rating: {lastEv.staffRating}) · Gains:&nbsp;
                  {Object.entries(lastEv.gains || {}).map(([k, v]) => `${k} +${v}`).join(', ') || '—'}
                </div>
                {lastEv.devNotes && lastEv.devNotes.length > 0 && (
                  <div className="text-xs text-[#4ADE80] mt-1 leading-relaxed">
                    {lastEv.devNotes.join(' · ')}
                  </div>
                )}
              </div>
            </div>
          )}
          {lastEv.type === 'key_event' && (
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0" style={{background:'#EFF6FF', border:'1px solid #BFDBFE'}}>📅</div>
              <div className="flex-1">
                <div className={css.label}>Event</div>
                <div className="font-bold text-[#0F172A]">{lastEv.name}</div>
                <div className="text-xs text-[#64748B] mt-1">{lastEv.description}</div>
              </div>
              {lastEv.action && (
                <button onClick={() => setScreen(lastEv.action)} className={css.btnPrimary + ' text-xs'}>Go →</button>
              )}
            </div>
          )}
          {(lastEv.type === 'round' || lastEv.type === 'preseason_match') && (
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0`}
                style={{background: lastEv.won ? '#F0FDF4' : lastEv.drew ? '#FFFBEB' : '#FEF2F2', border: `1px solid ${lastEv.won ? '#BBF7D0' : lastEv.drew ? '#FDE68A' : '#FECACA'}`}}>
                {lastEv.won ? '✅' : lastEv.drew ? '🤝' : '❌'}
              </div>
              <div className="flex-1">
                <div className={css.label}>{lastEv.type === 'preseason_match' ? lastEv.label : `Round ${lastEv.round}`}</div>
                <div className="font-bold text-[#0F172A]">
                  {lastEv.isHome ? 'vs' : '@'} {lastEv.opp?.name}
                  <span className="ml-3 font-['Bebas_Neue'] text-xl" style={{color: lastEv.won ? '#4AE89A' : lastEv.drew ? '#E89A4A' : '#E84A6F'}}>
                    {lastEv.myTotal} – {lastEv.oppTotal}
                  </span>
                </div>
                <div className="text-xs text-[#64748B] mt-1">{formatDate(lastEv.date)} · {lastEv.won ? 'Win' : lastEv.drew ? 'Draw' : 'Loss'}</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Upcoming Events Strip */}
      {upcoming7.length > 0 && (
        <div className={css.panel}>
          <div className="px-4 pt-4 pb-2 flex items-center justify-between">
            <h3 className="font-['Bebas_Neue'] text-lg text-[#0F172A] tracking-wide">UPCOMING</h3>
            <button onClick={() => setScreen('schedule')} className="text-[11px] font-bold text-[#E89A4A] uppercase tracking-wider hover:text-[#F0A558]">Full calendar →</button>
          </div>
          <div className="flex gap-2 px-4 pb-4 overflow-x-auto">
            {upcoming7.map((ev, i) => {
              const isMatch = ev.type === 'round' || ev.type === 'preseason_match';
              const isTraining = ev.type === 'training';
              const isKey = ev.type === 'key_event';
              const info = isTraining ? TRAINING_INFO[ev.subtype] : null;
              const color = isMatch ? '#E89A4A' : isKey ? '#4ADBE8' : (info?.color || '#94A3B8');
              let evLabel = '';
              if (isMatch && ev.type === 'round') {
                const m = (ev.matches || []).find(m2 => m2.home === career.clubId || m2.away === career.clubId);
                const opp2 = m ? findClub(m.home === career.clubId ? m.away : m.home) : null;
                evLabel = opp2 ? `Rd ${ev.round} ${opp2.short}` : `Rd ${ev.round}`;
              } else if (ev.type === 'preseason_match') {
                const oppId = ev.homeId === career.clubId ? ev.awayId : ev.homeId;
                evLabel = findClub(oppId)?.short || ev.label;
              } else if (isTraining) {
                evLabel = info?.name || ev.subtype;
              } else {
                evLabel = ev.name || 'Event';
              }
              return (
                <div key={ev.id} className="flex-shrink-0 rounded-xl p-3 text-center min-w-[88px]" style={{background:`${color}10`, border:`1px solid ${color}30`}}>
                  <div className="text-[9px] font-bold uppercase tracking-wider" style={{color}}>{formatDate(ev.date).split(' ').slice(0,-1).join(' ')}</div>
                  <div className="text-lg mt-1">{isTraining ? (info?.icon || '🏋️') : isKey ? '📅' : '🏉'}</div>
                  <div className="text-[10px] font-semibold text-[#0F172A] mt-1 leading-tight">{evLabel}</div>
                </div>
              );
            })}
            <div className="flex-shrink-0 flex items-center justify-center min-w-[60px]">
              <button onClick={onAdvance} className="rounded-xl px-3 py-2 text-[11px] font-bold text-white flex flex-col items-center gap-1"
                style={{background:'linear-gradient(135deg,#E89A4A,#D07A2A)'}}>
                <Play className="w-4 h-4" />
                <span>Next</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Finals Banner */}
      {career.inFinals && (
        <div className="rounded-2xl p-4 flex items-center justify-between" style={{background:"linear-gradient(135deg,#E89A4A22,#FCD34D11)", border:"2px solid #E89A4A55"}}>
          <div className="flex items-center gap-3">
            <span className="text-3xl">🏆</span>
            <div>
              <div className="font-['Bebas_Neue'] text-2xl text-[#E89A4A]">FINALS MODE</div>
              <div className="text-sm text-[#64748B]">{(career.finalsAlive||[]).length} clubs remain · {finalsLabel(career.finalsRound||0, career.finalsTotalRounds||3)}</div>
            </div>
          </div>
          <div className="text-right">
            <div className="font-['Bebas_Neue'] text-xl text-[#E89A4A]">{(career.finalsAlive||[]).includes(career.clubId) ? "STILL ALIVE" : "SEASON OVER"}</div>
          </div>
        </div>
      )}

      {/* Premiership Banner */}
      {career.premiership === career.season - 1 && (
        <div className="rounded-2xl p-4 flex items-center gap-3" style={{background:"linear-gradient(135deg,#FCD34D22,#E89A4A11)", border:"2px solid #FCD34D55"}}>
          <span className="text-3xl">🎉</span>
          <div>
            <div className="font-['Bebas_Neue'] text-2xl text-[#E89A4A]">BACK-TO-BACK PREMIERS!</div>
            <div className="text-sm text-[#64748B]">Can you go three in a row this season?</div>
          </div>
        </div>
      )}

      {/* Stat Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Squad Rating" value={squadAvg} sub={`${career.squad.length} players`} accent="#E89A4A" icon={Users} />
        <Stat label="Cash" value={fmtK(career.finance.cash)} sub={`Wages ${fmtK(wagesAnnual)}/yr`} accent="#4AE89A" icon={DollarSign} />
        <Stat label="Sponsors" value={fmtK(sponsorsAnnual)} sub={`${career.sponsors.length} active deals`} accent="#4ADBE8" icon={Handshake} />
        <Stat label="Ladder Pos" value={`#${myLadderPos||"—"}`} sub={`${myRow?.w||0}W / ${myRow?.l||0}L`} accent={posColor} icon={Trophy} />
      </div>

      <div className="grid md:grid-cols-5 gap-5">
        {/* Ladder */}
        <div className={`${css.panel} md:col-span-3`}>
          <div className="flex items-center justify-between px-5 pt-5 pb-3">
            <h3 className="font-['Bebas_Neue'] text-xl tracking-wide text-white">LADDER</h3>
            <button onClick={()=>setScreen("compete")} className="text-[11px] font-bold text-[#E89A4A] uppercase tracking-wider hover:text-[#F0A558]">Full table →</button>
          </div>
          <div>
            {top5.map((row, i) => {
              const c = findClub(row.id);
              if (!c) return null;
              const isMe = row.id === career.clubId;
              const rankColor = i === 0 ? "#FFD700" : i === 1 ? "#C0C0C0" : i === 2 ? "#CD7F32" : "#94A3B8";
              return (
                <div key={row.id} className={`flex items-center gap-4 px-5 py-3 transition-colors ${isMe ? "" : "hover:bg-[#F8FAFC]/50"}`}
                  style={isMe ? {background:"linear-gradient(90deg,#E89A4A10,transparent)", borderLeft:"3px solid #E89A4A"} : {borderLeft:"3px solid transparent"}}>
                  <div className="font-['Bebas_Neue'] text-2xl w-6 text-center flex-shrink-0" style={{color: rankColor}}>{i+1}</div>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center font-['Bebas_Neue'] text-sm flex-shrink-0"
                    style={{background:`linear-gradient(135deg,${c.colors[0]},${c.colors[1]})`, color:c.colors[2]}}>
                    {c.short}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`font-bold text-sm truncate ${isMe ? "text-[#E89A4A]" : "text-white"}`}>{c.name}</div>
                    <div className="text-[10px] text-[#64748B]">{row.W}W {row.L}L {row.D}D</div>
                  </div>
                  <div className="text-right">
                    <div className="font-['Bebas_Neue'] text-2xl text-[#E89A4A]">{row.pts}</div>
                    <div className="text-[10px] text-[#64748B]">pts</div>
                  </div>
                </div>
              );
            })}
            {myLadderPos > 5 && myRow && (
              <>
                <div className="px-5 py-1 text-[#94A3B8] text-xs">· · ·</div>
                <div className="flex items-center gap-4 px-5 py-3"
                  style={{background:"linear-gradient(90deg,#E89A4A10,transparent)", borderLeft:"3px solid #E89A4A"}}>
                  <div className="font-['Bebas_Neue'] text-2xl w-6 text-center text-[#E89A4A]">{myLadderPos}</div>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center font-['Bebas_Neue'] text-sm"
                    style={{background:`linear-gradient(135deg,${club.colors[0]},${club.colors[1]})`, color:club.colors[2]}}>
                    {club.short}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm text-[#E89A4A]">{club.name}</div>
                    <div className="text-[10px] text-[#64748B]">{myRow.W}W {myRow.L}L {myRow.D}D</div>
                  </div>
                  <div className="text-right">
                    <div className="font-['Bebas_Neue'] text-2xl text-[#E89A4A]">{myRow.pts}</div>
                    <div className="text-[10px] text-[#64748B]">pts</div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* News */}
        <div className={`${css.panel} p-5 md:col-span-2`}>
          <div className="flex items-center gap-2 mb-4">
            <Newspaper className="w-4 h-4 text-[#E89A4A]" />
            <h3 className="font-['Bebas_Neue'] text-xl tracking-wide text-white">NEWS</h3>
          </div>
          <div className="space-y-2">
            {recentNews.length === 0 && <div className="text-sm text-[#64748B] py-4 text-center">No news yet.</div>}
            {recentNews.map((n, i) => {
              const c = n.type === "win" ? "#4AE89A" : n.type === "loss" ? "#E84A6F" : n.type === "info" ? "#4ADBE8" : "#64748B";
              return (
                <div key={i} className="flex gap-3 p-3 rounded-xl" style={{background:"#F1F5F9", border:"1px solid #E2E8F0"}}>
                  <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{background: c, boxShadow:`0 0 6px ${c}`}} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-white leading-snug">{n.text}</div>
                    <div className="text-[9px] text-[#94A3B8] uppercase tracking-widest mt-0.5 font-bold">{n.week === 0 ? 'Pre-Season' : `Round ${n.week}`}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Board Pressure */}
      {career.finance.boardConfidence < 35 && (
        <div className="rounded-2xl p-4 flex items-center gap-3" style={{background:"#FEF2F2", border:"1.5px solid #FECACA"}}>
          <span className="text-2xl">⚠️</span>
          <div>
            <div className="font-bold text-sm text-[#DC2626]">Board On Notice — Confidence {career.finance.boardConfidence}%</div>
            <div className="text-xs text-[#EF4444]">Win your next match or face consequences. The board is watching closely.</div>
          </div>
        </div>
      )}

      {/* Contract Expiry Warnings */}
      {(() => {
        const expiring = career.squad.filter(p => (career.lineup || []).includes(p.id) && p.contract <= 1);
        if (!expiring.length) return null;
        return (
          <div className="rounded-2xl p-4 flex items-start gap-3" style={{background:"#FFFBEB", border:"1.5px solid #FDE68A"}}>
            <span className="text-2xl flex-shrink-0">📋</span>
            <div>
              <div className="font-bold text-sm text-[#D97706]">Contracts Expiring — Act Now</div>
              <div className="text-xs text-[#92400E] mt-1">
                {expiring.map(p => `${p.firstName} ${p.lastName} (${p.contract === 0 ? 'Out of contract' : '1 year left'})`).join(' · ')}
              </div>
              <button onClick={() => setScreen('squad')} className="mt-2 text-xs font-bold text-[#D97706] hover:text-[#B45309]">Manage contracts →</button>
            </div>
          </div>
        );
      })()}

      {/* Quick links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: Users,    label: "Manage Squad",  sub: "Players & lineup", screen: "squad", color: "#E89A4A" },
          { icon: Dumbbell, label: "Set Training",  sub: "Intensity & focus", screen: "squad", color: "#4ADBE8" },
          { icon: Building2,label: "Upgrade Club",  sub: "Facilities & staff", screen: "club",  color: "#4AE89A" },
          { icon: Repeat,   label: "Trade & Draft", sub: "Signings & youth",   screen: "recruit",color: "#E84A6F" },
        ].map(q => {
          const Icon = q.icon;
          return (
            <button key={q.label} onClick={()=>setScreen(q.screen)}
              className="rounded-2xl p-4 text-left flex items-center gap-4 transition-all group"
              style={{background:"#FFFFFF", border:"1px solid #E2E8F0"}}
              onMouseEnter={e=>{e.currentTarget.style.borderColor=q.color+"66"; e.currentTarget.style.background="#F8FAFC";}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor="#E2E8F0"; e.currentTarget.style.background="#FFFFFF";}}>
              <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{background:`${q.color}18`, color:q.color}}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-sm text-white truncate">{q.label}</div>
                <div className="text-[10px] text-[#64748B]">{q.sub}</div>
              </div>
              <ChevronRight className="w-4 h-4 text-[#94A3B8] flex-shrink-0" />
            </button>
          );
        })}
      </div>
    </div>
  );
}


// ============================================================================
// SCHEDULE SCREEN — month calendar grid with event dots
// ============================================================================
function ScheduleScreen({ career, club, league }) {
  const startDate = career.currentDate || `${career.season - 1}-12-01`;
  const [viewDate, setViewDate] = React.useState(startOfMonth(startDate));

  const allEvents = career.eventQueue || [];
  const eventsByDate = {};
  allEvents.forEach(ev => {
    if (!eventsByDate[ev.date]) eventsByDate[ev.date] = [];
    eventsByDate[ev.date].push(ev);
  });

  const monthStart = startOfMonth(viewDate);
  const firstDow   = getDayOfWeek(monthStart); // 0=Sun
  const totalDays  = daysInMonth(viewDate);
  const cells      = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= totalDays; d++) {
    const y = viewDate.slice(0, 4);
    const m = viewDate.slice(5, 7);
    cells.push(`${y}-${m}-${String(d).padStart(2, '0')}`);
  }

  const today  = career.currentDate || startDate;
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Upcoming events list
  const upcoming = allEvents.filter(e => !e.completed && e.date >= today).slice(0, 15);

  function evDot(ev) {
    if (ev.type === 'training')        return { color: TRAINING_INFO[ev.subtype]?.color || '#94A3B8', icon: TRAINING_INFO[ev.subtype]?.icon || '🏋️', label: TRAINING_INFO[ev.subtype]?.name || ev.subtype };
    if (ev.type === 'key_event')       return { color: '#4ADBE8', icon: '📅', label: ev.name };
    if (ev.type === 'preseason_match') return { color: '#E84A6F', icon: '⚽', label: ev.label };
    if (ev.type === 'round') {
      const m = (ev.matches || []).find(m2 => m2.home === career.clubId || m2.away === career.clubId);
      const opp = m ? findClub(m.home === career.clubId ? m.away : m.home) : null;
      return { color: '#E89A4A', icon: '🏉', label: opp ? `Rd ${ev.round} vs ${opp.short}` : `Rd ${ev.round}` };
    }
    return { color: '#94A3B8', icon: '●', label: 'Event' };
  }

  return (
    <div className="anim-in space-y-5">
      <div className="flex items-center justify-between">
        <h1 className={`${css.h1} text-3xl`}>SEASON CALENDAR</h1>
        <div className="flex items-center gap-2">
          <button onClick={() => setViewDate(prevMonth(viewDate))} className={css.btnGhost + ' px-3 py-2'}><ChevronLeft className="w-4 h-4" /></button>
          <span className="font-['Bebas_Neue'] text-xl tracking-wide text-[#0F172A] min-w-[180px] text-center">{formatMonth(viewDate)}</span>
          <button onClick={() => setViewDate(nextMonth(viewDate))} className={css.btnGhost + ' px-3 py-2'}><ChevronRight className="w-4 h-4" /></button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Calendar grid */}
        <div className={`${css.panel} lg:col-span-2 p-4`}>
          <div className="grid grid-cols-7 mb-2">
            {dayNames.map(d => (
              <div key={d} className="text-center text-[10px] font-bold uppercase tracking-widest text-[#94A3B8] py-1">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {cells.map((dateStr, i) => {
              if (!dateStr) return <div key={`empty-${i}`} />;
              const dayEvs  = eventsByDate[dateStr] || [];
              const isToday = dateStr === today;
              const isPast  = dateStr < today;
              return (
                <div key={dateStr}
                  className={`rounded-lg p-1.5 min-h-[64px] transition-all ${isToday ? 'ring-2 ring-[#E89A4A]' : ''}`}
                  style={{background: isToday ? '#FFF7ED' : isPast && dayEvs.length ? '#F8FAFC' : '#FFFFFF', border: '1px solid #F1F5F9'}}>
                  <div className={`text-[11px] font-bold mb-1 ${isToday ? 'text-[#E89A4A]' : isPast ? 'text-[#CBD5E1]' : 'text-[#475569]'}`}>
                    {dateStr.slice(8)}
                  </div>
                  <div className="flex flex-col gap-0.5">
                    {dayEvs.slice(0, 3).map((ev, ei) => {
                      const dot = evDot(ev);
                      return (
                        <div key={ei} className="rounded text-[8px] font-bold px-1 py-0.5 truncate leading-tight"
                          style={{background: `${dot.color}18`, color: dot.color, opacity: ev.completed ? 0.4 : 1}}>
                          {dot.icon} {dot.label}
                        </div>
                      );
                    })}
                    {dayEvs.length > 3 && (
                      <div className="text-[8px] text-[#94A3B8] px-1">+{dayEvs.length - 3} more</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-3 mt-4 pt-3" style={{borderTop:'1px solid #F1F5F9'}}>
            {[
              { color: '#4ADE80', label: 'Ball Skills' },
              { color: '#60A5FA', label: 'Running' },
              { color: '#A78BFA', label: 'Tactics' },
              { color: '#F97316', label: 'Gym' },
              { color: '#E89A4A', label: 'Match Day' },
              { color: '#E84A6F', label: 'Pre-Season Match' },
              { color: '#4ADBE8', label: 'Key Event' },
            ].map(({ color, label }) => (
              <div key={label} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{background: color}} />
                <span className="text-[10px] text-[#64748B]">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming events list */}
        <div className={`${css.panel} p-4`}>
          <h3 className="font-['Bebas_Neue'] text-lg text-[#0F172A] tracking-wide mb-3">UPCOMING EVENTS</h3>
          <div className="space-y-2">
            {upcoming.length === 0 && <div className="text-sm text-[#64748B] py-4 text-center">No more events this season.</div>}
            {upcoming.map(ev => {
              const dot = evDot(ev);
              return (
                <div key={ev.id} className="flex items-start gap-3 p-3 rounded-xl" style={{background:'#F8FAFC', border:'1px solid #F1F5F9'}}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base flex-shrink-0" style={{background:`${dot.color}18`}}>
                    {dot.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] font-bold uppercase tracking-widest" style={{color: dot.color}}>{formatDate(ev.date)}</div>
                    <div className="text-sm font-semibold text-[#0F172A] leading-tight truncate">{dot.label}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}


// ============================================================================
// SEASON SUMMARY SCREEN
// ============================================================================
function SeasonSummaryScreen({ summary, club, onContinue }) {
  const posColor   = summary.position <= 1 ? '#FFD700' : summary.position <= 4 ? '#4AE89A' : summary.position <= summary.totalTeams / 2 ? '#E89A4A' : '#E84A6F';
  const tierColors = { 1: '#E84A6F', 2: '#E89A4A', 3: '#4ADBE8' };
  const tierColor  = tierColors[summary.leagueTier] || '#E89A4A';

  let outcomeText  = `Finished ${summary.position}${summary.position===1?'st':summary.position===2?'nd':summary.position===3?'rd':'th'} of ${summary.totalTeams}`;
  let outcomeIcon  = summary.champion ? '🏆' : summary.promoted ? '⬆️' : summary.relegated ? '⬇️' : summary.position <= 4 ? '✅' : '📊';
  let outcomeSub   = summary.champion   ? 'PREMIERS — ' + summary.leagueShort + ' Champions!'
    : summary.promoted  ? `Promoted to the next division`
    : summary.relegated ? `Relegated — bounce back next season`
    : outcomeText;

  const AwardCard = ({ icon, label, name, stat, sub }) => (
    <div className="rounded-2xl p-4 flex items-center gap-4" style={{background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)'}}>
      <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
        style={{background:'rgba(232,154,74,0.15)', border:'1px solid rgba(232,154,74,0.3)'}}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400">{label}</div>
        <div className="font-bold text-white truncate">{name || '—'}</div>
        <div className="text-sm font-['Bebas_Neue'] text-[#E89A4A]">{stat}</div>
      </div>
      {sub && <div className="text-[10px] text-slate-500 text-right leading-tight">{sub}</div>}
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col" style={{background:'linear-gradient(160deg,#0F172A 0%,#1E293B 100%)'}}>
      {/* Header */}
      <div className="text-center px-6 py-10" style={{borderBottom:'1px solid rgba(255,255,255,0.08)'}}>
        <div className="text-5xl mb-4">{outcomeIcon}</div>
        <div className="text-[11px] font-bold uppercase tracking-[0.3em] mb-2" style={{color: tierColor}}>{summary.leagueName} · Season {summary.season}</div>
        <div className="font-['Bebas_Neue'] text-6xl leading-none text-white mb-2">{summary.leagueShort} {summary.season}</div>
        <div className="font-bold text-xl" style={{color: posColor}}>{outcomeSub}</div>

        {/* Season record strip */}
        <div className="flex items-center justify-center gap-6 mt-8">
          {[
            { label: 'Position', value: `#${summary.position}`, color: posColor },
            { label: 'Wins',     value: summary.W,  color: '#4AE89A' },
            { label: 'Losses',   value: summary.L,  color: '#E84A6F' },
            { label: 'Draws',    value: summary.D,  color: '#E89A4A' },
            { label: 'Points',   value: summary.pts, color: '#A78BFA' },
            { label: 'Pct',      value: `${summary.pct}%`, color: '#4ADBE8' },
          ].map(({ label, value, color }) => (
            <div key={label} className="text-center">
              <div className="font-['Bebas_Neue'] text-4xl leading-none" style={{color}}>{value}</div>
              <div className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mt-1">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Awards */}
      <div className="flex-1 px-6 py-8 max-w-2xl mx-auto w-full space-y-3">
        <div className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-400 mb-4">Season Awards</div>

        {summary.champion && (
          <div className="rounded-2xl p-4 text-center mb-4" style={{background:'linear-gradient(135deg,rgba(255,215,0,0.15),rgba(232,154,74,0.1))', border:'2px solid rgba(255,215,0,0.4)'}}>
            <div className="text-4xl mb-2">🏆</div>
            <div className="font-['Bebas_Neue'] text-3xl text-[#FFD700]">PREMIERS!</div>
            <div className="text-sm text-slate-300 mt-1">{club.name} are the {summary.season} {summary.leagueShort} Champions</div>
          </div>
        )}

        <AwardCard
          icon="🥇" label="Best & Fairest"
          name={summary.baf?.name}
          stat={summary.baf ? `${summary.baf.overall} OVR · ${summary.baf.games} games` : '—'}
        />
        <AwardCard
          icon="⚽" label="Top Goal Kicker"
          name={summary.topScorer?.name}
          stat={summary.topScorer ? `${summary.topScorer.goals} goals` : '—'}
          sub={summary.topScorer ? `${summary.topScorer.games} games` : null}
        />
        <AwardCard
          icon="🤝" label="Disposal King"
          name={summary.topDisposal?.name}
          stat={summary.topDisposal ? `${summary.topDisposal.disposals} disposals` : '—'}
          sub={summary.topDisposal ? `${summary.topDisposal.games} games` : null}
        />

        {(summary.promoted || summary.relegated) && (
          <div className="rounded-2xl p-4 mt-2" style={{background: summary.promoted ? 'rgba(74,232,154,0.1)' : 'rgba(232,74,111,0.1)', border: `1px solid ${summary.promoted ? 'rgba(74,232,154,0.3)' : 'rgba(232,74,111,0.3)'}`}}>
            <div className="font-bold text-base" style={{color: summary.promoted ? '#4AE89A' : '#E84A6F'}}>
              {summary.promoted ? '⬆️ Promoted!' : '⬇️ Relegated'}
            </div>
            <div className="text-sm text-slate-400 mt-1">
              {summary.promoted ? 'A new challenge awaits in the division above.' : 'Time to rebuild and fight back up.'}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-6" style={{borderTop:'1px solid rgba(255,255,255,0.08)'}}>
        <div className="max-w-2xl mx-auto">
          <button onClick={onContinue}
            className="w-full py-4 rounded-2xl font-['Bebas_Neue'] text-xl tracking-widest text-white transition-all"
            style={{background:'linear-gradient(135deg,#E89A4A,#D07A2A)', boxShadow:'0 4px 20px rgba(232,154,74,0.4)'}}>
            START SEASON {summary.season + 1} →
          </button>
        </div>
      </div>
    </div>
  );
}


// ============================================================================
// MATCH DAY SCREEN — quarter-by-quarter visual scoreboard
// ============================================================================
function MatchDayScreen({ result, league, career, club, onContinue }) {
  const [revealed, setRevealed] = React.useState(0);

  const quarters = result.quarters || [];
  const qLabels  = ['Q1', 'Q2', 'Q3', 'Q4'];

  // Cumulative scores per quarter
  const cumHome = [], cumAway = [];
  let hG = 0, hB = 0, aG = 0, aB = 0;
  quarters.forEach(q => {
    hG += q.homeGoals;   hB += q.homeBehinds;
    aG += q.awayGoals;   aB += q.awayBehinds;
    cumHome.push({ g: hG, b: hB, total: hG * 6 + hB });
    cumAway.push({ g: aG, b: aB, total: aG * 6 + aB });
  });

  const homeClub = result.isHome ? club : result.opp;
  const awayClub = result.isHome ? result.opp : club;
  const myColor  = club.colors[0] || '#E89A4A';
  const oppColor = result.opp?.colors?.[0] || '#64748B';

  const won  = result.won;
  const drew = result.drew;
  const resultLabel = won ? 'WIN' : drew ? 'DRAW' : 'LOSS';
  const resultColor = won ? '#4AE89A' : drew ? '#E89A4A' : '#E84A6F';

  // AFL-tier commentary lines
  const commentary = result.isAFL ? [
    won  ? `${club.name} put in a dominant performance today.` : drew ? `An even contest — both sides had their chances.` : `A tough day at the office for ${club.name}.`,
    result.myTotal > 80 ? 'The forward line was electric, converting at a high rate.' : result.myTotal > 60 ? 'A solid if unremarkable offensive effort.' : 'The team struggled to convert inside 50.',
    won && result.myTotal - result.oppTotal > 30 ? 'It was never in doubt from the third quarter on.' : won ? 'They held on for a hard-fought victory.' : '',
    result.isPreseason ? 'Pre-season result — ladders unaffected.' : `${league.short} Round ${result.label.replace('Round ', '')}.`,
  ].filter(Boolean) : [];

  return (
    <div className="min-h-screen flex flex-col" style={{background:'linear-gradient(160deg, #0F172A 0%, #1E293B 100%)'}}>
      {/* Header */}
      <div className="px-6 py-5 text-center" style={{borderBottom:'1px solid rgba(255,255,255,0.08)'}}>
        <div className="text-[11px] font-bold uppercase tracking-[0.3em] mb-1" style={{color: result.isPreseason ? '#4ADBE8' : '#E89A4A'}}>
          {result.label} · {career.currentDate ? formatDate(career.currentDate) : ''}
          {result.isPreseason && ' · Pre-Season'}
        </div>

        {/* Teams */}
        <div className="flex items-center justify-center gap-6 mt-4">
          {/* Home */}
          <div className="text-center flex-1">
            <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center font-['Bebas_Neue'] text-2xl mb-2"
              style={{background:`linear-gradient(135deg,${homeClub?.colors?.[0]||'#E89A4A'},${homeClub?.colors?.[1]||'#D07A2A'})`,color:homeClub?.colors?.[2]||'#FFF'}}>
              {homeClub?.short}
            </div>
            <div className="text-white font-bold text-sm">{homeClub?.name}</div>
            <div className="text-[10px] text-slate-400 uppercase tracking-widest">HOME</div>
          </div>

          {/* Score */}
          <div className="text-center px-6">
            <div className="font-['Bebas_Neue'] text-6xl leading-none" style={{color: resultColor}}>
              {result.homeTotal} – {result.awayTotal}
            </div>
            <div className="text-[11px] font-bold uppercase tracking-widest mt-1" style={{color: resultColor}}>{resultLabel}</div>
          </div>

          {/* Away */}
          <div className="text-center flex-1">
            <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center font-['Bebas_Neue'] text-2xl mb-2"
              style={{background:`linear-gradient(135deg,${awayClub?.colors?.[0]||'#64748B'},${awayClub?.colors?.[1]||'#475569'})`,color:awayClub?.colors?.[2]||'#FFF'}}>
              {awayClub?.short}
            </div>
            <div className="text-white font-bold text-sm">{awayClub?.name}</div>
            <div className="text-[10px] text-slate-400 uppercase tracking-widest">AWAY</div>
          </div>
        </div>
      </div>

      {/* Quarter breakdown */}
      <div className="flex-1 px-6 py-6 max-w-2xl mx-auto w-full">
        <div className="mb-4">
          <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-3">Quarter by Quarter</div>
          {quarters.length === 0 && (
            <div className="text-slate-400 text-sm text-center py-4">No quarter data available.</div>
          )}
          <div className="space-y-3">
            {quarters.map((q, i) => {
              const isShowing = i < revealed || revealed === quarters.length;
              const hCum = cumHome[i] || { g: 0, b: 0, total: 0 };
              const aCum = cumAway[i] || { g: 0, b: 0, total: 0 };
              const qWinner = hCum.total > aCum.total ? 'home' : aCum.total > hCum.total ? 'away' : 'draw';
              return (
                <div key={i} className={`rounded-2xl p-4 transition-all duration-300 ${isShowing ? 'opacity-100' : 'opacity-0 translate-y-2'}`}
                  style={{background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)'}}>
                  <div className="flex items-center justify-between">
                    <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">{qLabels[i]}</div>
                    {isShowing && (
                      <div className="text-[10px] text-slate-500">
                        {q.homeGoals}.{q.homeBehinds} — {q.awayGoals}.{q.awayBehinds} (this qtr)
                      </div>
                    )}
                  </div>
                  {isShowing && (
                    <div className="flex items-center gap-4 mt-2">
                      <div className="text-right flex-1">
                        <span className="font-['Bebas_Neue'] text-3xl" style={{color: result.isHome ? myColor : oppColor}}>{hCum.total}</span>
                        <div className="text-[10px] text-slate-400">{hCum.g}.{hCum.b}</div>
                      </div>
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                        style={{background: qWinner === (result.isHome ? 'home' : 'away') ? '#4AE89A22' : '#64748B22', color: qWinner === (result.isHome ? 'home' : 'away') ? '#4AE89A' : '#64748B'}}>
                        {qWinner === 'draw' ? '=' : qWinner === (result.isHome ? 'home' : 'away') ? '▲' : '▼'}
                      </div>
                      <div className="text-left flex-1">
                        <span className="font-['Bebas_Neue'] text-3xl" style={{color: result.isHome ? oppColor : myColor}}>{aCum.total}</span>
                        <div className="text-[10px] text-slate-400">{aCum.g}.{aCum.b}</div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Reveal controls */}
          {quarters.length > 0 && revealed < quarters.length && (
            <button onClick={() => setRevealed(r => Math.min(r + 1, quarters.length))}
              className="mt-4 w-full rounded-xl py-3 text-sm font-bold uppercase tracking-widest transition-all"
              style={{background:'rgba(232,154,74,0.15)', color:'#E89A4A', border:'1px solid rgba(232,154,74,0.3)'}}>
              Show {qLabels[revealed]} →
            </button>
          )}
        </div>

        {/* AFL Commentary */}
        {result.isAFL && commentary.length > 0 && revealed === quarters.length && (
          <div className="rounded-2xl p-4 mt-2" style={{background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.06)'}}>
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-3">Match Commentary</div>
            <div className="space-y-2">
              {commentary.map((line, i) => (
                <div key={i} className="flex gap-2 text-sm text-slate-300">
                  <span className="text-[#E89A4A] flex-shrink-0">›</span>
                  <span>{line}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-5" style={{borderTop:'1px solid rgba(255,255,255,0.08)'}}>
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          {revealed < quarters.length && quarters.length > 0 ? (
            <button onClick={() => setRevealed(quarters.length)}
              className="flex-1 py-3 rounded-xl text-sm font-bold text-slate-400 uppercase tracking-widest"
              style={{border:'1px solid rgba(255,255,255,0.1)'}}>
              Skip to Full Time
            </button>
          ) : null}
          <button onClick={onContinue}
            className={`flex-1 py-3 rounded-xl font-bold uppercase tracking-widest text-white transition-all`}
            style={{background:`linear-gradient(135deg,${resultColor}CC,${resultColor})`, boxShadow:`0 4px 20px ${resultColor}44`}}>
            Continue →
          </button>
        </div>
      </div>
    </div>
  );
}


// ============================================================================
// SHARED TAB NAV
// ============================================================================
function TabNav({ tabs, active, onChange }) {
  return (
    <div className="flex gap-1 p-1 rounded-xl mb-5" style={{background:"#F1F5F9", border:"1px solid #E2E8F0"}}>
      {tabs.map(tb => {
        const Icon = tb.icon;
        const isActive = active === tb.key;
        return (
          <button key={tb.key} onClick={()=>onChange(tb.key)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all flex-1 justify-center"
            style={isActive
              ? {background:"linear-gradient(135deg,#E89A4A,#D07A2A)", color:"white", boxShadow:"0 2px 8px #E89A4A33"}
              : {color:"#64748B"}}>
            <Icon className="w-4 h-4" /><span>{tb.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// ============================================================================
// SQUAD SCREEN — players, tactics, training
// ============================================================================
function SquadScreen({ career, club, updateCareer, tab, setTab }) {
  const t = tab || "players";
  const tabs = [
    { key: "players", label: "Players", icon: Users },
    { key: "tactics", label: "Tactics", icon: Target },
    { key: "training", label: "Training", icon: Dumbbell },
  ];
  return (
    <div className="anim-in">
      <TabNav tabs={tabs} active={t} onChange={setTab} />
      {t === "players"  && <PlayersTab career={career} updateCareer={updateCareer} />}
      {t === "tactics"  && <TacticsTab career={career} updateCareer={updateCareer} />}
      {t === "training" && <TrainingTab career={career} updateCareer={updateCareer} />}
    </div>
  );
}

function PlayersTab({ career, updateCareer }) {
  const [sort, setSort] = useState("overall");
  const [filterPos, setFilterPos] = useState("ALL");
  const [selected, setSelected] = useState(null);
  const players = useMemo(() => {
    let arr = [...career.squad];
    if (filterPos !== "ALL") arr = arr.filter(p => p.position === filterPos);
    const name = p => p.firstName ? p.firstName+" "+p.lastName : (p.name||"");
    arr.sort((a,b) => sort === "overall" ? b.overall - a.overall : sort === "age" ? a.age - b.age : sort === "form" ? b.form - a.form : sort === "wage" ? b.wage - a.wage : name(a).localeCompare(name(b)));
    return arr;
  }, [career.squad, sort, filterPos]);
  const pName = p => p.firstName ? p.firstName+" "+p.lastName : (p.name||"Player");

  return (
    <div className="flex gap-5">
      {/* Left: filters + table */}
      <div className="flex-1 min-w-0">
        {/* Filters */}
        <div className="flex gap-2 mb-3 flex-wrap items-center">
          {["ALL", ...POSITIONS].map(pos => (
            <button key={pos} onClick={()=>setFilterPos(pos)}
              className="text-[11px] px-3 py-1.5 rounded-lg font-bold transition-all"
              style={filterPos===pos ? {background:"#E89A4A", color:"white"} : {background:"#F8FAFC", color:"#64748B", border:"1px solid #E2E8F0"}}>
              {pos}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-2">
            <span className={css.label}>Sort by</span>
            <select value={sort} onChange={e=>setSort(e.target.value)}
              className="text-sm font-semibold rounded-lg px-3 py-1.5"
              style={{background:"#FFFFFF", border:"1px solid #E2E8F0", color:"#334155"}}>
              <option value="overall">Rating</option>
              <option value="age">Age</option>
              <option value="form">Form</option>
              <option value="wage">Wage</option>
              <option value="name">Name</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-2xl overflow-hidden" style={{border:"1px solid #E2E8F0"}}>
          <div className="grid px-4 py-3" style={{gridTemplateColumns:"2rem 1fr 4rem 3rem 3.5rem 5rem 5rem 4.5rem 3.5rem", gap:"0.5rem", background:"#F1F5F9", borderBottom:"1px solid #E2E8F0"}}>
            {["#","Player","Pos","Age","OVR","Form","Fitness","Wage","Status"].map((h,i)=>(
              <div key={h} className={`text-[10px] font-black uppercase tracking-[0.15em] text-[#94A3B8] ${i>1?"text-center":""} ${i===7?"text-right":""}`}>{h}</div>
            ))}
          </div>
          <div className="max-h-[65vh] overflow-y-auto" style={{background:"#FFFFFF"}}>
            {players.map((p, i) => {
              const inLineup = career.lineup.includes(p.id);
              const isSelected = selected?.id === p.id;
              const formColor = p.form >= 75 ? "#4AE89A" : p.form >= 55 ? "#E89A4A" : "#E84A6F";
              const fitColor  = p.fitness >= 80 ? "#4AE89A" : p.fitness >= 60 ? "#E89A4A" : "#E84A6F";
              return (
                <button key={p.id} onClick={()=>setSelected(isSelected ? null : p)}
                  className="w-full grid px-4 py-3 transition-all"
                  style={{
                    gridTemplateColumns:"2rem 1fr 4rem 3rem 3.5rem 5rem 5rem 4.5rem 3.5rem", gap:"0.5rem",
                    borderBottom:"1px solid #E2E8F0",
                    background: isSelected ? "#E89A4A12" : "transparent",
                    borderLeft: isSelected ? "3px solid #E89A4A" : "3px solid transparent",
                  }}
                  onMouseEnter={e=>{if(!isSelected) e.currentTarget.style.background="#F8FAFC";}}
                  onMouseLeave={e=>{if(!isSelected) e.currentTarget.style.background="transparent";}}>
                  <div className="text-[#94A3B8] text-sm font-bold text-left">{i+1}</div>
                  <div className="flex items-center gap-2 min-w-0 text-left">
                    {p.injured > 0 && <Heart className="w-3 h-3 flex-shrink-0 text-[#E84A6F]" />}
                    {inLineup && <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{background:"#4AE89A", boxShadow:"0 0 4px #4AE89A"}} />}
                    <span className="truncate text-sm font-semibold text-white">{pName(p)}</span>
                    {p.rookie && <span className="text-[9px] px-1.5 py-0.5 rounded font-black flex-shrink-0" style={{background:"#4ADBE822",color:"#4ADBE8"}}>R</span>}
                  </div>
                  <div className="text-center"><Pill color="#4ADBE8">{p.position}</Pill></div>
                  <div className="text-center text-sm text-[#8A9AB8]">{p.age}</div>
                  <div className="text-center flex justify-center"><RatingDot value={p.overall} size="sm" /></div>
                  <div className="flex items-center gap-1">
                    <div className="flex-1 h-2 rounded-full overflow-hidden" style={{background:"#E2E8F0"}}>
                      <div className="h-full rounded-full" style={{width:`${p.form}%`, background:formColor}} />
                    </div>
                    <span className="text-[10px] font-bold w-6 text-right" style={{color:formColor}}>{p.form}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="flex-1 h-2 rounded-full overflow-hidden" style={{background:"#E2E8F0"}}>
                      <div className="h-full rounded-full" style={{width:`${p.fitness}%`, background:fitColor}} />
                    </div>
                    <span className="text-[10px] font-bold w-6 text-right" style={{color:fitColor}}>{p.fitness}</span>
                  </div>
                  <div className="text-right text-xs font-mono text-[#64748B]">{fmtK(p.wage)}</div>
                  <div className="text-center">
                    {p.injured > 0 ? <Pill color="#E84A6F">{p.injured}w</Pill> : inLineup ? <Pill color="#4AE89A">XI</Pill> : <span className="text-[#94A3B8] text-xs">—</span>}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
        <div className="mt-2 text-[10px] text-[#94A3B8]">{players.length} players · {career.lineup.length}/22 in XXII · {career.squad.length} total squad</div>
      </div>

      {/* Right: player detail */}
      <div className="w-72 flex-shrink-0">
        {selected ? (
          <PlayerDetail player={selected} career={career} updateCareer={updateCareer} onClose={()=>setSelected(null)} />
        ) : (
          <div className="rounded-2xl p-8 text-center" style={{background:"#F1F5F9", border:"1px solid #E2E8F0"}}>
            <Users className="w-10 h-10 mx-auto mb-3 text-[#E2E8F0]" />
            <div className="text-sm text-[#94A3B8] font-medium">Click a player to view their profile</div>
          </div>
        )}
      </div>
    </div>
  );
}

function PlayerDetail({ player, career, updateCareer, onClose }) {
  const inLineup = career.lineup.includes(player.id);
  const pName = player.firstName ? player.firstName+" "+player.lastName : (player.name||"Player");
  const toggleLineup = () => {
    if (inLineup) updateCareer({ lineup: career.lineup.filter(id => id !== player.id) });
    else if (career.lineup.length < 22) updateCareer({ lineup: [...career.lineup, player.id] });
  };
  const offerNewContract = () => {
    const wageBump = Math.round(player.wage * 1.15);
    updateCareer({ squad: career.squad.map(p => p.id === player.id ? {...p, contract:3, wage:wageBump, morale:clamp(p.morale+8,30,100)} : p) });
  };
  const release = () => {
    updateCareer({ squad: career.squad.filter(p => p.id !== player.id), lineup: career.lineup.filter(id => id !== player.id) });
    onClose();
  };
  const ATTR_COLORS = { kicking:"#4ADBE8", marking:"#4AE89A", handball:"#A78BFA", tackling:"#E84A6F", speed:"#E89A4A", endurance:"#4AE89A", strength:"#E84A6F", decision:"#4ADBE8" };

  return (
    <div className="rounded-2xl overflow-hidden sticky top-20" style={{background:"#F1F5F9", border:"1px solid #E2E8F0"}}>
      {/* Header */}
      <div className="p-4" style={{background:`linear-gradient(135deg, #FFFFFF, #F1F5F9)`}}>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0 flex-1">
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[#64748B] mb-0.5">{POSITION_NAMES[player.position]}</div>
            <h3 className="font-['Bebas_Neue'] text-2xl text-white leading-tight truncate">{pName.toUpperCase()}</h3>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-[11px] text-[#64748B]">Age {player.age}</span>
              <span className="text-[#E2E8F0]">·</span>
              <span className="text-[11px] text-[#64748B]">{player.contract}yr</span>
              <span className="text-[#E2E8F0]">·</span>
              <span className="text-[11px] text-[#64748B]">{fmtK(player.wage)}/yr</span>
            </div>
          </div>
          <div className="flex flex-col items-center gap-1.5">
            <RatingDot value={player.overall} size="lg" />
            {player.trueRating && (
              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full" style={{background:"#4ADBE814",color:"#4ADBE8",border:"1px solid #4ADBE830"}}>
                Scout {player.trueRating}
              </span>
            )}
          </div>
        </div>
        {/* Form / Fitness / Morale row */}
        <div className="grid grid-cols-3 gap-2">
          {[["Form", player.form, player.form>=75?"#4AE89A":player.form>=55?"#E89A4A":"#E84A6F"],
            ["Fitness", player.fitness, player.fitness>=80?"#4AE89A":player.fitness>=60?"#E89A4A":"#E84A6F"],
            ["Morale", player.morale, player.morale>=75?"#4AE89A":"#E89A4A"]].map(([l,v,c])=>(
            <div key={l} className="rounded-xl p-2.5 text-center" style={{background:"#F1F5F9"}}>
              <div className="text-[8px] font-black uppercase tracking-widest text-[#94A3B8]">{l}</div>
              <div className="font-['Bebas_Neue'] text-2xl leading-tight" style={{color:c}}>{v}</div>
              <div className="h-1 rounded-full mt-1 overflow-hidden" style={{background:"#E2E8F0"}}>
                <div className="h-full rounded-full" style={{width:`${v}%`,background:c}} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Attributes */}
      <div className="p-4" style={{borderTop:"1px solid #E2E8F0"}}>
        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[#94A3B8] mb-3">Attributes</div>
        <div className="space-y-2.5">
          {Object.entries(player.attrs).map(([k, v]) => {
            const color = ATTR_COLORS[k] || "#E89A4A";
            return (
              <div key={k} className="flex items-center gap-2">
                <div className="text-[11px] capitalize font-semibold text-[#8A9AB8] w-20 flex-shrink-0">{k}</div>
                <div className="flex-1 h-2 rounded-full overflow-hidden" style={{background:"#E2E8F0"}}>
                  <div className="h-full rounded-full transition-all" style={{width:`${v}%`, background:`linear-gradient(90deg,${color}88,${color})`}} />
                </div>
                <div className="text-[12px] font-black w-7 text-right" style={{color}}>{v}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Season Stats */}
      <div className="px-4 pb-4" style={{borderTop:"1px solid #E2E8F0", paddingTop:"1rem"}}>
        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[#94A3B8] mb-3">Season Stats</div>
        <div className="grid grid-cols-4 gap-2">
          {[["G", player.goals,"#4AE89A"],["B",player.behinds,"#E89A4A"],["DSP",player.disposals,"#4ADBE8"],["M",player.marks,"#A78BFA"]].map(([l,v,c])=>(
            <div key={l} className="rounded-xl p-2.5 text-center" style={{background:"#F1F5F9", border:"1px solid #E2E8F0"}}>
              <div className="text-[9px] font-black uppercase tracking-widest" style={{color:c}}>{l}</div>
              <div className="font-['Bebas_Neue'] text-2xl leading-tight text-white">{v}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="p-4 space-y-2" style={{borderTop:"1px solid #E2E8F0"}}>
        <button onClick={toggleLineup} className={`w-full text-sm font-bold py-2.5 rounded-xl transition-all ${inLineup ? css.btnDanger : css.btnPrimary}`}>
          {inLineup ? "Remove from XXII" : career.lineup.length >= 22 ? "XXII Full" : "Add to XXII"}
        </button>
        <button onClick={offerNewContract} className={`w-full ${css.btnGhost} text-sm`}>Offer Contract Ext. (+15%)</button>
        <button onClick={release} className="w-full text-sm py-2.5 rounded-xl font-bold transition-all text-[#E84A6F] hover:bg-[#E84A6F]/10">
          Release Player
        </button>
      </div>
    </div>
  );
}

function TacticsTab({ career, updateCareer }) {
  const lineup = career.lineup.map(id => career.squad.find(p => p.id === id)).filter(Boolean);
  const byPos = POSITIONS.reduce((acc, p) => ({ ...acc, [p]: lineup.filter(pl => pl.position === p) }), {});
  // Visualize positions on a footy field
  return (
    <div className="grid md:grid-cols-2 gap-4">
      <div className={`${css.panel} p-5`}>
        <h3 className={`${css.h1} text-2xl mb-3`}>FORMATION (XXII)</h3>
        <div className="text-[11px] text-[#64748B] mb-4">{lineup.length}/22 selected. AFL teams field 18 + 4 interchange.</div>
        {/* SVG oval */}
        <div className="relative aspect-[5/4] rounded-2xl overflow-hidden" style={{ background: "radial-gradient(ellipse at center, #1B5E3F 0%, #0F4029 70%, #08251A 100%)" }}>
          <svg viewBox="0 0 500 400" className="absolute inset-0">
            <ellipse cx="250" cy="200" rx="240" ry="190" fill="none" stroke="#FFFFFF20" strokeWidth="2" />
            <ellipse cx="250" cy="200" rx="60" ry="60" fill="none" stroke="#FFFFFF30" strokeWidth="1.5" />
            <line x1="250" y1="10" x2="250" y2="390" stroke="#FFFFFF20" strokeWidth="1" strokeDasharray="4,4" />
            {/* Goalposts */}
            <line x1="10" y1="170" x2="10" y2="230" stroke="#FFFFFF60" strokeWidth="3" />
            <line x1="490" y1="170" x2="490" y2="230" stroke="#FFFFFF60" strokeWidth="3" />
            {/* Position dots */}
            {[
              { pos: "KF", x: 80, y: 200, lbl: "Full Forward" },
              { pos: "HF", x: 150, y: 130, lbl: "Half Fwd" },
              { pos: "HF", x: 150, y: 270, lbl: "Half Fwd" },
              { pos: "C", x: 250, y: 200, lbl: "Centre" },
              { pos: "WG", x: 250, y: 110, lbl: "Wing" },
              { pos: "WG", x: 250, y: 290, lbl: "Wing" },
              { pos: "RU", x: 200, y: 200, lbl: "Ruck" },
              { pos: "R", x: 300, y: 200, lbl: "Rover" },
              { pos: "HB", x: 350, y: 130, lbl: "Half Back" },
              { pos: "HB", x: 350, y: 270, lbl: "Half Back" },
              { pos: "KB", x: 420, y: 200, lbl: "Full Back" },
            ].map((sp, i) => {
              const players = byPos[sp.pos] || [];
              const filled = players.length > 0;
              return (
                <g key={i}>
                  <circle cx={sp.x} cy={sp.y} r="14" fill={filled ? career.kits.home.primary : "#FFFFFF20"} stroke={filled ? career.kits.home.accent : "#FFFFFF40"} strokeWidth="2" />
                  <text x={sp.x} y={sp.y + 4} textAnchor="middle" fontSize="10" fontWeight="700" fill="#FFFFFF" fontFamily="Bebas Neue">{sp.pos}</text>
                </g>
              );
            })}
          </svg>
        </div>
        <div className="grid grid-cols-3 gap-2 mt-4">
          {POSITIONS.map(p => (
            <div key={p} className={`${css.inset} p-2 text-center`}>
              <div className="text-[9px] text-[#64748B] uppercase">{p}</div>
              <div className="font-['Bebas_Neue'] text-2xl text-[#E89A4A]">{byPos[p]?.length || 0}</div>
            </div>
          ))}
        </div>
      </div>
      <div className={`${css.panel} p-5`}>
        <h3 className={`${css.h1} text-2xl mb-3`}>SELECTED XXII</h3>
        <div className="text-[11px] text-[#64748B] mb-4">Tap to remove. Add players from the Players tab.</div>
        <div className="space-y-1.5 max-h-[60vh] overflow-y-auto">
          {lineup.length === 0 && <div className="text-sm text-[#64748B] text-center py-12">No players selected.</div>}
          {lineup.sort((a,b)=>b.overall-a.overall).map(p => (
            <button key={p.id} onClick={()=>updateCareer({ lineup: career.lineup.filter(id => id !== p.id) })} className="w-full flex items-center gap-2 p-2 rounded-lg bg-[#F8FAFC] hover:bg-[#F1F5F9] transition group">
              <span className="text-[10px] px-1.5 py-0.5 bg-[#E2E8F0] rounded font-bold w-9 text-center">{p.position}</span>
              <span className="text-sm flex-1 text-left truncate">{p.firstName ? p.firstName + " " + p.lastName : p.name}</span>
              <span className="text-xs text-[#64748B]">{p.age}</span>
              <RatingDot value={p.overall} />
              <X className="w-4 h-4 text-[#E84A6F] opacity-0 group-hover:opacity-100" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function TrainingTab({ career, updateCareer }) {
  const t = career.training;
  const setIntensity = (v) => updateCareer({ training: { ...t, intensity: v } });
  const setFocus = (k, v) => {
    const others = Object.keys(t.focus).filter(x => x !== k);
    const remain = 100 - v;
    const oldOthers = others.reduce((a, x) => a + t.focus[x], 0);
    const newFocus = { [k]: v };
    others.forEach(x => { newFocus[x] = oldOthers === 0 ? Math.round(remain / others.length) : Math.round((t.focus[x] / oldOthers) * remain); });
    updateCareer({ training: { ...t, focus: newFocus } });
  };
  return (
    <div className="grid md:grid-cols-2 gap-4">
      <div className={`${css.panel} p-5`}>
        <h3 className={`${css.h1} text-2xl mb-3`}>TRAINING INTENSITY</h3>
        <p className="text-xs text-[#64748B] mb-4">Higher intensity boosts development but increases fatigue and injury risk.</p>
        <div className="flex items-center gap-3 mb-2">
          <div className={`${css.h1} text-5xl text-[#E89A4A] w-20 text-center`}>{t.intensity}</div>
          <div className="flex-1">
            <input type="range" min="20" max="100" value={t.intensity} onChange={(e)=>setIntensity(+e.target.value)} className="w-full accent-[#E89A4A]" />
            <div className="flex justify-between text-[10px] text-[#64748B] mt-1 uppercase tracking-widest"><span>Easy</span><span>Hard</span></div>
          </div>
        </div>
        <div className={`${css.inset} p-3 mt-4`}>
          <div className="flex items-center gap-2 text-xs">
            <AlertCircle className="w-4 h-4 text-[#E89A4A]" />
            <span>{t.intensity > 80 ? "High injury risk" : t.intensity > 60 ? "Balanced" : "Conservative — slow growth"}</span>
          </div>
        </div>
      </div>
      <div className={`${css.panel} p-5`}>
        <h3 className={`${css.h1} text-2xl mb-3`}>TRAINING FOCUS</h3>
        <p className="text-xs text-[#64748B] mb-4">Distribution must total 100. Adjusting one re-balances the others.</p>
        {Object.entries(t.focus).map(([k, v]) => {
          const colors = { skills: "#E89A4A", fitness: "#4ADBE8", tactics: "#E84A6F", recovery: "#4AE89A" };
          return (
            <div key={k} className="mb-3">
              <div className="flex justify-between mb-1">
                <span className="text-sm capitalize font-semibold" style={{ color: colors[k] }}>{k}</span>
                <span className="font-['Bebas_Neue'] text-lg">{v}%</span>
              </div>
              <input type="range" min="5" max="80" value={v} onChange={(e)=>setFocus(k, +e.target.value)} className="w-full" style={{ accentColor: colors[k] }} />
            </div>
          );
        })}
      </div>
    </div>
  );
}


// ============================================================================
// CLUB SCREEN — finances, sponsors, kits, facilities, staff
// ============================================================================
function ClubScreen({ career, club, updateCareer, tab, setTab }) {
  const t = tab || "finances";
  const tabs = [
    { key: "finances", label: "Finances", icon: DollarSign },
    { key: "sponsors", label: "Sponsors", icon: Handshake },
    { key: "kits", label: "Kits", icon: Shirt },
    { key: "facilities", label: "Facilities", icon: Building2 },
    { key: "staff", label: "Staff", icon: UserCog },
  ];
  return (
    <div className="anim-in">
      <TabNav tabs={tabs} active={t} onChange={setTab} />
      {t === "finances"   && <FinancesTab career={career} />}
      {t === "sponsors"   && <SponsorsTab career={career} updateCareer={updateCareer} />}
      {t === "kits"       && <KitsTab career={career} club={club} updateCareer={updateCareer} />}
      {t === "facilities" && <FacilitiesTab career={career} updateCareer={updateCareer} />}
      {t === "staff"      && <StaffTab career={career} updateCareer={updateCareer} />}
    </div>
  );
}

function FinancesTab({ career }) {
  const wages = career.squad.reduce((a, p) => a + p.wage, 0);
  const staffWages = career.staff.reduce((a, s) => a + s.wage, 0);
  const sponsors = career.sponsors.reduce((a, s) => a + s.annualValue, 0);
  const facilityCosts = Math.round(Object.values(career.facilities).reduce((a, f) => a + f.level * 130000, 0));
  const gateRev = Math.round(career.finance.annualIncome * 0.4);
  const broadcastRev = Math.round(career.finance.annualIncome * 0.35);
  const annualNet = (gateRev + broadcastRev + sponsors) - (wages + staffWages + facilityCosts);
  const wageCap = career.finance.wageBudget || 0;
  const wagePct = wageCap > 0 ? Math.min(100, Math.round((wages / wageCap) * 100)) : 0;
  const wageCapColor = wagePct >= 95 ? "#E84A6F" : wagePct >= 80 ? "#E89A4A" : "#4AE89A";
  return (
    <div className="space-y-4">
      <div className="grid md:grid-cols-4 gap-4">
        <Stat label="Cash" value={fmtK(career.finance.cash)} accent="#4AE89A" />
        <Stat label="Annual Net (proj)" value={fmtK(annualNet)} accent={annualNet > 0 ? "#4AE89A" : "#E84A6F"} />
        <Stat label="Wage Bill" value={fmtK(wages + staffWages)} sub="players + staff" accent="#E89A4A" />
        <Stat label="Transfer Budget" value={fmtK(career.finance.transferBudget)} accent="#4ADBE8" />
      </div>

      {/* Salary Cap Bar */}
      {wageCap > 0 && (
        <div className={`${css.panel} p-5`}>
          <div className="flex items-center justify-between mb-3">
            <h3 className={`${css.h1} text-2xl`}>SALARY CAP</h3>
            <span className="text-xs font-bold" style={{color: wageCapColor}}>{wagePct}% used</span>
          </div>
          <div className="flex justify-between text-xs text-[#64748B] mb-2">
            <span>Player wages: <span className="font-bold text-[#0F172A]">{fmtK(wages)}</span></span>
            <span>Cap: <span className="font-bold text-[#0F172A]">{fmtK(wageCap)}</span></span>
          </div>
          <div className="h-4 rounded-full overflow-hidden" style={{background:"#F1F5F9"}}>
            <div className="h-full rounded-full transition-all" style={{width:`${wagePct}%`, background: wageCapColor}} />
          </div>
          <div className="text-xs text-[#64748B] mt-2">
            {fmtK(wageCap - wages)} remaining · {wagePct >= 95 ? '⚠️ Near cap — limited signing ability' : wagePct >= 80 ? 'Cap tightening — plan ahead' : 'Healthy cap space available'}
          </div>
        </div>
      )}
      <div className="grid md:grid-cols-2 gap-4">
        <div className={`${css.panel} p-5`}>
          <h3 className={`${css.h1} text-2xl mb-3`}>INCOME (ANNUAL)</h3>
          {[
            { label: "Broadcast / TV Rights", value: broadcastRev, color: "#E89A4A" },
            { label: "Gate & Membership", value: gateRev, color: "#4ADBE8" },
            { label: "Sponsorship", value: sponsors, color: "#4AE89A" },
          ].map(r => {
            const total = broadcastRev + gateRev + sponsors;
            return (
              <div key={r.label} className="mb-3">
                <div className="flex justify-between text-sm mb-1"><span className="text-[#0F172A]">{r.label}</span><span className="font-['Bebas_Neue'] text-lg" style={{ color: r.color }}>{fmtK(r.value)}</span></div>
                <Bar value={(r.value / total) * 100} color={r.color} />
              </div>
            );
          })}
        </div>
        <div className={`${css.panel} p-5`}>
          <h3 className={`${css.h1} text-2xl mb-3`}>EXPENSES (ANNUAL)</h3>
          {[
            { label: "Player Wages", value: wages, color: "#E84A6F" },
            { label: "Staff Wages", value: staffWages, color: "#E89A4A" },
            { label: "Facilities Upkeep", value: facilityCosts, color: "#4ADBE8" },
          ].map(r => {
            const total = wages + staffWages + facilityCosts;
            return (
              <div key={r.label} className="mb-3">
                <div className="flex justify-between text-sm mb-1"><span className="text-[#0F172A]">{r.label}</span><span className="font-['Bebas_Neue'] text-lg" style={{ color: r.color }}>{fmtK(r.value)}</span></div>
                <Bar value={(r.value / total) * 100} color={r.color} />
              </div>
            );
          })}
        </div>
      </div>
      <div className={`${css.panel} p-5`}>
        <h3 className={`${css.h1} text-2xl mb-3`}>WEEKLY CASH FLOW</h3>
        {career.weeklyHistory.length === 0 ? (
          <div className="text-sm text-[#64748B] py-8 text-center">No matches played yet — advance a week to see cash flow.</div>
        ) : (
          <div className="flex items-end gap-1 h-40">
            {career.weeklyHistory.map((w, i) => {
              const max = Math.max(...career.weeklyHistory.map(x => Math.abs(x.profit)));
              const h = max === 0 ? 0 : (Math.abs(w.profit) / max) * 100;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full rounded-t" style={{ height: `${h}%`, background: w.profit >= 0 ? "#4AE89A" : "#E84A6F", opacity: 0.85 }} />
                  <div className="text-[9px] text-[#64748B]">R{w.week}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function SponsorsTab({ career, updateCareer }) {
  const totalAnnual = career.sponsors.reduce((a, s) => a + s.annualValue, 0);
  const renew = (sp) => {
    updateCareer({ sponsors: career.sponsors.map(s => s.id === sp.id ? { ...s, yearsLeft: s.yearsLeft + 2, annualValue: Math.round(s.annualValue * 1.08) } : s) });
  };
  const drop = (sp) => updateCareer({ sponsors: career.sponsors.filter(s => s.id !== sp.id) });
  const seek = () => {
    const newOnes = generateSponsors(findLeagueOf(career.clubId).tier);
    const fresh = newOnes[rand(0, newOnes.length - 1)];
    if (career.sponsors.find(s => s.name === fresh.name)) return;
    updateCareer({ sponsors: [...career.sponsors, fresh], finance: { ...career.finance, fanHappiness: clamp(career.finance.fanHappiness + 2, 10, 100) } });
  };
  return (
    <div className="space-y-4">
      <div className="grid md:grid-cols-3 gap-4">
        <Stat label="Total Annual Sponsorship" value={fmtK(totalAnnual)} accent="#4AE89A" />
        <Stat label="Active Deals" value={career.sponsors.length} accent="#E89A4A" />
        <Stat label="Avg Deal" value={career.sponsors.length ? fmtK(Math.round(totalAnnual/career.sponsors.length)) : "—"} accent="#4ADBE8" />
      </div>
      <div className={`${css.panel} p-5`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className={`${css.h1} text-2xl`}>ACTIVE PARTNERS</h3>
          <button onClick={seek} className={`${css.btnPrimary} text-sm flex items-center gap-2`}><Plus className="w-4 h-4" />SEEK NEW DEAL</button>
        </div>
        <div className="grid md:grid-cols-2 gap-3">
          {career.sponsors.map(s => (
            <div key={s.id} className={`${css.inset} p-4`}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-['Bebas_Neue'] text-2xl">{s.name}</div>
                  <div className="text-[10px] text-[#64748B] uppercase tracking-widest">{s.category} • {s.type}</div>
                </div>
                <Pill color="#E89A4A">{s.yearsLeft}y left</Pill>
              </div>
              <div className="flex items-end justify-between mt-3">
                <div>
                  <div className="text-[10px] text-[#64748B] uppercase tracking-widest">Annual Value</div>
                  <div className="font-['Bebas_Neue'] text-3xl text-[#4AE89A]">{fmtK(s.annualValue)}</div>
                </div>
                <div className="flex gap-2">
                  <button onClick={()=>renew(s)} className={`${css.btnGhost} text-xs`}>Renew +2y</button>
                  <button onClick={()=>drop(s)} className="text-xs px-3 py-2 rounded-lg text-[#E84A6F] hover:bg-[#E84A6F]/10">Drop</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


// ============================================================================
// KITS TAB
// ============================================================================
function KitsTab({ career, club, updateCareer }) {
  const [editing, setEditing] = useState("home");
  const kit = career.kits[editing];
  const PATTERNS = [
    { key: "solid", label: "Solid" },
    { key: "stripes", label: "Stripes" },
    { key: "v", label: "V-Yoke" },
    { key: "sash", label: "Sash" },
    { key: "yoke", label: "Yoke" },
  ];
  const updateKit = (field, value) => {
    updateCareer({ kits: { ...career.kits, [editing]: { ...career.kits[editing], [field]: value } } });
  };
  const resetToClubColors = () => {
    updateCareer({ kits: { ...career.kits, [editing]: defaultKits(club.colors)[editing] } });
  };
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className={`${css.h1} text-3xl`}>KIT DESIGNER</div>
          <div className="text-xs text-[#64748B]">Customise your club's three jerseys. Live preview updates as you tweak.</div>
        </div>
        <div className="flex gap-2">
          {["home","away","clash"].map(k => (
            <button key={k} onClick={()=>setEditing(k)} className={`px-4 py-2 rounded-lg text-sm font-bold uppercase tracking-wider ${editing===k ? "bg-[#E89A4A] text-[#F8FAFC]" : "bg-[#F1F5F9] text-[#64748B] hover:text-[#0F172A]"}`}>{k}</button>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* PREVIEW */}
        <div className={`${css.panel} p-6 flex flex-col items-center justify-center lg:col-span-1`}>
          <div className={css.label}>Preview · {editing}</div>
          <div className="my-4 p-4 bg-gradient-to-br from-[#F1F5F9] to-[#F8FAFC] rounded-2xl">
            <Jersey kit={kit} size={220} />
          </div>
          <div className="flex gap-2 text-[10px] uppercase tracking-wider text-[#64748B]">
            <span>{kit.pattern}</span>·
            <span style={{color: kit.primary}}>●</span>
            <span style={{color: kit.secondary}}>●</span>
            <span style={{color: kit.accent}}>●</span>
          </div>
          <button onClick={resetToClubColors} className={`${css.btnGhost} mt-4 text-xs`}>Reset to club colours</button>
        </div>

        {/* CONTROLS */}
        <div className={`${css.panel} p-6 lg:col-span-2 space-y-5`}>
          <div>
            <div className={css.label}>Pattern</div>
            <div className="flex flex-wrap gap-2 mt-2">
              {PATTERNS.map(p => (
                <button key={p.key} onClick={()=>updateKit("pattern", p.key)} className={`px-4 py-2 rounded-lg text-sm font-semibold ${kit.pattern===p.key ? "bg-[#E89A4A] text-[#F8FAFC]" : "bg-[#F1F5F9] text-[#64748B] hover:text-[#0F172A]"}`}>{p.label}</button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              {field:"primary", label:"Primary"},
              {field:"secondary", label:"Secondary"},
              {field:"accent", label:"Accent"},
              {field:"numberColor", label:"Number"},
            ].map(c => (
              <div key={c.field}>
                <div className={css.label}>{c.label}</div>
                <div className="flex items-center gap-3 mt-2">
                  <input type="color" value={kit[c.field]} onChange={e=>updateKit(c.field, e.target.value)} className="w-14 h-14 rounded-lg border border-[#E2E8F0] bg-transparent cursor-pointer" />
                  <input type="text" value={kit[c.field]} onChange={e=>updateKit(c.field, e.target.value)} className="flex-1 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-3 py-2 text-sm font-mono" />
                </div>
              </div>
            ))}
          </div>

          <div className={`${css.inset} p-4`}>
            <div className={css.label}>Quick Palettes</div>
            <div className="grid grid-cols-4 gap-2 mt-2">
              {[
                ["#0E1A40","#FFFFFF","#FFD200"],
                ["#7A0019","#FDB930","#003E80"],
                ["#000000","#FFD200","#FF0000"],
                ["#003F87","#FFFFFF","#E21937"],
                ["#4D2004","#FBBF15","#FFFFFF"],
                ["#2A0D54","#FFFFFF","#E89A4A"],
                ["#008AAB","#000000","#FFFFFF"],
                ["#0F1131","#CC2031","#FFFFFF"],
              ].map((pal,i) => (
                <button key={i} onClick={()=>updateCareer({kits:{...career.kits,[editing]:{...career.kits[editing], primary:pal[0], secondary:pal[1], accent:pal[2]}}})} className="h-10 rounded-lg overflow-hidden flex border border-[#E2E8F0] hover:border-[#E89A4A] transition">
                  <div style={{background:pal[0]}} className="flex-1" />
                  <div style={{background:pal[1]}} className="flex-1" />
                  <div style={{background:pal[2]}} className="flex-1" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* All three kits row */}
      <div className={`${css.panel} p-6`}>
        <div className={css.label}>Full kit set</div>
        <div className="grid grid-cols-3 gap-4 mt-3">
          {["home","away","clash"].map(k => (
            <div key={k} className={`${css.inset} p-4 flex flex-col items-center cursor-pointer hover:border-[#E89A4A] transition`} onClick={()=>setEditing(k)}>
              <Jersey kit={career.kits[k]} size={120} />
              <div className="mt-2 text-xs uppercase tracking-wider text-[#64748B]">{k}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// FACILITIES TAB
// ============================================================================
function FacilitiesTab({ career, updateCareer }) {
  const FAC_INFO = {
    trainingGround: { name: "Training Ground", icon: Activity, desc: "Improves training effectiveness and skill development", color: "#4ADBE8" },
    gym: { name: "Strength & Conditioning", icon: Dumbbell, desc: "Boosts player strength, speed and endurance gains", color: "#E89A4A" },
    medical: { name: "Medical Centre", icon: Heart, desc: "Reduces injury rate, faster recovery from knocks", color: "#E84A6F" },
    academy: { name: "Youth Academy", icon: GraduationCap, desc: "Better youth recruits and development progression", color: "#4AE89A" },
    stadium: { name: "Stadium", icon: Building2, desc: "Higher capacity = bigger gate revenue & sponsor pull", color: "#FFD200" },
    recovery: { name: "Recovery Centre", icon: Sparkles, desc: "Faster fitness recovery between matches", color: "#A78BFA" },
  };
  const upgrade = (key) => {
    const f = career.facilities[key];
    if (f.level >= f.max) return;
    const cost = f.cost * f.level;
    if (career.finance.cash < cost) return;
    updateCareer({
      facilities: { ...career.facilities, [key]: { ...f, level: f.level + 1 } },
      finance: { ...career.finance, cash: career.finance.cash - cost },
      news: [{ week: career.week, type: "info", text: `📈 Upgraded ${FAC_INFO[key].name} to Level ${f.level+1}` }, ...career.news].slice(0,15),
    });
  };
  const totalLevel = Object.values(career.facilities).reduce((a,b)=>a+b.level,0);
  const maxTotal = Object.values(career.facilities).reduce((a,b)=>a+b.max,0);
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className={`${css.h1} text-3xl`}>FACILITIES</div>
          <div className="text-xs text-[#64748B]">Long-term investment. Effects compound across the season.</div>
        </div>
        <div className="flex items-center gap-3">
          <Stat label="Overall Rating" value={`${totalLevel}/${maxTotal}`} accent="#4ADBE8" />
          <Stat label="Cash" value={fmtK(career.finance.cash)} accent="#E89A4A" />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        {Object.entries(career.facilities).map(([key, f]) => {
          const info = FAC_INFO[key];
          const Icon = info.icon;
          const cost = f.cost * f.level;
          const canAfford = career.finance.cash >= cost;
          const maxed = f.level >= f.max;
          return (
            <div key={key} className={`${css.panel} p-5`}>
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${info.color}1A`, border: `1px solid ${info.color}44` }}>
                  <Icon className="w-7 h-7" style={{ color: info.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-bold tracking-wide">{info.name}</div>
                    <div className={`${css.num} text-2xl`} style={{color: info.color}}>{f.level}<span className="text-sm text-[#64748B]">/{f.max}</span></div>
                  </div>
                  <div className="text-[11px] text-[#64748B] mt-1">{info.desc}</div>
                  <div className="flex gap-1 mt-3">
                    {Array.from({length: f.max}).map((_,i) => (
                      <div key={i} className="flex-1 h-2 rounded-full" style={{ background: i < f.level ? info.color : "#E2E8F0" }} />
                    ))}
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <div className="text-xs text-[#64748B]">
                      {maxed ? <span className="text-[#4AE89A]">⭐ Max level</span> : <>Upgrade: <span className={canAfford ? "text-[#0F172A] font-bold" : "text-[#E84A6F] font-bold"}>${(cost/1000).toFixed(0)}k</span></>}
                    </div>
                    <button onClick={()=>upgrade(key)} disabled={maxed||!canAfford} className={maxed||!canAfford ? "px-3 py-1.5 rounded-lg text-xs font-bold bg-[#F1F5F9] text-[#CBD5E1]" : `${css.btnPrimary} text-xs px-3 py-1.5`}>
                      {maxed ? "Maxed" : "Upgrade"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// STAFF TAB
// ============================================================================
function StaffTab({ career, updateCareer }) {
  const replaceStaff = (idx) => {
    const old = career.staff[idx];
    seedRng(Date.now() % 100000 + idx);
    const newRating = clamp(old.rating + rand(-8, 14), 35, 95);
    const newWage = Math.round((newRating / 75) * 80000);
    const newStaff = [...career.staff];
    newStaff[idx] = {
      ...old,
      name: `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`,
      rating: newRating,
      wage: newWage,
      contract: rand(1, 3),
    };
    updateCareer({
      staff: newStaff,
      news: [{ week: career.week, type: "info", text: `🤝 Hired new ${old.role}: ${newStaff[idx].name} (${newRating} OVR)` }, ...career.news].slice(0,15),
    });
  };
  const totalWage = career.staff.reduce((a,s)=>a+s.wage,0);
  const avgRating = Math.round(career.staff.reduce((a,s)=>a+s.rating,0) / career.staff.length);
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className={`${css.h1} text-3xl`}>STAFF</div>
          <div className="text-xs text-[#64748B]">Your support team shapes training outcomes, recruitment quality and player development.</div>
        </div>
        <div className="flex items-center gap-3">
          <Stat label="Avg Rating" value={avgRating} accent="#4AE89A" />
          <Stat label="Annual Wages" value={fmtK(totalWage)} accent="#E89A4A" />
        </div>
      </div>

      <div className="rounded-2xl overflow-hidden" style={{border:"1px solid #E2E8F0", background:"#FFFFFF"}}>
        <div className="grid grid-cols-12 gap-2 px-4 py-3 text-[10px] uppercase tracking-[0.15em] text-[#94A3B8] font-black border-b" style={{borderColor:"#E2E8F0",background:"#F1F5F9"}}>
          <div className="col-span-3">Name</div>
          <div className="col-span-3">Role</div>
          <div className="col-span-2">Rating</div>
          <div className="col-span-1 text-center">Years</div>
          <div className="col-span-2 text-right">Wage</div>
          <div className="col-span-1"></div>
        </div>
        {career.staff.map((s, idx) => (
          <div key={idx} className="grid grid-cols-12 gap-2 px-4 py-3 items-center transition-colors" style={{borderBottom:"1px solid #E2E8F0"}} onMouseEnter={e=>e.currentTarget.style.background="#F8FAFC"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
            <div className="col-span-3 font-semibold text-sm">{s.name}</div>
            <div className="col-span-3 text-sm text-[#64748B]">{s.role}</div>
            <div className="col-span-2 flex items-center gap-2">
              <RatingDot value={s.rating} />
              <Bar value={s.rating} small />
            </div>
            <div className="col-span-1 text-center text-sm">{s.contract}y</div>
            <div className="col-span-2 text-right text-sm font-mono">${(s.wage/1000).toFixed(0)}k</div>
            <div className="col-span-1 flex justify-end">
              <button onClick={()=>replaceStaff(idx)} className="text-xs px-3 py-1.5 rounded-lg border border-[#E2E8F0] hover:border-[#E89A4A] hover:text-[#E89A4A] transition">Replace</button>
            </div>
          </div>
        ))}
      </div>

      <div className={`${css.inset} p-4 text-xs text-[#64748B]`}>
        <span className="text-[#E89A4A] font-bold">TIP:</span> Replacing a staff member rolls a new candidate. Higher overall ratings = better training outcomes, lower injury rates, sharper recruitment, and stronger youth pipeline. Wages scale with rating.
      </div>
    </div>
  );
}

// ============================================================================
// RECRUIT SCREEN — Trade / Draft / Youth / Local
// ============================================================================
function RecruitScreen({ career, club, updateCareer, tab, setTab }) {
  const t = tab || "trade";
  const tabs = [
    { key: "trade", label: "Trades", icon: Repeat },
    { key: "draft", label: "Draft", icon: Award },
    { key: "youth", label: "Youth Academy", icon: GraduationCap },
    { key: "local", label: "Local Football", icon: Map },
  ];
  return (
    <div className="anim-in">
      <TabNav tabs={tabs} active={t} onChange={setTab} />
      {t === "trade" && <TradeTab career={career} updateCareer={updateCareer} />}
      {t === "draft" && <DraftTab career={career} updateCareer={updateCareer} />}
      {t === "youth" && <YouthTab career={career} club={club} updateCareer={updateCareer} />}
      {t === "local" && <LocalTab career={career} club={club} updateCareer={updateCareer} />}
    </div>
  );
}

function TradeTab({ career, updateCareer }) {
  const [filter, setFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState("overall");
  const [negotiating, setNegotiating] = useState(null); // { playerId, wage, years, counterUsed }
  const pool = career.tradePool || [];
  const filtered = pool.filter(p => filter === "ALL" || p.position === filter);
  const sorted = [...filtered].sort((a,b) => sortBy === "overall" ? b.overall - a.overall : sortBy === "value" ? b.value - a.value : a.age - b.age);

  const currentWages = career.squad.reduce((a, p) => a + p.wage, 0);
  const wageCap = career.finance.wageBudget || Infinity;

  const openNegotiation = (p) => {
    const demandedWage  = Math.round(p.wage * (1.05 + Math.random() * 0.2));
    const demandedYears = 1 + Math.floor(Math.random() * 3);
    setNegotiating({ playerId: p.id, wage: demandedWage, years: demandedYears, counterUsed: false });
  };

  const acceptDeal = (p) => {
    if (career.finance.transferBudget < p.value) return;
    if (career.squad.length >= 40) return;
    if (currentWages + negotiating.wage > wageCap) return;
    const signedPlayer = { ...p, id: Date.now() + Math.random(), wage: negotiating.wage, contract: negotiating.years };
    updateCareer({
      squad: [...career.squad, signedPlayer],
      tradePool: pool.filter(x => x.id !== p.id),
      finance: { ...career.finance, transferBudget: career.finance.transferBudget - p.value, cash: career.finance.cash - Math.round(p.value * 0.3) },
      news: [{ week: career.week, type: "win", text: `🤝 Signed ${p.firstName} ${p.lastName} (${p.overall} OVR) — ${negotiating.years}yr @ ${fmtK(negotiating.wage)}/yr` }, ...career.news].slice(0,15),
    });
    setNegotiating(null);
  };

  const counterOffer = (p) => {
    if (negotiating.counterUsed) return;
    const counterWage = Math.round(negotiating.wage * 0.88);
    const success = Math.random() < 0.65;
    if (success) {
      setNegotiating({ ...negotiating, wage: counterWage, counterUsed: true });
    } else {
      setNegotiating(null);
      updateCareer({ news: [{ week: career.week, type: "info", text: `❌ ${p.firstName} ${p.lastName} rejected your counter-offer and walked away` }, ...career.news].slice(0,15) });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className={`${css.h1} text-3xl`}>TRADE MARKET</div>
          <div className="text-xs text-[#64748B]">Players currently available across the league pyramid.</div>
        </div>
        <div className="flex items-center gap-3">
          <Stat label="Transfer Budget" value={fmtK(career.finance.transferBudget)} accent="#4ADBE8" />
          <Stat label="Squad Size" value={`${career.squad.length}/40`} accent="#E89A4A" />
        </div>
      </div>

      <div className="flex gap-2 items-center flex-wrap">
        <span className="text-xs text-[#64748B] uppercase tracking-wider">Position:</span>
        {["ALL", ...POSITIONS].map(pos => (
          <button key={pos} onClick={()=>setFilter(pos)} className={`px-3 py-1.5 rounded-lg text-xs font-bold ${filter===pos ? "bg-[#E89A4A] text-[#F8FAFC]" : "bg-[#F1F5F9] text-[#64748B] hover:text-[#0F172A]"}`}>{pos}</button>
        ))}
        <span className="ml-4 text-xs text-[#64748B] uppercase tracking-wider">Sort:</span>
        <select value={sortBy} onChange={e=>setSortBy(e.target.value)} className="bg-[#F1F5F9] border border-[#E2E8F0] rounded-lg px-3 py-1.5 text-xs">
          <option value="overall">Overall</option>
          <option value="value">Value</option>
          <option value="age">Age</option>
        </select>
      </div>

      <div className="rounded-2xl overflow-hidden" style={{border:"1px solid #E2E8F0", background:"#FFFFFF"}}>
        <div className="grid grid-cols-12 gap-2 px-4 py-3 text-[10px] uppercase tracking-[0.15em] text-[#94A3B8] font-black border-b" style={{borderColor:"#E2E8F0",background:"#F1F5F9"}}>
          <div className="col-span-3">Player</div>
          <div className="col-span-1">Pos</div>
          <div className="col-span-1">Age</div>
          <div className="col-span-1">OVR</div>
          <div className="col-span-1">POT</div>
          <div className="col-span-2">From</div>
          <div className="col-span-2 text-right">Value</div>
          <div className="col-span-1"></div>
        </div>
        <div className="max-h-[60vh] overflow-y-auto">
          {sorted.map(p => {
            const canAfford = career.finance.transferBudget >= p.value;
            const capRoom = wageCap - currentWages;
            const isNeg = negotiating?.playerId === p.id;
            const capBlock = negotiating && isNeg && (currentWages + negotiating.wage > wageCap);
            return (
              <div key={p.id}>
                <div className="grid grid-cols-12 gap-2 px-4 py-3 items-center transition-colors" style={{borderBottom: isNeg ? "none" : "1px solid #E2E8F0"}} onMouseEnter={e=>e.currentTarget.style.background="#F8FAFC"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                  <div className="col-span-3">
                    <div className="font-semibold text-sm">{p.firstName} {p.lastName}</div>
                    <div className="text-[10px] text-[#64748B]">Listed wage: {fmtK(p.wage)}/yr</div>
                  </div>
                  <div className="col-span-1"><Pill color="#4ADBE8">{p.position}</Pill></div>
                  <div className="col-span-1 text-sm">{p.age}</div>
                  <div className="col-span-1"><RatingDot value={p.overall} /></div>
                  <div className="col-span-1 text-sm text-[#4AE89A]">{p.potential}</div>
                  <div className="col-span-2 text-xs text-[#64748B]">{p.fromClub}</div>
                  <div className="col-span-2 text-right text-sm font-mono font-bold" style={{color: canAfford ? "#4AE89A" : "#E84A6F"}}>{fmtK(p.value)}</div>
                  <div className="col-span-1 flex justify-end">
                    {isNeg
                      ? <button onClick={()=>setNegotiating(null)} className="text-xs text-[#94A3B8] hover:text-[#64748B] px-2 py-1">✕</button>
                      : <button onClick={()=>canAfford ? openNegotiation(p) : null} disabled={!canAfford} className={canAfford ? `${css.btnPrimary} text-xs px-3 py-1.5` : "px-3 py-1.5 rounded-lg text-xs bg-[#F1F5F9] text-[#CBD5E1]"}>{canAfford ? "Negotiate" : "Too dear"}</button>
                    }
                  </div>
                </div>
                {isNeg && (
                  <div className="mx-4 mb-3 rounded-xl p-4" style={{background:"#F0FDF4", border:"1px solid #BBF7D0"}}>
                    <div className="text-xs font-bold text-[#166534] mb-2">📋 {p.firstName} {p.lastName}'s demands</div>
                    <div className="flex gap-6 mb-3">
                      <div>
                        <div className="text-[10px] text-[#64748B] uppercase tracking-wider">Wage demand</div>
                        <div className="font-['Bebas_Neue'] text-xl text-[#0F172A]">{fmtK(negotiating.wage)}<span className="text-sm font-sans">/yr</span></div>
                      </div>
                      <div>
                        <div className="text-[10px] text-[#64748B] uppercase tracking-wider">Contract length</div>
                        <div className="font-['Bebas_Neue'] text-xl text-[#0F172A]">{negotiating.years}<span className="text-sm font-sans"> yr</span></div>
                      </div>
                      <div>
                        <div className="text-[10px] text-[#64748B] uppercase tracking-wider">Cap room after</div>
                        <div className={`font-['Bebas_Neue'] text-xl ${capBlock ? 'text-[#E84A6F]' : 'text-[#4AE89A]'}`}>{fmtK(capRoom - negotiating.wage)}</div>
                      </div>
                    </div>
                    {capBlock && <div className="text-xs text-[#E84A6F] mb-2">⚠️ Signing this player would exceed your salary cap.</div>}
                    <div className="flex gap-2">
                      <button onClick={()=>acceptDeal(p)} disabled={capBlock} className={capBlock ? "px-4 py-2 rounded-lg text-xs bg-[#F1F5F9] text-[#CBD5E1]" : `${css.btnPrimary} text-xs px-4 py-2`}>
                        ✅ Accept deal
                      </button>
                      {!negotiating.counterUsed && (
                        <button onClick={()=>counterOffer(p)} className="px-4 py-2 rounded-lg text-xs font-bold bg-[#FFF7ED] text-[#D97706] border border-[#FDE68A] hover:bg-[#FEF3C7]">
                          🔄 Counter (−12%)
                        </button>
                      )}
                      {negotiating.counterUsed && (
                        <span className="px-4 py-2 text-xs text-[#94A3B8]">Counter used — accept or walk away</span>
                      )}
                      <button onClick={()=>setNegotiating(null)} className="px-4 py-2 rounded-lg text-xs font-bold bg-[#F1F5F9] text-[#64748B] hover:bg-[#E2E8F0]">
                        Walk away
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          {sorted.length === 0 && <div className="p-8 text-center text-sm text-[#64748B]">No players match the filter. Try widening your search.</div>}
        </div>
      </div>
    </div>
  );
}

function DraftTab({ career, updateCareer }) {
  const [drafted, setDrafted] = useState([]);
  const pool = (career.draftPool || []).slice().sort((a,b) => b.overall - a.overall);
  const draftPlayer = (p, idx) => {
    if (career.squad.length >= 40) return;
    const rookieWage = Math.max(60000, Math.round(p.overall * 1500));
    const rookie = { ...p, id: Date.now() + Math.random(), wage: rookieWage, contract: 2, age: rand(17, 19) };
    const newDraftPool = career.draftPool.filter((_, i) => career.draftPool.indexOf(p) !== i);
    setDrafted(d => [...d, p.id]);
    updateCareer({
      squad: [...career.squad, rookie],
      draftPool: career.draftPool.filter(x => x.id !== p.id),
      news: [{ week: career.week, type: "win", text: `🎯 Drafted ${p.firstName} ${p.lastName} (${p.position}, ${p.overall} OVR)` }, ...career.news].slice(0,15),
    });
  };
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className={`${css.h1} text-3xl`}>NATIONAL DRAFT</div>
          <div className="text-xs text-[#64748B]">Pick from the next generation. Sorted by best available — secret wraps may exist.</div>
        </div>
        <div className="flex items-center gap-3">
          <Stat label="Draft Pool" value={pool.length} accent="#4AE89A" />
          <Stat label="Squad" value={`${career.squad.length}/40`} accent="#E89A4A" />
        </div>
      </div>

      <div className="rounded-2xl overflow-hidden" style={{border:"1px solid #E2E8F0", background:"#FFFFFF"}}>
        <div className="grid grid-cols-12 gap-2 px-4 py-3 text-[10px] uppercase tracking-[0.15em] text-[#94A3B8] font-black border-b" style={{borderColor:"#E2E8F0",background:"#F1F5F9"}}>
          <div className="col-span-1">#</div>
          <div className="col-span-4">Prospect</div>
          <div className="col-span-1">Pos</div>
          <div className="col-span-1">OVR</div>
          <div className="col-span-2">Potential</div>
          <div className="col-span-2 text-right">Rookie Wage</div>
          <div className="col-span-1"></div>
        </div>
        <div className="max-h-[60vh] overflow-y-auto">
          {pool.slice(0, 30).map((p, i) => {
            const rookieWage = Math.max(60000, Math.round(p.overall * 1500));
            return (
              <div key={p.id} className="grid grid-cols-12 gap-2 px-4 py-3 items-center transition-colors" style={{borderBottom:"1px solid #E2E8F0"}} onMouseEnter={e=>e.currentTarget.style.background="#F8FAFC"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                <div className="col-span-1 font-bold text-[#E89A4A]">#{i+1}</div>
                <div className="col-span-4 font-semibold text-sm">{p.firstName} {p.lastName} <span className="text-[10px] text-[#64748B] ml-1">(age {rand(17,19)})</span></div>
                <div className="col-span-1"><Pill color="#4ADBE8">{p.position}</Pill></div>
                <div className="col-span-1"><RatingDot value={p.overall} /></div>
                <div className="col-span-2 flex items-center gap-2">
                  <div className="font-bold text-[#4AE89A]">{p.potential}</div>
                  <Bar value={p.potential} color="#4AE89A" small />
                </div>
                <div className="col-span-2 text-right text-sm font-mono">${(rookieWage/1000).toFixed(0)}k</div>
                <div className="col-span-1 flex justify-end">
                  <button onClick={()=>draftPlayer(p, i)} className={`${css.btnPrimary} text-xs px-3 py-1.5`}>Draft</button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div className={`${css.inset} p-4 text-xs text-[#64748B]`}>
        <span className="text-[#E89A4A] font-bold">TIP:</span> Young draftees enter on a 2-year rookie contract at minimum wage. Higher potential = bigger growth ceiling but slower start. Develop them through training and game time.
      </div>
    </div>
  );
}

function YouthTab({ career, club, updateCareer }) {
  const youth = career.youth;
  const [generated, setGenerated] = useState(youth.recruits || []);
  const generateRecruits = () => {
    seedRng(Date.now() % 99999);
    const count = 4 + youth.programLevel * 2;
    const recruits = Array.from({length: count}, (_, i) => generatePlayer(2 + Math.floor(youth.programLevel/3), 12000 + i + Date.now() % 1000));
    setGenerated(recruits);
    updateCareer({ youth: { ...youth, recruits } });
  };
  const upgradeProgram = () => {
    const cost = youth.programLevel * 80000;
    if (career.finance.cash < cost || youth.programLevel >= 5) return;
    updateCareer({
      youth: { ...youth, programLevel: youth.programLevel + 1 },
      finance: { ...career.finance, cash: career.finance.cash - cost },
      news: [{ week: career.week, type: "info", text: `⭐ Youth program upgraded to Level ${youth.programLevel+1}` }, ...career.news].slice(0,15),
    });
  };
  const promote = (p) => {
    if (career.squad.length >= 40) return;
    const rookie = { ...p, id: Date.now() + Math.random(), wage: 65000, contract: 2 };
    const remaining = generated.filter(x => x.id !== p.id);
    setGenerated(remaining);
    updateCareer({
      squad: [...career.squad, rookie],
      youth: { ...youth, recruits: remaining },
      news: [{ week: career.week, type: "info", text: `🌱 Promoted academy talent ${p.firstName} ${p.lastName} to senior list` }, ...career.news].slice(0,15),
    });
  };
  const focusOptions = ["All-rounders", "Key Forwards", "Midfielders", "Key Defenders", "Ruckmen", "Small Forwards"];
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className={`${css.h1} text-3xl`}>YOUTH ACADEMY</div>
          <div className="text-xs text-[#64748B]">Develop talent from the {club.state} zone. Build the next generation.</div>
        </div>
        <div className="flex items-center gap-3">
          <Stat label="Program Level" value={`${youth.programLevel}/5`} accent="#4AE89A" />
          <Stat label="Zone" value={youth.zone} accent="#4ADBE8" />
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className={`${css.panel} p-5 lg:col-span-1 space-y-4`}>
          <div className="flex items-center gap-2"><GraduationCap className="w-5 h-5 text-[#4AE89A]" /><div className="font-bold tracking-wide">Academy Settings</div></div>
          <div>
            <div className={css.label}>Recruitment Zone</div>
            <select value={youth.zone} onChange={e=>updateCareer({ youth: { ...youth, zone: e.target.value }})} className="w-full mt-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-3 py-2 text-sm">
              {STATES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <div className={css.label}>Scout Focus</div>
            <select value={youth.scoutFocus} onChange={e=>updateCareer({ youth: { ...youth, scoutFocus: e.target.value }})} className="w-full mt-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-3 py-2 text-sm">
              {focusOptions.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
          <div>
            <div className={css.label}>Program Level</div>
            <div className="flex gap-1 mt-2">
              {Array.from({length:5}).map((_,i) => <div key={i} className="flex-1 h-3 rounded-full" style={{background: i < youth.programLevel ? "#4AE89A" : "#E2E8F0"}} />)}
            </div>
            <button onClick={upgradeProgram} disabled={youth.programLevel>=5||career.finance.cash<youth.programLevel*80000} className={`${css.btnPrimary} mt-3 text-xs w-full`}>
              {youth.programLevel >= 5 ? "Maxed" : `Upgrade Program · $${(youth.programLevel*80).toFixed(0)}k`}
            </button>
          </div>
          <button onClick={generateRecruits} className={`${css.btnGhost} text-xs w-full`}>Scout New Intake</button>
        </div>

        <div className={`${css.panel} p-5 lg:col-span-2`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2"><Sprout className="w-5 h-5 text-[#4AE89A]" /><div className="font-bold tracking-wide">Current Intake</div></div>
            <div className="text-xs text-[#64748B]">{generated.length} recruit{generated.length !== 1 ? "s" : ""}</div>
          </div>
          {generated.length === 0 ? (
            <div className="text-center py-12 text-sm text-[#64748B]">No recruits yet. Click "Scout New Intake" to find prospects from {youth.zone}.</div>
          ) : (
            <div className="space-y-2 max-h-[60vh] overflow-y-auto">
              {generated.map(p => (
                <div key={p.id} className={`${css.inset} p-3 grid grid-cols-12 gap-2 items-center`}>
                  <div className="col-span-4">
                    <div className="font-semibold text-sm">{p.firstName} {p.lastName}</div>
                    <div className="text-[10px] text-[#64748B]">Age {rand(16,18)} · From {youth.zone}</div>
                  </div>
                  <div className="col-span-1"><Pill color="#4ADBE8">{p.position}</Pill></div>
                  <div className="col-span-2"><RatingDot value={p.overall} /></div>
                  <div className="col-span-2">
                    <div className="text-[10px] text-[#64748B]">Potential</div>
                    <div className="flex items-center gap-1"><span className="text-xs font-bold text-[#4AE89A]">{p.potential}</span><Bar value={p.potential} color="#4AE89A" small /></div>
                  </div>
                  <div className="col-span-3 flex justify-end">
                    <button onClick={()=>promote(p)} className={`${css.btnPrimary} text-xs px-3 py-1.5`}>Promote</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function LocalTab({ career, club, updateCareer }) {
  const [scoutedPlayers, setScoutedPlayers] = useState([]);
  const [scoutingLeague, setScoutingLeague] = useState(null);
  // Find tier-3 leagues in same state, or tier-2 if at tier-1
  const myLeague = findLeagueOf(career.clubId);
  const localPool = LEAGUES_BY_STATE(club.state) || [];
  const localLeagues = localPool.filter(l => l.tier > myLeague.tier);

  const scout = (leagueKey) => {
    seedRng(Date.now() % 88888);
    const league = PYRAMID[leagueKey];
    const found = Array.from({length: 6}, (_, i) => {
      const p = generatePlayer(league.tier, 13000 + i + Date.now() % 500);
      return { ...p, fromLocal: pick(league.clubs).short };
    });
    setScoutedPlayers(found);
    setScoutingLeague(leagueKey);
  };

  const sign = (p) => {
    if (career.finance.cash < 30000 || career.squad.length >= 40) return;
    const newPlayer = { ...p, id: Date.now() + Math.random(), wage: 70000, contract: 2 };
    setScoutedPlayers(s => s.filter(x => x.id !== p.id));
    updateCareer({
      squad: [...career.squad, newPlayer],
      finance: { ...career.finance, cash: career.finance.cash - 30000 },
      news: [{ week: career.week, type: "info", text: `📍 Signed local talent ${p.firstName} ${p.lastName} from ${p.fromLocal}` }, ...career.news].slice(0,15),
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className={`${css.h1} text-3xl`}>LOCAL FOOTBALL</div>
          <div className="text-xs text-[#64748B]">Scout grassroots and lower-tier {club.state} leagues for hidden gems.</div>
        </div>
        <div className="flex items-center gap-3">
          <Stat label="Scout Cost" value="$30k" sub="per signing" accent="#E89A4A" />
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className={`${css.panel} p-5 lg:col-span-1`}>
          <div className="flex items-center gap-2 mb-3"><Map className="w-5 h-5 text-[#E89A4A]" /><div className="font-bold tracking-wide">Lower {club.state} Leagues</div></div>
          {localLeagues.length === 0 ? (
            <div className="text-sm text-[#64748B] py-4">No lower-tier leagues available in {club.state} from your current level.</div>
          ) : (
            <div className="space-y-2">
              {localLeagues.map(l => (
                <button key={l.key} onClick={()=>scout(l.key)} className={`w-full text-left p-3 rounded-lg border transition ${scoutingLeague===l.key ? "border-[#E89A4A] bg-[#E89A4A]/10" : "border-[#E2E8F0] hover:border-[#CBD5E1] bg-[#F8FAFC]"}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold text-sm">{l.short}</div>
                      <div className="text-[10px] text-[#64748B]">{l.name}</div>
                    </div>
                    <Pill color="#4ADBE8">T{l.tier}</Pill>
                  </div>
                  <div className="text-[10px] text-[#64748B] mt-1">{l.clubs.length} clubs · Scout for hidden talent</div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className={`${css.panel} p-5 lg:col-span-2`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2"><Target className="w-5 h-5 text-[#E89A4A]" /><div className="font-bold tracking-wide">Scouting Reports</div></div>
            {scoutingLeague && <div className="text-xs text-[#64748B]">{PYRAMID[scoutingLeague].short}</div>}
          </div>
          {scoutedPlayers.length === 0 ? (
            <div className="text-center py-12 text-sm text-[#64748B]">Pick a league to dispatch your scouts.</div>
          ) : (
            <div className="space-y-2 max-h-[60vh] overflow-y-auto">
              {scoutedPlayers.map(p => (
                <div key={p.id} className={`${css.inset} p-3 grid grid-cols-12 gap-2 items-center`}>
                  <div className="col-span-4">
                    <div className="font-semibold text-sm">{p.firstName} {p.lastName}</div>
                    <div className="text-[10px] text-[#64748B]">From {p.fromLocal} · Age {p.age}</div>
                  </div>
                  <div className="col-span-1"><Pill color="#4ADBE8">{p.position}</Pill></div>
                  <div className="col-span-2"><RatingDot value={p.overall} /></div>
                  <div className="col-span-2">
                    <div className="text-[10px] text-[#64748B]">Potential</div>
                    <div className="flex items-center gap-1"><span className="text-xs font-bold text-[#4AE89A]">{p.potential}</span><Bar value={p.potential} color="#4AE89A" small /></div>
                  </div>
                  <div className="col-span-3 flex justify-end">
                    <button onClick={()=>sign(p)} disabled={career.finance.cash<30000} className={career.finance.cash>=30000 ? `${css.btnPrimary} text-xs px-3 py-1.5` : "px-3 py-1.5 rounded-lg text-xs bg-[#F1F5F9] text-[#CBD5E1]"}>Sign · $30k</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className={`${css.inset} p-4 text-xs text-[#64748B]`}>
        <span className="text-[#E89A4A] font-bold">TIP:</span> Local scouting often unearths late bloomers and gritty depth players. They sign at modest wages but can develop dramatically with the right training program and game time.
      </div>
    </div>
  );
}

// ============================================================================
// COMPETITION SCREEN — Ladder / Fixtures / Pyramid
// ============================================================================
function CompetitionScreen({ career, club, league, tab, setTab }) {
  const t = tab || "ladder";
  const tabs = [
    { key: "ladder", label: "Ladder", icon: BarChart3 },
    { key: "fixtures", label: "Fixtures", icon: Calendar },
    { key: "pyramid", label: "Pyramid", icon: Trophy },
  ];
  return (
    <div className="anim-in">
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
          <div className="text-xs text-[#64748B]">Round {career.week} of {career.fixtures.length} · {league.name}</div>
        </div>
        <div className="flex items-center gap-3">
          <Pill color="#4AE89A">{league.tier === 1 ? "Top 8 = Finals" : "Top 1 = Promoted"}</Pill>
          {league.tier > 1 && <Pill color="#E84A6F">Bottom = Relegated</Pill>}
        </div>
      </div>

      <div className="rounded-2xl overflow-hidden" style={{border:"1px solid #E2E8F0", background:"#FFFFFF"}}>
        <div className="grid grid-cols-12 gap-2 px-4 py-3 text-[10px] uppercase tracking-[0.15em] text-[#94A3B8] font-black border-b" style={{borderColor:"#E2E8F0",background:"#F1F5F9"}}>
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
            <div key={row.id} className={`grid grid-cols-12 gap-2 px-4 py-2.5 items-center border-b border-[#EEF2F6] ${isMe ? "bg-[#E89A4A]/10" : "hover:bg-[#F1F5F9]/50"} transition`}>
              <div className="col-span-1 flex items-center gap-1">
                <span className={`font-bold ${inPromo ? "text-[#4AE89A]" : inReleg ? "text-[#E84A6F]" : "text-[#64748B]"}`}>{pos}</span>
                {inPromo && <ArrowUp className="w-3 h-3 text-[#4AE89A]" />}
                {inReleg && <ArrowDown className="w-3 h-3 text-[#E84A6F]" />}
              </div>
              <div className="col-span-4 flex items-center gap-2">
                <div className="w-2 h-6 rounded-sm" style={{background: c?.colors[0] || "#E2E8F0"}} />
                <span className={isMe ? "font-bold text-[#E89A4A]" : "font-semibold"}>{c?.name || row.id}</span>
                {isMe && <Crown className="w-3 h-3 text-[#E89A4A]" />}
              </div>
              <div className="col-span-1 text-center text-sm">{row.p}</div>
              <div className="col-span-1 text-center text-sm font-bold text-[#4AE89A]">{row.W}</div>
              <div className="col-span-1 text-center text-sm text-[#E84A6F]">{row.L}</div>
              <div className="col-span-1 text-center text-sm text-[#64748B]">{row.D}</div>
              <div className="col-span-1 text-right text-sm font-mono">{row.f}</div>
              <div className="col-span-1 text-right text-sm font-mono text-[#64748B]">{row.a}</div>
              <div className="col-span-1 text-right text-sm font-mono font-bold">{row.a > 0 ? ((row.f/row.a)*100).toFixed(1) : "—"}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function FixturesTab({ career, club, league }) {
  return (
    <div className="space-y-4">
      <div>
        <div className={`${css.h1} text-3xl`}>FIXTURES</div>
        <div className="text-xs text-[#64748B]">Full season schedule · {career.fixtures.length} rounds</div>
      </div>
      <div className="grid md:grid-cols-2 gap-3">
        {career.fixtures.map((round, ri) => {
          const isPlayed = ri < career.week;
          const isCurrent = ri === career.week;
          return (
            <div key={ri} className={`${css.panel} p-4 ${isCurrent ? "ring-2 ring-[#E89A4A]" : ""}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="font-bold tracking-wide">Round {ri+1}</div>
                {isPlayed && <Pill color="#64748B">Played</Pill>}
                {isCurrent && <Pill color="#E89A4A">Up Next</Pill>}
              </div>
              <div className="space-y-1.5">
                {round.map((m, mi) => {
                  const home = findClub(m.home);
                  const away = findClub(m.away);
                  const myMatch = m.home === career.clubId || m.away === career.clubId;
                  const result = isPlayed && m.result;
                  return (
                    <div key={mi} className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm ${myMatch ? "bg-[#E89A4A]/10 border border-[#E89A4A]/30" : "bg-[#F8FAFC]"}`}>
                      <div className="flex items-center gap-2 flex-1">
                        <div className="w-1.5 h-4 rounded-sm" style={{background: home?.colors[0] || "#E2E8F0"}} />
                        <span className={myMatch && m.home === career.clubId ? "font-bold" : ""}>{home?.short || m.home}</span>
                      </div>
                      {result ? (
                        <div className="font-mono font-bold text-xs px-2">{result.hScore}–{result.aScore}</div>
                      ) : (
                        <div className="text-[10px] text-[#64748B] px-2">vs</div>
                      )}
                      <div className="flex items-center gap-2 flex-1 justify-end">
                        <span className={myMatch && m.away === career.clubId ? "font-bold" : ""}>{away?.short || m.away}</span>
                        <div className="w-1.5 h-4 rounded-sm" style={{background: away?.colors[0] || "#E2E8F0"}} />
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
        <div className="text-xs text-[#64748B]">Climb from grassroots to the AFL. You're currently in <span className="text-[#E89A4A] font-bold">{league.short} (Tier {league.tier})</span>.</div>
      </div>

      <div className="space-y-4">
        {/* TIER 1 */}
        <div className={`${css.panel} p-5`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2"><Crown className="w-5 h-5 text-[#FFD200]" /><div className={`${css.h1} text-2xl`}>TIER 1 · NATIONAL</div></div>
            <Pill color="#FFD200">Premier Competition</Pill>
          </div>
          {byTier[1].map(([key, l]) => (
            <div key={key} className={`p-4 rounded-xl ${career.leagueKey===key ? "bg-[#E89A4A]/15 border-2 border-[#E89A4A]" : "bg-gradient-to-r from-[#FFD200]/10 to-transparent border border-[#FFD200]/30"}`}>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <div className="font-bold text-lg">{l.name}</div>
                  <div className="text-xs text-[#64748B]">{l.clubs.length} clubs · Australia-wide</div>
                </div>
                {career.leagueKey===key && <Pill color="#E89A4A">YOU ARE HERE</Pill>}
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {l.clubs.map(c => (
                  <div key={c.id} className={`px-2 py-1 rounded text-[10px] font-bold ${c.id === career.clubId ? "bg-[#E89A4A] text-[#F8FAFC]" : ""}`} style={c.id !== career.clubId ? {background: `${c.colors[0]}33`, color: c.colors[1] === "#FFFFFF" ? "#0F172A" : c.colors[1], border: `1px solid ${c.colors[0]}66`} : {}}>{c.short}</div>
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
                <div key={key} className={`p-3 rounded-xl ${isCurrent ? "bg-[#E89A4A]/15 border-2 border-[#E89A4A]" : myStateLeague ? "bg-[#4ADBE8]/10 border border-[#4ADBE8]/40" : "bg-[#F8FAFC] border border-[#E2E8F0] opacity-60"}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold text-sm">{l.short}</div>
                      <div className="text-[10px] text-[#64748B]">{l.state} · {l.clubs.length} clubs</div>
                    </div>
                    {isCurrent && <Pill color="#E89A4A">HERE</Pill>}
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
            <div className="text-sm text-[#64748B] py-4">No tier 3 leagues currently in this build.</div>
          ) : (
            <div className="grid md:grid-cols-3 gap-2">
              {byTier[3].map(([key, l]) => {
                const myStateLeague = isMyState(l);
                const isCurrent = career.leagueKey === key;
                return (
                  <div key={key} className={`p-3 rounded-lg ${isCurrent ? "bg-[#E89A4A]/15 border-2 border-[#E89A4A]" : myStateLeague ? "bg-[#4AE89A]/10 border border-[#4AE89A]/30" : "bg-[#F8FAFC] border border-[#E2E8F0] opacity-60"}`}>
                    <div className="font-bold text-xs">{l.short}</div>
                    <div className="text-[10px] text-[#64748B]">{l.clubs.length} clubs</div>
                    {isCurrent && <div className="mt-1"><Pill color="#E89A4A">HERE</Pill></div>}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className={`${css.inset} p-4 text-xs text-[#64748B]`}>
        <span className="text-[#E89A4A] font-bold">PROMOTION:</span> Win your league to climb a tier. The AFL is the summit — once there, chase the flag. The game tracks your full journey, season-by-season, from grassroots to glory.
      </div>
    </div>
  );
}
