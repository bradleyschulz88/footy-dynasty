// Direction A — Polished Match Day
// Cinematic broadcast feel: large momentum bar with animated needle,
// quarter strips, stat bars that animate in, lower-third tickers, key-moments timeline.
(function () {
  const { Jersey, Crest, Spark, Ring, BarChart } = window.FDP;
  const { CLUB, MATCH_FEED, TACTICS } = window.FD;
  const { FrameA } = window.FDA;

  // Live momentum samples (last 20 sec of match for the bar)
  const MOMENTUM_TIMELINE = [
    { t: 0,  bal: 50 }, { t: 1, bal: 52 }, { t: 2, bal: 55 }, { t: 3, bal: 58 },
    { t: 4, bal: 56 }, { t: 5, bal: 60 }, { t: 6, bal: 64 }, { t: 7, bal: 68 },
    { t: 8, bal: 65 }, { t: 9, bal: 62 }, { t: 10, bal: 60 }, { t: 11, bal: 58 },
    { t: 12, bal: 55 }, { t: 13, bal: 52 }, { t: 14, bal: 56 }, { t: 15, bal: 60 },
    { t: 16, bal: 64 }, { t: 17, bal: 68 }, { t: 18, bal: 70 }, { t: 19, bal: 65 }, { t: 20, bal: 62 },
  ];

  // Key match moments along the timeline
  const KEY_MOMENTS = [
    { t: 5,  type: "G", side: "h", label: "Walsh" },
    { t: 12, type: "G", side: "a", label: "Stengle" },
    { t: 32, type: "G", side: "h", label: "Petracca" },
    { t: 41, type: "M", side: "h", label: "Momentum" },
    { t: 53, type: "G", side: "a", label: "Rioli" },
    { t: 60, type: "G", side: "h", label: "Daicos" },
    { t: 78, type: "G", side: "h", label: "Curnow" },
    { t: 92, type: "G", side: "a", label: "Naughton" },
  ];

  // Animated momentum bar with traveling needle
  function MomentumBar() {
    const [phase, setPhase] = React.useState(0);
    React.useEffect(() => {
      const id = setInterval(() => setPhase(p => (p + 1) % 360), 50);
      return () => clearInterval(id);
    }, []);
    // breathe between 58 and 70
    const balPct = 60 + Math.sin(phase / 60) * 8;
    return (
      <div>
        <div className="row between aic" style={{ marginBottom: 6 }}>
          <span className="label" style={{ fontSize: 9 }}>MOMENTUM · LAST 5 MIN</span>
          <span className="mono accent" style={{ fontSize: 10, letterSpacing: "0.16em" }}>BAL +{Math.round(balPct - 50)} ▲</span>
        </div>
        <div style={{ position: "relative", height: 28, background: "rgba(255,255,255,0.04)", overflow: "hidden", borderRadius: 4 }}>
          {/* Bar fill */}
          <div style={{
            position: "absolute", left: 0, top: 0, bottom: 0,
            width: `${balPct}%`,
            background: "linear-gradient(90deg, rgba(0,224,255,0.15) 0%, var(--A-accent) 100%)",
            transition: "width 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
            borderRight: "2px solid var(--A-accent)",
            boxShadow: "0 0 24px rgba(0,224,255,0.4)",
          }} />
          {/* Tick marks */}
          {Array.from({ length: 11 }).map((_, i) => (
            <div key={i} style={{
              position: "absolute", left: `${i*10}%`, top: 0, bottom: 0,
              width: 1, background: "rgba(255,255,255,0.06)",
            }} />
          ))}
          {/* Center line */}
          <div style={{ position: "absolute", left: "50%", top: -4, bottom: -4, width: 1, background: "rgba(255,255,255,0.3)" }} />
          {/* Pulsing needle */}
          <div style={{
            position: "absolute", left: `${balPct}%`, top: -2, bottom: -2,
            width: 2, background: "var(--A-text)",
            transform: "translateX(-1px)",
            transition: "left 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
            boxShadow: "0 0 8px var(--A-text)",
          }} />
          {/* Sample sparkline overlay */}
          <svg width="100%" height="28" style={{ position: "absolute", inset: 0, pointerEvents: "none" }} preserveAspectRatio="none" viewBox="0 0 200 28">
            <polyline
              points={MOMENTUM_TIMELINE.map((m, i) => `${(i / (MOMENTUM_TIMELINE.length - 1)) * 200},${28 - (m.bal/100) * 28}`).join(" ")}
              fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1" strokeLinejoin="round"
            />
          </svg>
        </div>
        <div className="row between" style={{ marginTop: 4 }}>
          <span className="mono dim" style={{ fontSize: 9 }}>BAL ◀</span>
          <span className="mono dim" style={{ fontSize: 9 }}>EVEN</span>
          <span className="mono dim" style={{ fontSize: 9 }}>▶ VRM</span>
        </div>
      </div>
    );
  }

  // Animated counting score
  function CountScore({ value, color, size = 96 }) {
    const [v, setV] = React.useState(0);
    React.useEffect(() => {
      let cancelled = false;
      const dur = 800;
      const start = performance.now();
      const tick = (now) => {
        if (cancelled) return;
        const t = Math.min(1, (now - start) / dur);
        const ease = 1 - Math.pow(1 - t, 3);
        setV(Math.round(value * ease));
        if (t < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      return () => { cancelled = true; };
    }, [value]);
    return (
      <span className="display tnum" style={{ fontSize: size, lineHeight: 0.85, color }}>{v}</span>
    );
  }

  function MatchA() {
    const [feedIdx, setFeedIdx] = React.useState(MATCH_FEED.length);
    React.useEffect(() => {
      const id = setInterval(() => {
        setFeedIdx(i => Math.max(1, ((i) % MATCH_FEED.length) + 1));
      }, 4500);
      return () => clearInterval(id);
    }, []);
    const visibleFeed = MATCH_FEED.slice(0, feedIdx).slice().reverse();

    return (
      <FrameA active="match">
        <div className="col gap-3" style={{ height: "100%", overflow: "hidden" }}>
          {/* Cinematic scoreboard */}
          <div className="panel" style={{ overflow: "hidden", position: "relative", padding: 0 }}>
            {/* Subtle scan-line texture */}
            <div style={{
              position: "absolute", inset: 0, pointerEvents: "none", opacity: 0.4,
              background: "repeating-linear-gradient(180deg, transparent 0, transparent 3px, rgba(0,224,255,0.025) 3px, rgba(0,224,255,0.025) 4px)",
            }} />
            <div className="row between aic" style={{ padding: "10px 18px", borderBottom: "1px solid var(--A-line)", background: "rgba(0,224,255,0.04)" }}>
              <div className="row aic gap-2"><span className="live-dot" /><span className="mono" style={{ fontSize: 10, color: "var(--A-neg)", letterSpacing: "0.2em" }}>LIVE · Q3 · 12:38</span></div>
              <span className="label">EFL · ROUND 8 · BALWYN PARK · ATT 2,140 · WEATHER FINE</span>
              <div className="row aic gap-2"><span className="mono accent" style={{ fontSize: 10, letterSpacing: "0.18em" }}>BROADCAST · CH7</span></div>
            </div>
            <div className="row aic" style={{ padding: "28px 32px", position: "relative" }}>
              {/* Home */}
              <div className="col aic" style={{ flex: 1 }}>
                <Jersey kit="stripes" colors={CLUB.colors} size={96} num="1" />
                <div className="display" style={{ fontSize: 28, marginTop: 10, letterSpacing: "0.04em" }}>BALWYN</div>
                <div className="row aic gap-2" style={{ marginTop: 4 }}>
                  <span className="label" style={{ fontSize: 8 }}>HOME</span>
                  <span className="mono accent" style={{ fontSize: 9 }}>STR 78</span>
                  <span className="pill" style={{ background: "rgba(46,230,166,0.08)", color: "var(--A-pos)", borderColor: "rgba(46,230,166,0.25)", padding: "1px 6px", fontSize: 9 }}>▲ FAV</span>
                </div>
              </div>
              {/* Score */}
              <div className="col aic" style={{ flex: 1.5, textAlign: "center" }}>
                <div className="row aic" style={{ gap: 14 }}>
                  <CountScore value={43} color="var(--A-accent)" size={108} />
                  <div className="display mute" style={{ fontSize: 72, lineHeight: 0.85 }}>—</div>
                  <CountScore value={34} color="var(--A-text)" size={108} />
                </div>
                <div className="mono tnum" style={{ fontSize: 13, marginTop: 6, color: "var(--A-text-dim)", letterSpacing: "0.1em" }}>6.7 (43)  ·  5.4 (34)</div>
                <div className="row gap-1" style={{ marginTop: 14 }}>
                  {[1,2,3,4].map(q => {
                    const live = q === 3;
                    const past = q < 3;
                    return (
                      <div key={q} style={{
                        width: 76, padding: "6px 0", textAlign: "center",
                        background: live ? "rgba(0,224,255,0.1)" : "transparent",
                        border: `1px solid ${live ? "var(--A-accent)" : "var(--A-line)"}`,
                        borderRadius: 4,
                        position: "relative",
                      }}>
                        <div className="label" style={{ fontSize: 8 }}>Q{q}{live && " · LIVE"}</div>
                        <div className="mono tnum" style={{ fontSize: 11, marginTop: 3, color: past || live ? "var(--A-text)" : "var(--A-text-mute)" }}>
                          {q === 1 ? "15-13" : q === 2 ? "20-14" : q === 3 ? "8-7" : "—"}
                        </div>
                        {live && <div style={{ position: "absolute", top: 4, right: 4, width: 5, height: 5, borderRadius: "50%", background: "var(--A-neg)", animation: "liveBlink 1.4s infinite" }}/>}
                      </div>
                    );
                  })}
                </div>
              </div>
              {/* Away */}
              <div className="col aic" style={{ flex: 1 }}>
                <Jersey kit="yoke" colors={["#000000","#CC0000","#FFFFFF"]} size={96} num="9" />
                <div className="display" style={{ fontSize: 28, marginTop: 10, letterSpacing: "0.04em" }}>VERMONT</div>
                <div className="row aic gap-2" style={{ marginTop: 4 }}>
                  <span className="label" style={{ fontSize: 8 }}>AWAY</span>
                  <span className="mono dim" style={{ fontSize: 9 }}>STR 81</span>
                  <span className="pill" style={{ background: "rgba(255,87,119,0.08)", color: "var(--A-neg)", borderColor: "rgba(255,87,119,0.25)", padding: "1px 6px", fontSize: 9 }}>1ST</span>
                </div>
              </div>
            </div>
            {/* Momentum + key-moments timeline */}
            <div style={{ padding: "12px 20px 16px", borderTop: "1px solid var(--A-line)" }}>
              <MomentumBar />
              {/* Key-moments timeline */}
              <div style={{ marginTop: 12 }}>
                <div className="row between aic" style={{ marginBottom: 6 }}>
                  <span className="label" style={{ fontSize: 9 }}>MATCH TIMELINE · KEY MOMENTS</span>
                  <span className="mono dim" style={{ fontSize: 9 }}>Q1   ·   Q2   ·   Q3   ·   Q4</span>
                </div>
                <div style={{ position: "relative", height: 26, background: "linear-gradient(90deg, rgba(0,224,255,0.04) 0%, rgba(255,255,255,0.02) 100%)", borderRadius: 2 }}>
                  {/* Quarter dividers */}
                  {[25, 50, 75].map(p => (
                    <div key={p} style={{ position: "absolute", left: `${p}%`, top: 0, bottom: 0, width: 1, background: "rgba(124,161,207,0.2)" }} />
                  ))}
                  {/* Live progress */}
                  <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "63%", background: "rgba(0,224,255,0.08)" }} />
                  <div style={{ position: "absolute", left: "63%", top: -3, bottom: -3, width: 2, background: "var(--A-accent)", boxShadow: "0 0 12px var(--A-accent)" }} />
                  {/* Moments */}
                  {KEY_MOMENTS.map((m, i) => {
                    const x = (m.t / 100) * 100;
                    const c = m.side === "h" ? "var(--A-pos)" : "var(--A-neg)";
                    return (
                      <div key={i} style={{
                        position: "absolute", left: `${x}%`, top: m.side === "h" ? 4 : "auto", bottom: m.side === "a" ? 4 : "auto",
                        transform: "translateX(-50%)",
                        width: 14, height: 14, borderRadius: m.type === "M" ? 2 : "50%",
                        background: c, color: "#000",
                        fontFamily: "JetBrains Mono", fontSize: 8, fontWeight: 700,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        border: "1px solid rgba(0,0,0,0.3)",
                      }} title={m.label}>{m.type}</div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Lower row */}
          <div className="row gap-3" style={{ flex: 1, minHeight: 0 }}>
            {/* Live feed */}
            <div className="panel" style={{ flex: 2, padding: 16, minHeight: 0, display: "flex", flexDirection: "column" }}>
              <div className="row between aic" style={{ marginBottom: 10 }}>
                <div className="row aic gap-2">
                  <div className="display" style={{ fontSize: 16 }}>MATCH FEED</div>
                  <span className="pill" style={{ fontSize: 9 }}>AUTO-SCROLL</span>
                </div>
                <div className="row gap-2">
                  <span className="pill">▲ {visibleFeed.filter(e => e.type === "goal-h").length} GOALS</span>
                  <span className="pill" style={{ background: "rgba(255,179,71,0.08)", color: "var(--A-accent-2)", borderColor: "rgba(255,179,71,0.25)" }}>BEHINDS</span>
                </div>
              </div>
              <div className="col gap-1" style={{ flex: 1, overflow: "auto" }}>
                {visibleFeed.map((e, i) => {
                  const c = e.type === "goal-h" ? "var(--A-pos)" : e.type === "goal-a" ? "var(--A-neg)" : e.type === "moment" ? "var(--A-accent-2)" : e.type === "behind" ? "var(--A-text-dim)" : "var(--A-text-mute)";
                  return (
                    <div key={`${e.q}-${e.t}-${i}`} className="feed-item row gap-3" style={{
                      padding: "10px 12px",
                      borderLeft: `2px solid ${c}`,
                      background: i === 0 ? "rgba(0,224,255,0.05)" : "transparent",
                    }}>
                      <span className="mono" style={{ fontSize: 9, width: 56, color: "var(--A-text-mute)", letterSpacing: "0.05em" }}>Q{e.q} · {e.t}</span>
                      {(e.type === "goal-h" || e.type === "goal-a") && (
                        <span className="display" style={{ fontSize: 11, color: c, letterSpacing: "0.18em", width: 40 }}>GOAL</span>
                      )}
                      {e.type === "moment" && <span className="display" style={{ fontSize: 11, color: c, letterSpacing: "0.18em", width: 40 }}>MOM</span>}
                      {e.type === "behind" && <span className="display" style={{ fontSize: 11, color: c, letterSpacing: "0.18em", width: 40 }}>BHD</span>}
                      {!["goal-h","goal-a","moment","behind"].includes(e.type) && <span style={{ width: 40 }}/>}
                      <span style={{ flex: 1, fontSize: 11, color: e.type === "neutral" ? "var(--A-text-mute)" : "var(--A-text)" }}>{e.text}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Game plan + stats */}
            <div className="col gap-3" style={{ flex: 1, minHeight: 0, minWidth: 240 }}>
              <div className="panel" style={{ padding: 14 }}>
                <div className="row between aic" style={{ marginBottom: 8 }}>
                  <div className="display" style={{ fontSize: 14 }}>GAME PLAN</div>
                  <span className="mono dim" style={{ fontSize: 9, letterSpacing: "0.14em" }}>Q3 ADJUST</span>
                </div>
                <div className="col gap-2">
                  {TACTICS.map(t => (
                    <div key={t.key} className="card-hover" style={{
                      padding: "8px 10px",
                      border: t.active ? "1px solid var(--A-accent)" : "1px solid var(--A-line)",
                      background: t.active ? "rgba(0,224,255,0.06)" : "transparent",
                      borderRadius: 4,
                    }}>
                      <div className="row between aic">
                        <span style={{ fontSize: 12, fontWeight: 700, color: t.active ? "var(--A-accent)" : "var(--A-text)" }}>{t.name}</span>
                        <span className="mono" style={{ fontSize: 10, color: t.active ? "var(--A-accent)" : "var(--A-text-mute)" }}>{t.diff}</span>
                      </div>
                      <div className="mono mute" style={{ fontSize: 9, marginTop: 2 }}>{t.note}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="panel" style={{ padding: 14, flex: 1, minHeight: 0 }}>
                <div className="row between aic" style={{ marginBottom: 10 }}>
                  <div className="display" style={{ fontSize: 14 }}>HEAD TO HEAD</div>
                  <div className="row gap-2"><span className="mono accent" style={{ fontSize: 9 }}>BAL</span><span className="mono dim" style={{ fontSize: 9 }}>VRM</span></div>
                </div>
                <div className="col gap-3">
                  {[
                    ["Inside 50s", 28, 21],
                    ["Contested poss.", 92, 84],
                    ["Tackles", 41, 36],
                    ["Marks", 67, 58],
                    ["Clearances", 22, 19],
                    ["Disposal eff.", 72, 68],
                  ].map(([l, h, a]) => {
                    const total = h + a, hp = (h / total) * 100;
                    return (
                      <div key={l}>
                        <div className="row between" style={{ marginBottom: 3 }}>
                          <span className="mono accent" style={{ fontSize: 11, fontWeight: 700 }}>{h}</span>
                          <span className="label" style={{ fontSize: 9 }}>{l}</span>
                          <span className="mono dim" style={{ fontSize: 11 }}>{a}</span>
                        </div>
                        <div style={{ height: 4, background: "rgba(255,87,119,0.18)", overflow: "hidden", borderRadius: 2 }}>
                          <div className="bar-fill" style={{ width: `${hp}%`, height: "100%", background: "var(--A-accent)" }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </FrameA>
    );
  }

  window.FDA_POLISH = window.FDA_POLISH || {};
  window.FDA_POLISH.MatchA = MatchA;
})();
