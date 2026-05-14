// Overview tiles, Commercial KPI strip, section breadcrumb for Club screen.
import React from "react";
import {
  Briefcase, DollarSign, FileText, Handshake, Wrench, Building2, UserCog, Users,
  Shirt, Award, Sprout, ChevronRight, LayoutDashboard, Landmark,
} from "lucide-react";
import { css, Pill } from "../../components/primitives.jsx";
import { fmtK, avgFacilities, avgStaff } from "../../lib/format.js";
import {
  effectiveWageCap,
  currentPlayerWageBill,
  capHeadroom,
} from "../../lib/finance/engine.js";

function overviewTile(title, sublines, Icon, accent, onClick) {
  return (
    <button
      type="button"
      key={title}
      onClick={onClick}
      className={`${css.panel} p-3 sm:p-4 text-left rounded-xl border border-aline hover:border-aaccent/45 transition w-full min-h-[72px]`}
    >
      <div className="flex items-start gap-2 sm:gap-3">
        <div
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: `${accent}18`, border: `1px solid ${accent}40` }}
        >
          <Icon className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: accent }} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-bold text-atext text-xs sm:text-sm tracking-wide">{title}</div>
          <div className="text-[10px] sm:text-[11px] text-atext-dim mt-1 space-y-0.5 leading-snug">
            {sublines.map((line) => (
              <div key={line}>{line}</div>
            ))}
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-atext-dim flex-shrink-0 mt-0.5 hidden sm:block" />
      </div>
    </button>
  );
}

function sectionLabel(text) {
  return (
    <div className="text-[10px] font-mono font-black uppercase tracking-[0.2em] text-atext-mute px-0.5">
      {text}
    </div>
  );
}

/** Hub landing — tiles jump to specific leaf tabs (matches primary nav defaults). */
export function ClubOverviewTab({ career, club, setTab, showCommittee }) {
  const cash = career.finance?.cash ?? 0;
  const boardConf = career.finance?.boardConfidence ?? 0;
  const sponsorsN = (career.sponsors || []).length;
  const sponsorsAnnual = (career.sponsors || []).reduce((a, s) => a + (s.annualValue || 0), 0);
  const facAvg = avgFacilities(career.facilities);
  const staffAvg = avgStaff(career.staff);
  const rookies = (career.squad || []).filter((p) => p.rookie).length;
  const cap = effectiveWageCap(career);
  const pBill = currentPlayerWageBill(career);
  const capPct = cap > 0 ? Math.round((pBill / cap) * 100) : null;
  const pendPlayer = (career.pendingRenewals || []).filter((r) => !r._handled).length;
  const pendStaff = (career.pendingStaffRenewals || []).filter((r) => !r._handled).length;
  const renewHint =
    pendPlayer + pendStaff > 0 ? `${pendPlayer + pendStaff} renewal queue` : "No pending renewals";

  return (
    <div className="space-y-6">
      <div>
        <div className={`${css.h1} text-2xl md:text-3xl`}>CLUB OVERVIEW</div>
        <div className="text-xs text-atext-dim mt-1">
          {club.name} — jump to any area. <strong className="text-atext">Commercial</strong> defaults to Finances from the top bar.
        </div>
      </div>

      <div className="space-y-2">
        {sectionLabel("Commercial")}
        <div className="grid sm:grid-cols-3 gap-2 sm:gap-3">
          {overviewTile(
            "Finances",
            [`Cash ${fmtK(cash)}`, capPct != null ? `Player cap ${capPct}%` : "Cap off"],
            DollarSign,
            "#4ADBE8",
            () => setTab("finances"),
          )}
          {overviewTile(
            "Contracts",
            [renewHint, capPct != null ? `Headroom ${fmtK(capHeadroom(career))}` : "List & renewals"],
            FileText,
            "#22C55E",
            () => setTab("contracts"),
          )}
          {overviewTile(
            "Sponsors",
            [`${sponsorsN} deals`, sponsorsAnnual > 0 ? `${fmtK(sponsorsAnnual)}/yr` : "No sponsor income"],
            Handshake,
            "#F59E0B",
            () => setTab("sponsors"),
          )}
        </div>
      </div>

      <div className="space-y-2">
        {sectionLabel("Operations")}
        <div className={`grid gap-2 sm:gap-3 ${showCommittee ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
          {overviewTile(
            "Facilities",
            [`Avg ${facAvg.toFixed(1)}`, "Venue, medical, training"],
            Building2,
            "#4AE89A",
            () => setTab("facilities"),
          )}
          {overviewTile(
            "Staff",
            [`Avg rating ${Math.round(staffAvg)}`, "Coaches & football dept"],
            UserCog,
            "#60A5FA",
            () => setTab("staff"),
          )}
          {showCommittee
            ? overviewTile(
                "Committee",
                ["Volunteer board", "Mood & community"],
                Users,
                "#C084FC",
                () => setTab("committee"),
              )
            : null}
        </div>
      </div>

      <div className="space-y-2">
        {sectionLabel("Club & list")}
        <div className="grid sm:grid-cols-3 gap-2 sm:gap-3">
          {overviewTile(
            "Kits",
            ["Home & away design", "Colours"],
            Shirt,
            "#A78BFA",
            () => setTab("kits"),
          )}
          {overviewTile(
            "Honours",
            ["Season history", "Flags & Brownlow"],
            Award,
            "#FBBF24",
            () => setTab("honours"),
          )}
          {overviewTile(
            "Rookie list",
            [`${rookies} on list`, "Elevation & wages"],
            Sprout,
            "#34D399",
            () => setTab("rookies"),
          )}
        </div>
      </div>
    </div>
  );
}

const PRIMARY_META = {
  overview: { label: "Club", icon: LayoutDashboard },
  commercial: { label: "Commercial", icon: Briefcase },
  operations: { label: "Operations", icon: Wrench },
  identity: { label: "Club & list", icon: Shirt },
};

const LEAF_LABELS = {
  overview: "Overview",
  finances: "Finances",
  contracts: "Contracts",
  board: "Board",
  sponsors: "Sponsors",
  facilities: "Facilities",
  staff: "Staff",
  committee: "Committee",
  kits: "Kits",
  honours: "Honours",
  rookies: "Rookie list",
};

/** Breadcrumb: primary domain · active leaf */
export function ClubBreadcrumb({ activePrimary, activeTab }) {
  const p = PRIMARY_META[activePrimary] ?? PRIMARY_META.overview;
  const leaf = LEAF_LABELS[activeTab] ?? activeTab;
  const PIcon = p.icon;
  if (activeTab === "overview") {
    return (
      <div className="flex items-center gap-2 mb-3 text-[11px] text-atext-dim">
        <PIcon className="w-3.5 h-3.5 text-aaccent shrink-0" />
        <span className="font-mono uppercase tracking-wider">{p.label}</span>
        <span className="text-atext-mute">·</span>
        <span className="text-atext">Overview</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2 mb-3 text-[11px] text-atext-dim">
      <PIcon className="w-3.5 h-3.5 text-aaccent shrink-0" />
      <span className="font-mono uppercase tracking-wider">{p.label}</span>
      <span className="text-atext-mute">·</span>
      <span className="text-atext font-semibold">{leaf}</span>
    </div>
  );
}

/** Sticky-style metrics while browsing Commercial sub-tabs */
export function CommercialKpiStrip({ career }) {
  const cash = career.finance?.cash ?? 0;
  const board = Math.round(career.finance?.boardConfidence ?? 0);
  const cap = effectiveWageCap(career);
  const bill = currentPlayerWageBill(career);
  const headroom = capHeadroom(career);
  const capPct = cap > 0 ? Math.round((bill / cap) * 100) : null;
  const sponsorsN = (career.sponsors || []).length;

  return (
    <div
      className="flex flex-wrap items-center gap-2 sm:gap-3 mb-4 px-3 py-2.5 rounded-xl border text-[11px]"
      style={{
        background: "var(--A-panel-2)",
        borderColor: "var(--A-line)",
      }}
    >
      <Pill color="#64748B">Cash {fmtK(cash)}</Pill>
      {capPct != null ? (
        <Pill color={capPct >= 100 ? "#E84A6F" : capPct >= 90 ? "#FFB347" : "#64748B"}>
          Cap {capPct}% · room {fmtK(headroom)}
        </Pill>
      ) : (
        <Pill color="#64748B">No cap</Pill>
      )}
      <Pill color={board >= 50 ? "#4AE89A" : "#E84A6F"}>Board {board}%</Pill>
      <Pill color="#4ADBE8">{sponsorsN} sponsors</Pill>
    </div>
  );
}
