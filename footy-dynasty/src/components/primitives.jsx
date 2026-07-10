// ---------------------------------------------------------------------------
// Shared visual primitives. Extracted from AFLManager.jsx as part of the
// Tier 3 modularisation pass. These components have no React state of their
// own — they're pure presentational helpers.
// ---------------------------------------------------------------------------
import React from "react";
import { ChevronDown } from "lucide-react";
import { motion, useMotionValue, useSpring, useTransform } from "motion/react";

export const css = {
  panel: "panel",
  panelHover: "panel card-hover cursor-pointer",
  inset: "panel-flat",
  btn: "px-4 py-2.5 rounded-md font-semibold transition-all duration-150 active:scale-[0.98] font-mono text-[11px] uppercase tracking-[0.18em]",
  btnPrimary: "btn-primary text-xs px-5 py-2.5 font-mono font-bold uppercase tracking-[0.2em] active:scale-[0.98]",
  btnGhost: "btn-ghost px-5 py-2.5 active:scale-[0.98]",
  btnDanger: "px-5 py-2.5 rounded-md font-semibold border border-aneg/40 text-aneg hover:bg-aneg/10 hover:border-aneg/70 active:scale-[0.98] transition-all duration-150",
  label: "label",
  h1: "display tracking-wider text-atext",
  num: "font-display tracking-wide text-atext",
  divider: "border-t border-aline",
  tableHead: "px-4 py-3 font-mono text-[11px] uppercase tracking-[0.15em] text-atext-mute font-bold border-b border-aline bg-apanel/40",
  tableRow: "border-b border-aline/80 hover:bg-aaccent/5 transition-colors",
};

// Progress bar with optional value label.
export const Bar = ({ value, color = "var(--A-accent)", small = false, showVal = false }) => (
  <div className="flex items-center gap-2 w-full">
    <div className={`flex-1 ${small ? "h-1.5" : "h-2.5"} bg-apanel-2 rounded-full overflow-hidden`} style={{ border: "1px solid var(--A-line)" }}>
      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.max(2, value)}%`, background: `linear-gradient(90deg, ${color}CC, ${color})` }} />
    </div>
    {showVal && <span className="text-xs font-bold w-8 text-right" style={{ color }}>{value}</span>}
  </div>
);

// Player rating — an AFL star tier (footy-card style), not a FIFA "OVR" chip.
// Kept as `RatingDot` so the many existing call sites need no changes; it now
// renders the shared StarRating so every table/list matches the new identity.
export const RatingDot = ({ value, size = "md" }) => {
  const px = size === "lg" ? 15 : size === "sm" ? 10 : 12;
  return <StarRating overall={value} size={px} />;
};

// AFL star tier — maps an overall rating (0–100) to a 1–5 star tier, the way
// footy trading cards grade players. Replaces the FIFA-style "OVR 84" chip.
export function starCount(overall) {
  const o = overall ?? 0;
  if (o >= 88) return 5;
  if (o >= 78) return 4;
  if (o >= 66) return 3;
  if (o >= 54) return 2;
  return 1;
}

// Row of five stars, filled to the player's tier. `size` is the font-size in px.
export const StarRating = ({ overall, size = 11, className = "" }) => {
  const n = starCount(overall);
  return (
    <span
      className={`inline-flex items-center gap-[1px] ${className}`}
      style={{ fontSize: size, lineHeight: 1 }}
      aria-label={`${n} of 5 stars`}
      title={`Rating ${n}/5`}
    >
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} style={{ color: i <= n ? "var(--A-accent)" : "var(--A-line-2)" }}>★</span>
      ))}
    </span>
  );
};

// Compact label/badge.
export const Pill = ({ children, color = "#64748B" }) => (
  <span className="inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-[0.12em] px-2.5 py-1 rounded-lg"
    style={{ background: `${color}18`, color, border: `1px solid ${color}40` }}>
    {children}
  </span>
);

/**
 * AnimatedNumber — smoothly counts to `value` whenever it changes. Built on
 * motion/react's spring so it feels organic rather than linear. Falls back to
 * rendering the raw value when `value` isn't a finite number (e.g. an em-dash
 * placeholder or a pre-formatted string), so callers can stay simple.
 *
 * @param {number} value    target number to animate toward
 * @param {(n:number)=>any} [format] formats the live number (default Math.round)
 */
export const AnimatedNumber = ({ value, format = Math.round, className, style }) => {
  const isNumeric = typeof value === "number" && Number.isFinite(value);
  // Start at the first value so the initial mount lands on the real number;
  // subsequent changes animate. A spring tuned for a ~700ms ease-out feel.
  const mv = useMotionValue(isNumeric ? value : 0);
  const spring = useSpring(mv, { stiffness: 90, damping: 20, mass: 0.6 });
  const text = useTransform(spring, (latest) => format(latest));

  React.useEffect(() => {
    if (isNumeric) mv.set(value);
  }, [value, isNumeric, mv]);

  if (!isNumeric) {
    return <span className={className} style={style}>{value}</span>;
  }
  return <motion.span className={className} style={style}>{text}</motion.span>;
};

// Visual weight presets for Stat — establishes the dashboard numeric hierarchy.
const STAT_VARIANTS = {
  hero: {
    padding: "p-6",
    strip: "w-1.5",
    numClass: "text-5xl mt-2 leading-none",
    panelExtra: "card-hover",
    glow: true,
  },
  primary: {
    padding: "p-5",
    strip: "w-1",
    numClass: "text-4xl mt-1.5 leading-none",
    panelExtra: "",
    glow: false,
  },
  secondary: {
    padding: "p-4",
    strip: "w-0.5",
    numClass: "text-2xl mt-1 leading-none",
    panelExtra: "",
    glow: false,
  },
};

// KPI tile with accent strip + optional icon. `variant` drives numeric
// hierarchy: 'hero' (largest, glowing), 'primary' (default), 'secondary'
// (muted). When `value` is a finite number it counts up via AnimatedNumber;
// strings (pre-formatted text, em-dashes) pass through unchanged.
export const Stat = ({ label, value, sub, accent = "var(--A-accent)", icon: Icon, variant = "primary", format }) => {
  const v = STAT_VARIANTS[variant] || STAT_VARIANTS.primary;
  const isNumeric = typeof value === "number" && Number.isFinite(value);
  const heroStyle = v.glow
    ? {
        border: `1px solid color-mix(in srgb, ${accent} 35%, var(--A-line))`,
        boxShadow: `0 0 0 1px color-mix(in srgb, ${accent} 12%, transparent), 0 8px 28px color-mix(in srgb, ${accent} 14%, transparent)`,
      }
    : undefined;
  return (
    <div className={`${css.panel} ${v.padding} ${v.panelExtra} relative overflow-hidden`} style={heroStyle}>
      <div className={`absolute top-0 left-0 ${v.strip} h-full rounded-l-2xl`} style={{ background: accent }} />
      {Icon && <Icon className={`w-5 h-5 mb-2 ${variant === "secondary" ? "opacity-45" : "opacity-60"}`} style={{ color: accent }} />}
      <div className={css.label} style={variant === "secondary" ? { color: "var(--A-text-mute)" } : undefined}>{label}</div>
      <div className={`${css.num} ${v.numClass} tabular-nums`} style={{ color: accent, fontVariantNumeric: "tabular-nums" }}>
        {isNumeric ? <AnimatedNumber value={value} format={format} /> : value}
      </div>
      {sub && <div className="text-xs text-atext-dim mt-1.5 font-medium">{sub}</div>}
    </div>
  );
};

// Inline SVG kit preview used by the Kits tab and squad selectors.
export const Jersey = ({ kit, size = 64 }) => {
  const k = kit || { primary: "var(--A-accent)", secondary: "#FFFFFF", accent: "var(--A-accent)", pattern: "solid", numberColor: "#FFFFFF" };
  return (
    <svg viewBox="0 0 100 100" width={size} height={size}>
      <defs>
        <linearGradient id={`gr-${k.primary}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={k.primary} stopOpacity="1" />
          <stop offset="100%" stopColor={k.primary} stopOpacity="0.85" />
        </linearGradient>
      </defs>
      <path d="M20 20 L35 12 L50 18 L65 12 L80 20 L75 35 L72 35 L72 88 L28 88 L28 35 L25 35 Z"
        fill={`url(#gr-${k.primary})`} stroke="#000" strokeWidth="0.8" />
      {k.pattern === "stripes" && (
        <g fill={k.secondary} opacity="0.85">
          <rect x="42" y="20" width="6" height="68" />
          <rect x="52" y="20" width="6" height="68" />
        </g>
      )}
      {k.pattern === "v" && (
        <polygon points="35,20 50,42 65,20 50,28" fill={k.secondary} opacity="0.95" />
      )}
      {k.pattern === "sash" && (
        <polygon points="22,28 78,72 78,82 22,38" fill={k.secondary} opacity="0.95" />
      )}
      {k.pattern === "yoke" && (
        <path d="M28 20 L72 20 L72 38 L50 44 L28 38 Z" fill={k.secondary} opacity="0.95" />
      )}
      <text x="50" y="62" textAnchor="middle" fontSize="22" fontWeight="900" fontFamily="Bebas Neue, sans-serif" fill={k.numberColor}>9</text>
    </svg>
  );
};

/** Desktop table + stacked mobile list sharing the same column definitions. */
export function DataTable({ title, titleAction, columns, rows, rowKey, emptyLabel = "No data.", bare = false }) {
  const outerClass = bare
    ? "rounded-xl overflow-hidden border border-aline bg-apanel/30"
    : css.panel;
  return (
    <div className={outerClass}>
      {(title || titleAction) && (
        <div className="flex items-center justify-between px-5 pt-5 pb-3 gap-2">
          {title && <h3 className="font-display text-xl tracking-wide text-atext">{title}</h3>}
          {titleAction}
        </div>
      )}
      {rows.length === 0 ? (
        <div className="px-5 py-8 text-sm text-atext-dim text-center">{emptyLabel}</div>
      ) : (
        <>
          <div className="hidden md:block overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
            <table className="w-full text-left border-collapse min-w-max">
              <thead>
                <tr>{columns.map((col) => <th key={col.key} className={css.tableHead}>{col.header}</th>)}</tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={rowKey(row)} className={css.tableRow}>
                    {columns.map((col) => (
                      <td key={col.key} className="px-4 py-3 text-sm text-atext align-middle">
                        {col.render ? col.render(row) : row[col.key]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="md:hidden overflow-x-auto -mx-4 px-4 pb-4">
            {rows.map((row) => (
              <div key={rowKey(row)} className="min-w-[280px] px-4 py-3 border-b border-aline/80 last:border-b-0">
                {columns.map((col) => (
                  <div key={col.key} className="flex justify-between gap-3 py-1.5 text-sm">
                    <span className="text-atext-mute font-mono uppercase tracking-wider text-[11px] shrink-0">{col.header}</span>
                    <span className="text-atext text-right min-w-0">{col.render ? col.render(row) : row[col.key]}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/**
 * Collapsible panel for secondary dashboard sections. Open/closed state is
 * remembered per `id` in localStorage so the hub stays as tidy as the player
 * left it. An optional `right` node (e.g. a "view all" link) renders beside the
 * title — kept outside the toggle button so it stays independently clickable.
 */
export function CollapsibleSection({ id, title, defaultOpen = false, right = null, children }) {
  const storeKey = `fd_collapse_${id}`;
  const [open, setOpen] = React.useState(() => {
    try {
      const v = localStorage.getItem(storeKey);
      return v == null ? defaultOpen : v === "1";
    } catch {
      return defaultOpen;
    }
  });
  const toggle = () =>
    setOpen((o) => {
      const next = !o;
      try { localStorage.setItem(storeKey, next ? "1" : "0"); } catch { /* ignore */ }
      return next;
    });
  return (
    <div className={`${css.panel} overflow-hidden`}>
      <div className="flex items-center justify-between gap-2 px-4 py-3">
        <button type="button" onClick={toggle} aria-expanded={open} className="flex items-center gap-2 min-w-0 flex-1 text-left">
          <ChevronDown className={`w-4 h-4 text-atext-mute transition-transform shrink-0 ${open ? "rotate-180" : ""}`} />
          <span className="font-display text-base tracking-wide text-atext truncate">{title}</span>
        </button>
        {right}
      </div>
      {open && <div className="px-4 pb-4 anim-in">{children}</div>}
    </div>
  );
}

// Global app-wide style block — extracted so it's referenced from a single place.
export const GlobalStyle = () => (
  <style>{`
    body, html { background:var(--A-bg); margin:0; color:var(--A-text); }
    ::-webkit-scrollbar { width:5px; height:5px; }
    ::-webkit-scrollbar-track { background:var(--A-bg); }
    ::-webkit-scrollbar-thumb { background:var(--A-line-2); border-radius:4px; }
    ::-webkit-scrollbar-thumb:hover { background:rgba(255,255,255,0.22); }
    .no-scrollbar { scrollbar-width:none; -ms-overflow-style:none; }
    .no-scrollbar::-webkit-scrollbar { display:none; width:0; height:0; }
    @keyframes pulseGlow { 0%,100%{box-shadow:0 0 0 0 color-mix(in srgb, var(--A-accent) 18%, transparent);}50%{box-shadow:0 0 14px 3px color-mix(in srgb, var(--A-accent) 10%, transparent);} }
    .glow { animation: pulseGlow 2.5s ease-in-out infinite; }
    @keyframes slideIn { from{opacity:0;transform:translateY(6px);}to{opacity:1;transform:translateY(0);} }
    .anim-in { animation: slideIn 0.2s ease-out; }
    .dirA select option { background:var(--A-panel); color:var(--A-text); }
    .dirA select { color:var(--A-text); background:var(--A-panel); border:1px solid var(--A-line); border-radius:10px; }
    .dirB select option { background:var(--B-panel); color:var(--B-text); }
    .dirB select { color:var(--B-text); background:var(--B-panel); border:1px solid var(--B-line-2); border-radius:10px; }
    .dirS select option { background:var(--A-panel); color:var(--A-text); }
    .dirS select { color:var(--A-text); background:var(--A-panel); border:1px solid var(--A-line); border-radius:8px; }
    .dirV4 select option { background:var(--V4-panel); color:var(--V4-text); }
    .dirV4 select { color:var(--V4-text); background:var(--V4-panel); border:1px solid var(--V4-line-2); border-radius:10px; }
    input[type=color] { padding:2px; cursor:pointer; border-radius:6px; }
    button:disabled { opacity:0.4; cursor:not-allowed; }
    /* Accessible focus rings — accent-tinted, theme-adaptive, only on keyboard focus. */
    button:focus-visible, a:focus-visible, [role="button"]:focus-visible, select:focus-visible, [tabindex]:focus-visible {
      outline: none;
      box-shadow: 0 0 0 2px var(--A-bg), 0 0 0 4px color-mix(in srgb, var(--A-accent) 70%, transparent);
      border-radius: var(--radius-md);
    }
    /* Subtle tactile press feedback for tappable buttons. */
    button:not(:disabled):active { transform: translateY(0.5px); }
    /* Minimum touch target for mobile accessibility (44x44px) */
    button, [role="button"], a.btn, .btn {
      min-height: 44px;
      min-width: 44px;
    }
    * { box-sizing:border-box; }
  `}</style>
);
