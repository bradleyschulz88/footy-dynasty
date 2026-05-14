// Derby detection — same-city / rivalry flavour for fixtures.

import { findClub } from '../data/pyramid.js';

/** City keys shared by multiple clubs (manual map for pyramid data). */
const CITY_GROUPS = [
  ['melbourne', 'carlton', 'collingwood', 'essendon', 'hawthorn', 'melbourne', 'north', 'richmond', 'st-kilda', 'western-bulldogs'],
  ['adelaide', 'port-adelaide'],
  ['brisbane', 'gold-coast'],
  ['sydney', 'gws'],
  ['perth', 'west-coast', 'fremantle'],
  ['geelong'],
];

function clubCityKey(club) {
  if (!club) return null;
  const id = String(club.id || '').toLowerCase();
  const city = String(club.city || club.region || '').toLowerCase();
  for (const group of CITY_GROUPS) {
    if (group.some((g) => id.includes(g) || city.includes(g))) return group[0];
  }
  return city || id.split('-')[0] || null;
}

/** True when two clubs share a derby city bucket. */
export function isDerbyMatch(homeId, awayId) {
  const h = findClub(homeId);
  const a = findClub(awayId);
  const hk = clubCityKey(h);
  const ak = clubCityKey(a);
  return hk && ak && hk === ak && homeId !== awayId;
}

/** Short label for UI ribbons. */
export function derbyLabel(homeId, awayId) {
  if (!isDerbyMatch(homeId, awayId)) return null;
  return '🔥 Derby';
}
