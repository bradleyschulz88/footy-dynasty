import React from "react";

const SIZES = {
  xs: "w-7 h-7 min-w-[1.75rem] text-[8px] rounded-md",
  sm: "w-9 h-9 min-w-[2.25rem] text-[9px] rounded-lg",
  md: "w-10 h-10 min-w-[2.5rem] text-[10px] rounded-lg",
  lg: "w-12 h-12 min-w-[3rem] text-xs rounded-xl",
};

/**
 * Fictional club crest tile from pyramid colors + short code (until real assets exist).
 */
export function ClubBadge({ club, size = "md", className = "" }) {
  const cls = `${SIZES[size] || SIZES.md} inline-flex items-center justify-center font-black tracking-tight text-white shadow-sm border border-white/25 shrink-0 ${className}`;
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
  return (
    <div
      className={cls}
      style={{
        background: `linear-gradient(135deg, ${c1} 0%, ${c2} 50%, ${c3} 100%)`,
        textShadow: "0 1px 2px rgba(0,0,0,0.5)",
      }}
      title={club.name || club.short}
    >
      <span className="leading-none px-0.5">{club.short}</span>
    </div>
  );
}
