// Footy Dynasty — mobile (Expo / React Native).
// Native Hub / Squad / Match / Club / Recruit screens on the SHARED game engine
// (synced from ../footy-dynasty/src by scripts/sync-engine.mjs). Career state is
// held here so playing a match on Match-day advances the ladder + finances live.
import React, { useMemo, useState } from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView, View, Text, Pressable, StyleSheet } from "react-native";
import { C } from "./src/theme.js";
import { buildDemoCareer, advanceMatch } from "./src/engine.js";
import HubScreen from "./src/screens/HubScreen.js";
import SquadScreen from "./src/screens/SquadScreen.js";
import MatchDayScreen from "./src/screens/MatchDayScreen.js";
import ClubScreen from "./src/screens/ClubScreen.js";
import RecruitScreen from "./src/screens/RecruitScreen.js";

const TABS = [
  { key: "hub", label: "Hub", glyph: "◈" },
  { key: "squad", label: "Squad", glyph: "≡" },
  { key: "match", label: "Match", glyph: "▶" },
  { key: "club", label: "Club", glyph: "⬢" },
  { key: "recruit", label: "Recruit", glyph: "⇄" },
];

export default function App() {
  const [career, setCareer] = useState(() => buildDemoCareer("car", 2026));
  const [tab, setTab] = useState("hub");

  const onAdvance = () => setCareer((c) => advanceMatch(c));

  let screen;
  if (tab === "hub") screen = <HubScreen career={career} onOpenSquad={() => setTab("squad")} />;
  else if (tab === "squad") screen = <SquadScreen career={career} />;
  else if (tab === "match") screen = <MatchDayScreen career={career} onAdvance={onAdvance} />;
  else if (tab === "club") screen = <ClubScreen career={career} />;
  else screen = <RecruitScreen career={career} />;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="light" />
      <View style={{ flex: 1 }}>{screen}</View>

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
    paddingTop: 8, paddingBottom: 20,
  },
  tab: { flex: 1, alignItems: "center", gap: 3 },
  tabGlyph: { fontSize: 17, fontWeight: "900" },
  tabLabel: { fontSize: 10, fontWeight: "800", letterSpacing: 0.3 },
});
