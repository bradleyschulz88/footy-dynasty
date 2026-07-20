// FacilityPrecinct — stylised top-down view of the club's training base.
// Every part of the precinct is driven by the facility levels, so upgrades
// are visible on the ground: the oval gains a second field and an indoor
// centre, the gym/medical/academy buildings grow, recovery pools appear,
// and the grandstand wraps further around the main oval.
// Pure presentation: reads levels + club colour, renders SVG. No state.
import React from "react";

const TURF = "#1c6b38";
const TURF_DARK = "#14522a";
const BUILDING = "var(--A-panel-2)";
const LINE = "rgba(255,255,255,0.55)";

function Label({ x, y, children, anchor = "middle" }) {
  return (
    <text x={x} y={y} textAnchor={anchor} fontSize="5.2" fontWeight="700"
      style={{ fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.08em", textTransform: "uppercase" }}
      fill="var(--A-text-dim)">
      {children}
    </text>
  );
}

function LevelPip({ x, y, level }) {
  return (
    <g>
      <rect x={x - 7} y={y - 5} width={14} height={8} rx={2} fill="var(--A-panel)" stroke="var(--A-line-2)" strokeWidth="0.5" />
      <text x={x} y={y + 1.4} textAnchor="middle" fontSize="5" fontWeight="800"
        style={{ fontFamily: "'JetBrains Mono', monospace" }} fill="var(--A-accent)">
        L{level}
      </text>
    </g>
  );
}

export default function FacilityPrecinct({ facilities, clubColor = "var(--A-accent)", baseName, groundName }) {
  const f = facilities || {};
  const lv = (k) => f[k]?.level ?? 1;
  const tg = lv("trainingGround"), gym = lv("gym"), med = lv("medical");
  const aca = lv("academy"), sta = lv("stadium"), rec = lv("recovery");

  // Building heights grow with level.
  const bh = (level) => 12 + level * 4.5;

  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--A-line)", background: "linear-gradient(180deg, color-mix(in srgb, #1f7a3d 9%, var(--A-panel)), var(--A-panel))" }}>
      <svg viewBox="0 0 400 168" className="w-full h-auto block" role="img"
        aria-label={`Training precinct map — ${baseName || "club base"}`}>

        {/* precinct apron */}
        <rect x="0" y="0" width="400" height="168" fill="transparent" />

        {/* ── Main oval ── */}
        <ellipse cx="118" cy="88" rx="96" ry="62" fill={TURF_DARK} />
        <ellipse cx="118" cy="88" rx="90" ry="57" fill={TURF} />
        <ellipse cx="118" cy="88" rx="78" ry="47" fill="none" stroke={LINE} strokeWidth="1" opacity="0.8" />
        {/* centre square + circles */}
        <rect x="93" y="63" width="50" height="50" fill="none" stroke={LINE} strokeWidth="0.8" opacity="0.7" />
        <circle cx="118" cy="88" r="5" fill="none" stroke={LINE} strokeWidth="0.8" opacity="0.7" />
        <circle cx="118" cy="88" r="16" fill="none" stroke={LINE} strokeWidth="0.8" opacity="0.55" />
        {/* goal squares */}
        <rect x="40" y="79" width="14" height="18" fill="none" stroke={LINE} strokeWidth="0.8" opacity="0.7" />
        <rect x="182" y="79" width="14" height="18" fill="none" stroke={LINE} strokeWidth="0.8" opacity="0.7" />
        {/* 50m arcs */}
        <path d="M 78 46 A 52 52 0 0 0 78 130" fill="none" stroke={LINE} strokeWidth="0.8" opacity="0.5" />
        <path d="M 158 46 A 52 52 0 0 1 158 130" fill="none" stroke={LINE} strokeWidth="0.8" opacity="0.5" />
        <Label x={118} y={152}>{groundName || "Main Oval"}</Label>
        <LevelPip x={118} y={34} level={tg} />

        {/* running track appears at elite training level */}
        {tg >= 5 && (
          <ellipse cx="118" cy="88" rx="94" ry="60" fill="none" stroke="#c26b3f" strokeWidth="2.4" opacity="0.85" />
        )}

        {/* ── Grandstand wraps with stadium level ── */}
        {sta >= 2 && (
          <path d="M 30 40 A 100 66 0 0 0 30 136" fill="none"
            stroke={clubColor} strokeWidth={3 + sta * 1.6} opacity="0.85" strokeLinecap="round" />
        )}
        {sta >= 4 && (
          <path d="M 206 46 A 100 66 0 0 1 206 130" fill="none"
            stroke={clubColor} strokeWidth={2 + sta} opacity="0.6" strokeLinecap="round" />
        )}
        {sta >= 2 && <Label x={16} y={88} anchor="middle">Stand</Label>}

        {/* ── Second training oval (level 3+) ── */}
        {tg >= 3 && (
          <g>
            <ellipse cx="262" cy="46" rx="40" ry="26" fill={TURF_DARK} />
            <ellipse cx="262" cy="46" rx="36" ry="22" fill={TURF} />
            <ellipse cx="262" cy="46" rx="28" ry="15" fill="none" stroke={LINE} strokeWidth="0.7" opacity="0.7" />
            <Label x={262} y={80}>Oval 2</Label>
          </g>
        )}

        {/* ── Indoor training centre (level 4+) ── */}
        {tg >= 4 && (
          <g>
            <rect x="310" y="20" width="76" height="34" rx="3" fill={BUILDING} stroke="var(--A-line-2)" strokeWidth="0.8" />
            <line x1="310" y1="37" x2="386" y2="37" stroke="var(--A-line)" strokeWidth="0.6" />
            <rect x="316" y="26" width="64" height="22" rx="2" fill={TURF} opacity="0.5" />
            <Label x={348} y={62}>Indoor Centre</Label>
          </g>
        )}

        {/* ── Buildings row: gym / medical / academy ── */}
        <g>
          {/* Gym */}
          <rect x="310" y={118 - bh(gym)} width="26" height={bh(gym)} rx="2.5"
            fill={BUILDING} stroke={clubColor} strokeWidth="1" />
          {gym >= 4 && <rect x="313" y={121 - bh(gym)} width="20" height="4" rx="1" fill={clubColor} opacity="0.8" />}
          <Label x={323} y={128}>Gym</Label>
          <LevelPip x={323} y={110 - bh(gym)} level={gym} />

          {/* Medical */}
          <rect x="342" y={118 - bh(med)} width="26" height={bh(med)} rx="2.5"
            fill={BUILDING} stroke="var(--A-neg)" strokeWidth="1" />
          <line x1="352" y1={112 - bh(med) + 8} x2="358" y2={112 - bh(med) + 8} stroke="var(--A-neg)" strokeWidth="1.6" />
          <line x1="355" y1={109 - bh(med) + 8} x2="355" y2={115 - bh(med) + 8} stroke="var(--A-neg)" strokeWidth="1.6" />
          <Label x={355} y={128}>Medical</Label>
          <LevelPip x={355} y={110 - bh(med)} level={med} />

          {/* Academy */}
          <rect x="374" y={118 - bh(aca)} width="22" height={bh(aca)} rx="2.5"
            fill={BUILDING} stroke="var(--A-pos)" strokeWidth="1" />
          <Label x={385} y={128}>Academy</Label>
          <LevelPip x={385} y={110 - bh(aca)} level={aca} />
        </g>

        {/* ── Recovery pools ── */}
        <g>
          <circle cx="322" cy="148" r={4 + rec * 1.4} fill="#1c86c8" opacity="0.85" stroke="#9ed4f2" strokeWidth="0.8" />
          {rec >= 3 && <circle cx={340 + rec} cy="150" r={3 + rec} fill="#125e93" opacity="0.85" stroke="#9ed4f2" strokeWidth="0.7" />}
          {rec >= 5 && <rect x="356" y="142" width="30" height="14" rx="3" fill="#0d4a75" opacity="0.9" stroke="#9ed4f2" strokeWidth="0.7" />}
          <Label x={344} y={165}>Recovery</Label>
          <LevelPip x={306} y={146} level={rec} />
        </g>
      </svg>
    </div>
  );
}
