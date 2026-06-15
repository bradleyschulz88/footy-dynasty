// ---------------------------------------------------------------------------
// JobOfferCard — a single vacancy tile. Shared by the sacking-flow Job Market
// and the always-available Careers screen (browse & apply while employed).
//
// Presentational only. The CTA label / disabled state / an optional status
// footer are supplied by the caller so the same card serves both surfaces.
// ---------------------------------------------------------------------------
import React from "react";
import { Star } from "lucide-react";
import { css } from "../../components/primitives.jsx";
import { accreditationLabel } from "../../lib/coachReputation.js";

export function JobOfferCard({
  offer,
  onSelect,
  coachRep,
  isStarred,
  onToggleStar,
  ctaLabel = "APPLY & INTERVIEW →",
  disabled = false,
  statusFooter = null,
}) {
  const tierColor = offer.leagueTier === 1 ? "#FFD200" : offer.leagueTier === 2 ? "var(--A-accent)" : "#4ADE80";
  const heatColor = offer.mediaHeat === "high" ? "#E84A6F" : offer.mediaHeat === "med" ? "var(--A-accent-2)" : "#4AE89A";
  const longShot = coachRep < (offer.minReputation ?? 0);
  return (
    <div
      className={`${css.panel} p-4 flex flex-col transition`}
      style={{ boxShadow: isStarred ? "0 0 0 2px color-mix(in srgb, var(--A-accent) 35%, transparent)" : undefined }}
    >
      <div className="h-1 -mx-4 -mt-4 mb-3" style={{ background: offer.color }} />
      <div className="flex items-start justify-between mb-2 flex-wrap gap-2">
        <div className="flex-1 min-w-0">
          <div className={css.label}>{offer.leagueShort} · Tier {offer.leagueTier}</div>
          <div className="font-bold text-atext leading-tight">{offer.clubName}</div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {onToggleStar && (
            <button
              type="button"
              className="p-1.5 rounded-lg transition"
              style={{ color: isStarred ? "#FFD200" : "var(--A-text-mute)", border: "1px solid var(--A-line)" }}
              aria-label={isStarred ? "Remove from shortlist" : "Add to shortlist"}
              onClick={(e) => { e.stopPropagation(); onToggleStar(); }}
            >
              <Star className="w-4 h-4" fill={isStarred ? "currentColor" : "none"} />
            </button>
          )}
          <span className="text-[10px] uppercase tracking-widest font-mono font-bold px-2 py-1 rounded-md" style={{ background: `${tierColor}18`, color: tierColor, border: `1px solid ${tierColor}40` }}>
            T{offer.leagueTier}
          </span>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 mb-2 text-[10px] font-mono">
        <span className="px-2 py-0.5 rounded" style={{ border: `1px solid ${heatColor}`, color: heatColor }}>Media {offer.mediaHeat}</span>
        <span className="px-2 py-0.5 rounded text-atext-dim" style={{ border: "1px solid var(--A-line)" }}>List {offer.rosterTag}</span>
        <span className="px-2 py-0.5 rounded text-aaccent" style={{ border: "1px solid var(--A-line)" }}>{offer.interestLabel}</span>
        {longShot && (
          <span className="px-2 py-0.5 rounded text-[#FFB347]" style={{ border: "1px solid #FFB34755" }}>Long shot vs bar</span>
        )}
      </div>
      <div className="text-[10px] text-atext-mute mb-2 leading-snug italic">{offer.vacancyReason}</div>
      <div className="grid grid-cols-2 gap-1 text-[11px] mb-3">
        <div className="text-atext-mute">Position</div>
        <div className="text-atext text-right font-mono">#{offer.ladderPos}</div>
        <div className="text-atext-mute">Form</div>
        <div className="text-atext text-right font-mono">{offer.recentForm.join("")}</div>
        <div className="text-atext-mute">Finances</div>
        <div className="text-atext text-right">{offer.finance}</div>
        <div className="text-atext-mute">Wage</div>
        <div className="text-aaccent text-right font-mono font-bold">{offer.wage > 0 ? `$${offer.wage.toLocaleString()}` : "Volunteer"}</div>
        <div className="text-atext-mute">Rep bar</div>
        <div className="text-atext text-right font-mono">{offer.minReputation ?? 0}+</div>
        <div className="text-atext-mute">Accreditation</div>
        <div className="text-atext text-right font-mono">{accreditationLabel(offer.minAccreditation ?? 0)}</div>
      </div>
      <div className="text-[11px] text-atext-dim italic mb-2 leading-snug">{offer.expectations}</div>
      <div className="text-[11px] text-atext leading-snug mb-3">{offer.chairmanLine}</div>
      <div className="mt-auto">
        {statusFooter}
        {onSelect && (
          <button
            type="button"
            onClick={onSelect}
            disabled={disabled}
            className={disabled ? "w-full text-[11px] py-2 rounded-lg bg-apanel-2 text-atext-mute cursor-not-allowed" : `${css.btnPrimary} w-full text-[11px] py-2`}
          >
            {ctaLabel}
          </button>
        )}
      </div>
    </div>
  );
}
