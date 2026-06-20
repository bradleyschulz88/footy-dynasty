import React from "react";

const SIZES = {
  xs: "w-7 h-7 min-w-[1.75rem] text-[8px] rounded-md",
  sm: "w-9 h-9 min-w-[2.25rem] text-[9px] rounded-lg",
  md: "w-10 h-10 min-w-[2.5rem] text-[10px] rounded-lg",
  lg: "w-12 h-12 min-w-[3rem] text-xs rounded-xl",
};

// Show the short code only at sm and above; xs shows emblem only (stays legible).
const SHOW_SHORT = { xs: false, sm: true, md: true, lg: true };

/** Tiny deterministic string hash (FNV-1a style, 32-bit). */
function hashStr(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
  }
  return h >>> 0;
}

/** Relative luminance of a #rrggbb (or #rgb) color, 0..1. */
function luminance(hex) {
  let c = (hex || "").replace("#", "");
  if (c.length === 3) c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2];
  if (c.length !== 6) return 0.3;
  const r = parseInt(c.slice(0, 2), 16) / 255;
  const g = parseInt(c.slice(2, 4), 16) / 255;
  const b = parseInt(c.slice(4, 6), 16) / 255;
  const lin = (v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

const LIGHT = "#f8fafc";
const DARK = "#0f172a";

/** Pick a readable ink (light/dark) for text/shapes sitting on `bg`. */
function inkFor(bg) {
  return luminance(bg) > 0.45 ? DARK : LIGHT;
}

/**
 * Emblem motifs. Each returns inline SVG drawn in a 40x40 viewBox.
 * `em` is the emblem color (already chosen to contrast the primary background),
 * `div` is a secondary/divider color.
 */
const MOTIFS = [
  // 0 sash — diagonal band
  (em) => (
    <polygon points="0,28 12,40 40,12 40,0 28,0 0,28" fill={em} opacity="0.92" />
  ),
  // 1 vertical stripe (pale band)
  (em, div) => (
    <>
      <rect x="15" y="0" width="10" height="40" fill={em} opacity="0.9" />
      <rect x="13.5" y="0" width="1.5" height="40" fill={div} opacity="0.6" />
      <rect x="25" y="0" width="1.5" height="40" fill={div} opacity="0.6" />
    </>
  ),
  // 2 chevron
  (em) => (
    <polygon points="20,8 36,26 36,34 20,16 4,34 4,26" fill={em} opacity="0.92" />
  ),
  // 3 star (5-point)
  (em) => (
    <polygon
      points="20,6 23.5,16 34,16 25.5,22.5 28.8,33 20,26.5 11.2,33 14.5,22.5 6,16 16.5,16"
      fill={em}
    />
  ),
  // 4 diagonal-half
  (em) => <polygon points="0,0 40,0 0,40" fill={em} opacity="0.85" />,
  // 5 hoops (two horizontal bands)
  (em) => (
    <>
      <rect x="0" y="10" width="40" height="6" fill={em} opacity="0.9" />
      <rect x="0" y="24" width="40" height="6" fill={em} opacity="0.9" />
    </>
  ),
  // 6 diamond
  (em, div) => (
    <>
      <polygon points="20,7 31,20 20,33 9,20" fill={em} opacity="0.92" />
      <polygon points="20,12 26,20 20,28 14,20" fill={div} opacity="0.55" />
    </>
  ),
  // 7 V
  (em) => (
    <polygon points="6,6 14,6 20,24 26,6 34,6 22,38 18,38" fill={em} opacity="0.92" />
  ),
];

/**
 * Fictional, deterministic club crest built from pyramid colors + a hashed motif.
 * Original (non-trademarked) shapes only.
 */
export function ClubBadge({ club, size = "md", className = "" }) {
  const cls = `${SIZES[size] || SIZES.md} inline-flex items-center justify-center font-black tracking-tight text-white shadow-sm border border-white/25 shrink-0 overflow-hidden ${className}`;

  if (!club?.short) {
    return (
      <div
        className={cls}
        style={{ background: "linear-gradient(135deg,#475569 0%,#334155 100%)" }}
        aria-hidden
      >
        —
      </div>
    );
  }

  const [c1, c2] = club.colors?.length >= 2 ? club.colors : ["#334155", "#0f172a"];
  const c3 = club.colors?.[2] || c2;

  const seed = String(club.id ?? club.short ?? "");
  const hash = hashStr(seed);
  const motifIndex = hash % MOTIFS.length;
  // Stable, DOM-safe unique id for defs (avoids invalid chars / cross-badge clashes).
  const uid = `cb-${hash.toString(36)}`;

  // Choose an emblem color that contrasts the primary background.
  const baseLum = luminance(c1);
  const candidates = [c2, c3].filter(Boolean);
  // Prefer a club secondary that differs enough in luminance; else fall back to ink.
  let emblem =
    candidates.find((c) => Math.abs(luminance(c) - baseLum) > 0.18) || inkFor(c1);
  // Divider/inner color: the other club color, or ink, distinct from emblem.
  const divider = inkFor(c1) === emblem ? c2 : inkFor(c1);

  const ink = inkFor(c1);
  const showShort = SHOW_SHORT[size] ?? true;
  const short = String(club.short).slice(0, 3).toUpperCase();

  return (
    <div className={cls} title={club.name || club.short}>
      <svg
        viewBox="0 0 40 40"
        className="w-full h-full"
        role="img"
        aria-label={`${club.name || club.short} crest`}
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Shield clip so the crest reads as a crest at the rounded container edges */}
        <defs>
          <clipPath id={`crest-${uid}`}>
            <path d="M3,2 H37 V20 Q37,33 20,39 Q3,33 3,20 Z" />
          </clipPath>
          <linearGradient id={`bg-${uid}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={c1} />
            <stop offset="100%" stopColor={c2} />
          </linearGradient>
        </defs>

        <g clipPath={`url(#crest-${uid})`}>
          {/* Primary background */}
          <rect x="0" y="0" width="40" height="40" fill={`url(#bg-${uid})`} />
          {/* Emblem motif */}
          {MOTIFS[motifIndex](emblem, divider)}
          {/* Short code overlay (sm+) */}
          {showShort && (
            <text
              x="20"
              y={size === "lg" ? 27 : 26}
              textAnchor="middle"
              fontSize={size === "lg" ? 15 : 16}
              fontWeight="900"
              fill={ink}
              stroke={ink === LIGHT ? "rgba(0,0,0,0.35)" : "rgba(255,255,255,0.35)"}
              strokeWidth="0.6"
              paintOrder="stroke"
              style={{ fontFamily: "inherit", letterSpacing: "-0.5px" }}
            >
              {short}
            </text>
          )}
        </g>
        {/* Crest outline for definition on dark UI */}
        <path
          d="M3,2 H37 V20 Q37,33 20,39 Q3,33 3,20 Z"
          fill="none"
          stroke="rgba(255,255,255,0.28)"
          strokeWidth="1"
        />
      </svg>
    </div>
  );
}
