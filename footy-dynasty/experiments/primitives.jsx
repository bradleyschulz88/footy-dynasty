// Shared visual primitives used by both Direction A and B.
// All take a `dir` prop ("A" | "B") to pick token defaults.

const Jersey = ({ kit = "stripes", colors = ["#1B3B7A", "#FFD200", "#FFFFFF"], size = 64, num }) => {
  const [c1, c2, c3] = colors;
  const id = React.useId ? React.useId().replace(/:/g, "_") : `j${Math.random().toString(36).slice(2,7)}`;
  return (
    <svg width={size} height={size * 1.15} viewBox="0 0 60 70" style={{ display: "block" }}>
      <defs>
        <clipPath id={`jc-${id}`}>
          <path d="M10 5 L22 5 L26 11 L34 11 L38 5 L50 5 L56 14 L48 22 L48 60 L12 60 L12 22 L4 14 Z" />
        </clipPath>
      </defs>
      <g clipPath={`url(#jc-${id})`}>
        <rect x="0" y="0" width="60" height="70" fill={c1} />
        {kit === "stripes" && (<>
          <rect x="18" y="0" width="6" height="70" fill={c2} />
          <rect x="36" y="0" width="6" height="70" fill={c2} />
        </>)}
        {kit === "yoke" && <rect x="0" y="0" width="60" height="22" fill={c2} />}
        {kit === "sash" && <polygon points="0,40 60,0 60,18 0,58" fill={c2} />}
        {kit === "hoops" && (<>
          <rect x="0" y="14" width="60" height="8" fill={c2} />
          <rect x="0" y="30" width="60" height="8" fill={c2} />
          <rect x="0" y="46" width="60" height="8" fill={c2} />
        </>)}
        {kit === "panel" && (<>
          <rect x="0" y="0" width="14" height="70" fill={c2} />
          <rect x="46" y="0" width="14" height="70" fill={c2} />
        </>)}
        {kit === "solid" && null}
      </g>
      <path d="M10 5 L22 5 L26 11 L34 11 L38 5 L50 5 L56 14 L48 22 L48 60 L12 60 L12 22 L4 14 Z"
        fill="none" stroke="rgba(0,0,0,0.2)" strokeWidth="0.6" />
      {num != null && (
        <text x="30" y="42" textAnchor="middle" fill={c3}
          fontFamily="Bebas Neue, sans-serif" fontSize="22" letterSpacing="0.5">{num}</text>
      )}
    </svg>
  );
};

// Bar segment scale 0-100. Direction styles via class.
const AttrBar = ({ value, dir = "A", size = "sm", color }) => {
  const w = size === "lg" ? 120 : size === "md" ? 80 : 56;
  const h = dir === "A" ? 4 : 6;
  const tone = color || (value >= 85 ? "var(--A-pos)" : value >= 70 ? "var(--A-accent)" : "var(--A-text-mute)");
  const toneB = color || (value >= 85 ? "var(--B-pos)" : value >= 70 ? "var(--B-accent)" : "var(--B-text-mute)");
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
      <div style={{
        width: w, height: h,
        background: dir === "A" ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.05)",
        borderRadius: dir === "A" ? 999 : 0,
        overflow: "hidden",
      }}>
        <div style={{
          width: `${value}%`, height: "100%",
          background: dir === "A" ? tone : toneB,
        }} />
      </div>
      <span className="mono tnum" style={{ fontSize: 10, color: dir === "A" ? "var(--A-text-dim)" : "var(--B-text-dim)", minWidth: 18 }}>{value}</span>
    </div>
  );
};

// Big-number score / metric block
const NumberBlock = ({ value, label, sub, accent, dir = "A", size = 64 }) => (
  <div className="col">
    {label && <div className="label" style={{ marginBottom: 4 }}>{label}</div>}
    <div className="display" style={{ fontSize: size, lineHeight: 0.9, color: accent || "currentColor" }}>{value}</div>
    {sub && <div className="mono" style={{ fontSize: 10, marginTop: 4, color: dir === "A" ? "var(--A-text-mute)" : "var(--B-text-mute)" }}>{sub}</div>}
  </div>
);

const Spark = ({ data = [], color = "currentColor", h = 24, w = 80 }) => {
  const max = Math.max(...data, 1), min = Math.min(...data, 0);
  const range = max - min || 1;
  const step = w / (data.length - 1 || 1);
  const pts = data.map((v, i) => `${i * step},${h - ((v - min) / range) * h}`).join(" ");
  return (
    <svg width={w} height={h} style={{ display: "block" }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      {data.map((v, i) => (
        <circle key={i} cx={i * step} cy={h - ((v - min) / range) * h} r={1.5} fill={color} opacity={i === data.length - 1 ? 1 : 0.4} />
      ))}
    </svg>
  );
};

// Form chip: WLD letters
const FormChips = ({ form = "", dir = "A" }) => (
  <div style={{ display: "inline-flex", gap: 3 }}>
    {form.split("").map((c, i) => {
      const bg = c === "W" ? (dir === "A" ? "var(--A-pos)" : "var(--B-pos)")
                : c === "L" ? (dir === "A" ? "var(--A-neg)" : "var(--B-neg)")
                : (dir === "A" ? "var(--A-text-mute)" : "var(--B-text-mute)");
      return (
        <span key={i} className="mono" style={{
          width: 14, height: 14,
          fontSize: 9, fontWeight: 700,
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          background: bg, color: "#0A0A0A",
          borderRadius: dir === "A" ? 3 : 0,
        }}>{c}</span>
      );
    })}
  </div>
);

// Position badge
const PosBadge = ({ pos, dir = "A" }) => {
  const map = {
    KF: "#FF5A1F", HF: "#FFB347", C: "#00E0FF", WG: "#A78BFA",
    R: "#2EE6A6", RU: "#FFD84D", HB: "#7CA1CF", KB: "#5B7AB5", UT: "#8E9AAB",
  };
  return (
    <span className="mono" style={{
      display: "inline-block",
      padding: "2px 6px",
      fontSize: 9,
      fontWeight: 700,
      letterSpacing: "0.1em",
      background: dir === "A" ? `${map[pos]}20` : `${map[pos]}30`,
      color: map[pos],
      border: `1px solid ${map[pos]}55`,
      borderRadius: dir === "A" ? 3 : 0,
    }}>{pos}</span>
  );
};

// Crest tile — uses club colors as a stylized monogram
const Crest = ({ short = "BAL", colors = ["#1B3B7A", "#FFD200", "#FFFFFF"], size = 36, dir = "A" }) => {
  const [c1, c2, c3] = colors;
  return (
    <div style={{
      width: size, height: size,
      background: `linear-gradient(135deg, ${c1} 0%, ${c1} 50%, ${c2} 50%, ${c2} 100%)`,
      color: c3,
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      fontFamily: "Bebas Neue, sans-serif",
      fontSize: size * 0.4,
      letterSpacing: "0.04em",
      borderRadius: dir === "A" ? size * 0.2 : 0,
      flexShrink: 0,
      boxShadow: dir === "A" ? `0 0 0 1px ${c1}66 inset` : "none",
    }}>{short}</div>
  );
};

// Tab strip
const Tabs = ({ tabs, active, dir = "A" }) => (
  <div className="row" style={{
    gap: dir === "A" ? 4 : 0,
    borderBottom: dir === "A" ? "1px solid var(--A-line)" : "1px solid var(--B-line)",
    paddingBottom: dir === "A" ? 0 : 0,
  }}>
    {tabs.map(t => {
      const on = t === active;
      return (
        <div key={t} className="mono" style={{
          padding: dir === "A" ? "8px 14px" : "10px 16px",
          fontSize: dir === "A" ? 10 : 11,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: on ? (dir === "A" ? "var(--A-accent)" : "var(--B-accent)") : (dir === "A" ? "var(--A-text-mute)" : "var(--B-text-mute)"),
          borderBottom: on ? `2px solid ${dir === "A" ? "var(--A-accent)" : "var(--B-accent)"}` : "2px solid transparent",
          marginBottom: -1,
          fontWeight: 600,
          cursor: "pointer",
        }}>{t}</div>
      );
    })}
  </div>
);

// Section header
const SectionHead = ({ title, sub, action, dir = "A" }) => (
  <div className="row between aic" style={{ marginBottom: 12 }}>
    <div>
      <div className="display" style={{
        fontSize: dir === "A" ? 18 : 22,
        letterSpacing: "0.04em",
      }}>{title}</div>
      {sub && <div className="label" style={{ marginTop: 2 }}>{sub}</div>}
    </div>
    {action}
  </div>
);

// Radar/spider chart — for player attributes
const Radar = ({ data = [], size = 180, dir = "A", color }) => {
  // data: [{ label, value (0-100) }]
  const cx = size / 2, cy = size / 2, r = size * 0.4;
  const n = data.length;
  const angle = (i) => (Math.PI * 2 * i) / n - Math.PI / 2;
  const pt = (i, v) => [cx + Math.cos(angle(i)) * r * (v / 100), cy + Math.sin(angle(i)) * r * (v / 100)];
  const polygon = data.map((d, i) => pt(i, d.value).join(",")).join(" ");
  const accent = color || (dir === "A" ? "#00E0FF" : "#FF5A1F");
  const grid = dir === "A" ? "rgba(124,161,207,0.18)" : "rgba(255,255,255,0.10)";
  const labelColor = dir === "A" ? "#8AA3C2" : "#A8A095";
  return (
    <svg width={size} height={size} style={{ display: "block", overflow: "visible" }}>
      {[20, 40, 60, 80, 100].map(p => (
        <polygon key={p} points={data.map((_, i) => pt(i, p).join(",")).join(" ")}
          fill="none" stroke={grid} strokeWidth="0.6" />
      ))}
      {data.map((_, i) => {
        const [x, y] = pt(i, 100);
        return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke={grid} strokeWidth="0.6" />;
      })}
      <polygon points={polygon} fill={accent} fillOpacity="0.18" stroke={accent} strokeWidth="1.5" />
      {data.map((d, i) => {
        const [x, y] = pt(i, d.value);
        return <circle key={i} cx={x} cy={y} r="2.5" fill={accent} />;
      })}
      {data.map((d, i) => {
        const [x, y] = pt(i, 118);
        return (
          <text key={i} x={x} y={y} textAnchor="middle" dominantBaseline="middle"
            fontFamily="JetBrains Mono, monospace" fontSize="9" letterSpacing="0.1em"
            fill={labelColor}>{d.label}</text>
        );
      })}
    </svg>
  );
};

// Donut/ring progress
const Ring = ({ value = 50, size = 64, stroke = 6, color = "var(--A-accent)", track = "rgba(255,255,255,0.06)", label, mono = false }) => {
  const r = (size - stroke) / 2, c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} style={{ display: "block" }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={`${(value/100)*c} ${c}`} strokeLinecap="round"
        transform={`rotate(-90 ${size/2} ${size/2})`} />
      {label && (
        <text x={size/2} y={size/2 + 4} textAnchor="middle"
          fontFamily={mono ? "JetBrains Mono, monospace" : "Bebas Neue, sans-serif"}
          fontSize={size * 0.28} fill={color}>{label}</text>
      )}
    </svg>
  );
};

// Line chart
const LineChart = ({ data = [], w = 280, h = 80, color = "var(--A-accent)", fill = true, baseline = null }) => {
  const max = Math.max(...data, 1), min = Math.min(...data, 0);
  const range = max - min || 1;
  const step = w / (data.length - 1 || 1);
  const pts = data.map((v, i) => [i * step, h - ((v - min) / range) * (h - 8) - 4]);
  const line = pts.map(p => p.join(",")).join(" ");
  const area = `0,${h} ${line} ${w},${h}`;
  const id = `lc-${Math.random().toString(36).slice(2,7)}`;
  return (
    <svg width={w} height={h} style={{ display: "block" }}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {baseline != null && (
        <line x1="0" y1={h - ((baseline - min)/range) * (h-8) - 4} x2={w} y2={h - ((baseline - min)/range) * (h-8) - 4}
          stroke="rgba(255,255,255,0.08)" strokeDasharray="3 3" />
      )}
      {fill && <polygon points={area} fill={`url(#${id})`} />}
      <polyline points={line} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      {pts.map(([x,y],i) => i === pts.length-1 && (
        <g key={i}>
          <circle cx={x} cy={y} r="6" fill={color} fillOpacity="0.2" />
          <circle cx={x} cy={y} r="3" fill={color} />
        </g>
      ))}
    </svg>
  );
};

// Bar chart (horizontal categories)
const BarChart = ({ data = [], w = 240, h = 120, color = "var(--A-accent)", dir = "A" }) => {
  const max = Math.max(...data.map(d => d.value), 1);
  const bw = w / data.length;
  const labelColor = dir === "A" ? "#8AA3C2" : "#A8A095";
  return (
    <svg width={w} height={h + 18} style={{ display: "block" }}>
      {data.map((d, i) => {
        const barH = (d.value / max) * h;
        return (
          <g key={i}>
            <rect x={i * bw + bw * 0.15} y={h - barH} width={bw * 0.7} height={barH}
              fill={color} fillOpacity={d.highlight ? 1 : 0.5} rx={dir === "A" ? 2 : 0} />
            <text x={i * bw + bw * 0.5} y={h + 12} textAnchor="middle"
              fontFamily="JetBrains Mono, monospace" fontSize="9" fill={labelColor} letterSpacing="0.08em">{d.label}</text>
          </g>
        );
      })}
    </svg>
  );
};

window.FDP = { Jersey, AttrBar, NumberBlock, Spark, FormChips, PosBadge, Crest, Tabs, SectionHead, Radar, Ring, LineChart, BarChart };
