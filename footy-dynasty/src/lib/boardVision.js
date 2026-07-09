// ---------------------------------------------------------------------------
// Board vision — a multi-season mandate layered on the per-season objectives.
// The board sets a target with a deadline; it's judged at season end. Pure and
// deterministic: no rng decides the outcome.
// ---------------------------------------------------------------------------

const HORIZON = 3;      // seasons to deliver the mandate
const REWARD = 12;      // board-confidence lift on achievement
const PENALTY = 15;     // board-confidence hit on a missed deadline

export const VISION_TYPES = {
  finals_by:   { label: 'Reach the finals',        desc: 'Reach the finals' },
  solvency_by: { label: 'Stay solvent & competitive', desc: 'Keep the club solvent and competitive' },
};

/** A fresh mandate for the tier, running HORIZON seasons from `season`. */
export function defaultVision(season, tier) {
  const type = tier <= 2 ? 'finals_by' : 'solvency_by';
  const targetSeason = (season ?? 0) + HORIZON;
  return {
    type,
    description: `${VISION_TYPES[type].desc} by ${targetSeason}.`,
    startSeason: season ?? 0,
    targetSeason,
    reward: REWARD,
    penalty: PENALTY,
  };
}

/** Whether the mandate's goal is satisfied by this season's outcome. */
function goalMet(vision, ctx) {
  if (vision.type === 'finals_by') return !!ctx.madeFinals || !!ctx.champion;
  if (vision.type === 'solvency_by') return (ctx.cash ?? 0) >= 0;
  return false;
}

/**
 * Evaluate a mandate against a season's outcome.
 * @param {object} vision  career.board.vision
 * @param {{madeFinals?:boolean, champion?:boolean, cash?:number, season:number}} ctx
 * @returns {{achieved:boolean, expired:boolean, lines:string[], confidenceDelta:number, nextVision:object}}
 */
export function evaluateBoardVision(vision, ctx) {
  const season = ctx.season ?? vision?.startSeason ?? 0;
  const met = !!vision && goalMet(vision, ctx);
  const deadlineReached = !!vision && season >= vision.targetSeason;

  // finals_by can be met early; solvency_by is only judged at the deadline.
  const achieved = vision?.type === 'solvency_by' ? (deadlineReached && met) : met;
  const expired = !achieved && deadlineReached;

  if (!vision || (!achieved && !expired)) {
    return { achieved: false, expired: false, lines: [], confidenceDelta: 0, nextVision: vision };
  }
  const nextVision = defaultVision(season + 1, ctx.tier ?? (vision.type === 'finals_by' ? 1 : 3));
  if (achieved) {
    return {
      achieved: true, expired: false,
      lines: [`🎯 Board mandate achieved: ${VISION_TYPES[vision.type].desc.toLowerCase()} — the board is delighted.`],
      confidenceDelta: vision.reward ?? REWARD,
      nextVision,
    };
  }
  return {
    achieved: false, expired: true,
    lines: [`🎯 Board mandate missed: ${vision.description} Patience is wearing thin.`],
    confidenceDelta: -(vision.penalty ?? PENALTY),
    nextVision,
  };
}

/** UI summary: text + seasons remaining (urgent in the final season). */
export function visionSummary(vision, season) {
  if (!vision) return null;
  const seasonsLeft = Math.max(0, vision.targetSeason - (season ?? vision.startSeason));
  return {
    text: vision.description,
    seasonsLeft,
    urgent: seasonsLeft <= 1,
  };
}
