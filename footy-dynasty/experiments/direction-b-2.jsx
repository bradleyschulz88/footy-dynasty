(function(){
// Direction B — screens 4-6: Club, Recruit, Competition
const { Jersey, AttrBar, Spark, FormChips, PosBadge, Crest } = window.FDP;
const { CLUB, LADDER, FIXTURES, FACILITIES, SPONSORS, STAFF, DRAFT, TRADES } = window.FD;
const { FrameB } = window.FDB;

function ClubB() {
  return (
    <FrameB active="club">
      <div className="col gap-3" style={{ height: "100%", overflow: "hidden" }}>
        <div className="row gap-0">
          {["FINANCES","SPONSORS","KITS","FACILITIES","STAFF"].map((t,i)=>(
            <div key={t} style={{
              padding: "10px 18px",
              background: i===0 ? "var(--B-text)" : "transparent",
              color: i===0 ? "var(--B-bg)" : "var(--B-text-dim)",
              fontFamily: "Bebas Neue", fontSize: 14, letterSpacing: "0.16em",
              border: "1px solid var(--B-line-2)",
              borderRight: i===4 ? "1px solid var(--B-line-2)" : "none",
            }}>{t}</div>
          ))}
        </div>
        <div className="row gap-3" style={{ flex: 1, minHeight: 0 }}>
          <div className="col gap-3" style={{ flex: 1.2, minHeight: 0 }}>
            <div className="panel" style={{ padding: 22 }}>
              <div className="row between aic">
                <div>
                  <div className="label">CASH ON HAND</div>
                  <div className="display" style={{ fontSize: 76, lineHeight: 0.85, color: "var(--B-pos)", marginTop: 4 }}>$142.8K</div>
                  <div className="display" style={{ fontSize: 14, marginTop: 6, color: "var(--B-pos)" }}>▲ +$53.8K THIS QUARTER</div>
                </div>
                <Spark data={[78,84,92,88,96,110,124,138,142]} color="#B8E04C" w={160} h={56} />
              </div>
            </div>
            <div className="panel" style={{ padding: 18, flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
              <div className="display" style={{ fontSize: 22, marginBottom: 10 }}>P&amp;L · S{CLUB.season}</div>
              <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse" }}>
                <tbody>
                  {[["MEMBERSHIP","+$96.4K","pos"],["SPONSORSHIP","+$93.5K","pos"],["MATCH-DAY GATE","+$61.0K","pos"],["MERCH & BAR","+$42.2K","pos"],["GRANTS (COUNCIL)","+$22.0K","pos"],["WAGES (PLAYERS)","−$192.8K","neg"],["WAGES (STAFF)","−$117.0K","neg"],["FACILITIES","−$28.4K","neg"],["TRAVEL & MATCH","−$20.0K","neg"]].map(([l,v,c])=>(
                    <tr key={l} style={{ borderBottom: "1px solid var(--B-line)" }}>
                      <td className="display" style={{ padding: "10px 0", fontSize: 13, letterSpacing: "0.1em", color: "var(--B-text-dim)" }}>{l}</td>
                      <td className={`mono tnum ${c}`} style={{ padding: "10px 0", textAlign: "right", fontWeight: 600 }}>{v}</td>
                    </tr>
                  ))}
                  <tr><td className="display" style={{ padding: "14px 0 0", fontSize: 22, color: "var(--B-accent)" }}>NET</td>
                    <td className="display" style={{ padding: "14px 0 0", textAlign: "right", fontSize: 28, color: "var(--B-pos)" }}>+$53.8K</td></tr>
                </tbody>
              </table>
            </div>
          </div>
          <div className="col gap-3" style={{ flex: 1, minHeight: 0 }}>
            <div className="panel" style={{ padding: 16 }}>
              <div className="display" style={{ fontSize: 18, marginBottom: 12 }}>BUDGET HEALTH</div>
              <div className="row gap-3">
                {[["WAGES",78,"$192.8K / $240K"],["TRANSFER",24,"$9.2K / $38K"],["FACILITIES",56,"OK"]].map(([l,p,sub])=>(
                  <div key={l} style={{ flex: 1 }}>
                    <div className="row between" style={{ marginBottom: 5 }}>
                      <span className="label">{l}</span>
                      <span className="display accent" style={{ fontSize: 18 }}>{p}%</span>
                    </div>
                    <div style={{ height: 6, background: "rgba(255,255,255,0.05)" }}>
                      <div style={{ width: `${p}%`, height: "100%", background: p > 80 ? "var(--B-neg)" : "var(--B-accent)" }} />
                    </div>
                    <div className="mono mute" style={{ fontSize: 9, marginTop: 4 }}>{sub}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="panel" style={{ padding: 16, flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
              <div className="row between aic" style={{ marginBottom: 12 }}>
                <div className="display" style={{ fontSize: 18 }}>SPONSORS · 4 ACTIVE</div>
                <span className="pill">+ NEW DEAL</span>
              </div>
              <div className="col gap-2" style={{ flex: 1, overflow: "auto" }}>
                {SPONSORS.map(s => (
                  <div key={s.name} className="panel-flat" style={{ padding: 12, background: "var(--B-bg-2)" }}>
                    <div className="row between aic">
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{s.name}</div>
                        <div className="label" style={{ fontSize: 9, marginTop: 3 }}>{s.tier.toUpperCase()} · {s.expires}Y LEFT</div>
                      </div>
                      <div className="display accent" style={{ fontSize: 22 }}>${(s.value/1000).toFixed(1)}K</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="panel" style={{ flex: 0.9, padding: 16, minHeight: 0, display: "flex", flexDirection: "column" }}>
            <div className="display" style={{ fontSize: 18, marginBottom: 12 }}>FACILITIES</div>
            <div className="col gap-2" style={{ flex: 1, overflow: "auto" }}>
              {FACILITIES.map(f => (
                <div key={f.name} className="panel-flat" style={{ padding: 11, background: "var(--B-bg-2)" }}>
                  <div className="row between aic" style={{ marginBottom: 6 }}>
                    <span className="display" style={{ fontSize: 14, letterSpacing: "0.1em" }}>{f.name.toUpperCase()}</span>
                    <span className="display accent" style={{ fontSize: 14 }}>L{f.level}/{f.max}</span>
                  </div>
                  <div className="row gap-1">
                    {Array.from({length: f.max}).map((_,i)=>(
                      <div key={i} style={{ flex: 1, height: 5, background: i < f.level ? "var(--B-accent)" : "rgba(255,255,255,0.05)" }} />
                    ))}
                  </div>
                  <div className="mono mute" style={{ fontSize: 9, marginTop: 5 }}>{f.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </FrameB>
  );
}

function RecruitB() {
  return (
    <FrameB active="recruit">
      <div className="col gap-3" style={{ height: "100%", overflow: "hidden" }}>
        <div className="row gap-0">
          {["TRADES","DRAFT","YOUTH ACADEMY","LOCAL SCOUTING"].map((t,i)=>(
            <div key={t} style={{
              padding: "10px 18px",
              background: i===1 ? "var(--B-text)" : "transparent",
              color: i===1 ? "var(--B-bg)" : "var(--B-text-dim)",
              fontFamily: "Bebas Neue", fontSize: 14, letterSpacing: "0.16em",
              border: "1px solid var(--B-line-2)",
              borderRight: i===3 ? "1px solid var(--B-line-2)" : "none",
            }}>{t}</div>
          ))}
        </div>
        <div className="row gap-3" style={{ flex: 1, minHeight: 0 }}>
          <div className="panel" style={{ flex: 0.7, padding: 16, minHeight: 0, display: "flex", flexDirection: "column" }}>
            <div className="display" style={{ fontSize: 18, marginBottom: 12 }}>DRAFT ORDER</div>
            <div className="col gap-2" style={{ flex: 1, overflow: "auto" }}>
              {[["1","Vermont FC"],["2","Boronia FC"],["3","Bayswater"],["4","BALWYN FC",true],["5","Knox FC"],["6","Doncaster"]].map(([p,n,me])=>(
                <div key={p} className="row aic gap-3" style={{
                  padding: 10,
                  background: me ? "var(--B-accent)" : "var(--B-bg-2)",
                  color: me ? "#0A0A0A" : "var(--B-text)",
                }}>
                  <span className="display" style={{ fontSize: 22, width: 28 }}>{p}</span>
                  <span style={{ fontSize: 13, fontWeight: me ? 700 : 500 }}>{n}</span>
                </div>
              ))}
            </div>
            <div className="panel-flat" style={{ padding: 12, marginTop: 12, background: "var(--B-bg-2)" }}>
              <div className="label">YOUR PICK ETA</div>
              <div className="display accent" style={{ fontSize: 26, marginTop: 2 }}>3 PICKS AWAY</div>
            </div>
          </div>
          <div className="panel" style={{ flex: 1.7, padding: 16, minHeight: 0, display: "flex", flexDirection: "column" }}>
            <div className="row between aic" style={{ marginBottom: 12 }}>
              <div className="display" style={{ fontSize: 22 }}>BIG BOARD</div>
              <div className="row gap-2"><button className="btn-ghost">FILTER · POS</button><button className="btn-ghost">SHORTLIST · 3</button></div>
            </div>
            <div style={{ flex: 1, overflow: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr className="label" style={{ fontSize: 9 }}>
                    {["RNK","PROSPECT","POS","AGE","OVR","POT","FROM","SCOUT NOTE"].map(h=>(
                      <th key={h} style={{ textAlign: ["PROSPECT","FROM","SCOUT NOTE"].includes(h) ? "left" : "right", padding: "10px", borderBottom: "2px solid var(--B-line-2)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {DRAFT.map(p=>(
                    <tr key={p.rank} style={{ borderBottom: "1px solid var(--B-line)", background: p.rank === 4 ? "rgba(255,216,77,0.08)" : "transparent" }}>
                      <td className="display" style={{ padding: "12px 10px", textAlign: "right", fontSize: 22, color: "var(--B-accent)" }}>#{p.rank}</td>
                      <td style={{ padding: "12px 10px", fontWeight: 600, fontSize: 13 }}>{p.name}</td>
                      <td style={{ padding: "12px 10px", textAlign: "right" }}><PosBadge pos={p.pos} dir="B" /></td>
                      <td className="mono dim" style={{ padding: "12px 10px", textAlign: "right" }}>{p.age}</td>
                      <td className="display" style={{ padding: "12px 10px", textAlign: "right", fontSize: 18 }}>{p.ovr}</td>
                      <td style={{ padding: "12px 10px", textAlign: "right" }}>
                        <div className="display accent-2" style={{ fontSize: 18 }}>{p.pot}</div>
                        <div style={{ width: 60, height: 3, marginLeft: "auto", marginTop: 2, background: "rgba(255,216,77,0.18)" }}>
                          <div style={{ width: `${p.pot}%`, height: "100%", background: "var(--B-accent-2)" }} />
                        </div>
                      </td>
                      <td className="mono mute" style={{ padding: "12px 10px", fontSize: 10 }}>{p.club}</td>
                      <td className="mute" style={{ padding: "12px 10px", fontSize: 11, fontStyle: "italic" }}>{p.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="panel" style={{ flex: 1, padding: 16, minHeight: 0, display: "flex", flexDirection: "column" }}>
            <div className="display" style={{ fontSize: 18, marginBottom: 12 }}>POSITIONAL NEED</div>
            {[["KEY FWD",90,"var(--B-neg)"],["RUCK",75,"var(--B-accent-2)"],["WING",40,"var(--B-pos)"],["KEY BACK",30,"var(--B-pos)"],["CENTRE",55,"var(--B-accent)"]].map(([l,n,c])=>(
              <div key={l} style={{ marginBottom: 14 }}>
                <div className="row between aic" style={{ marginBottom: 5 }}>
                  <span className="display" style={{ fontSize: 14, letterSpacing: "0.12em" }}>{l}</span>
                  <span className="display" style={{ fontSize: 16, color: c }}>{n}</span>
                </div>
                <div style={{ height: 5, background: "rgba(255,255,255,0.06)" }}>
                  <div style={{ width: `${n}%`, height: "100%", background: c }} />
                </div>
              </div>
            ))}
            <div style={{ flex: 1 }} />
            <div className="display" style={{ fontSize: 18, marginTop: 12, marginBottom: 10 }}>WATCHLIST</div>
            <div className="col gap-2">
              {DRAFT.slice(0,2).map(p=>(
                <div key={p.rank} className="panel-flat" style={{ padding: 10, background: "var(--B-bg-2)" }}>
                  <div className="row between aic">
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600 }}>{p.name}</div>
                      <div className="mono mute" style={{ fontSize: 9, marginTop: 2 }}>#{p.rank} · {p.pos}</div>
                    </div>
                    <div className="display accent" style={{ fontSize: 22 }}>{p.ovr}<span className="mute" style={{ fontSize: 13 }}>/{p.pot}</span></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </FrameB>
  );
}

function CompeteB() {
  return (
    <FrameB active="compete">
      <div className="col gap-3" style={{ height: "100%", overflow: "hidden" }}>
        <div className="row gap-0">
          {["LADDER","FIXTURES","PYRAMID","FINALS"].map((t,i)=>(
            <div key={t} style={{
              padding: "10px 18px",
              background: i===0 ? "var(--B-text)" : "transparent",
              color: i===0 ? "var(--B-bg)" : "var(--B-text-dim)",
              fontFamily: "Bebas Neue", fontSize: 14, letterSpacing: "0.16em",
              border: "1px solid var(--B-line-2)",
              borderRight: i===3 ? "1px solid var(--B-line-2)" : "none",
            }}>{t}</div>
          ))}
        </div>
        <div className="row gap-3" style={{ flex: 1, minHeight: 0 }}>
          <div className="panel" style={{ flex: 2, padding: 18, minHeight: 0, display: "flex", flexDirection: "column" }}>
            <div className="row between aic" style={{ marginBottom: 12 }}>
              <div className="display" style={{ fontSize: 26, letterSpacing: "0.04em" }}>EASTERN FOOTBALL LEAGUE</div>
              <span className="pill">FINALS LINE: 4TH</span>
            </div>
            <div style={{ flex: 1, overflow: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead style={{ position: "sticky", top: 0, background: "var(--B-panel)" }}>
                  <tr className="label" style={{ fontSize: 9 }}>
                    {["#","CLUB","P","W","L","D","PF","PA","PCT","PTS","FORM"].map(h=>(
                      <th key={h} style={{ textAlign: h === "CLUB" ? "left" : "right", padding: "10px", borderBottom: "2px solid var(--B-line-2)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {LADDER.map(r=>(
                    <React.Fragment key={r.short}>
                      <tr style={{ borderBottom: "1px solid var(--B-line)", background: r.me ? "rgba(255,90,31,0.08)" : "transparent" }}>
                        <td className="display" style={{ padding: "12px 10px", textAlign: "right", fontSize: 22, color: r.rank <= 4 ? "var(--B-accent)" : "var(--B-text-mute)" }}>{r.rank}</td>
                        <td style={{ padding: "12px 10px" }}>
                          <div className="row aic gap-3">
                            <Crest short={r.short} colors={r.me ? CLUB.colors : ["#222","#444","#fff"]} size={26} dir="B" />
                            <span style={{ fontWeight: r.me ? 700 : 500, fontSize: 13, color: r.me ? "var(--B-accent)" : "var(--B-text)" }}>{r.club}</span>
                          </div>
                        </td>
                        <td className="mono tnum dim" style={{ padding: "12px 10px", textAlign: "right" }}>{r.w + r.l + r.d}</td>
                        <td className="mono tnum pos" style={{ padding: "12px 10px", textAlign: "right" }}>{r.w}</td>
                        <td className="mono tnum neg" style={{ padding: "12px 10px", textAlign: "right" }}>{r.l}</td>
                        <td className="mono tnum dim" style={{ padding: "12px 10px", textAlign: "right" }}>{r.d}</td>
                        <td className="mono tnum dim" style={{ padding: "12px 10px", textAlign: "right" }}>{r.pf}</td>
                        <td className="mono tnum dim" style={{ padding: "12px 10px", textAlign: "right" }}>{r.pa}</td>
                        <td className="mono tnum" style={{ padding: "12px 10px", textAlign: "right", color: r.pct >= 100 ? "var(--B-pos)" : "var(--B-neg)" }}>{r.pct.toFixed(1)}</td>
                        <td className="display" style={{ padding: "12px 10px", textAlign: "right", fontSize: 22, color: "var(--B-accent)" }}>{r.pts}</td>
                        <td style={{ padding: "12px 10px", textAlign: "right" }}><FormChips form={r.form} dir="B" /></td>
                      </tr>
                      {r.rank === 4 && (
                        <tr><td colSpan={11} style={{ padding: 0 }}>
                          <div style={{ borderTop: "2px dashed var(--B-accent-2)", display: "flex", justifyContent: "center" }}>
                            <span className="display" style={{ background: "var(--B-panel)", padding: "0 14px", color: "var(--B-accent-2)", fontSize: 11, letterSpacing: "0.2em", marginTop: -8 }}>↑ FINALS LINE ↑</span>
                          </div>
                        </td></tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="panel" style={{ flex: 1, padding: 18, minHeight: 0, display: "flex", flexDirection: "column" }}>
            <div className="display" style={{ fontSize: 22, marginBottom: 12 }}>YOUR FIXTURE</div>
            <div className="col gap-2" style={{ flex: 1, overflow: "auto" }}>
              {FIXTURES.map(f=>{
                const live = f.status === "live", done = f.result;
                return (
                  <div key={f.rd} style={{
                    padding: 12,
                    background: live ? "rgba(255,90,31,0.08)" : "var(--B-bg-2)",
                    border: live ? "1px solid var(--B-accent)" : "1px solid var(--B-line)",
                  }}>
                    <div className="row between aic" style={{ marginBottom: 6 }}>
                      <span className="display" style={{ fontSize: 14, letterSpacing: "0.16em", color: "var(--B-text-mute)" }}>RD {String(f.rd).padStart(2,"0")} · {f.home ? "HOME" : "AWAY"}</span>
                      {live && <span className="row aic gap-1"><span className="live-dot"/><span className="display accent" style={{ fontSize: 12, letterSpacing: "0.18em" }}>LIVE</span></span>}
                      {done && <span className={`display ${f.result === "W" ? "pos" : "neg"}`} style={{ fontSize: 22 }}>{f.result}</span>}
                    </div>
                    <div className="row aic gap-3">
                      <Crest short={f.short} colors={["#1a1a1a","#444","#fff"]} size={26} dir="B" />
                      <span className="display" style={{ fontSize: 18, letterSpacing: "0.04em" }}>{f.opp.toUpperCase()}</span>
                    </div>
                    {f.score && <div className="mono mute" style={{ fontSize: 11, marginTop: 6 }}>{f.score}</div>}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </FrameB>
  );
}

window.FDB2 = { ClubB, RecruitB, CompeteB };

})();
