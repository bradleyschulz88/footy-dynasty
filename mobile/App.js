// Footy Dynasty — mobile (Expo / React Native).
// Native Hub + Squad screens built on the SHARED game engine (synced from
// ../footy-dynasty/src by scripts/sync-engine.mjs). A lightweight bottom-tab
// shell switches screens; the deterministic demo career is built once from the
// engine and passed down.
import React, { useMemo, useState } from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView, View, Text, Pressable, StyleSheet } from "react-native";
import { C } from "./src/theme.js";
import { buildDemoCareer } from "./src/engine.js";
import HubScreen from "./src/screens/HubScreen.js";
import SquadScreen from "./src/screens/SquadScreen.js";

const TABS = [
  { key: "hub", label: "Hub", glyph: "◈" },
  { key: "squad", label: "Squad", glyph: "≡" },
];

export default function App() {
  const career = useMemo(() => buildDemoCareer("car", 2026), []);
  const [tab, setTab] = useState("hub");

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="light" />
      <View style={{ flex: 1 }}>
        {tab === "hub" ? (
          <HubScreen career={career} onOpenSquad={() => setTab("squad")} />
        ) : (
          <SquadScreen career={career} />
        )}
      </View>

      <View style={styles.tabbar}>
        {TABS.map((t) => {
          const active = tab === t.key;
          return (
            <Pressable key={t.key} onPress={() => setTab(t.key)} style={styles.tab}>
              <Text style={[styles.tabGlyph, { color: active ? C.sky : C.mute }]}>{t.glyph}</Text>
              <Text style={[styles.tabLabel, { color: active ? C.sky : C.mute }]}>{t.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  tabbar: {
    flexDirection: "row", borderTopWidth: 1, borderTopColor: C.line, backgroundColor: C.bg2,
    paddingTop: 8, paddingBottom: 22,
  },
  tab: { flex: 1, alignItems: "center", gap: 3 },
  tabGlyph: { fontSize: 18, fontWeight: "900" },
  tabLabel: { fontSize: 11, fontWeight: "800", letterSpacing: 0.5 },
});
