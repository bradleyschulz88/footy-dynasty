// Tutorial step definitions (pure data). UI helpers stay in TutorialOverlay.jsx.
// Redesigned to teach the core game loop: Advance → Event → Result cycle.

export const TUTORIAL_STEPS = [
  {
    step: 0,
    title: "WELCOME, COACH",
    intro: "You're in charge now. Here's how the game works — it'll take 60 seconds.",
    instruction:
      "Tap NEXT to walk through the basics. You can skip anytime and learn by doing. Nothing is locked while you read.",
    targetScreen: "hub",
    targetTab: null,
    advanceWithNext: true,
  },
  {
    step: 1,
    title: "THE ADVANCE BUTTON",
    intro: "Time only moves when you say so.",
    instruction:
      "Hit ADVANCE in the top bar (or press Space) to progress through the season. Each click steps through one event — a training session, a match, a board update, or a news story. You set the pace.",
    targetScreen: "hub",
    targetTab: null,
    advanceWithNext: true,
  },
  {
    step: 2,
    title: "MATCH DAY",
    intro: "When a match is due, ADVANCE takes you into the game.",
    instruction:
      "Your squad selection, tactics and fitness decide the result. Wins build board confidence; too many losses and the board gets nervous. Set your lineup in Squad → Tactics before the season kicks off.",
    targetScreen: "hub",
    targetTab: null,
    advanceWithNext: true,
  },
  {
    step: 3,
    title: "BOARD CONFIDENCE",
    intro: "The board hired you with expectations. Keep them on-side.",
    instruction:
      "Confidence drops with losses and rises with wins. If it falls too low the board calls a vote — survive it or lose your job. Check Club → Board anytime to see their objectives and your current standing.",
    targetScreen: "hub",
    targetTab: null,
    advanceWithNext: true,
  },
  {
    step: 4,
    title: "THE LADDER",
    intro: "Where you finish is everything.",
    instruction:
      "The competition table is how the board and fans judge you. Finish top-half to keep your job. Make top-four for finals. Win the flag to write your dynasty. Find it in the Competition screen anytime.",
    targetScreen: "hub",
    targetTab: null,
    advanceWithNext: true,
  },
  {
    step: 5,
    title: "START THE SEASON",
    intro: "You know enough. The rest you'll learn by doing.",
    instruction:
      "Hit ADVANCE in the top bar to begin. Events play out one at a time — training, matches, board meetings, news. Manage week by week. Good luck, coach.",
    targetScreen: "hub",
    targetTab: null,
    advanceWithNext: false,
    completesOnCalendarAdvance: true,
  },
];
