import React from "react";
import { ScrollView, View, Text, StyleSheet } from "react-native";
import { C } from "../theme.js";
import { fmtK } from "../engine.js";
import { KpiTile, SectionCard } from "../components.js";

export default function ClubScreen({ career }) {
  const { club, tier, cash, wages, board, squadRating } = career;
  const [c1] = club.colors || [C.sky];
  const sponsors = Math.round(wages * 0.55);
  const net = sponsors - wages;

  const lines = [
    { label: "Cash", value: fmtK(cash), color: C.pos },
    { label: "Sponsor income / yr", value: fmtK(sponsors), color: C.sky },
    { label: "Player wages / yr", value: `-${fmtK(wages)}`, color: C.red },
    { label: "Net (wages vs sponsor)", value: `${net >= 0 ? "+" : "-"}${fmtK(Math.abs(net))}`, color: net >= 0 ? C.pos : C.red },
  ];

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ paddingBottom: 28 }}>
      <View style={[styles.stripe, { backgroundColor: c1 }]} />
      <View style={styles.header}>
        <Text style={styles.kicker}>CLUB · {club.short}</Text>
        <Text style={styles.h1}>{club.name.toUpperCase()}</Text>
        <Text style={styles.sub}>Tier {tier} · squad rating {squadRating}</Text>
      </View>

      <View style={styles.kpiRow}>
        <KpiTile label="CASH" value={fmtK(cash)} sub="available funds" accent={C.pos} />
        <KpiTile label="BOARD" value={`${board.confidence}%`} sub="confidence" accent={board.confidence >= 50 ? C.sky : C.red} />
      </View>

      <SectionCard title="Finances" style={{ marginHorizontal: 14, marginTop: 12 }}>
        {lines.map((l, i) => (
          <View key={l.label} style={[styles.finRow, i === lines.length - 1 && { borderBottomWidth: 0 }]}>
            <Text style={styles.finLabel}>{l.label}</Text>
            <Text style={[styles.finVal, { color: l.color }]}>{l.value}</Text>
          </View>
        ))}
      </SectionCard>

      <SectionCard title="Board Objective" style={{ marginHorizontal: 14, marginTop: 12 }}>
        <Text style={styles.objective}>{board.objective}</Text>
        <View style={styles.barTrack}>
          <View style={[styles.barFill, { width: `${board.confidence}%`, backgroundColor: board.confidence >= 50 ? C.sky : C.red }]} />
        </View>
        <Text style={styles.barCap}>{board.confidence}% board confidence</Text>
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
  kpiRow: { flexDirection: "row", gap: 10, paddingHorizontal: 14 },
  finRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: C.line,
  },
  finLabel: { color: C.dim, fontSize: 14 },
  finVal: { fontSize: 15, fontWeight: "800", fontVariant: ["tabular-nums"] },
  objective: { color: C.text, fontSize: 15, fontWeight: "700" },
  barTrack: { height: 8, backgroundColor: C.bg2, borderRadius: 6, marginTop: 12, overflow: "hidden" },
  barFill: { height: "100%", borderRadius: 6 },
  barCap: { color: C.mute, fontSize: 11, marginTop: 6 },
});
