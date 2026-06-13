// ---------------------------------------------------------------------------
// Job search — browse & apply while employed.
//
// Listings come from generateJobMarket() (filtered to the coach's tier). The
// player applies; reputation gates the outcome:
//   • rep >= the club's reputation bar → an interview, then an offer to sign.
//   • rep <  the bar                    → a polite rejection with feedback.
// Applications are capped per season so you can't brute-force long shots.
// ---------------------------------------------------------------------------

export const MAX_APPLICATIONS_PER_SEASON = 3;

/** Current-season application ledger, reset whenever the season rolls over. */
export function applicationsState(career) {
  const a = career?.jobApplications;
  if (!a || a.season !== career?.season) {
    return { season: career?.season ?? 0, used: 0, results: {} };
  }
  return { season: a.season, used: a.used ?? 0, results: a.results || {} };
}

export function applicationsRemaining(career) {
  return Math.max(0, MAX_APPLICATIONS_PER_SEASON - applicationsState(career).used);
}

/** Status for a specific club this season: 'rejected' | 'offer' | undefined. */
export function applicationStatus(career, clubId) {
  return applicationsState(career).results[clubId];
}

export function canApply(career, offer) {
  if (!offer) return false;
  if (applicationStatus(career, offer.clubId)) return false; // already applied
  return applicationsRemaining(career) > 0;
}

/** Pure outcome of an application — does NOT mutate. */
export function evaluateApplication(career, offer) {
  const rep = career?.coachReputation ?? 30;
  const bar = offer?.minReputation ?? 0;
  if (rep >= bar) return { outcome: "interview" };
  return {
    outcome: "rejected",
    reason: `${offer.clubName} want a coach rated ${bar}+. You're on ${rep} — they've gone with someone else for now. Build your reputation and try again.`,
  };
}

/** Career patch that records an application result and decrements the budget. */
export function recordApplication(career, offer, result) {
  const st = applicationsState(career);
  return {
    jobApplications: {
      season: career.season,
      used: st.used + 1,
      results: { ...st.results, [offer.clubId]: result },
    },
  };
}
