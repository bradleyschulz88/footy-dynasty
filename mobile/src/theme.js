// Shared visual language for the mobile app — mirrors the web's official-AFL tokens.
export const C = {
  bg: "#001325",
  bg2: "#001E3C",
  panel: "#0A2742",
  panel2: "#0F3358",
  line: "rgba(143,166,188,0.18)",
  line2: "rgba(143,166,188,0.30)",
  text: "#F4F8FD",
  dim: "#B7C9DD",
  mute: "#8FA6BC",
  sky: "#0091DA",
  sky2: "#4FB6E8",
  red: "#E4002B",
  pos: "#2FB56B",
  gold: "#E0A43B",
};

// 1–5 star tier from an overall rating (same bands as the web footy-card).
export function starTier(overall) {
  const o = overall ?? 0;
  if (o >= 88) return 5;
  if (o >= 78) return 4;
  if (o >= 66) return 3;
  if (o >= 54) return 2;
  return 1;
}

export function starString(overall) {
  const n = starTier(overall);
  return "★★★★★".slice(0, n) + "☆☆☆☆☆".slice(0, 5 - n);
}
