import React, { useState } from "react";
import { ScrollView, View, Text, Pressable, StyleSheet } from "react-native";
import { C } from "../theme.js";
import { SectionCard } from "../components.js";

const TACTICS = ["Balanced", "Attacking", "Defensive", "Contested"];

export default function MatchDayScreen({ career, onAdvance }) {
  const { club, nextOpponent, lastResult } = career;
  const [tactic, setTactic] = useState("Balanced");
  const [c1] = club.colors || [C.sky];
  const oc1 = (nextOpponent?.colors || [C.mute])[0];

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ paddingBottom: 28 }}>
      <View style={[styles.stripe, { backgroundColor: c1 }]} />
      <View style={styles.header}>
        <Text style={styles.kicker}>MATCH DAY</Text>
        <Text style={styles.h1}>ROUND {(career.myRow.w ?? 0) + (career.myRow.l ?? 0) + (career.myRow.d ?? 0) + 1}</Text>
      </View>

      {/* Fixture */}
      {nextOpponent && (
        <SectionCard style={{ marginHorizontal: 14 }}>
          <View style={styles.fixture}>
            <View style={styles.team}>
              <View style={[styles.badge, { backgroundColor: c1 }]}><Text style={styles.badgeText}>{club.short}</Text></View>
              <Text style={styles.teamName}>{club.name}</Text>
            </View>
            <Text style={styles.vs}>vs</Text>
            <View style={styles.team}>
              <View style={[styles.badge, { backgroundColor: oc1 }]}><Text style={styles.badgeText}>{nextOpponent.short}</Text></View>
              <Text style={styles.teamName}>{nextOpponent.name}</Text>
            </View>
          </View>
        </SectionCard>
      )}

      {/* Tactic */}
      <SectionCard title="Game Plan" style={{ marginHorizontal: 14, marginTop: 12 }}>
        <View style={styles.tacticRow}>
          {TACTICS.map((t) => {
            const active = tactic === t;
            return (
              <Pressable key={t} onPress={() => setTactic(t)} style={[styles.tacticChip, active && styles.tacticActive]}>
                <Text style={[styles.tacticText, active && { color: "#fff" }]}>{t}</Text>
              </Pressable>
            );
          })}
        </View>
      </SectionCard>

      {/* Play */}
      <Pressable onPress={onAdvance} style={({ pressed }) => [styles.play, pressed && { opacity: 0.85 }]}>
        <Text style={styles.playText}>▶  PLAY MATCH</Text>
      </Pressable>

      {/* Last result */}
      {lastResult && (
        <SectionCard title="Last Result" style={{ marginHorizontal: 14, marginTop: 12 }}>
          <View style={[styles.resultBanner, { backgroundColor: lastResult.won ? "rgba(52,209,126,0.14)" : lastResult.draw ? "rgba(150,172,205,0.14)" : "rgba(255,59,78,0.14)" }]}>
            <Text style={[styles.resultTag, { color: lastResult.won ? C.pos : lastResult.draw ? C.mute : C.red }]}>
              {lastResult.won ? "WIN" : lastResult.draw ? "DRAW" : "LOSS"}
            </Text>
            <Text style={styles.resultScore}>
              <Text style={{ color: lastResult.won ? C.pos : C.text }}>{lastResult.myTotal}</Text>
              <Text style={{ color: C.mute }}>  –  </Text>
              <Text style={{ color: C.dim }}>{lastResult.oppTotal}</Text>
            </Text>
            <Text style={styles.resultVs}>{club.short} v {lastResult.opp?.short}</Text>
          </View>
          <View style={styles.qRow}>
            {lastResult.quarters.map((q, i) => (
              <View key={i} style={styles.qCell}>
                <Text style={styles.qLabel}>Q{i + 1}</Text>
                <Text style={styles.qScore}>{q.myTotal}-{q.oppTotal}</Text>
              </View>
            ))}
          </View>
        </SectionCard>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  stripe: { height: 4, width: "100%" },
  header: { paddingHorizontal: 18, paddingTop: 12, paddingBottom: 10 },
  kicker: { color: C.sky, fontSize: 11, fontWeight: "800", letterSpacing: 2 },
  h1: { color: C.text, fontSize: 26, fontWeight: "900", marginTop: 3, letterSpacing: -0.5 },
  fixture: { flexDirection: "row", alignItems: "center", justifyContent: "space-around" },
  team: { alignItems: "center", gap: 8, flex: 1 },
  badge: { width: 52, height: 52, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  badgeText: { color: "#fff", fontWeight: "900", fontSize: 16 },
  teamName: { color: C.dim, fontSize: 12, fontWeight: "700", textAlign: "center" },
  vs: { color: C.mute, fontSize: 18, fontWeight: "900", marginHorizontal: 6 },
  tacticRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tacticChip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10, borderWidth: 1, borderColor: C.line, backgroundColor: C.panel2 },
  tacticActive: { backgroundColor: C.sky, borderColor: C.sky },
  tacticText: { color: C.dim, fontSize: 13, fontWeight: "700" },
  play: {
    marginHorizontal: 14, marginTop: 14, backgroundColor: C.sky, borderRadius: 14,
    paddingVertical: 16, alignItems: "center",
  },
  playText: { color: "#fff", fontSize: 16, fontWeight: "900", letterSpacing: 1 },
  resultBanner: { borderRadius: 12, padding: 14, alignItems: "center" },
  resultTag: { fontSize: 12, fontWeight: "900", letterSpacing: 2 },
  resultScore: { fontSize: 34, fontWeight: "900", marginTop: 4 },
  resultVs: { color: C.mute, fontSize: 12, marginTop: 2 },
  qRow: { flexDirection: "row", marginTop: 12 },
  qCell: { flex: 1, alignItems: "center" },
  qLabel: { color: C.mute, fontSize: 10, fontWeight: "800" },
  qScore: { color: C.dim, fontSize: 12, marginTop: 3, fontVariant: ["tabular-nums"] },
});
