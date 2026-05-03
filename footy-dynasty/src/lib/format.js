export const fmt  = (n) => "$" + Math.round(n).toLocaleString("en-AU");
export const fmtK = (n) => n >= 1000000 ? `$${(n / 1000000).toFixed(1)}M` : n >= 1000 ? `$${(n / 1000).toFixed(0)}k` : `$${n}`;
export const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

export const avgFacilities = (f) => {
  const vals = Object.values(f).map(x => x.level);
  return vals.reduce((a, b) => a + b, 0) / vals.length;
};

export const avgStaff = (s) => s.reduce((a, b) => a + b.rating, 0) / s.length;
