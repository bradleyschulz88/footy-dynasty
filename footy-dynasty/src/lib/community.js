// ---------------------------------------------------------------------------
// Community Culture Systems (Spec Section 3) + minimal journalist stub.
// Tier-gated:
//   tier === 3 → full community feel (committee, meat tray, ramshackle ground)
//   tier === 2 → partial (committee, post-match function instead of meat tray)
//   tier === 1 → professional equivalents (board, sponsor cocktail evening)
// ---------------------------------------------------------------------------
import { rng, rand, pick } from './rng.js';
import { FIRST_NAMES, LAST_NAMES } from './playerGen.js';
import { clamp } from './format.js';

const pickName = () => `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`;

// =============================================================================
// 3A — Volunteer Committee
// =============================================================================
export const COMMITTEE_ROLES = [
  { role: 'President',           trait: 'old_school', startMood: 70 },
  { role: 'Treasurer',           trait: 'cautious',   startMood: 65 },
  { role: 'Social Coordinator',  trait: 'community',  startMood: 75 },
  { role: 'Head Trainer',        trait: 'loyal',      startMood: 70 },
  { role: 'Local Recruiter',     trait: 'connected',  startMood: 65 },
];

export const COMMITTEE_TRAITS = {
  old_school: {
    loves: 'Hard-nosed defenders, loyalty, tradition',
    hates: 'Spending money on unknowns, dropping veterans',
  },
  cautious: {
    loves: 'Sponsor deals, budget discipline, cost control',
    hates: 'Overspending, expensive facilities, footy trips',
  },
  community: {
    loves: 'Footy trips, post-match functions, community events',
    hates: 'Being ignored, low crowd games',
  },
  loyal: {
    loves: 'Players staying healthy, fitness drills, being consulted',
    hates: 'Medical-facility upgrades that make him feel replaced',
  },
  connected: {
    loves: 'Local signings, youth development, community ties',
    hates: 'Signing players from outside the zone, ignored tips',
  },
};

// Generate the five-person committee at career creation (Tier 2/3 only).
export function generateCommittee(leagueTier) {
  if (leagueTier === 1) return [];
  return COMMITTEE_ROLES.map(r => ({ ...r, name: pickName(), mood: r.startMood }));
}

export function getCommitteeMember(career, role) {
  return (career.committee || []).find(m => m.role === role) || null;
}

// Apply a mood delta to a committee member by role. Returns a new committee array.
export function bumpCommitteeMood(committee, role, delta) {
  if (!Array.isArray(committee)) return committee;
  return committee.map(m =>
    m.role === role ? { ...m, mood: clamp(m.mood + delta, 0, 100) } : m,
  );
}

export function committeeMoodAverage(committee) {
  if (!Array.isArray(committee) || committee.length === 0) return 100;
  return Math.round(committee.reduce((a, m) => a + m.mood, 0) / committee.length);
}

function moodTone(mood) {
  if (mood >= 70) return 'warm';
  if (mood >= 40) return 'neutral';
  return 'critical';
}

// Generate a flavour news entry from a committee member based on a trigger.
// Returns { type, text } or null.
export function committeeMessage(career, role, trigger, ctx = {}) {
  const m = getCommitteeMember(career, role);
  if (!m) return null;
  const tone = moodTone(m.mood);
  const T = MESSAGE_TEMPLATES[role]?.[trigger]?.[tone];
  if (!T) return null;
  const text = T
    .replace('{name}', m.name)
    .replace('{managerName}', career.managerName || 'Coach')
    .replace('{clubName}', ctx.clubName || '')
    .replace('{localClub}', ctx.localClub || 'a local side')
    .replace('{playerName}', ctx.playerName || 'one of the lads')
    .replace('{season}', String(ctx.season || career.season || ''));
  return { type: 'committee', text };
}

const MESSAGE_TEMPLATES = {
  President: {
    win: {
      warm:     '{name} sends his congratulations. Good, tough footy — exactly what this club is about.',
      neutral:  '{name} acknowledges the win. He expects more of the same.',
      critical: '{name} grudgingly notes the win, but the standards are still slipping.',
    },
    drop_veteran: {
      warm:     '{name} dropped you a line about the team selection. He understands, but he\'s watching.',
      neutral:  '{name} left a voicemail. He wants to talk about the team selection.',
      critical: '{name} is furious about the team selection. The veterans built this club.',
    },
    premiership: {
      warm:     '{name} broke down on the dais. "This is what it\'s all about. Thank you, {managerName}."',
      neutral:  '{name} congratulates the group on the flag. Long overdue, he says.',
      critical: '{name} congratulates the group on the flag. He hopes the vibe changes too.',
    },
  },
  Treasurer: {
    cash_negative: {
      warm:     '{name} flags that we ran a loss this week. Nothing to panic about, but worth a chat.',
      neutral:  '{name} has flagged that expenses exceeded income this week. He\'d like a meeting.',
      critical: '{name} is openly shaking his head at this week\'s books. The board will hear about it.',
    },
    good_sponsor: {
      warm:     '{name} is over the moon with that sponsor deal. Good work, Coach.',
      neutral:  '{name} approves of the new sponsor signing.',
      critical: '{name} concedes it\'s a decent deal — about time something went right.',
    },
    footy_trip: {
      warm:     '{name} shakes his head at the trip costs but agrees to sign off.',
      neutral:  '{name} is grumbling about the trip budget.',
      critical: '{name} sent a curt email about the trip. He\'s formally objecting in the minutes.',
    },
  },
  'Social Coordinator': {
    propose_trip: {
      warm:     '{name} is keen as mustard on this year\'s footy trip. She\'s got three options ready.',
      neutral:  '{name} would like to discuss this year\'s footy trip when you get a moment.',
      critical: '{name} reluctantly raises the trip topic. Says nobody seems excited this year.',
    },
    trip_approved: {
      warm:     '{name} says the trip was a huge success. She\'s already getting ideas for next year.',
      neutral:  '{name} confirms the trip was a positive experience for the group.',
      critical: '{name} reports the trip was OK. The mood on the bus said otherwise.',
    },
    trip_declined: {
      warm:     '{name} took the trip cancellation graciously. Maybe next year.',
      neutral:  '{name} is disappointed about the cancellation but understands.',
      critical: '{name} is furious about cancelling the trip. The boys are sulking.',
    },
  },
  'Head Trainer': {
    no_injuries: {
      warm:     '{name} is buzzing — full availability for the round. "Best week of training all year."',
      neutral:  '{name} reports a clean injury list this week.',
      critical: '{name} grudgingly admits training went OK. He\'s still annoyed about the medical setup.',
    },
    injury_storm: {
      warm:     '{name} is stretched thin on the rub-down table. He needs a hand.',
      neutral:  '{name} has flagged we need more help in the medical room.',
      critical: '{name} is openly questioning the medical staff. "I told them this would happen."',
    },
    medical_upgrade: {
      warm:     '{name} accepts the medical upgrade — but reminds you he\'s been here for 20 years.',
      neutral:  '{name} silently fumes about being replaced by the new medical setup.',
      critical: '{name} is talking about retirement after the medical upgrade. He feels finished.',
    },
  },
  'Local Recruiter': {
    tip: {
      warm:     '{name} reckons there\'s a kid playing for {localClub} worth a long look. Worth a phone call.',
      neutral:  '{name} mentions a player at {localClub} the recruiters should track.',
      critical: '{name} says he\'s heard about a kid at {localClub} but doubts you\'ll listen.',
    },
    local_signing: {
      warm:     '{name} couldn\'t be prouder of {playerName}. Local kid done good.',
      neutral:  '{name} approves of the {playerName} signing. Local connections matter.',
      critical: '{name} reluctantly admits the {playerName} signing was the right call.',
    },
    outside_signing: {
      warm:     '{name} understands the {playerName} signing but reminds you about the locals on the list.',
      neutral:  '{name} questions why a local couldn\'t fill that spot.',
      critical: '{name} sent a sharp note about the {playerName} signing. He\'s done with being ignored.',
    },
  },
};

// =============================================================================
// 3B — Footy Trip
// =============================================================================
export const FOOTY_TRIP_OPTIONS = [
  { id: 'local',     label: 'Local trip',     cost:  2000, moraleGain:  6, treasurerHit:  -6, mentor: false, drama: false, blurb: 'Day trip to the next town. Pub counter meal, a few quiet beers.' },
  { id: 'regional',  label: 'Regional trip',  cost:  5000, moraleGain: 10, treasurerHit: -10, mentor: true,  drama: false, blurb: 'Three-hour bus ride to a country pub. The veterans look after the kids.' },
  { id: 'interstate',label: 'Interstate trip',cost: 12000, moraleGain: 15, treasurerHit: -16, mentor: true,  drama: true,  blurb: 'Full weekend interstate. The boys will talk about this one for years.' },
];

// Apply a footy-trip outcome to the squad. Returns { squad, news, committee }.
export function applyFootyTrip(career, optionId) {
  const opt = FOOTY_TRIP_OPTIONS.find(o => o.id === optionId);
  if (!opt) return null;

  let squad = (career.squad || []).map(p => ({ ...p, morale: clamp((p.morale ?? 70) + opt.moraleGain, 0, 100) }));
  let committee = bumpCommitteeMood(career.committee, 'Social Coordinator', 12);
  committee     = bumpCommitteeMood(committee,        'Treasurer',          opt.treasurerHit);

  const news = [];
  // Mentor bond on regional/interstate
  if (opt.mentor && squad.length >= 2) {
    const veterans = squad.filter(p => (p.age ?? 24) >= 28);
    const youths   = squad.filter(p => (p.age ?? 24) <= 20);
    if (veterans.length && youths.length) {
      const v = pick(veterans);
      const y = pick(youths);
      squad = squad.map(p => {
        if (p.id === y.id) return { ...p, mentor: v.id };
        return p;
      });
      news.push({ type: 'committee', text: `${v.firstName} ${v.lastName} took ${y.firstName} ${y.lastName} under his wing on the trip. A mentor bond has formed.` });
    }
  }
  // Party-animal drama on interstate
  if (opt.drama && squad.length) {
    const partyAnimals = squad.filter(p => (p.traits || []).includes('party_animal'));
    const candidate = partyAnimals.length ? pick(partyAnimals) : pick(squad);
    squad = squad.map(p => {
      if (p.id === candidate.id) return { ...p, morale: clamp((p.morale ?? 70) - 3, 0, 100) };
      return { ...p, morale: clamp((p.morale ?? 70) + 4, 0, 100) };
    });
    news.push({ type: 'committee', text: `${candidate.firstName} ${candidate.lastName} had a big night on the trip. He's back in training but the boys are still talking about it.` });
  }
  return { squad, committee, news };
}

// =============================================================================
// 3C — Meat Tray Raffle (Tier 3 only) / equivalents at higher tiers
// =============================================================================
export function postMatchFundraiser(career, tier, isHomeGame) {
  if (!isHomeGame) return null;
  if (tier === 3) {
    const income = rand(150, 400);
    const winnerRoll = rand(0, 100);
    if (winnerRoll < 20 && (career.squad || []).length > 0) {
      const winner = pick(career.squad);
      return {
        income,
        news: { type: 'committee', text: `Congrats to ${winner.firstName} ${winner.lastName} who won the meat tray tonight. Donated it back to the kitchen. Legend.` },
        moralePlayerId: winner.id,
        moraleDelta: 4,
      };
    }
    return { income, news: { type: 'committee', text: `Tonight's meat tray raffle raised $${income} for the club. A community staple.` } };
  }
  if (tier === 2) {
    const income = rand(1000, 3000);
    return { income, news: { type: 'committee', text: `Post-match function pulled in $${income} this evening. Solid night for the club.` } };
  }
  if (tier === 1) {
    const income = rand(8000, 20000);
    return { income, news: { type: 'committee', text: `The corporate sponsor cocktail evening raised $${income}. Suits and tinnies, in equal measure.` } };
  }
  return null;
}

// =============================================================================
// 3D — Ground Conditions
// =============================================================================
export const WEATHER_OPTIONS = ['fine', 'fine', 'fine', 'wind', 'rain', 'rain'];

export function rollWeeklyWeather() {
  return pick(WEATHER_OPTIONS);
}

export function ensureWeatherForWeek(career, week) {
  if (!career.weeklyWeather) career.weeklyWeather = {};
  if (!career.weeklyWeather[week]) career.weeklyWeather[week] = rollWeeklyWeather();
  return career.weeklyWeather[week];
}

// Stadium-level floor: a level-5 stadium can never drop below 80.
const STADIUM_FLOOR = [20, 35, 50, 65, 80];

export function applyGroundDegradation(currentCondition, weather, stadiumLevel) {
  const degradation = weather === 'rain' ? rand(8, 15)
                    : weather === 'wind' ? rand(3, 6)
                    :                       rand(1, 3);
  const floor = STADIUM_FLOOR[(stadiumLevel || 1) - 1] ?? 20;
  return Math.max(floor, clamp(currentCondition - degradation, 0, 100));
}

export function recoverGroundPreseason(currentCondition) {
  return clamp(currentCondition + rand(10, 20), 0, 100);
}

export function groundConditionBand(condition) {
  if (condition >= 85) return { label: 'Perfect',     desc: 'Firm, true, well-grassed',                color: '#4AE89A', scoringMod: 1.00, accuracyMod: 1.00 };
  if (condition >= 65) return { label: 'Good',        desc: 'Some wear patches but playable',          color: 'var(--A-accent)', scoringMod: 0.98, accuracyMod: 1.00 };
  if (condition >= 45) return { label: 'Heavy',       desc: 'Ball sits up, footing uncertain',         color: '#FFB347', scoringMod: 0.90, accuracyMod: 0.95 };
  if (condition >= 25) return { label: 'Boggy',       desc: 'The ground is cutting up badly',          color: '#E89A4A', scoringMod: 0.80, accuracyMod: 0.85 };
  return                   { label: 'Unplayable', desc: 'Mud, puddles, chaos',                     color: '#E84A6F', scoringMod: 0.70, accuracyMod: 0.75 };
}

// Stadium-level descriptions used on match pre-game / hub.
export const STADIUM_DESCRIPTIONS = [
  'The home oval — one toilet block, a shed, a scoreboard someone painted by hand.',
  'A modest ground with basic facilities. The boundary line is freshly marked.',
  'A proper community ground. Covered seating for 500, a functioning canteen.',
  'A solid regional venue. Media box, full grandstand, professional presentation.',
  'A major ground. Corporate boxes, digital scoreboard, sold-out atmosphere.',
];

export function stadiumDescription(level) {
  return STADIUM_DESCRIPTIONS[clamp((level || 1) - 1, 0, 4)];
}

// =============================================================================
// Minimal journalist stub (Section 8 placeholder)
// =============================================================================
export function generateJournalist() {
  return {
    name: pickName(),
    satisfaction: 50,
    tone: pick(['supportive', 'neutral', 'critical']),
  };
}

// Adjust journalist satisfaction based on a result delta and produce a one-liner.
export function bumpJournalist(j, delta) {
  if (!j) return j;
  return { ...j, satisfaction: clamp((j.satisfaction ?? 50) + delta, 0, 100) };
}

export function journalistMatchLine(career, result, club, opp) {
  const j = career.journalist || generateJournalist();
  const tone = j.satisfaction >= 60 ? 'supportive'
             : j.satisfaction <= 35 ? 'critical' : 'neutral';
  const margin = Math.abs((result?.myTotal ?? 0) - (result?.oppTotal ?? 0));
  if (result?.won && margin > 30) {
    return tone === 'critical'
      ? `${j.name}: "Big win, sure, but it papers over the cracks."`
      : `${j.name}: "${club.name} were ruthless. Best performance of the year."`;
  }
  if (result?.won) {
    return tone === 'critical'
      ? `${j.name}: "Took the four points but unconvincing."`
      : `${j.name}: "Workmanlike from ${club.name}. Job done."`;
  }
  if (result?.drew) return `${j.name}: "Honours even at ${club.name}'s home ground."`;
  if (margin > 40) {
    return tone === 'supportive'
      ? `${j.name}: "Tough day. The coaching staff will regroup."`
      : `${j.name}: "Damning result. Questions will be asked."`;
  }
  return tone === 'supportive'
    ? `${j.name}: "A loss, but the effort was there."`
    : `${j.name}: "Another defeat that will keep the board talking."`;
}

// =============================================================================
// Player traits stub
// =============================================================================
export const PLAYER_TRAITS = ['party_animal', 'leader', 'mentor', 'workhorse', 'showman'];

// Roll 0–1 traits per player at generation. Helper for tests + seed code.
export function rollPlayerTrait() {
  if (rng() > 0.20) return null;
  return pick(PLAYER_TRAITS);
}
