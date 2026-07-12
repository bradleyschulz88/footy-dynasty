// Shared visual language for the mobile app — mirrors the web's official-AFL
// "Broadcast Deck" tokens (OLED-dark broadcast base, sky-blue primary).
export const C = {
  bg: "#05070C",       // ground — OLED near-black
  bg2: "#0A0F17",      // lifted ground
  panel: "#0B111B",    // surface
  panel2: "#121C2A",   // surface 2 (raised)
  line: "rgba(150,172,205,0.14)",
  line2: "rgba(150,172,205,0.28)",
  text: "#EAF1FB",
  dim: "#8FA3BE",
  mute: "#5C6E88",
  sky: "#2CA8F0",
  sky2: "#5FC0F7",
  red: "#FF3B4E",
  pos: "#34D17E",
  gold: "#F5B23A",
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
