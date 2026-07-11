import React, { useMemo, useState } from "react";
import { ScrollView, View, Text, Pressable, StyleSheet } from "react-native";
import { C } from "../theme.js";
import { fmtK, POSITION_NAMES } from "../engine.js";
import { PlayerRow } from "../components.js";

const LINES = {
  ALL: null,
  DEF: new Set(["KB", "HB"]),
  MID: new Set(["C", "R", "WG"]),
  FWD: new Set(["KF", "HF"]),
  RUCK: new Set(["RU"]),
};
const FILTERS = ["ALL", "DEF", "MID", "FWD", "RUCK"];

export default function SquadScreen({ career }) {
  const { club, squad, squadRating, wages } = career;
  const [filter, setFilter] = useState("ALL");
  const [c1] = club.colors || [C.sky];

  const rows = useMemo(() => {
    const set = LINES[filter];
    return squad
      .filter((p) => !set || set.has(p.position))
      .map((p) => ({ ...p, posName: POSITION_NAMES?.[p.position] || p.position }));
  }, [squad, filter]);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ paddingBottom: 28 }}>
      <View style={[styles.stripe, { backgroundColor: c1 }]} />
      <View style={styles.header}>
        <Text style={styles.kicker}>SQUAD · {club.short}</Text>
        <Text style={styles.h1}>PLAYER LIST</Text>
        <Text style={styles.sub}>{squad.length} players · rating {squadRating} · wages {fmtK(wages)}/yr</Text>
      </View>

      <View style={styles.filters}>
        {FILTERS.map((f) => {
          const active = filter === f;
          const n = f === "ALL" ? squad.length : squad.filter((p) => LINES[f].has(p.position)).length;
          return (
            <Pressable key={f} onPress={() => setFilter(f)} style={[styles.chip, active && styles.chipActive]}>
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{f}</Text>
              <Text style={[styles.chipCount, active && styles.chipTextActive]}>{n}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.legend}>
        <Text style={styles.lh}>#</Text>
        <Text style={[styles.lh, { flex: 1, marginLeft: 10 }]}>PLAYER</Text>
        <Text style={styles.lh}>POS</Text>
        <Text style={[styles.lh, { width: 82, textAlign: "right" }]}>RATING</Text>
      </View>

      <View style={{ paddingHorizontal: 18 }}>
        {rows.length === 0 && <Text style={styles.empty}>No players in this line.</Text>}
        {rows.map((p, i) => (
          <PlayerRow key={p.id ?? i} rank={i + 1} player={p} accent={C.sky} />
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  stripe: { height: 4, width: "100%" },
  header: { paddingHorizontal: 18, paddingTop: 12, paddingBottom: 10 },
  kicker: { color: C.sky, fontSize: 11, fontWeight: "800", letterSpacing: 2 },
  h1: { color: C.text, fontSize: 26, fontWeight: "900", marginTop: 3, letterSpacing: -0.5 },
  sub: { color: C.mute, fontSize: 12, marginTop: 5 },
  filters: { flexDirection: "row", flexWrap: "wrap", gap: 8, paddingHorizontal: 16, paddingBottom: 8 },
  chip: {
    flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: 10, borderWidth: 1, borderColor: C.line, backgroundColor: C.panel,
  },
  chipActive: { backgroundColor: C.sky, borderColor: C.sky },
  chipText: { color: C.mute, fontSize: 11, fontWeight: "800", letterSpacing: 0.5 },
  chipCount: { color: C.mute, fontSize: 11, fontWeight: "800", opacity: 0.8 },
  chipTextActive: { color: "#fff" },
  legend: {
    flexDirection: "row", alignItems: "center", paddingHorizontal: 18, paddingVertical: 8,
    borderTopWidth: 1, borderBottomWidth: 1, borderColor: C.line,
  },
  lh: { color: C.mute, fontSize: 10, fontWeight: "800", letterSpacing: 1 },
  empty: { color: C.mute, textAlign: "center", paddingVertical: 24 },
});
