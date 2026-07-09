// ---------------------------------------------------------------------------
// Sponsor tiers + negotiation stance. Pure helpers layered on the existing
// sponsor system: a tier badge (presentational ordering) and a value↔term
// trade-off applied before signing. No rng — the stance transform is exact.
// ---------------------------------------------------------------------------

const num = (v) => (Number.isFinite(v) ? v : 0);

/** Tier classification (Major / Apparel / Minor) from a sponsor/offer's type. */
export function sponsorTier(offer) {
  const t = String(offer?.type ?? '').toLowerCase();
  if (t === 'major' || t === 'premier' || t === 'stadium') {
    return { key: 'major', label: 'Major', color: 'var(--A-accent)' };
  }
  if (t === 'apparel') {
    return { key: 'apparel', label: 'Apparel', color: '#46d6c6' };
  }
  return { key: 'minor', label: 'Minor', color: 'var(--A-text-mute)' };
}

/** Negotiation stances offered on each deal. */
export const SPONSOR_STANCES = [
  { key: 'balanced', label: 'Balanced',    desc: 'As offered' },
  { key: 'value',    label: 'Front-loaded', desc: 'More cash now, one year shorter' },
  { key: 'term',     label: 'Long-term',    desc: 'Lower annual value, longer security' },
];

const VALUE_STANCE_MULT = 1.18; // front-loaded: +18% value, −1 yr
const TERM_STANCE_MULT = 0.90;  // long-term: −10% value, +2 yrs
const TERM_STANCE_YEARS = 2;

/**
 * Transform an offer's headline value + term by stance.
 * @returns {{annualValue:number, yearsLeft:number}} floored at 1 year; NaN-safe.
 */
export function negotiateStance(offer, stance) {
  const base = Math.max(0, Math.round(num(offer?.annualValue)));
  const years = Math.max(1, Math.round(num(offer?.yearsLeft)) || 1);
  if (stance === 'value') {
    return { annualValue: Math.round(base * VALUE_STANCE_MULT), yearsLeft: Math.max(1, years - 1) };
  }
  if (stance === 'term') {
    return { annualValue: Math.round(base * TERM_STANCE_MULT), yearsLeft: years + TERM_STANCE_YEARS };
  }
  return { annualValue: base, yearsLeft: years };
}
