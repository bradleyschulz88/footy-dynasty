(function(){
// Direction A — screens 3-6: Match, Club, Recruit, Competition
const { Jersey, AttrBar, NumberBlock, Spark, FormChips, PosBadge, Crest, Tabs } = window.FDP;
const { CLUB, LADDER, FIXTURES, TACTICS, FACILITIES, SPONSORS, STAFF, DRAFT, TRADES, FINANCE, MATCH_FEED } = window.FD;
const { FrameA } = window.FDA;

// ─── MATCH DAY ──────────────────────────────────────────────────
function MatchA() {
  return (
    <FrameA active="match">
      <div className="col gap-3" style={{ height: "100%", overflow: "hidden" }}>
        {/* Scoreboard */}
        <div className="panel" style={{ overflow: "hidden", position: "relative" }}>
          <div className="row between aic" style={{ padding: "8px 16px", borderBottom: "1px solid var(--A-line)", background: "rgba(0,224,255,0.03)" }}>
            <div className="row aic gap-2"><span className="live-dot" /><span className="mono" style={{ fontSize: 10, color: "var(--A-neg)", letterSpacing: "0.18em" }}>LIVE · Q3 · 12:38</span></div>
            <span className="label">EFL · ROUND 8 · BALWYN PARK · ATT 2,140</span>
            <span className="label">HOME ▲</span>
          </div>
          <div className="row aic" style={{ padding: "20px 24px", background: "linear-gradient(180deg, rgba(0,224,255,0.04), transparent)" }}>
            {/* Home */}
            <div className="col aic" style={{ flex: 1 }}>
              <Jersey kit="stripes" colors={CLUB.colors} size={84} num="1" />
              <div className="display" style={{ fontSize: 22, marginTop: 6 }}>BAL</div>
              <div className="label" style={{ fontSize: 8 }}>BALWYN FC · STR 78</div>
            </div>
            {/* Score */}
            <div className="col aic" style={{ flex: 1.4, textAlign: "center" }}>
              <div className="row aic" style={{ gap: 16 }}>
                <div className="display" style={{ fontSize: 88, lineHeight: 1, color: "var(--A-accent)" }}>43</div>
                <div className="mute display" style={{ fontSize: 60, lineHeight: 1 }}>—</div>
                <div className="display" style={{ fontSize: 88, lineHeight: 1, color: "var(--A-text)" }}>34</div>
              </div>
              <div className="mono tnum" style={{ fontSize: 12, marginTop: 4, color: "var(--A-text-dim)", letterSpacing: "0.1em" }}>6.7 (43)  ·  5.4 (34)</div>
              <div className="row gap-1" style={{ marginTop: 14 }}>
                {[1,2,3,4].map(q => (
                  <div key={q} style={{
                    width: 64, padding: "4px 0", textAlign: "center",
                    background: q === 3 ? "rgba(0,224,255,0.1)" : "transparent",
                    border: `1px solid ${q < 3 ? "var(--A-line)" : q === 3 ? "var(--A-accent)" : "var(--A-line)"}`,
                  }}>
                    <div className="label" style={{ fontSize: 8 }}>Q{q}</div>
                    <div className="mono tnum" style={{ fontSize: 10, marginTop: 2 }}>
                      {q === 1 ? "15-13" : q === 2 ? "20-14" : q === 3 ? "8-7" : "—"}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* Away */}
            <div className="col aic" style={{ flex: 1 }}>
              <Jersey kit="yoke" colors={["#000000","#CC0000","#FFFFFF"]} size={84} num="9" />
              <div className="display" style={{ fontSize: 22, marginTop: 6 }}>VRM</div>
              <div className="label" style={{ fontSize: 8 }}>VERMONT FC · STR 81</div>
            </div>
          </div>
          {/* Momentum bar */}
          <div style={{ padding: "10px 16px", borderTop: "1px solid var(--A-line)" }}>
            <div className="row between" style={{ marginBottom: 4 }}>
              <span className="label" style={{ fontSize: 8 }}>MOMENTUM</span>
              <span className="mono accent" style={{ fontSize: 9, letterSpacing: "0.15em" }}>BAL +6 LAST 5 MIN</span>
            </div>
            <div style={{ height: 6, background: "rgba(255,255,255,0.04)", display: "flex" }}>
              <div style={{ width: "62%", background: "linear-gradient(90deg, var(--A-accent), rgba(0,224,255,0.6))" }} />
              <div style={{ width: "38%", background: "rgba(255,87,119,0.5)" }} />
            </div>
          </div>
        </div>

        <div className="row gap-3" style={{ flex: 1, minHeight: 0 }}>
          {/* Feed */}
          <div className="panel" style={{ flex: 2, padding: 16, minHeight: 0, display: "flex", flexDirection: "column" }}>
            <div className="row between aic" style={{ marginBottom: 10 }}>
              <div className="display" style={{ fontSize: 16 }}>MATCH FEED</div>
              <div className="row gap-2"><span className="pill">▲ GOAL</span><span className="pill" style={{ background: "rgba(255,179,71,0.08)", color: "var(--A-accent-2)", borderColor: "rgba(255,179,71,0.25)" }}>BEHIND</span></div>
            </div>
            <div className="col gap-1" style={{ flex: 1, overflow: "auto" }}>
              {MATCH_FEED.slice().reverse().map((e, i) => {
                const c = e.type === "goal-h" ? "var(--A-pos)" : e.type === "goal-a" ? "var(--A-neg)" : e.type === "moment" ? "var(--A-accent-2)" : e.type === "behind" ? "var(--A-text-dim)" : "var(--A-text-mute)";
                return (
                  <div key={i} className="row gap-3" style={{ padding: "8px 10px", borderLeft: `2px solid ${c}`, background: i === 0 ? "rgba(0,224,255,0.05)" : "transparent" }}>
                    <span className="mono" style={{ fontSize: 9, width: 56, color: "var(--A-text-mute)", letterSpacing: "0.05em" }}>Q{e.q} · {e.t}</span>
                    <span style={{ flex: 1, fontSize: 11, color: e.type === "neutral" ? "var(--A-text-mute)" : "var(--A-text)" }}>{e.text}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Tactics + stats */}
          <div className="col gap-3" style={{ flex: 1, minHeight: 0, minWidth: 240 }}>
            <div className="panel" style={{ padding: 14 }}>
              <div className="display" style={{ fontSize: 14, marginBottom: 8 }}>GAME PLAN</div>
              <div className="col gap-2">
                {TACTICS.map(t => (
                  <div key={t.key} style={{
                    padding: "8px 10px",
                    border: t.active ? "1px solid var(--A-accent)" : "1px solid var(--A-line)",
                    background: t.active ? "rgba(0,224,255,0.06)" : "transparent",
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
              <div className="display" style={{ fontSize: 14, marginBottom: 10 }}>TEAM STATS</div>
              <div className="col gap-3">
                {[
                  ["Inside 50s", 28, 21],
                  ["Contested", 92, 84],
                  ["Tackles", 41, 36],
                  ["Marks", 67, 58],
                  ["Clearances", 22, 19],
                ].map(([l, h, a]) => {
                  const total = h + a, hp = (h / total) * 100;
                  return (
                    <div key={l}>
                      <div className="row between" style={{ marginBottom: 3 }}>
                        <span className="mono accent" style={{ fontSize: 11, fontWeight: 700 }}>{h}</span>
                        <span className="label" style={{ fontSize: 9 }}>{l}</span>
                        <span className="mono dim" style={{ fontSize: 11 }}>{a}</span>
                      </div>
                      <div style={{ height: 4, background: "rgba(255,87,119,0.2)", display: "flex" }}>
                        <div style={{ width: `${hp}%`, background: "var(--A-accent)" }} />
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

// ─── CLUB ───────────────────────────────────────────────────────
function ClubA() {
  return (
    <FrameA active="club">
      <div className="col gap-3" style={{ height: "100%", overflow: "hidden" }}>
        <Tabs tabs={["FINANCES", "SPONSORS", "KITS", "FACILITIES", "STAFF"]} active="FINANCES" dir="A" />
        <div className="row gap-3" style={{ flex: 1, minHeight: 0 }}>
          {/* Money flow */}
          <div className="col gap-3" style={{ flex: 1.2, minHeight: 0 }}>
            <div className="panel" style={{ padding: 18 }}>
              <div className="row between aic">
                <div>
                  <div className="label">CASH ON HAND</div>
                  <div className="display" style={{ fontSize: 56, lineHeight: 0.9, color: "var(--A-pos)", marginTop: 4 }}>$142.8K</div>
                  <div className="mono" style={{ fontSize: 10, marginTop: 4 }}><span className="pos">+$53.8K</span> <span className="mute">this quarter</span></div>
                </div>
                <Spark data={[78, 84, 92, 88, 96, 110, 124, 138, 142]} color="#2EE6A6" w={140} h={48} />
              </div>
            </div>
            <div className="panel" style={{ padding: 16, flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
              <div className="display" style={{ fontSize: 16, marginBottom: 10 }}>P&amp;L · SEASON {CLUB.season}</div>
              <table style={{ width: "100%", fontSize: 11, borderCollapse: "collapse" }}>
                <tbody>
                  {[
                    ["Membership",       "+$96.4K", "pos"],
                    ["Sponsorship",      "+$93.5K", "pos"],
                    ["Match-day gate",   "+$61.0K", "pos"],
                    ["Merch & bar",      "+$42.2K", "pos"],
                    ["Grants (council)", "+$22.0K", "pos"],
                    ["Wages (players)",  "−$192.8K","neg"],
                    ["Wages (staff)",    "−$117.0K","neg"],
                    ["Facilities",       "−$28.4K", "neg"],
                    ["Travel & match",   "−$20.0K", "neg"],
                  ].map(([l, v, c]) => (
                    <tr key={l} style={{ borderBottom: "1px solid var(--A-line)" }}>
                      <td style={{ padding: "9px 0", color: "var(--A-text-dim)" }}>{l}</td>
                      <td className={`mono tnum ${c}`} style={{ padding: "9px 0", textAlign: "right", fontWeight: 600 }}>{v}</td>
                    </tr>
                  ))}
                  <tr>
                    <td className="display" style={{ padding: "12px 0 0", fontSize: 14, color: "var(--A-accent)" }}>NET</td>
                    <td className="display tnum" style={{ padding: "12px 0 0", textAlign: "right", fontSize: 18, color: "var(--A-pos)" }}>+$53.8K</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          {/* Sponsors + budget rings */}
          <div className="col gap-3" style={{ flex: 1, minHeight: 0 }}>
            <div className="panel" style={{ padding: 16 }}>
              <div className="display" style={{ fontSize: 14, marginBottom: 10 }}>BUDGET HEALTH</div>
              <div className="row gap-3">
                {[["WAGES", 78, "$192.8K / $240K"], ["TRANSFER", 24, "$9.2K / $38K"], ["FACILITIES", 56, "ok"]].map(([l, p, sub]) => (
                  <div key={l} style={{ flex: 1, textAlign: "center" }}>
                    <svg viewBox="0 0 60 60" width="64" height="64" style={{ display: "block", margin: "0 auto" }}>
                      <circle cx="30" cy="30" r="26" stroke="rgba(255,255,255,0.06)" strokeWidth="6" fill="none" />
                      <circle cx="30" cy="30" r="26" stroke="var(--A-accent)" strokeWidth="6" fill="none"
                        strokeDasharray={`${(p / 100) * 163.4} 999`} strokeDashoffset="0" transform="rotate(-90 30 30)" strokeLinecap="round" />
                      <text x="30" y="34" textAnchor="middle" fontFamily="Bebas Neue" fontSize="16" fill="var(--A-accent)">{p}%</text>
                    </svg>
                    <div className="label" style={{ fontSize: 8, marginTop: 6 }}>{l}</div>
                    <div className="mono mute" style={{ fontSize: 9, marginTop: 2 }}>{sub}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="panel" style={{ padding: 16, flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
              <div className="row between aic" style={{ marginBottom: 10 }}>
                <div className="display" style={{ fontSize: 14 }}>SPONSORS</div>
                <span className="pill">+ NEW DEAL</span>
              </div>
              <div className="col gap-2" style={{ flex: 1, overflow: "auto" }}>
                {SPONSORS.map(s => (
                  <div key={s.name} className="panel-flat" style={{ padding: 10 }}>
                    <div className="row between aic">
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 600 }}>{s.name}</div>
                        <div className="label" style={{ fontSize: 8, marginTop: 2 }}>{s.tier} · {s.expires}y left</div>
                      </div>
                      <div className="display accent" style={{ fontSize: 18 }}>${(s.value/1000).toFixed(1)}K</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {/* Facilities */}
          <div className="panel" style={{ flex: 0.9, padding: 16, minHeight: 0, display: "flex", flexDirection: "column" }}>
            <div className="display" style={{ fontSize: 14, marginBottom: 10 }}>FACILITIES</div>
            <div className="col gap-2" style={{ flex: 1, overflow: "auto" }}>
              {FACILITIES.map(f => (
                <div key={f.name} className="panel-flat" style={{ padding: 10 }}>
                  <div className="row between aic" style={{ marginBottom: 4 }}>
                    <span style={{ fontSize: 11, fontWeight: 600 }}>{f.name}</span>
                    <span className="mono accent" style={{ fontSize: 10 }}>L{f.level}/{f.max}</span>
                  </div>
                  <div className="row gap-1">
                    {Array.from({length: f.max}).map((_, i) => (
                      <div key={i} style={{ flex: 1, height: 4, background: i < f.level ? "var(--A-accent)" : "rgba(255,255,255,0.06)" }} />
                    ))}
                  </div>
                  <div className="mono mute" style={{ fontSize: 9, marginTop: 4 }}>{f.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </FrameA>
  );
}

// ─── RECRUIT ────────────────────────────────────────────────────
function RecruitA() {
  return (
    <FrameA active="recruit">
      <div className="col gap-3" style={{ height: "100%", overflow: "hidden" }}>
        <Tabs tabs={["TRADES", "DRAFT", "YOUTH ACADEMY", "LOCAL SCOUTING"]} active="DRAFT" dir="A" />
        <div className="row gap-3" style={{ flex: 1, minHeight: 0 }}>
          {/* Draft order */}
          <div className="panel" style={{ flex: 0.8, padding: 16, minHeight: 0, display: "flex", flexDirection: "column" }}>
            <div className="display" style={{ fontSize: 16, marginBottom: 10 }}>DRAFT ORDER</div>
            <div className="col gap-2" style={{ flex: 1, overflow: "auto" }}>
              {[["#1", "Vermont FC"], ["#2", "Boronia FC"], ["#3", "Bayswater"], ["#4", "BALWYN FC", true], ["#5", "Knox FC"], ["#6", "Doncaster"]].map(([p, n, me]) => (
                <div key={p} className="row aic gap-3" style={{ padding: 8, background: me ? "rgba(0,224,255,0.06)" : "transparent", border: `1px solid ${me ? "var(--A-accent)" : "var(--A-line)"}` }}>
                  <span className="display accent" style={{ fontSize: 18, width: 32 }}>{p}</span>
                  <span style={{ fontSize: 12, fontWeight: me ? 700 : 500, color: me ? "var(--A-accent)" : "var(--A-text)" }}>{n}</span>
                </div>
              ))}
            </div>
            <div className="panel-flat" style={{ padding: 10, marginTop: 10 }}>
              <div className="label">YOUR PICK ETA</div>
              <div className="display accent" style={{ fontSize: 20, marginTop: 4 }}>3 PICKS AWAY</div>
            </div>
          </div>

          {/* Big board */}
          <div className="panel" style={{ flex: 1.6, padding: 16, minHeight: 0, display: "flex", flexDirection: "column" }}>
            <div className="row between aic" style={{ marginBottom: 10 }}>
              <div className="display" style={{ fontSize: 16 }}>NATIONAL DRAFT BIG BOARD</div>
              <div className="row gap-2"><button className="btn-ghost">FILTER · POS</button><button className="btn-ghost">SHORTLIST · 3</button></div>
            </div>
            <div style={{ flex: 1, overflow: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                <thead>
                  <tr className="label" style={{ fontSize: 8 }}>
                    {["RNK", "PROSPECT", "POS", "AGE", "OVR", "POT", "FROM", "SCOUT NOTE"].map(h => (
                      <th key={h} style={{ textAlign: h === "PROSPECT" || h === "FROM" || h === "SCOUT NOTE" ? "left" : "right", padding: "8px 10px", borderBottom: "1px solid var(--A-line)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {DRAFT.map(p => (
                    <tr key={p.rank} style={{ borderBottom: "1px solid var(--A-line)", background: p.rank === 4 ? "rgba(255,179,71,0.04)" : "transparent" }}>
                      <td className="mono accent" style={{ padding: "10px", textAlign: "right", fontSize: 13, fontWeight: 700 }}>#{p.rank}</td>
                      <td style={{ padding: "10px", fontWeight: 600 }}>{p.name}</td>
                      <td style={{ padding: "10px", textAlign: "right" }}><PosBadge pos={p.pos} dir="A" /></td>
                      <td className="mono dim" style={{ padding: "10px", textAlign: "right" }}>{p.age}</td>
                      <td className="mono" style={{ padding: "10px", textAlign: "right", color: "var(--A-text)" }}>{p.ovr}</td>
                      <td style={{ padding: "10px", textAlign: "right" }}>
                        <span className="mono accent-2" style={{ fontWeight: 700 }}>{p.pot}</span>
                        <div style={{ width: 50, height: 3, background: "rgba(255,179,71,0.18)", marginLeft: "auto", marginTop: 2 }}>
                          <div style={{ width: `${p.pot}%`, height: "100%", background: "var(--A-accent-2)" }} />
                        </div>
                      </td>
                      <td className="mono mute" style={{ padding: "10px", fontSize: 10 }}>{p.club}</td>
                      <td className="mute" style={{ padding: "10px", fontSize: 10, fontStyle: "italic" }}>{p.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Watchlist */}
          <div className="panel" style={{ flex: 1, padding: 16, minHeight: 0, display: "flex", flexDirection: "column" }}>
            <div className="display" style={{ fontSize: 14, marginBottom: 10 }}>WATCHLIST · 3</div>
            <div className="col gap-2">
              {DRAFT.slice(0, 3).map(p => (
                <div key={p.rank} className="panel-flat" style={{ padding: 10 }}>
                  <div className="row between aic">
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600 }}>{p.name}</div>
                      <div className="mono mute" style={{ fontSize: 9, marginTop: 2 }}>RNK #{p.rank} · {p.pos}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div className="display accent" style={{ fontSize: 20 }}>{p.ovr}<span className="mute" style={{ fontSize: 12 }}>/{p.pot}</span></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 14 }}>
              <div className="display" style={{ fontSize: 14, marginBottom: 10 }}>POSITIONAL NEED</div>
              {[["KEY FWD", 90, "var(--A-neg)"], ["RUCK", 75, "var(--A-accent-2)"], ["WING", 40, "var(--A-pos)"], ["KEY BACK", 30, "var(--A-pos)"]].map(([l, n, c]) => (
                <div key={l} style={{ marginBottom: 8 }}>
                  <div className="row between" style={{ marginBottom: 3 }}>
                    <span className="label" style={{ fontSize: 9 }}>{l}</span>
                    <span className="mono" style={{ fontSize: 9, color: c }}>{n}/100</span>
                  </div>
                  <div style={{ height: 3, background: "rgba(255,255,255,0.06)" }}>
                    <div style={{ width: `${n}%`, height: "100%", background: c }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </FrameA>
  );
}

// ─── COMPETITION ────────────────────────────────────────────────
function CompeteA() {
  return (
    <FrameA active="compete">
      <div className="col gap-3" style={{ height: "100%", overflow: "hidden" }}>
        <Tabs tabs={["LADDER", "FIXTURES", "PYRAMID", "FINALS"]} active="LADDER" dir="A" />
        <div className="row gap-3" style={{ flex: 1, minHeight: 0 }}>
          {/* Full ladder */}
          <div className="panel" style={{ flex: 2, padding: 16, minHeight: 0, display: "flex", flexDirection: "column" }}>
            <div className="row between aic" style={{ marginBottom: 10 }}>
              <div className="display" style={{ fontSize: 18 }}>EASTERN FOOTBALL LEAGUE · S2 · RD 8</div>
              <div className="row gap-2"><span className="pill">FINALS LINE: 4TH</span></div>
            </div>
            <div style={{ flex: 1, overflow: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                <thead style={{ position: "sticky", top: 0, background: "var(--A-panel)" }}>
                  <tr className="label" style={{ fontSize: 8 }}>
                    {["#", "CLUB", "P", "W", "L", "D", "PF", "PA", "PCT", "PTS", "FORM"].map(h => (
                      <th key={h} style={{ textAlign: h === "CLUB" ? "left" : "right", padding: "8px 10px", borderBottom: "1px solid var(--A-line)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {LADDER.map(r => (
                    <React.Fragment key={r.short}>
                      <tr style={{ background: r.me ? "rgba(0,224,255,0.05)" : "transparent", borderBottom: "1px solid var(--A-line)" }}>
                        <td className="mono" style={{ padding: "10px", textAlign: "right", color: r.rank <= 4 ? "var(--A-accent)" : "var(--A-text-mute)", fontWeight: 700 }}>{r.rank}</td>
                        <td style={{ padding: "10px" }}>
                          <div className="row aic gap-3">
                            <Crest short={r.short} colors={r.me ? CLUB.colors : ["#222","#444","#fff"]} size={22} dir="A" />
                            <span style={{ fontWeight: r.me ? 700 : 500, color: r.me ? "var(--A-accent)" : "var(--A-text)", fontSize: 12 }}>{r.club}</span>
                          </div>
                        </td>
                        <td className="mono tnum dim" style={{ padding: "10px", textAlign: "right" }}>{r.w + r.l + r.d}</td>
                        <td className="mono tnum pos" style={{ padding: "10px", textAlign: "right" }}>{r.w}</td>
                        <td className="mono tnum neg" style={{ padding: "10px", textAlign: "right" }}>{r.l}</td>
                        <td className="mono tnum dim" style={{ padding: "10px", textAlign: "right" }}>{r.d}</td>
                        <td className="mono tnum dim" style={{ padding: "10px", textAlign: "right" }}>{r.pf}</td>
                        <td className="mono tnum dim" style={{ padding: "10px", textAlign: "right" }}>{r.pa}</td>
                        <td className="mono tnum" style={{ padding: "10px", textAlign: "right", color: r.pct >= 100 ? "var(--A-pos)" : "var(--A-neg)" }}>{r.pct.toFixed(1)}</td>
                        <td className="mono tnum accent" style={{ padding: "10px", textAlign: "right", fontWeight: 700, fontSize: 13 }}>{r.pts}</td>
                        <td style={{ padding: "10px", textAlign: "right" }}><FormChips form={r.form} dir="A" /></td>
                      </tr>
                      {r.rank === 4 && (
                        <tr><td colSpan={11} style={{ padding: 0 }}>
                          <div style={{ borderTop: "2px dashed var(--A-accent-2)", display: "flex", justifyContent: "center" }}>
                            <span className="mono" style={{ background: "var(--A-panel)", padding: "0 10px", color: "var(--A-accent-2)", fontSize: 9, letterSpacing: "0.2em", marginTop: -7 }}>FINALS LINE</span>
                          </div>
                        </td></tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Fixtures */}
          <div className="panel" style={{ flex: 1, padding: 16, minHeight: 0, display: "flex", flexDirection: "column" }}>
            <div className="display" style={{ fontSize: 16, marginBottom: 10 }}>YOUR FIXTURE</div>
            <div className="col gap-2" style={{ flex: 1, overflow: "auto" }}>
              {FIXTURES.map(f => {
                const live = f.status === "live";
                const done = f.result;
                return (
                  <div key={f.rd} className="panel-flat" style={{
                    padding: 10,
                    border: live ? "1px solid var(--A-neg)" : "1px solid var(--A-line)",
                    background: live ? "rgba(255,87,119,0.05)" : "var(--A-panel)",
                  }}>
                    <div className="row between aic">
                      <div className="row aic gap-2">
                        <span className="mono" style={{ fontSize: 9, padding: "2px 6px", background: "rgba(255,255,255,0.06)", color: "var(--A-text-mute)", letterSpacing: "0.1em" }}>RD {f.rd}</span>
                        <span className="mono" style={{ fontSize: 9, color: f.home ? "var(--A-pos)" : "var(--A-text-mute)" }}>{f.home ? "HOME" : "AWAY"}</span>
                      </div>
                      {live && <span className="row aic gap-1"><span className="live-dot"/><span className="mono neg" style={{ fontSize: 9, letterSpacing: "0.18em" }}>LIVE</span></span>}
                      {done && <span className={`mono ${f.result === "W" ? "pos" : "neg"}`} style={{ fontSize: 11, fontWeight: 700 }}>{f.result}</span>}
                    </div>
                    <div className="row aic gap-2" style={{ marginTop: 6 }}>
                      <Crest short={f.short} colors={["#1a1a1a","#444","#fff"]} size={20} dir="A" />
                      <span style={{ fontSize: 12, fontWeight: 600 }}>{f.opp}</span>
                    </div>
                    {f.score && <div className="mono mute" style={{ fontSize: 10, marginTop: 4 }}>{f.score}</div>}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </FrameA>
  );
}

window.FDA2 = { MatchA, ClubA, RecruitA, CompeteA };

})();
