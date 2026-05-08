// ---------------------------------------------------------------------------
// Shared visual primitives. Extracted from AFLManager.jsx as part of the
// Tier 3 modularisation pass. These components have no React state of their
// own — they're pure presentational helpers.
// ---------------------------------------------------------------------------
import React from "react";

export const css = {
  panel: "panel",
  panelHover: "panel card-hover cursor-pointer",
  inset: "panel-flat",
  btn: "px-4 py-2.5 rounded-md font-semibold transition-all font-mono text-[11px] uppercase tracking-[0.18em]",
  btnPrimary: "btn-primary text-xs px-5 py-2.5 font-mono font-bold uppercase tracking-[0.2em]",
  btnGhost: "btn-ghost px-5 py-2.5",
  btnDanger: "px-5 py-2.5 rounded-md font-semibold border border-aneg/40 text-aneg hover:bg-aneg/10 transition-all",
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

// Player rating dot — colour-codes overall ratings into broadcast tiers.
export const RatingDot = ({ value, size = "md" }) => {
  const c = value >= 85 ? "#4AE89A" : value >= 75 ? "#4ADBE8" : value >= 65 ? "var(--A-accent)" : value >= 55 ? "#E8D44A" : "#E84A6F";
  const sz = size === "lg" ? "w-12 h-12 text-base" : size === "sm" ? "w-7 h-7 text-xs" : "w-10 h-10 text-sm";
  return (
    <span className={`inline-flex items-center justify-center font-black ${sz} rounded-xl flex-shrink-0`}
      style={{ background: `linear-gradient(135deg, ${c}22, ${c}0A)`, color: c, border: `1.5px solid ${c}55`, boxShadow: `0 0 8px ${c}22` }}>
      {value}
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

// KPI tile with accent strip + optional icon.
export const Stat = ({ label, value, sub, accent = "var(--A-accent)", icon: Icon }) => (
  <div className={`${css.panel} p-5 relative overflow-hidden`}>
    <div className="absolute top-0 left-0 w-1 h-full rounded-l-2xl" style={{ background: accent }} />
    {Icon && <Icon className="w-5 h-5 mb-2 opacity-60" style={{ color: accent }} />}
    <div className={css.label}>{label}</div>
    <div className={`${css.num} text-4xl mt-1.5 leading-none`} style={{ color: accent }}>{value}</div>
    {sub && <div className="text-xs text-atext-dim mt-1.5 font-medium">{sub}</div>}
  </div>
);

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
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
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
          <div className="md:hidden">
            {rows.map((row) => (
              <div key={rowKey(row)} className="px-4 py-3 border-b border-aline/80 last:border-b-0">
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

// Global app-wide style block — extracted so it's referenced from a single place.
export const GlobalStyle = () => (
  <style>{`
    body, html { background:var(--A-bg); margin:0; color:var(--A-text); }
    ::-webkit-scrollbar { width:5px; height:5px; }
    ::-webkit-scrollbar-track { background:var(--A-bg); }
    ::-webkit-scrollbar-thumb { background:rgba(124,161,207,0.25); border-radius:4px; }
    ::-webkit-scrollbar-thumb:hover { background:rgba(0,224,255,0.35); }
    @keyframes pulseGlow { 0%,100%{box-shadow:0 0 0 0 rgba(0,224,255,0.25);}50%{box-shadow:0 0 14px 3px rgba(0,224,255,0.15);} }
    .glow { animation: pulseGlow 2.5s ease-in-out infinite; }
    @keyframes slideIn { from{opacity:0;transform:translateY(6px);}to{opacity:1;transform:translateY(0);} }
    .anim-in { animation: slideIn 0.2s ease-out; }
    .dirA select option { background:var(--A-panel); color:var(--A-text); }
    .dirA select { color:var(--A-text); background:var(--A-panel); border:1px solid var(--A-line); border-radius:8px; }
    .dirS select option { background:var(--A-panel); color:var(--A-text); }
    .dirS select { color:var(--A-text); background:var(--A-panel); border:1px solid var(--A-line); border-radius:8px; }
    input[type=color] { padding:2px; cursor:pointer; border-radius:6px; }
    button:disabled { opacity:0.4; cursor:not-allowed; }
    * { box-sizing:border-box; }
  `}</style>
);
