import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { C, starString } from "./theme.js";

// KPI tile — label, big value, sub. Tappable (e.g. jump to a screen).
export function KpiTile({ label, value, sub, accent = C.sky, onPress, style }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.tile, style, pressed && onPress ? { opacity: 0.75 } : null]}
    >
      <View style={[styles.tileStripe, { backgroundColor: accent }]} />
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.tileValue, { color: accent }]} numberOfLines={1}>{value}</Text>
      {sub ? <Text style={styles.tileSub} numberOfLines={1}>{sub}</Text> : null}
    </Pressable>
  );
}

export function SectionCard({ title, right, children, style }) {
  return (
    <View style={[styles.card, style]}>
      {(title || right) && (
        <View style={styles.cardHead}>
          {title ? <Text style={styles.cardTitle}>{title}</Text> : <View />}
          {right}
        </View>
      )}
      {children}
    </View>
  );
}

export function PlayerRow({ rank, player, accent = C.sky }) {
  return (
    <View style={styles.row}>
      <Text style={[styles.rank, { color: accent }]}>{rank}</Text>
      <View style={{ flex: 1, marginLeft: 10 }}>
        <Text style={styles.name}>{player.firstName} {player.lastName}</Text>
        {player.posName ? <Text style={styles.posName}>{player.posName}</Text> : null}
      </View>
      <Text style={styles.pos}>{player.position}</Text>
      <Text style={styles.stars}>{starString(player.overall)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1, minWidth: 0, backgroundColor: C.panel, borderRadius: 14, borderWidth: 1,
    borderColor: C.line, paddingVertical: 12, paddingHorizontal: 12, overflow: "hidden",
  },
  tileStripe: { position: "absolute", left: 0, top: 0, bottom: 0, width: 3 },
  label: { color: C.mute, fontSize: 10, fontWeight: "800", letterSpacing: 1 },
  tileValue: { fontSize: 24, fontWeight: "900", marginTop: 4, letterSpacing: -0.5 },
  tileSub: { color: C.dim, fontSize: 11, marginTop: 3 },
  card: { backgroundColor: C.panel, borderRadius: 16, borderWidth: 1, borderColor: C.line, padding: 14 },
  cardHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  cardTitle: { color: C.text, fontSize: 16, fontWeight: "900", letterSpacing: 0.3 },
  row: {
    flexDirection: "row", alignItems: "center", paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: C.line,
  },
  rank: { width: 26, fontSize: 15, fontWeight: "900", textAlign: "center" },
  name: { color: C.text, fontSize: 15, fontWeight: "700" },
  posName: { color: C.dim, fontSize: 11, marginTop: 1 },
  pos: { color: C.mute, fontSize: 12, fontWeight: "700", width: 34, textAlign: "center" },
  stars: { color: C.sky, fontSize: 13, width: 82, textAlign: "right", letterSpacing: 1 },
});
