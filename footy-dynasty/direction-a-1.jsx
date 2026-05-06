(function(){
// Direction A — Broadcast Cinematic
// Deep navy, neon cyan, mono labels, scoreboard chrome, telemetry bars.

const { Jersey, AttrBar, NumberBlock, Spark, FormChips, PosBadge, Crest, Tabs, SectionHead } = window.FDP;
const { CLUB, LADDER, SQUAD, FIXTURES, NEWS, TACTICS, FACILITIES, SPONSORS, STAFF, DRAFT, TRADES, FINANCE, MATCH_FEED } = window.FD;

const A_NAV = [
  { key: "hub",     label: "Hub",         desc: "Overview" },
  { key: "squad",   label: "Squad",       desc: "Players & tactics" },
  { key: "match",   label: "Match Day",   desc: "Live sim" },
  { key: "club",    label: "Club",        desc: "Finance & ops" },
  { key: "recruit", label: "Recruit",     desc: "Trade & draft" },
  { key: "compete", label: "Competition", desc: "Ladder & fixtures" },
];

// ── Frame: sidebar + topbar wrapping any screen ─────────────────
function FrameA({ active, children }) {
  return (
    <div className="dirA" style={{ display: "flex", width: "100%", height: "100%" }}>
      {/* Sidebar */}
      <aside style={{
        width: 220, flexShrink: 0,
        background: "linear-gradient(180deg, #07101F, #050A14)",
        borderRight: "1px solid var(--A-line)",
        display: "flex", flexDirection: "column",
      }}>
        <div style={{ padding: "20px 18px", borderBottom: "1px solid var(--A-line)" }}>
          <div className="row aic gap-2">
            <div style={{
              width: 28, height: 28,
              background: "var(--A-accent)",
              clipPath: "polygon(0 0, 100% 0, 100% 70%, 70% 100%, 0 100%)",
            }} />
            <div>
              <div className="display" style={{ fontSize: 20, lineHeight: 1, letterSpacing: "0.06em" }}>DYNASTY</div>
              <div className="label" style={{ fontSize: 8, marginTop: 2 }}>FOOTY MGR · S{CLUB.season}</div>
            </div>
          </div>
        </div>
        {/* Club identity */}
        <div style={{ padding: 14, borderBottom: "1px solid var(--A-line)" }}>
          <div className="panel-flat" style={{ padding: 12 }}>
            <div className="row aic gap-3">
              <Crest short={CLUB.short} colors={CLUB.colors} size={36} dir="A" />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--A-text)" }}>{CLUB.name}</div>
                <div className="label" style={{ marginTop: 2 }}>{CLUB.leagueShort} · TIER {CLUB.tier}</div>
              </div>
            </div>
            <div className="row gap-2" style={{ marginTop: 10 }}>
              {[["RD", `${CLUB.week}/${CLUB.totalRounds}`], ["POS", "#2"], ["W-L", "6-2"]].map(([l, v]) => (
                <div key={l} style={{ flex: 1, textAlign: "center", padding: "6px 0", background: "rgba(0,224,255,0.05)", borderRadius: 4 }}>
                  <div className="label" style={{ fontSize: 8 }}>{l}</div>
                  <div className="display accent" style={{ fontSize: 16, lineHeight: 1, marginTop: 2 }}>{v}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
        {/* Nav */}
        <nav style={{ padding: 8, flex: 1 }}>
          {A_NAV.map(n => {
            const on = n.key === active;
            return (
              <div key={n.key} style={{
                padding: "10px 12px",
                margin: "2px 0",
                borderLeft: on ? "2px solid var(--A-accent)" : "2px solid transparent",
                background: on ? "rgba(0,224,255,0.06)" : "transparent",
                cursor: "pointer",
              }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: on ? "var(--A-accent)" : "var(--A-text)" }}>{n.label}</div>
                <div className="label" style={{ fontSize: 8, marginTop: 1 }}>{n.desc}</div>
              </div>
            );
          })}
        </nav>
        <div style={{ padding: 14, borderTop: "1px solid var(--A-line)" }}>
          <div className="label" style={{ fontSize: 8 }}>v2.0 · {CLUB.ground}</div>
        </div>
      </aside>

      {/* Right column */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, position: "relative", zIndex: 1 }}>
        {/* TopBar */}
        <header style={{
          height: 56,
          padding: "0 24px",
          borderBottom: "1px solid var(--A-line)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          background: "rgba(7, 16, 31, 0.7)",
          backdropFilter: "blur(8px)",
        }}>
          <div className="row aic gap-6">
            {[
              ["CASH",     "$142.8K",  "var(--A-pos)"],
              ["TRANSFER", "$38.0K",   "var(--A-accent)"],
              ["BOARD",    "78",       "var(--A-accent-2)", true],
              ["FANS",     "71",       "#A78BFA", true],
            ].map(([l, v, c, bar]) => (
              <div key={l}>
                <div className="label" style={{ fontSize: 8 }}>{l}</div>
                {bar
                  ? <div className="row aic gap-2" style={{ marginTop: 2 }}>
                      <div style={{ width: 50, height: 4, background: "rgba(255,255,255,0.06)" }}>
                        <div style={{ width: `${v}%`, height: "100%", background: c }} />
                      </div>
                      <span className="display" style={{ fontSize: 14, color: c }}>{v}</span>
                    </div>
                  : <div className="display" style={{ fontSize: 16, color: c }}>{v}</div>}
              </div>
            ))}
          </div>
          <div className="row aic gap-3">
            <div style={{ textAlign: "right" }}>
              <div className="label" style={{ fontSize: 8 }}>NEXT · ROUND 8</div>
              <div style={{ fontSize: 12, fontWeight: 600 }}>vs Vermont FC</div>
            </div>
            <Crest short="VRM" colors={["#000000", "#CC0000", "#FFFFFF"]} size={34} dir="A" />
            <button className="btn-primary">▶ ADVANCE</button>
          </div>
        </header>

        <div style={{ flex: 1, overflow: "hidden", padding: 20 }}>
          {children}
        </div>
      </div>
    </div>
  );
}

// ─── HUB ────────────────────────────────────────────────────────
function HubA() {
  const me = LADDER.find(r => r.me);
  return (
    <FrameA active="hub">
      <div className="col gap-4" style={{ height: "100%", overflow: "hidden" }}>
        {/* Hero */}
        <div className="panel" style={{
          padding: 22, position: "relative", overflow: "hidden",
          background: "linear-gradient(135deg, rgba(27,59,122,0.4), rgba(0,224,255,0.04) 60%, var(--A-panel))",
        }}>
          <div style={{ position: "absolute", right: -8, top: -8, opacity: 0.18 }}>
            <Jersey kit="stripes" colors={CLUB.colors} size={130} num="1" />
          </div>
          <div className="label">{CLUB.league} · SEASON {CLUB.season} · ROUND {CLUB.week}</div>
          <div className="display" style={{ fontSize: 44, lineHeight: 1, marginTop: 6, color: "var(--A-text)" }}>BALWYN FC</div>
          <div className="row gap-2 aic" style={{ marginTop: 12 }}>
            <span className="pill">▲ #{me.rank} ON LADDER</span>
            <span className="pill" style={{ background: "rgba(46,230,166,0.08)", color: "var(--A-pos)", borderColor: "rgba(46,230,166,0.25)" }}>{me.w}W · {me.l}L</span>
            <span className="pill" style={{ background: "rgba(255,179,71,0.08)", color: "var(--A-accent-2)", borderColor: "rgba(255,179,71,0.25)" }}>4 GAMES TO FINALS</span>
          </div>
          <div style={{ position: "absolute", right: 24, top: 22, textAlign: "right" }}>
            <div className="label">PREMIERSHIP PTS</div>
            <div className="display accent" style={{ fontSize: 64, lineHeight: 1 }}>{me.pts}</div>
          </div>
        </div>

        {/* Stat row */}
        <div className="row gap-3">
          {[
            ["SQUAD AVG", "78", "12 in 22, 3 expiring"],
            ["CASH", "$142.8K", "+$53.8K this Q"],
            ["MEMBERS", "2,412", "+186 this round"],
            ["FORM (5)", "WWLWW", "4W out of last 5"],
          ].map(([l, v, s], i) => (
            <div key={i} className="panel-flat" style={{ flex: 1, padding: 14 }}>
              <div className="label">{l}</div>
              <div className="display" style={{ fontSize: 28, lineHeight: 1, marginTop: 6, color: i === 1 ? "var(--A-pos)" : i === 0 ? "var(--A-accent)" : "var(--A-text)" }}>{v}</div>
              <div className="mono mute" style={{ fontSize: 10, marginTop: 4 }}>{s}</div>
            </div>
          ))}
        </div>

        <div className="row gap-3" style={{ flex: 1, minHeight: 0 }}>
          {/* Ladder */}
          <div className="panel" style={{ flex: 1.6, padding: 16, display: "flex", flexDirection: "column", minHeight: 0 }}>
            <div className="row between aic" style={{ marginBottom: 10 }}>
              <div className="display" style={{ fontSize: 16 }}>EFL LADDER</div>
              <div className="label">TOP 5 · FULL TABLE →</div>
            </div>
            <div style={{ flex: 1, overflow: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                <thead>
                  <tr className="label" style={{ fontSize: 8 }}>
                    {["#", "CLUB", "P", "W", "L", "PCT", "PTS", "FORM"].map(h => (
                      <th key={h} style={{ textAlign: h === "CLUB" ? "left" : "right", padding: "6px 8px", borderBottom: "1px solid var(--A-line)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {LADDER.slice(0, 8).map(r => (
                    <tr key={r.short} style={{ background: r.me ? "rgba(0,224,255,0.05)" : "transparent" }}>
                      <td className="mono" style={{ padding: "8px", color: r.rank <= 4 ? "var(--A-accent)" : "var(--A-text-mute)", fontWeight: 700 }}>{r.rank}</td>
                      <td style={{ padding: "8px", display: "flex", alignItems: "center", gap: 8 }}>
                        <Crest short={r.short} colors={r.me ? CLUB.colors : ["#1a1a1a", "#444", "#fff"]} size={20} dir="A" />
                        <span style={{ fontWeight: r.me ? 700 : 500, color: r.me ? "var(--A-accent)" : "var(--A-text)" }}>{r.club}</span>
                      </td>
                      <td className="mono tnum" style={{ padding: "8px", textAlign: "right" }}>{r.w + r.l + r.d}</td>
                      <td className="mono tnum pos" style={{ padding: "8px", textAlign: "right" }}>{r.w}</td>
                      <td className="mono tnum neg" style={{ padding: "8px", textAlign: "right" }}>{r.l}</td>
                      <td className="mono tnum dim" style={{ padding: "8px", textAlign: "right" }}>{r.pct.toFixed(1)}</td>
                      <td className="mono tnum" style={{ padding: "8px", textAlign: "right", color: "var(--A-accent)", fontWeight: 700 }}>{r.pts}</td>
                      <td style={{ padding: "8px", textAlign: "right" }}><FormChips form={r.form} dir="A" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right column: news + next match */}
          <div className="col gap-3" style={{ flex: 1, minHeight: 0 }}>
            <div className="panel" style={{ padding: 16 }}>
              <div className="display" style={{ fontSize: 16, marginBottom: 10 }}>NEXT FIXTURE</div>
              <div className="row aic between">
                <div className="col aic">
                  <Jersey kit="stripes" colors={CLUB.colors} size={56} num="1" />
                  <div className="display" style={{ fontSize: 16, marginTop: 4 }}>BAL</div>
                  <div className="label" style={{ fontSize: 8 }}>STR 78</div>
                </div>
                <div className="col aic" style={{ textAlign: "center" }}>
                  <div className="display accent" style={{ fontSize: 22 }}>VS</div>
                  <div className="label" style={{ fontSize: 8, marginTop: 4 }}>RD 8 · HOME</div>
                  <div className="mono mute" style={{ fontSize: 10, marginTop: 4 }}>SAT 14:10</div>
                </div>
                <div className="col aic">
                  <Jersey kit="yoke" colors={["#000000", "#CC0000", "#FFFFFF"]} size={56} num="9" />
                  <div className="display" style={{ fontSize: 16, marginTop: 4 }}>VRM</div>
                  <div className="label" style={{ fontSize: 8 }}>STR 81</div>
                </div>
              </div>
              <div style={{ marginTop: 12, padding: "8px 10px", background: "rgba(255,87,119,0.06)", border: "1px solid rgba(255,87,119,0.2)", borderRadius: 4 }}>
                <span className="label" style={{ color: "var(--A-neg)" }}>FAVOURED</span>
                <span className="mono" style={{ marginLeft: 8, fontSize: 10 }}>VRM by 3 (rating diff −3)</span>
              </div>
            </div>

            <div className="panel" style={{ padding: 16, flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
              <div className="display" style={{ fontSize: 16, marginBottom: 10 }}>FEED</div>
              <div className="col gap-2" style={{ flex: 1, overflow: "auto" }}>
                {NEWS.map((n, i) => (
                  <div key={i} className="row gap-3" style={{ padding: "8px 0", borderBottom: i < NEWS.length - 1 ? "1px solid var(--A-line)" : "none" }}>
                    <span className="mono" style={{
                      fontSize: 9, padding: "2px 6px", height: 16,
                      background: n.positive ? "rgba(46,230,166,0.12)" : "rgba(0,224,255,0.08)",
                      color: n.positive ? "var(--A-pos)" : "var(--A-accent)",
                      flexShrink: 0, fontWeight: 700, letterSpacing: "0.1em",
                    }}>{n.tag}</span>
                    <div style={{ fontSize: 11, lineHeight: 1.45, flex: 1 }}>{n.text}</div>
                    <span className="mono mute" style={{ fontSize: 9, flexShrink: 0 }}>{n.time}</span>
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

// ─── SQUAD ──────────────────────────────────────────────────────
function SquadA() {
  return (
    <FrameA active="squad">
      <div className="col gap-3" style={{ height: "100%", overflow: "hidden" }}>
        <Tabs tabs={["PLAYERS", "TACTICS", "TRAINING", "LINEUP"]} active="PLAYERS" dir="A" />

        <div className="row gap-3" style={{ flex: 1, minHeight: 0 }}>
          {/* Player table */}
          <div className="panel" style={{ flex: 2, display: "flex", flexDirection: "column", minHeight: 0 }}>
            <div className="row between aic" style={{ padding: "12px 16px", borderBottom: "1px solid var(--A-line)" }}>
              <div className="display" style={{ fontSize: 16 }}>SQUAD · 12 OF 32</div>
              <div className="row gap-2">
                <button className="btn-ghost">FILTER</button>
                <button className="btn-ghost">SORT · OVR</button>
              </div>
            </div>
            <div style={{ flex: 1, overflow: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                <thead style={{ position: "sticky", top: 0, background: "var(--A-panel)", zIndex: 1 }}>
                  <tr className="label" style={{ fontSize: 8 }}>
                    {["#", "NAME", "POS", "AGE", "OVR", "POT", "FIT", "FORM", "KICK", "MARK", "DEC", "STATUS"].map(h => (
                      <th key={h} style={{ textAlign: h === "NAME" ? "left" : "right", padding: "8px 10px", borderBottom: "1px solid var(--A-line)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {SQUAD.map(p => (
                    <tr key={p.num} style={{ borderBottom: "1px solid var(--A-line)" }}>
                      <td className="mono mute" style={{ padding: "8px 10px", textAlign: "right" }}>{String(p.num).padStart(2, "0")}</td>
                      <td style={{ padding: "8px 10px" }}>
                        <div style={{ fontWeight: 600, fontSize: 12 }}>{p.name}</div>
                        {p.status && <div className="label" style={{ fontSize: 8, marginTop: 1, color: p.status === "expiring" ? "var(--A-neg)" : p.status === "captain" ? "var(--A-accent-2)" : "var(--A-pos)" }}>· {p.status.toUpperCase()}</div>}
                      </td>
                      <td style={{ padding: "8px 10px", textAlign: "right" }}><PosBadge pos={p.pos} dir="A" /></td>
                      <td className="mono" style={{ padding: "8px 10px", textAlign: "right", color: "var(--A-text-dim)" }}>{p.age}</td>
                      <td className="mono" style={{ padding: "8px 10px", textAlign: "right", color: "var(--A-accent)", fontWeight: 700, fontSize: 13 }}>{p.ovr}</td>
                      <td className="mono dim" style={{ padding: "8px 10px", textAlign: "right" }}>{p.pot}</td>
                      <td style={{ padding: "8px 10px", textAlign: "right" }}>
                        <span className="mono" style={{ color: p.fit >= 95 ? "var(--A-pos)" : p.fit >= 85 ? "var(--A-text)" : "var(--A-accent-2)" }}>{p.fit}</span>
                      </td>
                      <td style={{ padding: "8px 10px", textAlign: "right" }}>
                        <Spark data={[p.form - 8, p.form - 3, p.form + 2, p.form - 1, p.form]} color={p.form >= 80 ? "#2EE6A6" : p.form >= 70 ? "#00E0FF" : "#FF5577"} h={14} w={40} />
                      </td>
                      <td style={{ padding: "8px 10px", textAlign: "right" }}><AttrBar value={p.kick} dir="A" /></td>
                      <td style={{ padding: "8px 10px", textAlign: "right" }}><AttrBar value={p.mark} dir="A" /></td>
                      <td style={{ padding: "8px 10px", textAlign: "right" }}><AttrBar value={p.dec} dir="A" /></td>
                      <td className="mono mute" style={{ padding: "8px 10px", textAlign: "right", fontSize: 10 }}>${(p.wage/1000).toFixed(1)}K · {p.contract}y</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Player detail */}
          <div className="panel" style={{ flex: 1, padding: 16, display: "flex", flexDirection: "column", minWidth: 240 }}>
            <div className="label">SELECTED · CAPTAIN</div>
            <div className="display" style={{ fontSize: 22, marginTop: 4 }}>LACHIE WALSH</div>
            <div className="row gap-3 aic" style={{ marginTop: 4 }}>
              <PosBadge pos="C" dir="A" />
              <span className="mono mute" style={{ fontSize: 10 }}>24 yo · 2y left · $24.4K</span>
            </div>
            <div className="row aic gap-3" style={{ marginTop: 14 }}>
              <Jersey kit="stripes" colors={CLUB.colors} size={70} num="1" />
              <div className="col gap-1">
                <div className="label" style={{ fontSize: 8 }}>OVERALL</div>
                <div className="display accent" style={{ fontSize: 44, lineHeight: 0.9 }}>86</div>
                <div className="mono mute" style={{ fontSize: 9 }}>POT 89 · TIER 3 elite</div>
              </div>
            </div>
            <div className="col gap-2" style={{ marginTop: 18 }}>
              {[["KICK", 88], ["MARK", 81], ["HAND", 90], ["TACK", 79], ["SPEED", 84], ["END", 88], ["STR", 76], ["DEC", 87]].map(([k, v]) => (
                <div key={k} className="row aic between">
                  <span className="label" style={{ fontSize: 9 }}>{k}</span>
                  <AttrBar value={v} dir="A" size="md" />
                </div>
              ))}
            </div>
            <div style={{ flex: 1 }} />
            <div className="row gap-2" style={{ marginTop: 12 }}>
              <button className="btn-ghost" style={{ flex: 1 }}>OFFER EXT.</button>
              <button className="btn-ghost" style={{ flex: 1 }}>LIST</button>
            </div>
          </div>
        </div>
      </div>
    </FrameA>
  );
}

window.FDA = { FrameA, HubA, SquadA, A_NAV };

})();
