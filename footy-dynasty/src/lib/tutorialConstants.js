// Tutorial step definitions (pure data). UI helpers stay in TutorialOverlay.jsx.

export const TUTORIAL_STEPS = [
  {
    step: 0,
    title: "WELCOME TO FOOTY DYNASTY",
    intro: "You're the new coach. Take this place from where it is to where it deserves to be.",
    instruction:
      "Tap NEXT to begin. Until you finish or skip, only the Hub and steps called out in the card are available.",
    targetScreen: "hub",
    targetTab: null,
    advanceWithNext: true,
  },
  {
    step: 1,
    title: "MEET YOUR SQUAD",
    intro: "These are your players.",
    instruction:
      "Open Squad in the side nav (highlighted). Then open the Players tab and tap a player card for their profile.",
    targetScreen: "squad",
    targetTab: "players",
    advanceWithNext: false,
  },
  {
    step: 2,
    title: "SET YOUR TRAINING",
    intro: "How they train shapes how they play.",
    instruction: "Stay in Squad and open the Training tab (highlighted). Move the intensity slider and pick a focus.",
    targetScreen: "squad",
    targetTab: "training",
    advanceWithNext: false,
  },
  {
    step: 3,
    title: "CHECK YOUR FINANCES",
    intro: "Know your numbers.",
    instruction:
      "Open Club in the side nav. Under Commercial pick Finances for cashflow, or Contracts after season roll for player & staff renewals. You'll come back for sponsors next.",
    targetScreen: "club",
    targetTab: "finances",
    advanceWithNext: false,
  },
  {
    step: 4,
    title: "SIGN A SPONSOR",
    intro: "Sponsors keep the lights on.",
    instruction: "Stay in Club. Open Commercial if needed, then Sponsors (highlighted) and accept at least one shirt deal.",
    targetScreen: "club",
    targetTab: "sponsors",
    advanceWithNext: false,
    requiresSponsor: true,
  },
  {
    step: 5,
    title: "PICK YOUR BEST 22",
    intro: "Selection is a coach's sharpest tool.",
    instruction: "Open Squad → Tactics (highlighted). Build your match-day 22 and choose a tactic.",
    targetScreen: "squad",
    targetTab: "tactics",
    advanceWithNext: false,
  },
  {
    step: 6,
    title: "PLAY YOUR FIRST MATCH",
    intro: "The season is waiting.",
    instruction: "Use ADVANCE in the top bar (highlighted) when you're ready. That finishes the tutorial.",
    targetScreen: "hub",
    targetTab: null,
    advanceWithNext: false,
    completesOnCalendarAdvance: true,
  },
];
