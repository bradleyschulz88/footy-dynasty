// Direction A — Polished Hub + Squad + Club + Recruit + Competition + Kit Designer
// Hero moments, charts, radar, scout reports, kit designer.
(function () {
  const { Jersey, AttrBar, Crest, FormChips, PosBadge, Spark, Tabs, SectionHead, Radar, Ring, LineChart, BarChart } = window.FDP;
  const {
    CLUB, LADDER, SQUAD, FIXTURES, NEWS, TACTICS, FACILITIES, SPONSORS, STAFF, DRAFT,
    TRADES, FINANCE, SEASON_TREND, CASH_TREND, REVENUE_BREAKDOWN, PLAYER_HISTORY,
    SCOUT_REPORTS, KIT_PRESETS, KIT_PALETTES,
  } = window.FD;
  const { FrameA } = window.FDA;

  // ────────────────────────────────────────────────────────────
  // HUB — hero season narrative
  // ────────────────────────────────────────────────────────────
  function HubA() {
    const me = LADDER.find(r => r.me);
    const next = FIXTURES[0];
    return (
      <FrameA active="hub">
        <div className="col gap-4" style={{ height: "100%", overflow: "hidden" }}>
          {/* HERO — season-narrative */}
          <div className="panel" style={{ padding: 0, position: "relative", overflow: "hidden" }}>
            {/* Background: club kit + glow */}
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, rgba(27,59,122,0.45) 0%, rgba(0,224,255,0.06) 50%, rgba(7,16,31,0.95) 100%)" }} />
            <div style={{ position: "absolute", right: -10, top: -20, opacity: 0.15, transform: "rotate(8deg)" }}>
              <Jersey kit="stripes" colors={CLUB.colors} size={210} num="1" />
            </div>
            <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(124,161,207,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(124,161,207,0.06) 1px, transparent 1px)", backgroundSize: "40px 40px", maskImage: "linear-gradient(180deg, transparent 0%, black 50%, transparent 100%)" }} />
            <div style={{ position: "relative", padding: "28px 30px" }}>
              <div className="row between aic" style={{ marginBottom: 18 }}>
                <div className="row aic gap-3">
                  <span className="pill"><span className="live-dot" /> Round {CLUB.week} of {CLUB.totalRounds}</span>
                  <span className="label">{CLUB.league} · TIER {CLUB.tier}</span>
                </div>
                <div className="row aic gap-3">
                  <span className="mono dim" style={{ fontSize: 10, letterSpacing: "0.18em" }}>SEASON {CLUB.season} · CH-7 BROADCAST</span>
                </div>
              </div>
              <div className="display glow-text" style={{ fontSize: 80, lineHeight: 0.85, letterSpacing: "0.02em" }}>{CLUB.name.toUpperCase()}</div>
              <div className="display" style={{ fontSize: 26, lineHeight: 1, marginTop: 6, color: "var(--A-text)" }}>
                <span className="accent">2ND</span> ON THE LADDER · ON FOR PROMOTION
              </div>
              <div style={{ fontSize: 13, color: "var(--A-text-dim)", marginTop: 6, maxWidth: 560 }}>
                Six-game winning streak. Two rounds clear of the cut, but Vermont sits one game adrift with the percentage edge. <span className="accent">Win Saturday</span> and finals are mathematically locked.
              </div>
              {/* Hero stats row */}
              <div className="row gap-4" style={{ marginTop: 20 }}>
                {[
                  { l: "FORM",    v: "WWWLW",  c: "var(--A-pos)",      sub: "LAST 5" },
                  { l: "PCT",     v: "118.4",  c: "var(--A-accent)",   sub: "FOR/AGAINST" },
                  { l: "PCT GAP", v: "+6.1",   c: "var(--A-accent-2)", sub: "VS 3RD" },
                  { l: "PROJ.",   v: "P1",     c: "var(--A-pos)",      sub: "PROMOTE" },
                  { l: "MORALE",  v: "82",     c: "#A78BFA",           sub: "+3 W/W" },
                ].map(s => (
                  <div key={s.l} className="panel-flat" style={{ padding: "10px 14px", flex: 1 }}>
                    <div className="label" style={{ fontSize: 8 }}>{s.l}</div>
                    <div className="display tnum" style={{ fontSize: 24, lineHeight: 1, color: s.c, marginTop: 2 }}>{s.v}</div>
                    <div className="mono mute" style={{ fontSize: 8, marginTop: 2, letterSpacing: "0.1em" }}>{s.sub}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="row gap-4" style={{ flex: 1, minHeight: 0 }}>
            {/* Trend chart */}
            <div className="panel" style={{ flex: 2, padding: 18, minWidth: 0 }}>
              <div className="row between aic" style={{ marginBottom: 14 }}>
                <div>
                  <div className="display" style={{ fontSize: 16 }}>SEASON TRAJECTORY</div>
                  <div className="label" style={{ marginTop: 2 }}>LADDER POSITION · ROUNDS 1–8</div>
                </div>
                <div className="row gap-2">
                  <span className="pill">FOR/AGST</span>
                  <span className="mono mute" style={{ fontSize: 10 }}>POS</span>
                </div>
              </div>
              {/* dual area chart */}
              <div style={{ position: "relative", height: 150 }}>
                <svg width="100%" height="150" style={{ position: "absolute", inset: 0 }} preserveAspectRatio="none" viewBox="0 0 600 150">
                  <defs>
                    <linearGradient id="forGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#00E0FF" stopOpacity="0.35" />
                      <stop offset="100%" stopColor="#00E0FF" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  {[30,60,90,120].map(y => <line key={y} x1="0" y1={y} x2="600" y2={y} stroke="rgba(124,161,207,0.08)" />)}
                  {/* For series */}
                  {(() => {
                    const pts = SEASON_TREND.map((d, i) => [(i / 7) * 600, 150 - (d.for / 110) * 130]);
                    const path = pts.map((p, i) => (i === 0 ? "M" : "L") + p.join(",")).join(" ");
                    const area = `M0,150 ${pts.map(p => "L" + p.join(",")).join(" ")} L600,150 Z`;
                    return (<>
                      <path d={area} fill="url(#forGrad)" />
                      <path d={path} fill="none" stroke="#00E0FF" strokeWidth="2" />
                      {pts.map(([x,y], i) => (
                        <circle key={i} cx={x} cy={y} r={i === pts.length - 1 ? 5 : 2.5} fill="#00E0FF"
                          opacity={i === pts.length - 1 ? 1 : 0.7} />
                      ))}
                    </>);
                  })()}
                  {/* Against series */}
                  {(() => {
                    const pts = SEASON_TREND.map((d, i) => [(i / 7) * 600, 150 - (d.agst / 110) * 130]);
                    const path = pts.map((p, i) => (i === 0 ? "M" : "L") + p.join(",")).join(" ");
                    return (
                      <path d={path} fill="none" stroke="#FF5577" strokeWidth="1.4" strokeDasharray="4 3" />
                    );
                  })()}
                  {/* Round labels */}
                  {SEASON_TREND.map((d, i) => (
                    <text key={i} x={(i / 7) * 600} y="146" textAnchor="middle"
                      fontFamily="JetBrains Mono, monospace" fontSize="9" fill="#4F6789" letterSpacing="0.1em">R{d.rd}</text>
                  ))}
                </svg>
              </div>
              <div className="row gap-4" style={{ marginTop: 6 }}>
                <div className="row aic gap-2"><span style={{ width: 10, height: 2, background: "var(--A-accent)" }}/><span className="mono dim" style={{ fontSize: 10 }}>POINTS FOR</span></div>
                <div className="row aic gap-2"><span style={{ width: 10, height: 2, background: "var(--A-neg)", borderTop: "1px dashed var(--A-neg)" }}/><span className="mono dim" style={{ fontSize: 10 }}>POINTS AGAINST</span></div>
                <div style={{ flex: 1 }} />
                <span className="mono accent" style={{ fontSize: 10 }}>+12.4 NET (R8 PROJ)</span>
              </div>
            </div>

            {/* Next match preview */}
            <div className="panel card-hover" style={{ flex: 1, padding: 18, minWidth: 230 }}>
              <div className="label">NEXT FIXTURE</div>
              <div className="display" style={{ fontSize: 18, marginTop: 4 }}>ROUND {next.round}</div>
              <hr style={{ margin: "12px 0" }}/>
              <div className="row aic gap-3" style={{ marginBottom: 14 }}>
                <Crest short="VRM" colors={["#000000","#CC0000","#FFFFFF"]} size={56} dir="A" />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{next.away}</div>
                  <div className="label" style={{ marginTop: 2 }}>{next.home === CLUB.short ? "AT HOME" : "AWAY"} · 2:10 PM</div>
                </div>
              </div>
              <div className="col gap-2">
                <div className="row between"><span className="label">FORM (L5)</span><FormChips form="WWLWW" dir="A" /></div>
                <div className="row between"><span className="label">LAST H2H</span><span className="mono accent" style={{ fontSize: 10 }}>BAL 78–62</span></div>
                <div className="row between"><span className="label">WIN PROB.</span><span className="display" style={{ fontSize: 22, color: "var(--A-pos)" }}>62%</span></div>
              </div>
              <div className="panel-flat" style={{ marginTop: 12, padding: 10, background: "rgba(0,224,255,0.04)" }}>
                <div className="label" style={{ fontSize: 8 }}>KEY MATCH-UP</div>
                <div style={{ fontSize: 11, marginTop: 4 }}>Walsh (BAL) vs Stengle (VRM) — they cancelled each other R3.</div>
              </div>
              <button className="btn-primary" style={{ width: "100%", marginTop: 14 }}>PRE-MATCH BRIEF →</button>
            </div>

            {/* News ticker */}
            <div className="panel" style={{ flex: 1, padding: 0, minWidth: 230, display: "flex", flexDirection: "column" }}>
              <div className="row between aic" style={{ padding: "14px 16px 8px" }}>
                <div className="display" style={{ fontSize: 16 }}>NEWS WIRE</div>
                <span className="pill" style={{ fontSize: 9 }}>5 NEW</span>
              </div>
              <div style={{ flex: 1, overflow: "auto", padding: "0 16px 14px" }}>
                <div className="col gap-1">
                  {NEWS.slice(0, 6).map((n, i) => (
                    <div key={i} className="row-hover" style={{
                      padding: "10px 0",
                      borderBottom: "1px solid var(--A-line)",
                    }}>
                      <div className="row aic gap-2">
                        <span className="mono" style={{ fontSize: 9, color: n.tone === "good" ? "var(--A-pos)" : n.tone === "bad" ? "var(--A-neg)" : "var(--A-text-mute)", letterSpacing: "0.15em" }}>
                          {n.tag.toUpperCase()}
                        </span>
                        <span className="mono mute" style={{ fontSize: 8 }}>· R{CLUB.week}</span>
                      </div>
                      <div style={{ fontSize: 12, marginTop: 4, lineHeight: 1.4 }}>{n.title}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </FrameA>
    );
  }

  // ────────────────────────────────────────────────────────────
  // SQUAD — radar chart, player detail
  // ────────────────────────────────────────────────────────────
  function SquadA() {
    const captain = SQUAD.find(p => p.captain) || SQUAD[0];
    const radarData = [
      { label: "MARK", value: captain.attr.MRK },
      { label: "KICK", value: captain.attr.KCK },
      { label: "TACK", value: captain.attr.TKL },
      { label: "ENDR", value: captain.attr.END },
      { label: "SPD",  value: captain.attr.SPD },
      { label: "DEC",  value: captain.attr.DEC },
    ];
    return (
      <FrameA active="squad">
        <div className="col" style={{ height: "100%", gap: 16, overflow: "hidden" }}>
          <div className="row between aic">
            <div>
              <div className="display" style={{ fontSize: 22 }}>SQUAD</div>
              <div className="label" style={{ marginTop: 2 }}>{SQUAD.length} PLAYERS · LIST SIZE 38 · CAP $4.2M</div>
            </div>
            <Tabs tabs={["Roster", "Tactics", "Training", "Contracts"]} active="Roster" dir="A" />
          </div>

          <div className="row gap-4" style={{ flex: 1, minHeight: 0 }}>
            {/* Player list */}
            <div className="panel" style={{ flex: 2, padding: 0, minWidth: 0, display: "flex", flexDirection: "column" }}>
              <div className="row" style={{ padding: "10px 16px", borderBottom: "1px solid var(--A-line)", background: "rgba(0,224,255,0.03)" }}>
                <span className="label" style={{ flex: 0.4 }}>#</span>
                <span className="label" style={{ flex: 2 }}>PLAYER</span>
                <span className="label" style={{ flex: 0.7 }}>POS</span>
                <span className="label" style={{ flex: 0.5 }}>AGE</span>
                <span className="label" style={{ flex: 0.5 }}>OVR</span>
                <span className="label" style={{ flex: 1.2 }}>FORM</span>
                <span className="label" style={{ flex: 1 }}>FIT</span>
                <span className="label" style={{ flex: 0.7 }}>$</span>
              </div>
              <div style={{ flex: 1, overflow: "auto" }}>
                {SQUAD.map((p, i) => {
                  const sel = p.captain;
                  return (
                    <div key={p.id} className="player-row row aic" style={{
                      padding: "8px 16px",
                      borderBottom: "1px solid var(--A-line)",
                      background: sel ? "rgba(0,224,255,0.06)" : "transparent",
                      borderLeft: sel ? "2px solid var(--A-accent)" : "2px solid transparent",
                    }}>
                      <span className="mono tnum" style={{ flex: 0.4, fontSize: 11, color: "var(--A-text-mute)" }}>{p.num}</span>
                      <div style={{ flex: 2, display: "flex", alignItems: "center", gap: 8 }}>
                        <Jersey kit="stripes" colors={CLUB.colors} size={22} />
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 12, fontWeight: 600 }}>{p.name} {p.captain && <span className="accent" style={{ fontSize: 9 }}>· C</span>}</div>
                        </div>
                      </div>
                      <span style={{ flex: 0.7 }}><PosBadge pos={p.pos} dir="A" /></span>
                      <span className="mono" style={{ flex: 0.5, fontSize: 11 }}>{p.age}</span>
                      <span style={{ flex: 0.5 }}><span className="display" style={{ fontSize: 16, color: p.ovr >= 85 ? "var(--A-pos)" : p.ovr >= 75 ? "var(--A-accent)" : "var(--A-text-mute)" }}>{p.ovr}</span></span>
                      <span style={{ flex: 1.2 }}><AttrBar value={p.form * 10} dir="A" size="sm" /></span>
                      <span style={{ flex: 1 }}><AttrBar value={p.fitness} dir="A" size="sm" color={p.fitness >= 90 ? "var(--A-pos)" : p.fitness >= 75 ? "var(--A-accent-2)" : "var(--A-neg)"} /></span>
                      <span className="mono" style={{ flex: 0.7, fontSize: 10, color: "var(--A-text-dim)" }}>${p.contract.salary}K</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Player detail */}
            <div className="panel" style={{ flex: 1.2, padding: 18, overflow: "auto", minWidth: 280 }}>
              <div className="row aic gap-3">
                <Jersey kit="stripes" colors={CLUB.colors} size={64} num={captain.num} />
                <div style={{ minWidth: 0 }}>
                  <div className="label">CAPTAIN · #{captain.num}</div>
                  <div className="display" style={{ fontSize: 22, marginTop: 2, lineHeight: 1 }}>{captain.name.toUpperCase()}</div>
                  <div className="row aic gap-2" style={{ marginTop: 4 }}>
                    <PosBadge pos={captain.pos} dir="A" />
                    <span className="mono dim" style={{ fontSize: 10 }}>{captain.age} YRS · {captain.h}cm · {captain.w}kg</span>
                  </div>
                </div>
                <div style={{ flex: 1 }} />
                <div className="col aic">
                  <div className="display accent" style={{ fontSize: 36, lineHeight: 0.9 }}>{captain.ovr}</div>
                  <div className="label" style={{ fontSize: 8 }}>OVR</div>
                </div>
              </div>

              <hr style={{ margin: "16px 0" }}/>

              {/* Radar */}
              <div className="row aic" style={{ gap: 16 }}>
                <Radar data={radarData} size={170} dir="A" />
                <div className="col gap-2" style={{ flex: 1 }}>
                  {Object.entries(captain.attr).map(([k, v]) => (
                    <div key={k} className="row between aic">
                      <span className="mono" style={{ fontSize: 10, color: "var(--A-text-dim)", letterSpacing: "0.1em" }}>{k}</span>
                      <div style={{ width: 80 }}><AttrBar value={v} dir="A" size="md" /></div>
                    </div>
                  ))}
                </div>
              </div>

              <hr style={{ margin: "16px 0" }}/>

              {/* Form trend */}
              <div className="row between aic" style={{ marginBottom: 8 }}>
                <span className="label">FORM TREND · LAST 8 ROUNDS</span>
                <span className="mono accent" style={{ fontSize: 10 }}>+8 OVR</span>
              </div>
              <LineChart data={(PLAYER_HISTORY.walsh || []).map(h => h.form)} w={280} h={56} color="var(--A-accent)" />

              <hr style={{ margin: "16px 0" }}/>

              {/* Contract */}
              <div className="row between aic" style={{ marginBottom: 8 }}>
                <span className="label">CONTRACT</span>
                <span className="pill" style={{ fontSize: 9, background: "rgba(46,230,166,0.08)", color: "var(--A-pos)", borderColor: "rgba(46,230,166,0.25)" }}>EXTEND ELIG.</span>
              </div>
              <div className="row gap-2">
                <div className="panel-flat" style={{ flex: 1, padding: 10 }}>
                  <div className="label" style={{ fontSize: 8 }}>SALARY</div>
                  <div className="display" style={{ fontSize: 18, marginTop: 2 }}>$28K</div>
                  <div className="mono mute" style={{ fontSize: 8, marginTop: 2 }}>PER WEEK</div>
                </div>
                <div className="panel-flat" style={{ flex: 1, padding: 10 }}>
                  <div className="label" style={{ fontSize: 8 }}>YEARS LEFT</div>
                  <div className="display" style={{ fontSize: 18, marginTop: 2 }}>{captain.contract.years}</div>
                  <div className="mono mute" style={{ fontSize: 8, marginTop: 2 }}>UFA AFTER</div>
                </div>
                <div className="panel-flat" style={{ flex: 1, padding: 10 }}>
                  <div className="label" style={{ fontSize: 8 }}>VALUE</div>
                  <div className="display accent" style={{ fontSize: 18, marginTop: 2 }}>$420K</div>
                  <div className="mono mute" style={{ fontSize: 8, marginTop: 2 }}>MARKET EST.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </FrameA>
    );
  }

  window.FDA_POLISH = window.FDA_POLISH || {};
  Object.assign(window.FDA_POLISH, { HubA, SquadA });
})();
