// Direction A — Polished Club + Recruit + Competition + Kit Designer
(function () {
  const { Jersey, AttrBar, Crest, FormChips, PosBadge, Spark, Tabs, Radar, Ring, LineChart, BarChart } = window.FDP;
  const {
    CLUB, LADDER, SQUAD, FIXTURES, NEWS, FACILITIES, SPONSORS, STAFF, DRAFT,
    TRADES, FINANCE, CASH_TREND, REVENUE_BREAKDOWN, SCOUT_REPORTS,
    KIT_PRESETS, KIT_PALETTES,
  } = window.FD;
  const { FrameA } = window.FDA;

  // ────────────────────────────────────────────────────────────
  // CLUB — finances with charts
  // ────────────────────────────────────────────────────────────
  function ClubA() {
    return (
      <FrameA active="club">
        <div className="col gap-3" style={{ height: "100%", overflow: "hidden" }}>
          <div className="row between aic">
            <div>
              <div className="display" style={{ fontSize: 22 }}>CLUB OPERATIONS</div>
              <div className="label" style={{ marginTop: 2 }}>FINANCES · FACILITIES · SPONSORS · STAFF</div>
            </div>
            <Tabs tabs={["Finance", "Facilities", "Sponsors", "Staff", "Kits"]} active="Finance" dir="A" />
          </div>

          <div className="row gap-3" style={{ flex: 1, minHeight: 0 }}>
            {/* Cash flow chart hero */}
            <div className="panel" style={{ flex: 2, padding: 18, minWidth: 0 }}>
              <div className="row between aic" style={{ marginBottom: 12 }}>
                <div>
                  <div className="label">CASH POSITION</div>
                  <div className="display" style={{ fontSize: 36, marginTop: 4 }}>
                    <span className="pos">$142.8K</span>
                    <span className="mono accent" style={{ fontSize: 14, marginLeft: 14, letterSpacing: "0.1em" }}>+$18.4K W/W ▲</span>
                  </div>
                  <div className="label" style={{ marginTop: 2 }}>12-WEEK ROLLING</div>
                </div>
                <div className="row gap-2">
                  <span className="pill">REVENUE</span>
                  <span className="mono mute" style={{ fontSize: 10 }}>EXPENSE</span>
                </div>
              </div>
              <LineChart data={CASH_TREND} w={620} h={130} color="var(--A-pos)" baseline={100} />
              <div className="row gap-2" style={{ marginTop: 12 }}>
                {[
                  ["BUDGET",     "$640K", "var(--A-text)"],
                  ["MEMBERSHIP", "$96K",  "var(--A-accent)"],
                  ["SPONSORS",   "$93.5K","var(--A-accent-2)"],
                  ["GATE",       "$61K",  "#A78BFA"],
                  ["WAGES",      "-$214K","var(--A-neg)"],
                  ["NET",        "+$92K", "var(--A-pos)"],
                ].map(([l, v, c]) => (
                  <div key={l} className="panel-flat" style={{ padding: 10, flex: 1 }}>
                    <div className="label" style={{ fontSize: 8 }}>{l}</div>
                    <div className="display tnum" style={{ fontSize: 16, marginTop: 2, color: c }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Revenue breakdown bar chart */}
            <div className="panel" style={{ flex: 1, padding: 18, minWidth: 220 }}>
              <div className="row between aic" style={{ marginBottom: 12 }}>
                <div>
                  <div className="label">REVENUE STREAMS</div>
                  <div className="display" style={{ fontSize: 14, marginTop: 2 }}>SEASON {CLUB.season}</div>
                </div>
                <span className="mono accent" style={{ fontSize: 10 }}>$323K TTL</span>
              </div>
              <BarChart data={REVENUE_BREAKDOWN} w={240} h={130} color="var(--A-accent)" dir="A" />
              <hr style={{ margin: "14px 0" }}/>
              <div className="col gap-2">
                {SPONSORS.slice(0, 3).map(s => (
                  <div key={s.name} className="row between aic">
                    <div className="row aic gap-2">
                      <div style={{ width: 20, height: 20, background: `${s.color}40`, border: `1px solid ${s.color}`, borderRadius: 3 }} />
                      <span style={{ fontSize: 11, fontWeight: 600 }}>{s.name}</span>
                    </div>
                    <span className="mono accent" style={{ fontSize: 11 }}>${s.value}K</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Lower row */}
          <div className="row gap-3" style={{ flex: 1, minHeight: 0 }}>
            {/* Facilities */}
            <div className="panel" style={{ flex: 1, padding: 16, minHeight: 0 }}>
              <div className="row between aic" style={{ marginBottom: 12 }}>
                <div className="display" style={{ fontSize: 14 }}>FACILITIES</div>
                <span className="pill" style={{ fontSize: 9 }}>{FACILITIES.length} BUILDINGS</span>
              </div>
              <div className="col gap-2">
                {FACILITIES.map(f => (
                  <div key={f.name} className="card-hover panel-flat" style={{ padding: 10 }}>
                    <div className="row between aic">
                      <span style={{ fontSize: 12, fontWeight: 600 }}>{f.name}</span>
                      <span className="mono accent" style={{ fontSize: 10 }}>LV {f.level}</span>
                    </div>
                    <div className="row aic gap-2" style={{ marginTop: 5 }}>
                      <div style={{ flex: 1, height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 2 }}>
                        <div className="bar-fill" style={{ width: `${f.level * 20}%`, height: "100%", background: "var(--A-accent)", borderRadius: 2 }} />
                      </div>
                      <span className="mono mute" style={{ fontSize: 9 }}>${f.upgrade}K UPG</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Staff */}
            <div className="panel" style={{ flex: 1, padding: 16, minHeight: 0 }}>
              <div className="display" style={{ fontSize: 14, marginBottom: 12 }}>STAFF</div>
              <div className="col gap-2">
                {STAFF.map(s => (
                  <div key={s.name} className="row between aic" style={{
                    padding: "8px 10px",
                    border: "1px solid var(--A-line)",
                    borderRadius: 4,
                  }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600 }}>{s.name}</div>
                      <div className="label" style={{ fontSize: 8, marginTop: 1 }}>{s.role}</div>
                    </div>
                    <div className="col aic">
                      <div className="display accent" style={{ fontSize: 18, lineHeight: 1 }}>{s.skill}</div>
                      <div className="mono mute" style={{ fontSize: 8 }}>${s.salary}K</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Sponsors detail */}
            <div className="panel" style={{ flex: 1, padding: 16, minHeight: 0 }}>
              <div className="display" style={{ fontSize: 14, marginBottom: 12 }}>SPONSORSHIP</div>
              <div className="col gap-2">
                {SPONSORS.map(s => (
                  <div key={s.name} className="card-hover panel-flat" style={{ padding: 10, borderLeft: `2px solid ${s.color}` }}>
                    <div className="row between aic">
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 600 }}>{s.name}</div>
                        <div className="label" style={{ fontSize: 8, marginTop: 2 }}>{s.tier}</div>
                      </div>
                      <span className="display accent" style={{ fontSize: 18 }}>${s.value}K</span>
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

  // ────────────────────────────────────────────────────────────
  // RECRUIT — deeper scout reports
  // ────────────────────────────────────────────────────────────
  function RecruitA() {
    const [selId, setSelId] = React.useState(1);
    const sel = DRAFT.find(d => d.id === selId) || DRAFT[0];
    const report = SCOUT_REPORTS[selId] || SCOUT_REPORTS[1];
    return (
      <FrameA active="recruit">
        <div className="col gap-3" style={{ height: "100%", overflow: "hidden" }}>
          <div className="row between aic">
            <div>
              <div className="display" style={{ fontSize: 22 }}>RECRUITING</div>
              <div className="label" style={{ marginTop: 2 }}>DRAFT BOARD · TRADES · ACADEMY</div>
            </div>
            <Tabs tabs={["Draft", "Trades", "Academy", "FA"]} active="Draft" dir="A" />
          </div>

          <div className="row gap-3" style={{ flex: 1, minHeight: 0 }}>
            {/* Draft list */}
            <div className="panel" style={{ flex: 1, padding: 0, display: "flex", flexDirection: "column", minWidth: 280 }}>
              <div className="row between aic" style={{ padding: "12px 16px", borderBottom: "1px solid var(--A-line)" }}>
                <div>
                  <div className="display" style={{ fontSize: 14 }}>DRAFT BOARD</div>
                  <div className="label" style={{ marginTop: 2 }}>SEASON {CLUB.season} · NATIONAL POOL</div>
                </div>
                <span className="pill" style={{ fontSize: 9 }}>PICK #4</span>
              </div>
              <div style={{ flex: 1, overflow: "auto" }}>
                {DRAFT.map((p, i) => {
                  const on = p.id === selId;
                  return (
                    <div key={p.id} onClick={() => setSelId(p.id)} className="player-row row aic" style={{
                      padding: "10px 16px",
                      borderBottom: "1px solid var(--A-line)",
                      cursor: "pointer",
                      background: on ? "rgba(0,224,255,0.08)" : "transparent",
                      borderLeft: on ? "3px solid var(--A-accent)" : "3px solid transparent",
                    }}>
                      <span className="display tnum" style={{ width: 28, fontSize: 18, color: on ? "var(--A-accent)" : "var(--A-text-mute)" }}>#{i+1}</span>
                      <div style={{ flex: 1, minWidth: 0, marginLeft: 8 }}>
                        <div className="row aic gap-2">
                          <span style={{ fontSize: 12, fontWeight: 600 }}>{p.name}</span>
                          <PosBadge pos={p.pos} dir="A" />
                        </div>
                        <div className="mono mute" style={{ fontSize: 9, marginTop: 2, letterSpacing: "0.1em" }}>{p.age}YO · {p.from.toUpperCase()}</div>
                      </div>
                      <div className="col aic">
                        <span className="display" style={{ fontSize: 16, color: p.proj >= 80 ? "var(--A-pos)" : "var(--A-accent)" }}>{p.proj}</span>
                        <span className="mono mute" style={{ fontSize: 8 }}>PROJ</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Scout report */}
            <div className="panel" style={{ flex: 1.6, padding: 18, overflow: "auto", minWidth: 0 }}>
              <div className="row between aic" style={{ marginBottom: 14 }}>
                <div>
                  <div className="label">SCOUT REPORT · CONFIDENTIAL</div>
                  <div className="display" style={{ fontSize: 30, lineHeight: 1, marginTop: 4 }}>{sel.name.toUpperCase()}</div>
                  <div className="row aic gap-3" style={{ marginTop: 6 }}>
                    <PosBadge pos={sel.pos} dir="A" />
                    <span className="mono dim" style={{ fontSize: 10 }}>{sel.age} YRS · {sel.from}</span>
                    <span className="mono accent" style={{ fontSize: 10 }}>NAT'L RANK #{report.nationalRank}</span>
                    <span className="mono mute" style={{ fontSize: 10 }}>{report.weeksScouted} WEEKS SCOUTED</span>
                  </div>
                </div>
                <div className="row gap-3">
                  <div className="col aic">
                    <Ring value={(sel.proj / 100) * 100} size={62} stroke={5} color="var(--A-pos)" label={sel.proj} />
                    <div className="label" style={{ fontSize: 8, marginTop: 2 }}>PROJECTION</div>
                  </div>
                  <div className="col aic">
                    <Ring value={sel.attr.MRK || 70} size={62} stroke={5} color="var(--A-accent)" label={Math.round((sel.attr.MRK + sel.attr.KCK + sel.attr.TKL) / 3)} />
                    <div className="label" style={{ fontSize: 8, marginTop: 2 }}>CURRENT</div>
                  </div>
                </div>
              </div>

              {/* Radar + scout text */}
              <div className="row gap-4">
                <Radar data={[
                  { label: "MARK", value: sel.attr.MRK || 70 },
                  { label: "KICK", value: sel.attr.KCK || 70 },
                  { label: "TACK", value: sel.attr.TKL || 60 },
                  { label: "ENDR", value: sel.attr.END || 70 },
                  { label: "SPD",  value: sel.attr.SPD || 70 },
                  { label: "DEC",  value: sel.attr.DEC || 70 },
                ]} size={170} dir="A" />

                <div className="col gap-3" style={{ flex: 1, minWidth: 0 }}>
                  <div>
                    <div className="label" style={{ marginBottom: 6 }}>STRENGTHS</div>
                    <div className="col gap-1">
                      {report.strengths.map((s, i) => (
                        <div key={i} className="row aic gap-2">
                          <span className="mono accent" style={{ fontSize: 10 }}>▲</span>
                          <span style={{ fontSize: 12 }}>{s}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="label" style={{ marginBottom: 6 }}>WATCH-OUTS</div>
                    <div className="col gap-1">
                      {report.weaknesses.map((s, i) => (
                        <div key={i} className="row aic gap-2">
                          <span className="mono neg" style={{ fontSize: 10 }}>▼</span>
                          <span style={{ fontSize: 12, color: "var(--A-text-dim)" }}>{s}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <hr style={{ margin: "16px 0" }}/>

              <div className="row gap-3">
                <div className="panel-flat" style={{ flex: 1, padding: 12 }}>
                  <div className="label" style={{ fontSize: 8 }}>PLAYER COMP</div>
                  <div style={{ fontSize: 12, marginTop: 4, fontStyle: "italic" }}>"{report.comparable}"</div>
                </div>
                <div className="panel-flat" style={{ flex: 1, padding: 12 }}>
                  <div className="label" style={{ fontSize: 8 }}>RISK</div>
                  <div className="display" style={{ fontSize: 18, marginTop: 4, color: report.riskFactor === "Low" ? "var(--A-pos)" : report.riskFactor === "Medium" ? "var(--A-accent-2)" : "var(--A-neg)" }}>{report.riskFactor.toUpperCase()}</div>
                </div>
                <div className="panel-flat" style={{ flex: 1, padding: 12 }}>
                  <div className="label" style={{ fontSize: 8 }}>DEMAND</div>
                  <div style={{ fontSize: 11, marginTop: 4 }}>{report.interestedClubs.length} clubs · top: {report.interestedClubs[0]}</div>
                </div>
              </div>

              <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
                <button className="btn-primary" style={{ flex: 1 }}>★ SHORTLIST</button>
                <button className="btn-ghost">SEND SCOUT</button>
                <button className="btn-ghost">FILM</button>
              </div>
            </div>

            {/* Pipeline */}
            <div className="panel" style={{ flex: 1, padding: 14, minWidth: 220 }}>
              <div className="display" style={{ fontSize: 14, marginBottom: 10 }}>YOUR PICKS</div>
              <div className="col gap-2">
                {[
                  { rd: 1, pick: 4,  acquired: "Own" },
                  { rd: 2, pick: 18, acquired: "Trade · Vermont" },
                  { rd: 3, pick: 36, acquired: "Own" },
                  { rd: 4, pick: 52, acquired: "Compensation" },
                ].map(p => (
                  <div key={p.pick} className="panel-flat" style={{ padding: 10 }}>
                    <div className="row between aic">
                      <div>
                        <div className="display" style={{ fontSize: 16, lineHeight: 1 }}>R{p.rd} #{p.pick}</div>
                        <div className="mono mute" style={{ fontSize: 8, marginTop: 2 }}>{p.acquired.toUpperCase()}</div>
                      </div>
                      <Ring value={p.rd === 1 ? 90 : p.rd === 2 ? 70 : 45} size={36} stroke={3} color="var(--A-accent)" />
                    </div>
                  </div>
                ))}
              </div>
              <hr style={{ margin: "14px 0" }}/>
              <div className="display" style={{ fontSize: 14, marginBottom: 10 }}>OPEN TRADES</div>
              <div className="col gap-2">
                {TRADES.slice(0, 2).map((t, i) => (
                  <div key={i} className="card-hover panel-flat" style={{ padding: 10 }}>
                    <div className="row between aic">
                      <span className="mono" style={{ fontSize: 10, fontWeight: 700, color: "var(--A-accent-2)", letterSpacing: "0.14em" }}>{t.from} → {t.to}</span>
                      <span className="mono accent" style={{ fontSize: 9 }}>{t.status}</span>
                    </div>
                    <div style={{ fontSize: 11, marginTop: 4 }}>{t.give} <span className="mute">↔</span> {t.get}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </FrameA>
    );
  }

  // ────────────────────────────────────────────────────────────
  // COMPETITION — same as before but with hover, and better fixtures
  // ────────────────────────────────────────────────────────────
  function CompeteA() {
    return (
      <FrameA active="compete">
        <div className="col gap-3" style={{ height: "100%", overflow: "hidden" }}>
          <div className="row between aic">
            <div>
              <div className="display" style={{ fontSize: 22 }}>{CLUB.league.toUpperCase()}</div>
              <div className="label" style={{ marginTop: 2 }}>TIER {CLUB.tier} · ROUND {CLUB.week}/{CLUB.totalRounds} · 18 CLUBS</div>
            </div>
            <Tabs tabs={["Ladder", "Fixtures", "Pyramid", "Finals"]} active="Ladder" dir="A" />
          </div>

          <div className="row gap-3" style={{ flex: 1, minHeight: 0 }}>
            {/* Ladder */}
            <div className="panel" style={{ flex: 2, padding: 0, display: "flex", flexDirection: "column", minWidth: 0 }}>
              <div className="row" style={{ padding: "10px 14px", borderBottom: "1px solid var(--A-line)", background: "rgba(0,224,255,0.04)" }}>
                <span className="label" style={{ flex: 0.4 }}>#</span>
                <span className="label" style={{ flex: 2.2 }}>CLUB</span>
                <span className="label" style={{ flex: 0.4, textAlign: "right" }}>P</span>
                <span className="label" style={{ flex: 0.4, textAlign: "right" }}>W</span>
                <span className="label" style={{ flex: 0.4, textAlign: "right" }}>L</span>
                <span className="label" style={{ flex: 0.6, textAlign: "right" }}>%</span>
                <span className="label" style={{ flex: 1.2, textAlign: "right" }}>FORM</span>
                <span className="label" style={{ flex: 0.5, textAlign: "right" }}>PTS</span>
              </div>
              <div style={{ flex: 1, overflow: "auto" }}>
                {LADDER.map((r, i) => {
                  const promo = i < 2;
                  const reg = i >= 14;
                  return (
                    <div key={r.club} className="player-row row aic" style={{
                      padding: "10px 14px",
                      borderBottom: "1px solid var(--A-line)",
                      background: r.me ? "rgba(0,224,255,0.08)" : "transparent",
                      borderLeft: r.me ? "2px solid var(--A-accent)" : promo ? "2px solid var(--A-pos)" : reg ? "2px solid var(--A-neg)" : "2px solid transparent",
                    }}>
                      <span className="display tnum" style={{ flex: 0.4, fontSize: 16, color: promo ? "var(--A-pos)" : reg ? "var(--A-neg)" : "var(--A-text-mute)" }}>{i+1}</span>
                      <div style={{ flex: 2.2, display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                        <Crest short={r.short} colors={r.colors} size={26} dir="A" />
                        <span style={{ fontSize: 12, fontWeight: r.me ? 700 : 500, color: r.me ? "var(--A-accent)" : "var(--A-text)" }}>{r.club}</span>
                      </div>
                      <span className="mono tnum" style={{ flex: 0.4, fontSize: 11, textAlign: "right" }}>{r.p}</span>
                      <span className="mono tnum pos" style={{ flex: 0.4, fontSize: 11, textAlign: "right" }}>{r.w}</span>
                      <span className="mono tnum neg" style={{ flex: 0.4, fontSize: 11, textAlign: "right" }}>{r.l}</span>
                      <span className="mono tnum" style={{ flex: 0.6, fontSize: 11, textAlign: "right", color: r.pct >= 100 ? "var(--A-pos)" : "var(--A-text-dim)" }}>{r.pct}</span>
                      <span style={{ flex: 1.2, textAlign: "right" }}><FormChips form={r.form} dir="A" /></span>
                      <span className="display" style={{ flex: 0.5, fontSize: 18, textAlign: "right", color: r.me ? "var(--A-accent)" : "var(--A-text)" }}>{r.pts}</span>
                    </div>
                  );
                })}
              </div>
              <div className="row gap-4" style={{ padding: "10px 14px", borderTop: "1px solid var(--A-line)", background: "rgba(7,16,31,0.6)" }}>
                <div className="row aic gap-2"><span style={{ width: 10, height: 2, background: "var(--A-pos)" }}/><span className="label">PROMOTION</span></div>
                <div className="row aic gap-2"><span style={{ width: 10, height: 2, background: "var(--A-neg)" }}/><span className="label">RELEGATION</span></div>
                <div style={{ flex: 1 }}/>
                <span className="mono mute" style={{ fontSize: 10 }}>UPDATED ROUND 8 · LIVE</span>
              </div>
            </div>

            {/* Pyramid */}
            <div className="panel" style={{ flex: 1, padding: 18, minHeight: 0 }}>
              <div className="display" style={{ fontSize: 14, marginBottom: 6 }}>FOOTBALL PYRAMID</div>
              <div className="label" style={{ marginBottom: 14 }}>YOUR TIER · 5 LEVELS</div>
              <div className="col gap-2">
                {[
                  { name: "AFL",  tier: 1, color: "#FFD200", clubs: 18, you: false },
                  { name: "VFL",  tier: 2, color: "#A78BFA", clubs: 14, you: false },
                  { name: "VAFA", tier: 3, color: "#00E0FF", clubs: 16, you: false },
                  { name: "EFL",  tier: 4, color: "var(--A-accent-2)", clubs: 18, you: true  },
                  { name: "WRFL", tier: 5, color: "var(--A-text-mute)", clubs: 12, you: false },
                ].map((t, i) => (
                  <div key={t.name} className="card-hover" style={{
                    padding: "10px 12px",
                    border: `1px solid ${t.you ? "var(--A-accent)" : "var(--A-line)"}`,
                    background: t.you ? "rgba(0,224,255,0.08)" : "transparent",
                    borderRadius: 4,
                    marginLeft: i * 6,
                    marginRight: i * 6,
                  }}>
                    <div className="row between aic">
                      <div className="row aic gap-2">
                        <span className="display tnum" style={{ fontSize: 14, color: t.color, width: 22 }}>T{t.tier}</span>
                        <span style={{ fontSize: 12, fontWeight: 700 }}>{t.name}</span>
                      </div>
                      <span className="mono mute" style={{ fontSize: 9 }}>{t.clubs} CLUBS</span>
                    </div>
                    {t.you && (<div className="mono accent" style={{ fontSize: 9, marginTop: 4, letterSpacing: "0.16em" }}>← YOU ARE HERE · 2ND</div>)}
                  </div>
                ))}
              </div>
              <hr style={{ margin: "14px 0" }} />
              <div className="display" style={{ fontSize: 13, marginBottom: 8 }}>UPCOMING</div>
              <div className="col gap-1">
                {FIXTURES.map((f, i) => {
                  const home = f.home === CLUB.short;
                  return (
                    <div key={i} className="row between aic row-hover" style={{ padding: "6px 0" }}>
                      <span className="mono dim" style={{ fontSize: 9, width: 24 }}>R{f.round}</span>
                      <span className="mono" style={{ fontSize: 10, color: home ? "var(--A-accent)" : "var(--A-text)" }}>{f.home}</span>
                      <span className="mono mute" style={{ fontSize: 9 }}>vs</span>
                      <span className="mono" style={{ fontSize: 10, color: !home ? "var(--A-accent)" : "var(--A-text)" }}>{f.away}</span>
                      <span className="mono mute" style={{ fontSize: 9 }}>{f.day.slice(0,3)}</span>
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

  // ────────────────────────────────────────────────────────────
  // KIT DESIGNER — new screen
  // ────────────────────────────────────────────────────────────
  function KitDesignerA() {
    const [pattern, setPattern] = React.useState("stripes");
    const [palette, setPalette] = React.useState(KIT_PALETTES[0]);
    const [shorts, setShorts] = React.useState("solid");
    return (
      <FrameA active="club">
        <div className="col gap-3" style={{ height: "100%", overflow: "hidden" }}>
          <div className="row between aic">
            <div>
              <div className="display" style={{ fontSize: 22 }}>KIT DESIGNER</div>
              <div className="label" style={{ marginTop: 2 }}>HOME · CLASH · HERITAGE · TRAINING</div>
            </div>
            <Tabs tabs={["Finance", "Facilities", "Sponsors", "Staff", "Kits"]} active="Kits" dir="A" />
          </div>

          <div className="row gap-3" style={{ flex: 1, minHeight: 0 }}>
            {/* Preview */}
            <div className="panel" style={{ flex: 1.2, padding: 24, minWidth: 0, position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse 60% 50% at 50% 50%, ${palette.colors[0]}30, transparent 70%)` }} />
              <div className="row between aic" style={{ position: "relative", marginBottom: 14 }}>
                <div className="label">HOME KIT · PREVIEW</div>
                <span className="pill"><span className="live-dot"/> LIVE</span>
              </div>

              <div style={{ position: "relative", display: "flex", justifyContent: "center", alignItems: "center", flex: 1, minHeight: 320 }}>
                {/* Big jersey */}
                <div style={{ position: "relative" }}>
                  <Jersey kit={pattern} colors={palette.colors} size={280} num="1" />
                  {/* sponsor patch */}
                  <div style={{ position: "absolute", top: "44%", left: "50%", transform: "translate(-50%, -50%)", padding: "3px 8px", background: "#FFFFFFD0", color: "#000", fontFamily: "Bebas Neue", fontSize: 14, letterSpacing: "0.06em", borderRadius: 2 }}>
                    NORTHERN BANK
                  </div>
                </div>
              </div>

              <div className="row between aic" style={{ position: "relative", marginTop: 14 }}>
                <div>
                  <div className="display" style={{ fontSize: 22, lineHeight: 1 }}>{palette.name.toUpperCase()}</div>
                  <div className="mono mute" style={{ fontSize: 10, marginTop: 4, letterSpacing: "0.14em" }}>PATTERN · {pattern.toUpperCase()} · 100% POLY</div>
                </div>
                <button className="btn-primary">★ SAVE KIT</button>
              </div>
            </div>

            {/* Controls */}
            <div className="panel" style={{ flex: 1, padding: 18, overflow: "auto", minWidth: 280 }}>
              <div className="label" style={{ marginBottom: 8 }}>PATTERN</div>
              <div className="row gap-2" style={{ flexWrap: "wrap", marginBottom: 18 }}>
                {KIT_PRESETS.map(k => (
                  <div key={k.id} onClick={() => setPattern(k.pattern)} className="card-hover" style={{
                    padding: 6,
                    border: pattern === k.pattern ? "1px solid var(--A-accent)" : "1px solid var(--A-line)",
                    background: pattern === k.pattern ? "rgba(0,224,255,0.08)" : "transparent",
                    borderRadius: 4,
                    width: 64,
                    textAlign: "center",
                  }}>
                    <Jersey kit={k.pattern} colors={palette.colors} size={42} />
                    <div className="mono" style={{ fontSize: 9, marginTop: 4, color: pattern === k.pattern ? "var(--A-accent)" : "var(--A-text-mute)", letterSpacing: "0.1em" }}>{k.name.toUpperCase()}</div>
                  </div>
                ))}
              </div>

              <div className="label" style={{ marginBottom: 8 }}>COLOUR PALETTE</div>
              <div className="col gap-2" style={{ marginBottom: 18 }}>
                {KIT_PALETTES.map(p => (
                  <div key={p.name} onClick={() => setPalette(p)} className="card-hover row between aic" style={{
                    padding: "8px 10px",
                    border: palette.name === p.name ? "1px solid var(--A-accent)" : "1px solid var(--A-line)",
                    background: palette.name === p.name ? "rgba(0,224,255,0.06)" : "transparent",
                    borderRadius: 4,
                  }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: palette.name === p.name ? "var(--A-accent)" : "var(--A-text)" }}>{p.name}</span>
                    <div className="row gap-1">
                      {p.colors.map((c, i) => (
                        <div key={i} style={{ width: 14, height: 14, background: c, borderRadius: 2, border: "1px solid rgba(255,255,255,0.1)" }} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="label" style={{ marginBottom: 8 }}>NUMBER STYLE</div>
              <div className="row gap-2" style={{ marginBottom: 18 }}>
                {["BEBAS","BLOCK","SCRIPT"].map((s, i) => (
                  <div key={s} className="card-hover" style={{
                    flex: 1, padding: "10px 0", textAlign: "center",
                    border: i === 0 ? "1px solid var(--A-accent)" : "1px solid var(--A-line)",
                    background: i === 0 ? "rgba(0,224,255,0.06)" : "transparent",
                    borderRadius: 4,
                  }}>
                    <div className="display" style={{ fontSize: 22, color: i === 0 ? "var(--A-accent)" : "var(--A-text)" }}>23</div>
                    <div className="mono mute" style={{ fontSize: 8, marginTop: 2, letterSpacing: "0.16em" }}>{s}</div>
                  </div>
                ))}
              </div>

              <div className="label" style={{ marginBottom: 8 }}>OTHER KITS</div>
              <div className="row gap-3">
                <div className="col aic" style={{ flex: 1 }}>
                  <Jersey kit="solid" colors={["#F4EFE6", palette.colors[0], "#0A0A0A"]} size={56} />
                  <div className="mono mute" style={{ fontSize: 8, marginTop: 4, letterSpacing: "0.14em" }}>CLASH</div>
                </div>
                <div className="col aic" style={{ flex: 1 }}>
                  <Jersey kit="hoops" colors={palette.colors} size={56} />
                  <div className="mono mute" style={{ fontSize: 8, marginTop: 4, letterSpacing: "0.14em" }}>HERITAGE</div>
                </div>
                <div className="col aic" style={{ flex: 1 }}>
                  <Jersey kit="solid" colors={["#222", palette.colors[1], "#FFFFFF"]} size={56} />
                  <div className="mono mute" style={{ fontSize: 8, marginTop: 4, letterSpacing: "0.14em" }}>TRAIN</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </FrameA>
    );
  }

  window.FDA_POLISH = window.FDA_POLISH || {};
  Object.assign(window.FDA_POLISH, { ClubA, RecruitA, CompeteA, KitDesignerA });
})();
