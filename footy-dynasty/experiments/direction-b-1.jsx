(function(){
// Direction B — Stadium Carbon
// Pure black canvas, brutalist orange + bone, ticket-stub geometry, oversized Bebas display.

const { Jersey, AttrBar, Spark, FormChips, PosBadge, Crest } = window.FDP;
const { CLUB, LADDER, SQUAD, FIXTURES, NEWS, TACTICS, FACILITIES, SPONSORS, STAFF, DRAFT, TRADES, FINANCE, MATCH_FEED } = window.FD;

const B_NAV = [
  { key: "hub",     label: "Hub",         num: "01" },
  { key: "squad",   label: "Squad",       num: "02" },
  { key: "match",   label: "Match Day",   num: "03" },
  { key: "club",    label: "Club",        num: "04" },
  { key: "recruit", label: "Recruit",     num: "05" },
  { key: "compete", label: "Competition", num: "06" },
];

function FrameB({ active, children }) {
  return (
    <div className="dirB" style={{ display: "flex", flexDirection: "column", width: "100%", height: "100%" }}>
      {/* Top header bar — full width */}
      <header style={{
        height: 56, padding: "0 24px",
        borderBottom: "1px solid var(--B-line)",
        display: "flex", alignItems: "center", gap: 28,
        background: "var(--B-bg-2)", flexShrink: 0,
        position: "relative", zIndex: 2,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 32, height: 32, background: "var(--B-accent)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#0A0A0A", fontFamily: "Bebas Neue", fontSize: 22,
          }}>F</div>
          <div>
            <div className="display" style={{ fontSize: 22, lineHeight: 0.9, letterSpacing: "0.05em" }}>FOOTY DYNASTY</div>
            <div className="label" style={{ fontSize: 9, marginTop: 2 }}>SEASON {CLUB.season} · ROUND {CLUB.week}/{CLUB.totalRounds}</div>
          </div>
        </div>

        {/* Nav as pill row */}
        <nav style={{ display: "flex", gap: 0, marginLeft: 20 }}>
          {B_NAV.map(n => {
            const on = n.key === active;
            return (
              <div key={n.key} style={{
                padding: "10px 14px",
                fontFamily: "Bebas Neue", fontSize: 14,
                letterSpacing: "0.14em",
                color: on ? "#0A0A0A" : "var(--B-text-dim)",
                background: on ? "var(--B-accent)" : "transparent",
                cursor: "pointer",
                display: "flex", alignItems: "center", gap: 8,
              }}>
                <span className="mono" style={{ fontSize: 9, opacity: 0.7 }}>{n.num}</span>
                {n.label.toUpperCase()}
              </div>
            );
          })}
        </nav>

        <div style={{ flex: 1 }} />

        {/* Cash readout */}
        <div style={{ display: "flex", gap: 22, alignItems: "center" }}>
          {[
            ["CASH",  "$142.8K", "var(--B-pos)"],
            ["BUDGET","$38.0K",  "var(--B-text)"],
            ["BOARD", "78",      "var(--B-accent-2)"],
            ["FANS",  "71",      "var(--B-accent)"],
          ].map(([l, v, c]) => (
            <div key={l}>
              <div className="label" style={{ fontSize: 8 }}>{l}</div>
              <div className="display" style={{ fontSize: 18, color: c, lineHeight: 1, marginTop: 2 }}>{v}</div>
            </div>
          ))}
          <button className="btn-primary">▶ ADVANCE WEEK</button>
        </div>
      </header>

      {/* Sub-header: club identity strip */}
      <div style={{
        height: 76, padding: "0 24px",
        borderBottom: "1px solid var(--B-line)",
        display: "flex", alignItems: "center", gap: 18,
        background: "linear-gradient(90deg, rgba(27,59,122,0.4), transparent 50%)",
        flexShrink: 0,
      }}>
        <Crest short={CLUB.short} colors={CLUB.colors} size={52} dir="B" />
        <div>
          <div className="display" style={{ fontSize: 32, lineHeight: 0.9, letterSpacing: "0.04em" }}>BALWYN FC</div>
          <div className="row aic gap-3" style={{ marginTop: 4 }}>
            <span className="label">EFL · TIER 3 · EST 1922</span>
            <span className="mono" style={{ fontSize: 10, color: "var(--B-accent)" }}>▲ 2ND</span>
            <span className="mono" style={{ fontSize: 10, color: "var(--B-pos)" }}>6W · 2L</span>
          </div>
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ textAlign: "right" }}>
          <div className="label">NEXT</div>
          <div className="display" style={{ fontSize: 18, lineHeight: 1, marginTop: 2 }}>VS VERMONT FC</div>
          <div className="mono mute" style={{ fontSize: 10, marginTop: 3 }}>SAT 14:10 · BALWYN PARK</div>
        </div>
      </div>

      {/* Main */}
      <div style={{ flex: 1, overflow: "hidden", padding: 20, position: "relative", zIndex: 1 }}>
        {children}
      </div>
    </div>
  );
}

// ─── HUB ────────────────────────────────────────────────────────
function HubB() {
  const me = LADDER.find(r => r.me);
  return (
    <FrameB active="hub">
      <div className="row gap-4" style={{ height: "100%", overflow: "hidden" }}>
        {/* Left big stat tower */}
        <div className="col gap-3" style={{ flex: 1, minWidth: 0 }}>
          <div className="panel" style={{ padding: 24, position: "relative", overflow: "hidden" }}>
            <div className="label">PREMIERSHIP POINTS</div>
            <div className="display" style={{ fontSize: 140, lineHeight: 0.85, color: "var(--B-accent)", marginTop: 8 }}>{me.pts}</div>
            <div style={{ display: "flex", gap: 16, marginTop: 12 }}>
              <div><div className="label">WINS</div><div className="display pos" style={{ fontSize: 32, lineHeight: 1 }}>{me.w}</div></div>
              <div><div className="label">LOSSES</div><div className="display neg" style={{ fontSize: 32, lineHeight: 1 }}>{me.l}</div></div>
              <div><div className="label">PCT</div><div className="display" style={{ fontSize: 32, lineHeight: 1 }}>{me.pct.toFixed(1)}</div></div>
            </div>
          </div>
          <div className="panel" style={{ padding: 16 }}>
            <div className="label" style={{ marginBottom: 8 }}>FORM · LAST 5</div>
            <FormChips form={me.form} dir="B" />
            <div style={{ marginTop: 14 }}>
              <div className="label">LADDER TREND</div>
              <Spark data={[8,6,5,4,3,3,2,2]} color="var(--B-accent)" w={220} h={36} />
              <div className="mono mute" style={{ fontSize: 9, marginTop: 4 }}>RD1 → RD8 · CLIMBED FROM 8TH</div>
            </div>
          </div>
        </div>

        {/* Center: ladder */}
        <div className="panel" style={{ flex: 1.4, padding: 18, display: "flex", flexDirection: "column", minHeight: 0 }}>
          <div className="row between aic" style={{ marginBottom: 12 }}>
            <div className="display" style={{ fontSize: 22 }}>LADDER</div>
            <span className="pill-ghost">FULL TABLE →</span>
          </div>
          <div style={{ flex: 1, overflow: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr className="label" style={{ fontSize: 9 }}>
                  {["#", "CLUB", "W-L", "PCT", "PTS", "FORM"].map(h => (
                    <th key={h} style={{ textAlign: h === "CLUB" ? "left" : "right", padding: "8px 6px", borderBottom: "1px solid var(--B-line)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {LADDER.slice(0, 8).map(r => (
                  <tr key={r.short} style={{ borderBottom: "1px solid var(--B-line)", background: r.me ? "rgba(255,90,31,0.08)" : "transparent" }}>
                    <td className="display" style={{ padding: "10px 6px", textAlign: "right", fontSize: 18, color: r.rank <= 4 ? "var(--B-accent)" : "var(--B-text-mute)" }}>{r.rank}</td>
                    <td style={{ padding: "10px 6px" }}>
                      <div className="row aic gap-2">
                        <Crest short={r.short} colors={r.me ? CLUB.colors : ["#222","#444","#fff"]} size={22} dir="B" />
                        <span style={{ fontWeight: r.me ? 700 : 500, color: r.me ? "var(--B-accent)" : "var(--B-text)" }}>{r.club}</span>
                      </div>
                    </td>
                    <td className="mono tnum" style={{ padding: "10px 6px", textAlign: "right" }}>{r.w}-{r.l}</td>
                    <td className="mono tnum dim" style={{ padding: "10px 6px", textAlign: "right" }}>{r.pct.toFixed(1)}</td>
                    <td className="display" style={{ padding: "10px 6px", textAlign: "right", fontSize: 18, color: "var(--B-accent)" }}>{r.pts}</td>
                    <td style={{ padding: "10px 6px", textAlign: "right" }}><FormChips form={r.form} dir="B" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: news ticker */}
        <div className="panel" style={{ flex: 1, padding: 18, minHeight: 0, display: "flex", flexDirection: "column" }}>
          <div className="display" style={{ fontSize: 22, marginBottom: 12 }}>FEED</div>
          <div className="col" style={{ flex: 1, overflow: "auto" }}>
            {NEWS.map((n, i) => (
              <div key={i} style={{ padding: "12px 0", borderBottom: i < NEWS.length - 1 ? "1px solid var(--B-line)" : "none" }}>
                <div className="row between aic" style={{ marginBottom: 4 }}>
                  <span className="display" style={{ fontSize: 14, letterSpacing: "0.18em", color: n.positive ? "var(--B-pos)" : "var(--B-accent)" }}>{n.tag}</span>
                  <span className="mono mute" style={{ fontSize: 9 }}>{n.time.toUpperCase()} AGO</span>
                </div>
                <div style={{ fontSize: 12, lineHeight: 1.45 }}>{n.text}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </FrameB>
  );
}

// ─── SQUAD ──────────────────────────────────────────────────────
function SquadB() {
  return (
    <FrameB active="squad">
      <div className="col gap-3" style={{ height: "100%", overflow: "hidden" }}>
        <div className="row between aic">
          <div className="row gap-0">
            {["PLAYERS","TACTICS","TRAINING","LINEUP"].map((t,i)=>(
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
          <div className="row gap-2"><button className="btn-ghost">FILTER</button><button className="btn-ghost">SORT · OVR</button></div>
        </div>

        <div className="row gap-3" style={{ flex: 1, minHeight: 0 }}>
          {/* Squad list */}
          <div className="panel" style={{ flex: 2, minHeight: 0, display: "flex", flexDirection: "column" }}>
            <div style={{ flex: 1, overflow: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead style={{ position: "sticky", top: 0, background: "var(--B-panel)", zIndex: 1 }}>
                  <tr className="label" style={{ fontSize: 9 }}>
                    {["#","NAME","POS","AGE","OVR","POT","FIT","FORM","KICK","MARK","DEC","WAGE"].map(h => (
                      <th key={h} style={{ textAlign: h === "NAME" ? "left" : "right", padding: "12px 10px", borderBottom: "2px solid var(--B-line-2)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {SQUAD.map((p, i) => (
                    <tr key={p.num} style={{ borderBottom: "1px solid var(--B-line)", background: i === 0 ? "rgba(255,90,31,0.06)" : "transparent" }}>
                      <td className="display mute" style={{ padding: "10px", textAlign: "right", fontSize: 16 }}>{String(p.num).padStart(2,"0")}</td>
                      <td style={{ padding: "10px" }}>
                        <div className="row aic gap-2">
                          <span style={{ fontWeight: 600, fontSize: 13 }}>{p.name}</span>
                          {p.status === "captain" && <span className="display" style={{ fontSize: 10, color: "var(--B-accent-2)", padding: "1px 5px", border: "1px solid var(--B-accent-2)", letterSpacing: "0.14em" }}>C</span>}
                          {p.status === "expiring" && <span className="display" style={{ fontSize: 10, color: "var(--B-neg)", letterSpacing: "0.14em" }}>EXP</span>}
                          {p.status === "rookie" && <span className="display" style={{ fontSize: 10, color: "var(--B-pos)", letterSpacing: "0.14em" }}>R</span>}
                        </div>
                      </td>
                      <td style={{ padding: "10px", textAlign: "right" }}><PosBadge pos={p.pos} dir="B" /></td>
                      <td className="mono dim" style={{ padding: "10px", textAlign: "right" }}>{p.age}</td>
                      <td className="display" style={{ padding: "10px", textAlign: "right", fontSize: 18, color: "var(--B-accent)" }}>{p.ovr}</td>
                      <td className="mono dim" style={{ padding: "10px", textAlign: "right" }}>{p.pot}</td>
                      <td style={{ padding: "10px", textAlign: "right" }}>
                        <span className="mono" style={{ color: p.fit >= 95 ? "var(--B-pos)" : p.fit >= 85 ? "var(--B-text)" : "var(--B-accent-2)" }}>{p.fit}</span>
                      </td>
                      <td style={{ padding: "10px", textAlign: "right" }}>
                        <Spark data={[p.form-8,p.form-3,p.form+2,p.form-1,p.form]} color={p.form>=80 ? "#B8E04C" : "#FF5A1F"} h={14} w={36} />
                      </td>
                      <td style={{ padding: "10px", textAlign: "right" }}><AttrBar value={p.kick} dir="B" /></td>
                      <td style={{ padding: "10px", textAlign: "right" }}><AttrBar value={p.mark} dir="B" /></td>
                      <td style={{ padding: "10px", textAlign: "right" }}><AttrBar value={p.dec} dir="B" /></td>
                      <td className="mono mute" style={{ padding: "10px", textAlign: "right", fontSize: 10 }}>${(p.wage/1000).toFixed(1)}K</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Detail card */}
          <div style={{ flex: 1, minWidth: 260, position: "relative" }}>
            <div className="panel" style={{ padding: 18, height: "100%", display: "flex", flexDirection: "column" }}>
              <div className="label">SELECTED · CAPTAIN</div>
              <div className="display" style={{ fontSize: 36, lineHeight: 0.9, marginTop: 6 }}>LACHIE</div>
              <div className="display" style={{ fontSize: 36, lineHeight: 0.9, color: "var(--B-accent)" }}>WALSH</div>
              <div className="row aic gap-2" style={{ marginTop: 8 }}>
                <PosBadge pos="C" dir="B" />
                <span className="mono mute" style={{ fontSize: 10 }}>#01 · 24YO · 2Y · $24.4K</span>
              </div>
              <div style={{ display: "flex", alignItems: "flex-end", marginTop: 18, gap: 14 }}>
                <Jersey kit="stripes" colors={CLUB.colors} size={92} num="1" />
                <div>
                  <div className="label">OVR / POT</div>
                  <div className="row aic gap-2">
                    <span className="display" style={{ fontSize: 56, lineHeight: 0.9, color: "var(--B-accent)" }}>86</span>
                    <span className="display mute" style={{ fontSize: 24 }}>/89</span>
                  </div>
                </div>
              </div>
              <div style={{ marginTop: 18, display: "grid", gridTemplateColumns: "1fr 1fr", rowGap: 8, columnGap: 14 }}>
                {[["KICK",88],["MARK",81],["HAND",90],["TACK",79],["SPEED",84],["END",88],["STR",76],["DEC",87]].map(([k,v]) => (
                  <div key={k}>
                    <div className="row between" style={{ marginBottom: 3 }}>
                      <span className="label" style={{ fontSize: 9 }}>{k}</span>
                      <span className="mono tnum" style={{ fontSize: 10 }}>{v}</span>
                    </div>
                    <div style={{ height: 5, background: "rgba(255,255,255,0.05)" }}>
                      <div style={{ width: `${v}%`, height: "100%", background: v >= 85 ? "var(--B-pos)" : v >= 75 ? "var(--B-accent)" : "var(--B-text-dim)" }} />
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ flex: 1 }} />
              <div className="row gap-2" style={{ marginTop: 14 }}>
                <button className="btn-primary" style={{ flex: 1 }}>OFFER EXTENSION</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </FrameB>
  );
}

// ─── MATCH DAY ──────────────────────────────────────────────────
function MatchB() {
  return (
    <FrameB active="match">
      <div className="col gap-3" style={{ height: "100%", overflow: "hidden" }}>
        {/* Big scoreboard */}
        <div className="panel" style={{ overflow: "hidden", padding: 0 }}>
          <div className="row between aic" style={{ padding: "8px 18px", borderBottom: "1px solid var(--B-line)" }}>
            <div className="row aic gap-2"><span className="live-dot" /><span className="display neg" style={{ fontSize: 14, letterSpacing: "0.2em" }}>LIVE · Q3 · 12:38</span></div>
            <div className="label">EFL · ROUND 8 · BALWYN PARK · ATT 2,140</div>
            <div className="label">FAVOURED: VRM −3</div>
          </div>
          <div className="row aic" style={{ padding: "24px 28px", gap: 24 }}>
            <div className="col aic" style={{ flex: 1 }}>
              <Jersey kit="stripes" colors={CLUB.colors} size={92} num="1" />
              <div className="display" style={{ fontSize: 24, marginTop: 8 }}>BALWYN</div>
              <div className="label" style={{ fontSize: 9 }}>HOME · STR 78</div>
            </div>
            <div className="col aic" style={{ flex: 1.5, textAlign: "center" }}>
              <div className="row aic" style={{ gap: 10 }}>
                <span className="display" style={{ fontSize: 124, lineHeight: 0.85, color: "var(--B-accent)" }}>43</span>
                <span className="display mute" style={{ fontSize: 80, lineHeight: 0.85 }}>·</span>
                <span className="display" style={{ fontSize: 124, lineHeight: 0.85 }}>34</span>
              </div>
              <div className="mono tnum" style={{ fontSize: 14, marginTop: 6, color: "var(--B-text-dim)", letterSpacing: "0.1em" }}>6.7 · 5.4</div>
            </div>
            <div className="col aic" style={{ flex: 1 }}>
              <Jersey kit="yoke" colors={["#000000","#CC0000","#FFFFFF"]} size={92} num="9" />
              <div className="display" style={{ fontSize: 24, marginTop: 8 }}>VERMONT</div>
              <div className="label" style={{ fontSize: 9 }}>AWAY · STR 81</div>
            </div>
          </div>
          {/* Quarter strip */}
          <div className="row" style={{ borderTop: "1px solid var(--B-line)" }}>
            {[["Q1","2.3 (15)","2.1 (13)"],["Q2","3.2 (20)","2.1 (14)"],["Q3","1.2 (8)","1.1 (7)", true],["Q4","—","—"]].map(([q,h,a,live]) => (
              <div key={q} style={{ flex: 1, padding: "10px 14px", borderRight: "1px solid var(--B-line)", background: live ? "rgba(255,90,31,0.08)" : "transparent" }}>
                <div className="display" style={{ fontSize: 14, color: live ? "var(--B-accent)" : "var(--B-text-mute)", letterSpacing: "0.16em" }}>{q}</div>
                <div className="row between" style={{ marginTop: 4 }}>
                  <span className="mono tnum" style={{ fontSize: 11, color: "var(--B-accent)" }}>{h}</span>
                  <span className="mono tnum" style={{ fontSize: 11 }}>{a}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="row gap-3" style={{ flex: 1, minHeight: 0 }}>
          {/* Feed */}
          <div className="panel" style={{ flex: 2, padding: 16, minHeight: 0, display: "flex", flexDirection: "column" }}>
            <div className="display" style={{ fontSize: 22, marginBottom: 10 }}>MATCH FEED</div>
            <div className="col" style={{ flex: 1, overflow: "auto" }}>
              {MATCH_FEED.slice().reverse().map((e, i) => {
                const isGoalH = e.type === "goal-h", isGoalA = e.type === "goal-a", isMoment = e.type === "moment";
                return (
                  <div key={i} className="row gap-3" style={{
                    padding: "10px 12px",
                    borderBottom: "1px solid var(--B-line)",
                    background: i === 0 ? "rgba(255,90,31,0.05)" : "transparent",
                  }}>
                    <span className="display" style={{ fontSize: 13, width: 56, color: "var(--B-text-mute)", letterSpacing: "0.14em" }}>Q{e.q} {e.t}</span>
                    {isGoalH && <span className="display" style={{ fontSize: 13, color: "var(--B-pos)", letterSpacing: "0.18em", width: 60 }}>● GOAL</span>}
                    {isGoalA && <span className="display" style={{ fontSize: 13, color: "var(--B-neg)", letterSpacing: "0.18em", width: 60 }}>○ GOAL</span>}
                    {isMoment && <span className="display" style={{ fontSize: 13, color: "var(--B-accent-2)", letterSpacing: "0.18em", width: 60 }}>~ MOM</span>}
                    {!isGoalH && !isGoalA && !isMoment && <span style={{ width: 60 }}/>}
                    <span style={{ flex: 1, fontSize: 12, color: e.type === "neutral" ? "var(--B-text-mute)" : "var(--B-text)" }}>{e.text}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Stats */}
          <div className="panel" style={{ flex: 1, padding: 16, minHeight: 0, display: "flex", flexDirection: "column" }}>
            <div className="display" style={{ fontSize: 22, marginBottom: 14 }}>HEAD TO HEAD</div>
            <div className="col gap-4">
              {[["INSIDE 50s",28,21],["CONTESTED",92,84],["TACKLES",41,36],["MARKS",67,58],["CLEARANCES",22,19],["EFFICIENCY",72,68]].map(([l,h,a]) => {
                const total = h+a, hp = (h/total)*100;
                return (
                  <div key={l}>
                    <div className="row between aic" style={{ marginBottom: 5 }}>
                      <span className="display" style={{ fontSize: 18, color: "var(--B-accent)" }}>{h}</span>
                      <span className="label" style={{ fontSize: 9 }}>{l}</span>
                      <span className="display dim" style={{ fontSize: 18 }}>{a}</span>
                    </div>
                    <div className="row" style={{ height: 4 }}>
                      <div style={{ width: `${hp}%`, background: "var(--B-accent)" }} />
                      <div style={{ width: `${100-hp}%`, background: "var(--B-text-mute)" }} />
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{ flex: 1 }} />
            <div className="panel-flat" style={{ padding: 12, marginTop: 14, background: "var(--B-bg-2)" }}>
              <div className="label">TACTIC</div>
              <div className="row between aic" style={{ marginTop: 4 }}>
                <span className="display" style={{ fontSize: 22 }}>BALANCED</span>
                <button className="btn-ghost" style={{ padding: "6px 12px", fontSize: 12 }}>CHANGE</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </FrameB>
  );
}

window.FDB = { FrameB, HubB, SquadB, MatchB };

})();
