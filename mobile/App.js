// Footy Dynasty — mobile (Expo / React Native).
// Starter screen proving the shared game engine (footy-dynasty/src/lib) runs
// natively: it generates a real, deterministic squad on-device via the same
// playerGen used by the web app. Native screens are built up from here.
import React, { useMemo } from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView, ScrollView, View, Text, StyleSheet } from "react-native";

// —— Shared engine (synced from ../footy-dynasty/src by scripts/sync-engine.mjs) ——
import { generateSquad, POSITION_NAMES } from "./engine/lib/playerGen.js";
import { PYRAMID } from "./engine/data/pyramid.js";
import { fmtK } from "./engine/lib/format.js";

// Official-AFL palette (mirrors the web tokens).
const C = {
  bg: "#001325",
  bg2: "#001E3C",
  panel: "#0A2742",
  line: "rgba(143,166,188,0.18)",
  text: "#F4F8FD",
  dim: "#B7C9DD",
  mute: "#8FA6BC",
  sky: "#0091DA",
  red: "#E4002B",
};

const CLUB_ID = "car"; // Carlton — any AFL club id from the shared pyramid data

function clubFromPyramid(id) {
  for (const key of Object.keys(PYRAMID)) {
    const league = PYRAMID[key];
    const found = (league.clubs || []).find((c) => c.id === id);
    if (found) return found;
  }
  return { name: "Footy Dynasty", short: "FD", colors: [C.sky, C.bg2, "#fff"] };
}

function stars(overall) {
  const n = overall >= 88 ? 5 : overall >= 78 ? 4 : overall >= 66 ? 3 : overall >= 54 ? 2 : 1;
  return "★★★★★".slice(0, n) + "☆☆☆☆☆".slice(0, 5 - n);
}

export default function App() {
  const club = useMemo(() => clubFromPyramid(CLUB_ID), []);
  // Deterministic squad from the shared engine — identical logic to the web app.
  const squad = useMemo(
    () => generateSquad(CLUB_ID, 1, 24, 2026).slice().sort((a, b) => b.overall - a.overall),
    [],
  );
  const wages = squad.reduce((a, p) => a + (p.wage || 0), 0);
  const [c1] = club.colors || [C.sky];

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="light" />
      <View style={[styles.stripe, { backgroundColor: c1 }]} />
      <View style={styles.header}>
        <Text style={styles.kicker}>FOOTY DYNASTY · MOBILE</Text>
        <Text style={styles.h1}>{club.name.toUpperCase()}</Text>
        <Text style={styles.sub}>
          {squad.length} players · wages {fmtK(wages)}/yr · generated on-device by the shared engine
        </Text>
      </View>

      <View style={styles.legend}>
        <Text style={styles.legendText}>#</Text>
        <Text style={[styles.legendText, { flex: 1, marginLeft: 10 }]}>PLAYER</Text>
        <Text style={styles.legendText}>POS</Text>
        <Text style={[styles.legendText, { width: 84, textAlign: "right" }]}>RATING</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 28 }}>
        {squad.map((p, i) => (
          <View key={p.id ?? i} style={styles.row}>
            <Text style={[styles.num, { color: C.sky }]}>{i + 1}</Text>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.name}>{p.firstName} {p.lastName}</Text>
              <Text style={styles.posName}>{POSITION_NAMES?.[p.position] || p.position}</Text>
            </View>
            <Text style={styles.pos}>{p.position}</Text>
            <Text style={styles.stars}>{stars(p.overall)}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  stripe: { height: 4, width: "100%" },
  header: { paddingHorizontal: 18, paddingTop: 14, paddingBottom: 12 },
  kicker: { color: C.sky, fontSize: 11, fontWeight: "800", letterSpacing: 2 },
  h1: { color: C.text, fontSize: 28, fontWeight: "900", marginTop: 4, letterSpacing: -0.5 },
  sub: { color: C.mute, fontSize: 12, marginTop: 6 },
  legend: {
    flexDirection: "row", alignItems: "center", paddingHorizontal: 18, paddingVertical: 8,
    borderBottomWidth: 1, borderBottomColor: C.line,
  },
  legendText: { color: C.mute, fontSize: 10, fontWeight: "800", letterSpacing: 1 },
  row: {
    flexDirection: "row", alignItems: "center", paddingHorizontal: 18, paddingVertical: 11,
    borderBottomWidth: 1, borderBottomColor: C.line,
  },
  num: { width: 24, fontSize: 16, fontWeight: "900", textAlign: "center" },
  name: { color: C.text, fontSize: 15, fontWeight: "700" },
  posName: { color: C.dim, fontSize: 11, marginTop: 1 },
  pos: { color: C.mute, fontSize: 12, fontWeight: "700", width: 34, textAlign: "center" },
  stars: { color: C.sky, fontSize: 13, width: 84, textAlign: "right", letterSpacing: 1 },
});
