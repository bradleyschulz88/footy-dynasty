// Mobile (iOS) layouts for Direction A — 6 screens
(function () {
  const { IOSDevice, IOSStatusBar } = window;
  const { Jersey, AttrBar, Crest, FormChips, PosBadge, Ring } = window.FDP;
  const { CLUB, LADDER, SQUAD, FIXTURES, NEWS, MATCH, FACILITIES, SPONSORS, DRAFT } = window.FD;

  // Mobile shell — status bar + content + tab bar
  function MobileShell({ title, badge, children, active }) {
    const tabs = [
      { id: "hub",     label: "Hub",     icon: "▤" },
      { id: "squad",   label: "Squad",   icon: "◫" },
      { id: "match",   label: "Match",   icon: "●" },
      { id: "club",    label: "Club",    icon: "◆" },
      { id: "more",    label: "More",    icon: "⋯" },
    ];
    return (
      <div className="dirA" style={{
        width: "100%", height: "100%", display: "flex", flexDirection: "column",
        background: "var(--A-bg)", color: "var(--A-text)",
        fontFamily: "Inter, system-ui, sans-serif",
        position: "relative", overflow: "hidden",
      }}>
        {/* iOS status bar */}
        <IOSStatusBar variant="light" textColor="var(--A-text)" />

        {/* App header */}
        <div style={{
          padding: "8px 16px 10px", display: "flex",
          alignItems: "center", justifyContent: "space-between",
          borderBottom: "1px solid var(--A-line)",
          background: "linear-gradient(180deg, rgba(0,224,255,0.06), transparent)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              width: 22, height: 22, background: "var(--A-accent)",
              clipPath: "polygon(0 0, 100% 0, 100% 70%, 70% 100%, 0 100%)",
            }} />
            <div>
              <div className="display" style={{ fontSize: 16, lineHeight: 1, letterSpacing: "0.04em" }}>{title}</div>
              {badge && <div className="label" style={{ fontSize: 7, marginTop: 2 }}>{badge}</div>}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn-ghost" style={{ padding: "4px 8px", fontSize: 9 }}>⌕</button>
            <button className="btn-ghost" style={{ padding: "4px 8px", fontSize: 9 }}>◉</button>
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflow: "auto" }}>
          {children}
        </div>

        {/* Tab bar */}
        <div style={{
          display: "flex", borderTop: "1px solid var(--A-line)",
          background: "rgba(7,16,31,0.95)",
          paddingBottom: 18,
        }}>
          {tabs.map(t => {
            const on = t.id === active;
            return (
              <div key={t.id} style={{
                flex: 1, padding: "8px 0", textAlign: "center",
                color: on ? "var(--A-accent)" : "var(--A-text-mute)",
                borderTop: on ? "2px solid var(--A-accent)" : "2px solid transparent",
                marginTop: -1,
              }}>
                <div style={{ fontSize: 16, lineHeight: 1 }}>{t.icon}</div>
                <div className="mono" style={{ fontSize: 8, marginTop: 3, letterSpacing: "0.14em", textTransform: "uppercase" }}>{t.label}</div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ── HUB ───────────────────────────────────────────────────────
  function MobileHub() {
    return (
      <MobileShell title="DYNASTY" badge="BALWYN FC · S2 · R8" active="hub">
        <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 12 }}>
          {/* Hero card */}
          <div className="panel" style={{ padding: 16, position: "relative", overflow: "hidden" }}>
            <div style={{
              position: "absolute", top: -10, right: -10, width: 90, height: 90,
              background: "radial-gradient(circle, rgba(0,224,255,0.2), transparent 70%)",
            }} />
            <div className="label" style={{ fontSize: 8 }}>SEASON 2 · ROUND 8</div>
            <div className="display" style={{ fontSize: 26, lineHeight: 1, marginTop: 6 }}>
              ON FOR<br/><span className="accent">PROMOTION</span>
            </div>
            <div style={{ fontSize: 11, color: "var(--A-text-dim)", marginTop: 8 }}>
              2nd · 6W-2L · within 4 pts of top
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <div className="panel-flat" style={{ padding: 8, flex: 1 }}>
                <div className="label" style={{ fontSize: 7 }}>POS</div>
                <div className="display" style={{ fontSize: 22, color: "var(--A-pos)" }}>2<span className="mono mute" style={{ fontSize: 10 }}>nd</span></div>
              </div>
              <div className="panel-flat" style={{ padding: 8, flex: 1 }}>
                <div className="label" style={{ fontSize: 7 }}>FORM</div>
                <div style={{ marginTop: 4 }}><FormChips form="WWLWW" dir="A" /></div>
              </div>
              <div className="panel-flat" style={{ padding: 8, flex: 1 }}>
                <div className="label" style={{ fontSize: 7 }}>%</div>
                <div className="display" style={{ fontSize: 22, color: "var(--A-pos)" }}>130</div>
              </div>
            </div>
          </div>

          {/* Next match */}
          <div className="panel" style={{ padding: 14 }}>
            <div className="row between aic" style={{ marginBottom: 10 }}>
              <span className="label">NEXT MATCH · R9</span>
              <span className="pill" style={{ fontSize: 8 }}>SAT 2:10PM</span>
            </div>
            <div className="row aic" style={{ gap: 10 }}>
              <div className="col aic" style={{ flex: 1 }}>
                <Crest short="BAL" colors={CLUB.colors} size={36} dir="A" />
                <div className="mono" style={{ fontSize: 10, marginTop: 4 }}>BAL</div>
                <div className="mono mute" style={{ fontSize: 8 }}>HOME</div>
              </div>
              <div className="display" style={{ fontSize: 18, color: "var(--A-text-mute)" }}>VS</div>
              <div className="col aic" style={{ flex: 1 }}>
                <Crest short="VRM" colors={["#1B5E20","#FFD200","#FFFFFF"]} size={36} dir="A" />
                <div className="mono" style={{ fontSize: 10, marginTop: 4 }}>VRM</div>
                <div className="mono mute" style={{ fontSize: 8 }}>1ST</div>
              </div>
            </div>
            <button className="btn-primary" style={{ width: "100%", marginTop: 12 }}>OPEN MATCH CENTRE →</button>
          </div>

          {/* Mini ladder */}
          <div className="panel" style={{ padding: 0 }}>
            <div style={{ padding: "10px 14px", borderBottom: "1px solid var(--A-line)" }}>
              <div className="display" style={{ fontSize: 13 }}>LADDER · TOP 5</div>
            </div>
            {LADDER.slice(0, 5).map((r, i) => (
              <div key={r.club} className="row aic" style={{
                padding: "8px 14px", borderBottom: "1px solid var(--A-line)",
                background: r.me ? "rgba(0,224,255,0.08)" : "transparent",
                borderLeft: r.me ? "2px solid var(--A-accent)" : "2px solid transparent",
              }}>
                <span className="display tnum" style={{ width: 18, fontSize: 13, color: i < 2 ? "var(--A-pos)" : "var(--A-text-mute)" }}>{i+1}</span>
                <Crest short={r.short} colors={r.colors || CLUB.colors} size={20} dir="A" />
                <span style={{ flex: 1, marginLeft: 8, fontSize: 11, fontWeight: r.me ? 700 : 500 }}>{r.club}</span>
                <span className="display" style={{ fontSize: 14, color: r.me ? "var(--A-accent)" : "var(--A-text)" }}>{r.pts}</span>
              </div>
            ))}
          </div>

          {/* News */}
          <div className="panel" style={{ padding: 14 }}>
            <div className="display" style={{ fontSize: 13, marginBottom: 10 }}>NEWS WIRE</div>
            <div className="col gap-2">
              {NEWS.slice(0, 3).map((n, i) => (
                <div key={i} className="row" style={{ gap: 10 }}>
                  <span className="mono accent" style={{ fontSize: 9, width: 28 }}>{n.tag}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, fontWeight: 600 }}>{n.head}</div>
                    <div className="mono mute" style={{ fontSize: 8, marginTop: 2 }}>{n.time.toUpperCase()}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </MobileShell>
    );
  }

  // ── SQUAD ─────────────────────────────────────────────────────
  function MobileSquad() {
    const sel = SQUAD[0];
    return (
      <MobileShell title="SQUAD" badge="22 · AVG OVR 78" active="squad">
        <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 12 }}>
          {/* Captain hero */}
          <div className="panel" style={{ padding: 16, position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, rgba(0,224,255,0.08), transparent 60%)" }} />
            <div className="label" style={{ fontSize: 8 }}>CAPTAIN · #1</div>
            <div className="display" style={{ fontSize: 24, lineHeight: 1, marginTop: 6 }}>{sel.name.toUpperCase()}</div>
            <div className="row aic gap-2" style={{ marginTop: 6 }}>
              <PosBadge pos={sel.pos} dir="A" />
              <span className="mono dim" style={{ fontSize: 9 }}>{sel.age}YO · {sel.contract}YR</span>
            </div>
            <div className="row aic gap-3" style={{ marginTop: 14 }}>
              <Ring value={sel.ovr} size={56} stroke={5} color="var(--A-pos)" label={sel.ovr} />
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                <AttrBar label="KICK" value={sel.kick} dir="A" />
                <AttrBar label="MARK" value={sel.mark} dir="A" />
                <AttrBar label="DEC"  value={sel.dec}  dir="A" />
              </div>
            </div>
          </div>

          {/* Filter chips */}
          <div className="row gap-2" style={{ overflowX: "auto", paddingBottom: 4 }}>
            {["ALL", "FWD", "MID", "DEF", "RUCK", "INJ"].map((c, i) => (
              <span key={c} className="pill" style={{ fontSize: 9, whiteSpace: "nowrap", background: i === 0 ? "rgba(0,224,255,0.2)" : "transparent", color: i === 0 ? "var(--A-accent)" : "var(--A-text-mute)" }}>{c}</span>
            ))}
          </div>

          {/* Squad list */}
          <div className="panel" style={{ padding: 0 }}>
            {SQUAD.slice(0, 7).map(p => (
              <div key={p.num} className="row aic" style={{
                padding: "10px 14px", borderBottom: "1px solid var(--A-line)", gap: 10,
              }}>
                <div className="display tnum" style={{ width: 28, fontSize: 16, color: "var(--A-text-mute)" }}>{String(p.num).padStart(2,"0")}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="row aic gap-2">
                    <span style={{ fontSize: 12, fontWeight: 600 }}>{p.name}</span>
                    {p.status === "captain" && <span className="mono accent" style={{ fontSize: 8 }}>⊙ C</span>}
                  </div>
                  <div className="row aic gap-2" style={{ marginTop: 3 }}>
                    <PosBadge pos={p.pos} dir="A" />
                    <span className="mono mute" style={{ fontSize: 8 }}>{p.age}YO · FORM {p.form}</span>
                  </div>
                </div>
                <Ring value={p.ovr} size={32} stroke={3} color={p.ovr >= 85 ? "var(--A-pos)" : "var(--A-accent)"} label={p.ovr} />
              </div>
            ))}
          </div>
        </div>
      </MobileShell>
    );
  }

  // ── MATCH ─────────────────────────────────────────────────────
  function MobileMatch() {
    return (
      <MobileShell title="MATCH" badge="LIVE · Q3 · 14:22" active="match">
        <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 12 }}>
          {/* Scoreboard */}
          <div className="panel" style={{ padding: 16, position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 50% 0%, rgba(0,224,255,0.15), transparent 60%)" }} />
            <div className="row between aic" style={{ position: "relative" }}>
              <span className="pill"><span className="live-dot"/> LIVE</span>
              <span className="mono accent" style={{ fontSize: 10, letterSpacing: "0.18em" }}>Q3 · 14:22</span>
            </div>
            <div className="row aic" style={{ marginTop: 16, position: "relative" }}>
              <div className="col aic" style={{ flex: 1 }}>
                <Crest short="BAL" colors={CLUB.colors} size={42} dir="A" />
                <div className="mono" style={{ fontSize: 10, marginTop: 6 }}>BAL</div>
                <div className="display glow-text" style={{ fontSize: 56, lineHeight: 0.9, marginTop: 6, color: "var(--A-accent)" }}>67</div>
                <div className="mono mute" style={{ fontSize: 8, marginTop: 2 }}>9.13 (67)</div>
              </div>
              <div className="display" style={{ fontSize: 16, color: "var(--A-text-mute)" }}>VS</div>
              <div className="col aic" style={{ flex: 1 }}>
                <Crest short="VRM" colors={["#1B5E20","#FFD200","#FFFFFF"]} size={42} dir="A" />
                <div className="mono" style={{ fontSize: 10, marginTop: 6 }}>VRM</div>
                <div className="display" style={{ fontSize: 56, lineHeight: 0.9, marginTop: 6 }}>54</div>
                <div className="mono mute" style={{ fontSize: 8, marginTop: 2 }}>7.12 (54)</div>
              </div>
            </div>
            {/* Momentum */}
            <div style={{ marginTop: 16, position: "relative" }}>
              <div className="row between" style={{ marginBottom: 6 }}>
                <span className="mono accent" style={{ fontSize: 9 }}>BAL +13</span>
                <span className="mono mute" style={{ fontSize: 9 }}>MOMENTUM</span>
              </div>
              <div style={{ height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 3, position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: "62%", background: "linear-gradient(90deg, var(--A-accent), var(--A-pos))" }} />
                <div style={{ position: "absolute", left: "62%", top: -3, width: 2, height: 12, background: "white" }} />
              </div>
            </div>
          </div>

          {/* Quarter strip */}
          <div className="panel" style={{ padding: 12 }}>
            <div className="label" style={{ marginBottom: 8 }}>BY QUARTER</div>
            <div className="row" style={{ gap: 6 }}>
              {[
                ["Q1", "21", "14"],
                ["Q2", "18", "21"],
                ["Q3", "28", "19", true],
                ["Q4", "—", "—"],
              ].map(([q, h, a, live]) => (
                <div key={q} className="panel-flat" style={{ flex: 1, padding: 8, textAlign: "center", border: live ? "1px solid var(--A-accent)" : undefined }}>
                  <div className="mono" style={{ fontSize: 9, color: live ? "var(--A-accent)" : "var(--A-text-mute)", letterSpacing: "0.14em" }}>{q}</div>
                  <div className="display" style={{ fontSize: 18, marginTop: 4 }}>{h}</div>
                  <div className="mono mute" style={{ fontSize: 9 }}>{a}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Live feed */}
          <div className="panel" style={{ padding: 14 }}>
            <div className="display" style={{ fontSize: 13, marginBottom: 10 }}>FEED</div>
            <div className="col gap-2">
              {(MATCH.feed || []).slice(0, 5).map((f, i) => (
                <div key={i} className="row" style={{ gap: 10 }}>
                  <span className="mono accent" style={{ fontSize: 9, width: 38 }}>{f.q} {f.t}</span>
                  <span style={{ flex: 1, fontSize: 11, color: f.major ? "var(--A-text)" : "var(--A-text-dim)" }}>{f.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </MobileShell>
    );
  }

  // ── CLUB ──────────────────────────────────────────────────────
  function MobileClub() {
    return (
      <MobileShell title="CLUB" badge="BALANCE $142.8K" active="club">
        <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 12 }}>
          {/* Cash hero */}
          <div className="panel" style={{ padding: 16 }}>
            <div className="label">CASH POSITION</div>
            <div className="display" style={{ fontSize: 36, lineHeight: 1, marginTop: 6 }}>
              <span className="pos">$142.8K</span>
            </div>
            <div className="mono accent" style={{ fontSize: 10, marginTop: 4, letterSpacing: "0.14em" }}>+$18.4K W/W ▲</div>
            <div className="row gap-2" style={{ marginTop: 14 }}>
              <div className="panel-flat" style={{ padding: 8, flex: 1 }}>
                <div className="label" style={{ fontSize: 7 }}>REV</div>
                <div className="display" style={{ fontSize: 16, color: "var(--A-pos)" }}>$93K</div>
              </div>
              <div className="panel-flat" style={{ padding: 8, flex: 1 }}>
                <div className="label" style={{ fontSize: 7 }}>WAGES</div>
                <div className="display" style={{ fontSize: 16, color: "var(--A-neg)" }}>-$214K</div>
              </div>
              <div className="panel-flat" style={{ padding: 8, flex: 1 }}>
                <div className="label" style={{ fontSize: 7 }}>NET</div>
                <div className="display" style={{ fontSize: 16, color: "var(--A-pos)" }}>+$92K</div>
              </div>
            </div>
          </div>

          {/* Sections */}
          <div className="row gap-2">
            {[
              ["FACILITIES", `${FACILITIES.length} bldgs`, "var(--A-accent)"],
              ["SPONSORS", `${SPONSORS.length} active`, "var(--A-accent-2)"],
              ["STAFF", "8 hired", "#A78BFA"],
              ["KITS", "Customise", "var(--A-pos)"],
            ].map(([n, sub, c]) => (
              <div key={n} className="panel card-hover" style={{ padding: 12, flex: "1 1 calc(50% - 4px)", minWidth: "calc(50% - 4px)", borderLeft: `2px solid ${c}` }}>
                <div className="display" style={{ fontSize: 14 }}>{n}</div>
                <div className="mono mute" style={{ fontSize: 9, marginTop: 3 }}>{sub.toUpperCase()}</div>
              </div>
            ))}
          </div>

          {/* Sponsors */}
          <div className="panel" style={{ padding: 14 }}>
            <div className="display" style={{ fontSize: 13, marginBottom: 10 }}>SPONSORSHIP</div>
            <div className="col gap-2">
              {SPONSORS.slice(0, 3).map(s => (
                <div key={s.name} className="panel-flat row between aic" style={{ padding: 10, borderLeft: `2px solid ${s.color}` }}>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600 }}>{s.name}</div>
                    <div className="label" style={{ fontSize: 7, marginTop: 2 }}>{s.tier}</div>
                  </div>
                  <span className="display accent" style={{ fontSize: 16 }}>${s.value}K</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </MobileShell>
    );
  }

  // ── RECRUIT ───────────────────────────────────────────────────
  function MobileRecruit() {
    const top = DRAFT[0];
    return (
      <MobileShell title="RECRUIT" badge="DRAFT · PICK #4" active="more">
        <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 12 }}>
          {/* Top prospect hero */}
          <div className="panel" style={{ padding: 16, position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, rgba(0,224,255,0.1), transparent 60%)" }} />
            <div className="label" style={{ fontSize: 8 }}>SHORTLIST · #1</div>
            <div className="display" style={{ fontSize: 24, lineHeight: 1, marginTop: 4 }}>{top.name.toUpperCase()}</div>
            <div className="row aic gap-2" style={{ marginTop: 6 }}>
              <PosBadge pos={top.pos} dir="A" />
              <span className="mono dim" style={{ fontSize: 9 }}>{top.age}YO · {top.from}</span>
            </div>
            <div className="row aic gap-3" style={{ marginTop: 14 }}>
              <Ring value={top.proj} size={62} stroke={5} color="var(--A-pos)" label={top.proj} />
              <div style={{ flex: 1 }}>
                <div className="label" style={{ fontSize: 7, marginBottom: 6 }}>PROJECTION</div>
                <div className="col gap-1" style={{ fontSize: 10, color: "var(--A-text-dim)" }}>
                  <div>▲ Elite mark overhead</div>
                  <div>▲ AFL-ready frame</div>
                  <div>▼ Decision-making raw</div>
                </div>
              </div>
            </div>
            <button className="btn-primary" style={{ width: "100%", marginTop: 14 }}>★ SHORTLISTED</button>
          </div>

          {/* Picks */}
          <div className="panel" style={{ padding: 14 }}>
            <div className="display" style={{ fontSize: 13, marginBottom: 10 }}>YOUR PICKS</div>
            <div className="row gap-2">
              {[
                ["R1", "#4"], ["R2", "#18"], ["R3", "#36"], ["R4", "#52"],
              ].map(([r, p]) => (
                <div key={p} className="panel-flat" style={{ padding: 10, flex: 1, textAlign: "center" }}>
                  <div className="mono accent" style={{ fontSize: 9, letterSpacing: "0.14em" }}>{r}</div>
                  <div className="display" style={{ fontSize: 18, marginTop: 4 }}>{p}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Draft list */}
          <div className="panel" style={{ padding: 0 }}>
            <div style={{ padding: "10px 14px", borderBottom: "1px solid var(--A-line)" }}>
              <div className="display" style={{ fontSize: 13 }}>DRAFT BOARD</div>
            </div>
            {DRAFT.slice(0, 5).map((p, i) => (
              <div key={p.id} className="row aic" style={{ padding: "10px 14px", borderBottom: "1px solid var(--A-line)", gap: 10 }}>
                <span className="display tnum" style={{ width: 24, fontSize: 14, color: "var(--A-text-mute)" }}>#{i+1}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, fontWeight: 600 }}>{p.name}</div>
                  <div className="mono mute" style={{ fontSize: 8, marginTop: 2 }}>{p.pos} · {p.age}YO · {p.from.toUpperCase()}</div>
                </div>
                <span className="display" style={{ fontSize: 16, color: p.proj >= 80 ? "var(--A-pos)" : "var(--A-accent)" }}>{p.proj}</span>
              </div>
            ))}
          </div>
        </div>
      </MobileShell>
    );
  }

  // ── COMPETE ───────────────────────────────────────────────────
  function MobileCompete() {
    return (
      <MobileShell title="LEAGUE" badge="EFL · TIER 3 · R8" active="more">
        <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 12 }}>
          {/* Pyramid */}
          <div className="panel" style={{ padding: 14 }}>
            <div className="display" style={{ fontSize: 13, marginBottom: 10 }}>PYRAMID</div>
            <div className="col gap-1">
              {[
                ["AFL", 1, 18, false],
                ["VFL", 2, 14, false],
                ["VAFA", 3, 16, false],
                ["EFL", 4, 18, true],
                ["WRFL", 5, 12, false],
              ].map(([n, t, c, you], i) => (
                <div key={n} className="row between aic" style={{
                  padding: "8px 10px",
                  marginLeft: i * 4, marginRight: i * 4,
                  border: you ? "1px solid var(--A-accent)" : "1px solid var(--A-line)",
                  background: you ? "rgba(0,224,255,0.08)" : "transparent",
                  borderRadius: 4,
                }}>
                  <div className="row aic gap-2">
                    <span className="display" style={{ fontSize: 12, color: you ? "var(--A-accent)" : "var(--A-text-mute)" }}>T{t}</span>
                    <span style={{ fontSize: 11, fontWeight: 700 }}>{n}</span>
                  </div>
                  {you ? <span className="mono accent" style={{ fontSize: 8, letterSpacing: "0.14em" }}>← YOU</span>
                       : <span className="mono mute" style={{ fontSize: 8 }}>{c} CLUBS</span>}
                </div>
              ))}
            </div>
          </div>

          {/* Ladder full */}
          <div className="panel" style={{ padding: 0 }}>
            <div style={{ padding: "10px 14px", borderBottom: "1px solid var(--A-line)" }}>
              <div className="display" style={{ fontSize: 13 }}>EFL LADDER</div>
            </div>
            <div className="row" style={{ padding: "8px 14px", borderBottom: "1px solid var(--A-line)", background: "rgba(0,224,255,0.04)" }}>
              <span className="label" style={{ flex: 0.4 }}>#</span>
              <span className="label" style={{ flex: 2 }}>CLUB</span>
              <span className="label" style={{ flex: 0.5, textAlign: "right" }}>W-L</span>
              <span className="label" style={{ flex: 0.6, textAlign: "right" }}>FORM</span>
              <span className="label" style={{ flex: 0.4, textAlign: "right" }}>PTS</span>
            </div>
            {LADDER.map((r, i) => {
              const promo = i < 2;
              return (
                <div key={r.club} className="row aic" style={{
                  padding: "8px 14px", borderBottom: "1px solid var(--A-line)",
                  background: r.me ? "rgba(0,224,255,0.08)" : "transparent",
                  borderLeft: r.me ? "2px solid var(--A-accent)" : promo ? "2px solid var(--A-pos)" : "2px solid transparent",
                }}>
                  <span className="display tnum" style={{ flex: 0.4, fontSize: 12, color: promo ? "var(--A-pos)" : "var(--A-text-mute)" }}>{i+1}</span>
                  <span style={{ flex: 2, fontSize: 11, fontWeight: r.me ? 700 : 500, color: r.me ? "var(--A-accent)" : "var(--A-text)" }}>{r.short}</span>
                  <span className="mono" style={{ flex: 0.5, fontSize: 9, textAlign: "right" }}>{r.w}-{r.l}</span>
                  <span style={{ flex: 0.6, textAlign: "right" }}><FormChips form={r.form.slice(-3)} dir="A" /></span>
                  <span className="display" style={{ flex: 0.4, fontSize: 14, textAlign: "right" }}>{r.pts}</span>
                </div>
              );
            })}
          </div>
        </div>
      </MobileShell>
    );
  }

  window.FDA_MOBILE = { MobileHub, MobileSquad, MobileMatch, MobileClub, MobileRecruit, MobileCompete };
})();
