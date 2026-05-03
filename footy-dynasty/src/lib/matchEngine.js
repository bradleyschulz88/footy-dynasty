import { rand, randNorm } from './rng.js';
import { findClub } from '../data/pyramid.js';

export const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

export function teamRating(squad, lineup, training, facilitiesAvg, staffAvg) {
  const top22 = lineup && lineup.length
    ? lineup.map(id => squad.find(p => p.id === id)).filter(Boolean)
    : squad.slice().sort((a, b) => b.overall - a.overall).slice(0, 22);
  if (top22.length === 0) return 50;
  const avgOverall  = top22.reduce((a, b) => a + (b.trueRating || b.overall), 0) / top22.length;
  const avgForm     = top22.reduce((a, b) => a + b.form, 0) / top22.length;
  const avgFitness  = top22.reduce((a, b) => a + b.fitness, 0) / top22.length;
  const trainingBoost = (training.intensity - 50) * 0.04;
  return avgOverall
    + (avgForm - 70) * 0.15
    + (avgFitness - 90) * 0.1
    + trainingBoost
    + (facilitiesAvg - 1) * 1.2
    + (staffAvg - 60) * 0.15;
}

export function simMatch(home, away, isPlayerHome, playerStrength) {
  const hAdv = 4;
  const hStr = isPlayerHome ? playerStrength + hAdv : home.rating + hAdv;
  const aStr = !isPlayerHome ? playerStrength : away.rating;
  const diff = hStr - aStr;
  const expHome = clamp(80 + diff * 1.6, 30, 160);
  const expAway = clamp(80 - diff * 1.6, 30, 160);
  const hScore = Math.max(20, Math.round(randNorm(expHome, 18)));
  const aScore = Math.max(20, Math.round(randNorm(expAway, 18)));
  const hGoals = Math.floor(hScore / 6) + (hScore % 6 > 3 ? 1 : 0);
  const hBeh   = Math.max(0, Math.round((hScore - hGoals * 6) / 1) + rand(2, 9));
  const aGoals = Math.floor(aScore / 6) + (aScore % 6 > 3 ? 1 : 0);
  const aBeh   = Math.max(0, Math.round((aScore - aGoals * 6) / 1) + rand(2, 9));
  const homeTotal = hGoals * 6 + hBeh;
  const awayTotal = aGoals * 6 + aBeh;
  return {
    homeGoals: hGoals, homeBehinds: hBeh, homeTotal,
    awayGoals: aGoals, awayBehinds: aBeh, awayTotal,
    winner: homeTotal === awayTotal ? "draw" : homeTotal > awayTotal ? "home" : "away",
  };
}

function splitAcrossQuarters(total, n) {
  const parts = [];
  let rem = total;
  for (let i = 0; i < n - 1; i++) {
    const q = rem > 0 ? Math.floor(Math.random() * Math.ceil(rem * 0.6 + 1)) : 0;
    parts.push(q);
    rem -= q;
  }
  parts.push(Math.max(0, rem));
  return parts;
}

export function simMatchWithQuarters(home, away, isPlayerHome, playerStrength) {
  const result = simMatch(home, away, isPlayerHome, playerStrength);
  const hGQ = splitAcrossQuarters(result.homeGoals, 4);
  const hBQ = splitAcrossQuarters(result.homeBehinds, 4);
  const aGQ = splitAcrossQuarters(result.awayGoals, 4);
  const aBQ = splitAcrossQuarters(result.awayBehinds, 4);
  const quarters = [0, 1, 2, 3].map(i => ({
    homeGoals: hGQ[i],   homeBehinds: hBQ[i],
    homeTotal: hGQ[i] * 6 + hBQ[i],
    awayGoals: aGQ[i],   awayBehinds: aBQ[i],
    awayTotal: aGQ[i] * 6 + aBQ[i],
  }));
  return { ...result, quarters };
}

export function aiClubRating(clubId, tier) {
  const c = findClub(clubId);
  if (!c) return 60;
  const tierMean = tier === 1 ? 75 : tier === 2 ? 60 : 48;
  const sum = c.id.split("").reduce((a, ch) => a + ch.charCodeAt(0), 0);
  return tierMean + ((sum % 17) - 8);
}
