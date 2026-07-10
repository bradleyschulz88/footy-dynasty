export const fmt = (n: number): string => "$" + Math.round(n).toLocaleString("en-AU");

export const fmtK = (n: number): string =>
  n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(1)}M` : n >= 1000 ? `$${Math.round(n / 1000)}k` : `$${n}`;

export const clamp = (n: number, a: number, b: number): number => Math.max(a, Math.min(b, n));

export interface Facility {
  level: number;
}

export interface StaffMember {
  rating: number;
}

export const avgFacilities = (f: Record<string, Facility> | undefined): number => {
  const vals = Object.values(f ?? {}).map((x) => x.level);
  return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 1;
};

export const avgStaff = (s: StaffMember[] | undefined): number => {
  if (!s?.length) return 60;
  return s.reduce((a, b) => a + b.rating, 0) / s.length;
};