import React from "react";
import { ScrollView, View, Text, StyleSheet } from "react-native";
import { C } from "../theme.js";
import { fmtK } from "../engine.js";
import { KpiTile, SectionCard } from "../components.js";

export default function HubScreen({ career, onOpenSquad }) {
  const { club, season, tier, squadRating, wages, cash, ladder, myRow, nextOpponent, board } = career;
  const [c1] = club.colors || [C.sky];
  const top8 = ladder.slice(0, 8);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ paddingBottom: 28 }}>
      <View style={[styles.stripe, { backgroundColor: c1 }]} />
      <View style={styles.header}>
        <Text style={styles.kicker}>HUB · SEASON {season}</Text>
        <Text style={styles.h1}>{club.name.toUpperCase()}</Text>
        <Text style={styles.sub}>Tier {tier} · {board.objective}</Text>
      </View>

      {/* Summary strip */}
      <View style={styles.summary}>
        <View style={styles.summaryCell}>
          <Text style={styles.summaryNum}>#{myRow.pos ?? "—"}</Text>
          <Text style={styles.summaryLabel}>LADDER</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryCell}>
          <Text style={styles.summaryNum}>{myRow.w ?? 0}<Text style={styles.summaryUnit}>W </Text>{myRow.l ?? 0}<Text style={styles.summaryUnit}>L</Text></Text>
          <Text style={styles.summaryLabel}>RECORD</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryCell}>
          <Text style={styles.summaryNum}>{board.confidence}<Text style={styles.summaryUnit}>%</Text></Text>
          <Text style={styles.summaryLabel}>BOARD</Text>
        </View>
      </View>

      {/* KPI tiles */}
      <View style={styles.kpiRow}>
        <KpiTile label="SQUAD RATING" value={String(squadRating)} sub={`${career.squad.length} players`} accent={C.sky} onPress={onOpenSquad} />
        <KpiTile label="CASH" value={fmtK(cash)} sub={`Wages ${fmtK(wages)}/yr`} accent={C.pos} />
      </View>

      {/* Next match */}
      {nextOpponent && (
        <SectionCard title="Next Match" style={{ marginHorizontal: 14, marginTop: 12 }}>
          <View style={styles.matchRow}>
            <View style={styles.matchTeam}>
              <View style={[styles.badge, { backgroundColor: c1 }]}><Text style={styles.badgeText}>{club.short}</Text></View>
              <Text style={styles.matchName}>{club.short}</Text>
            </View>
            <Text style={styles.vs}>vs</Text>
            <View style={styles.matchTeam}>
              <View style={[styles.badge, { backgroundColor: (nextOpponent.colors || [C.mute])[0] }]}><Text style={styles.badgeText}>{nextOpponent.short}</Text></View>
              <Text style={styles.matchName}>{nextOpponent.short}</Text>
            </View>
          </View>
          <Text style={styles.matchSub}>{nextOpponent.name} · Round {(myRow.w ?? 0) + (myRow.l ?? 0) + 1}</Text>
        </SectionCard>
      )}

      {/* Ladder */}
      <SectionCard title="Ladder" style={{ marginHorizontal: 14, marginTop: 12 }}>
        <View style={styles.ladderHead}>
          <Text style={[styles.lh, { width: 22 }]}>#</Text>
          <Text style={[styles.lh, { flex: 1, marginLeft: 8 }]}>CLUB</Text>
          <Text style={[styles.lh, { width: 44, textAlign: "right" }]}>W-L</Text>
          <Text style={[styles.lh, { width: 42, textAlign: "right" }]}>PTS</Text>
        </View>
        {top8.map((r) => {
          const me = r.id === club.id;
          return (
            <View key={r.id} style={[styles.ladderRow, me && styles.ladderRowMe]}>
              <Text style={[styles.lpos, me && { color: C.sky }]}>{r.pos}</Text>
              <View style={[styles.dot, { backgroundColor: (r.colors || [C.mute])[0], marginLeft: 8 }]} />
              <Text style={[styles.lname, me && { color: C.sky, fontWeight: "900" }]} numberOfLines={1}>{r.name}</Text>
              <Text style={styles.lwl}>{r.w}-{r.l}</Text>
              <Text style={styles.lpts}>{r.pts}</Text>
            </View>
          );
        })}
      </SectionCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  stripe: { height: 4, width: "100%" },
  header: { paddingHorizontal: 18, paddingTop: 12, paddingBottom: 10 },
  kicker: { color: C.sky, fontSize: 11, fontWeight: "800", letterSpacing: 2 },
  h1: { color: C.text, fontSize: 26, fontWeight: "900", marginTop: 3, letterSpacing: -0.5 },
  sub: { color: C.mute, fontSize: 12, marginTop: 5 },
  summary: {
    flexDirection: "row", marginHorizontal: 14, backgroundColor: C.panel, borderRadius: 14,
    borderWidth: 1, borderColor: C.line, paddingVertical: 12,
  },
  summaryCell: { flex: 1, alignItems: "center" },
  summaryDivider: { width: 1, backgroundColor: C.line },
  summaryNum: { color: C.sky, fontSize: 22, fontWeight: "900" },
  summaryUnit: { color: C.mute, fontSize: 12, fontWeight: "700" },
  summaryLabel: { color: C.mute, fontSize: 9, fontWeight: "800", letterSpacing: 1, marginTop: 2 },
  kpiRow: { flexDirection: "row", gap: 10, paddingHorizontal: 14, marginTop: 12 },
  matchRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 18 },
  matchTeam: { alignItems: "center", gap: 6 },
  badge: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  badgeText: { color: "#fff", fontWeight: "900", fontSize: 14 },
  matchName: { color: C.dim, fontSize: 12, fontWeight: "700" },
  vs: { color: C.mute, fontSize: 16, fontWeight: "900" },
  matchSub: { color: C.mute, fontSize: 11, textAlign: "center", marginTop: 10 },
  ladderHead: { flexDirection: "row", alignItems: "center", paddingBottom: 6, borderBottomWidth: 1, borderBottomColor: C.line },
  lh: { color: C.mute, fontSize: 9, fontWeight: "800", letterSpacing: 1 },
  ladderRow: { flexDirection: "row", alignItems: "center", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: C.line },
  ladderRowMe: { backgroundColor: "rgba(0,145,218,0.08)", borderRadius: 6 },
  lpos: { width: 22, color: C.dim, fontSize: 13, fontWeight: "800", textAlign: "center" },
  dot: { width: 10, height: 10, borderRadius: 5 },
  lname: { flex: 1, marginLeft: 8, color: C.text, fontSize: 13, fontWeight: "600" },
  lwl: { width: 44, color: C.dim, fontSize: 12, textAlign: "right", fontVariant: ["tabular-nums"] },
  lpts: { width: 42, color: C.text, fontSize: 13, fontWeight: "800", textAlign: "right", fontVariant: ["tabular-nums"] },
});
