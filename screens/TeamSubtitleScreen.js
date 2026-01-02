import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  SafeAreaView,
  Image,
} from "react-native";
import { useRoute } from "@react-navigation/native";
import { useStudentStore } from "../state/useStudentStore";
import { listenToSubtitles } from "../services/firebase/teamSubtitles";

export default function TeamSubtitleScreen() {
  const route = useRoute();
  const { teamId } = route.params;
  const student = useStudentStore((s) => s.selectedStudent);

  const [subtitles, setSubtitles] = useState([]);
  const listRef = useRef(null);

  useEffect(() => {
    if (!teamId) return;

    const unsub = listenToSubtitles(teamId, (rows) => {
      // rows already contain { id, ...data }
      setSubtitles(rows.slice(-300));
    });

    return () => unsub && unsub();
  }, [teamId]);

  useEffect(() => {
    if (!listRef.current || subtitles.length === 0) return;

    // auto-scroll to latest subtitle
    requestAnimationFrame(() => {
      listRef.current.scrollToEnd({ animated: true });
    });
  }, [subtitles.length]);

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.title}>Team Live Subtitles</Text>
        <Text style={styles.subTitle}>Team {teamId}</Text>
      </View>

      <FlatList
        ref={listRef}
        data={subtitles}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <SubtitleRow item={item} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 14, paddingBottom: 150 }}
      />

      
    </SafeAreaView>
  );
}

/* ================= SUBTITLE ROW ================= */

function SubtitleRow({ item }) {
  return (
    <View style={r.row}>
      <View style={r.avatarWrap}>
        {item.photo ? (
          <Image source={{ uri: item.photo }} style={r.avatar} />
        ) : (
          <View style={r.avatarPlaceholder}>
            <Text style={r.avatarInitial}>
              {item.name?.charAt(0) || "?"}
            </Text>
          </View>
        )}
      </View>

      <View style={r.bubbleWrap}>
        <View style={r.bubble}>
          <Text style={r.name}>{item.name}</Text>
          <Text style={r.text}>{item.text}</Text>
        </View>
      </View>
    </View>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#05060A" },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,159,28,0.08)",
  },
  title: { color: "#FFB35A", fontSize: 18, fontWeight: "800" },
  subTitle: { color: "#8A94A0", marginTop: 4, fontSize: 12 },
});

const r = StyleSheet.create({
  row: { flexDirection: "row", marginBottom: 12 },
  avatarWrap: { width: 52, alignItems: "center" },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#FF9F1C",
  },
  avatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#081018",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitial: { color: "#FF9F1C", fontWeight: "700" },
  bubbleWrap: { flex: 1 },
  bubble: {
    backgroundColor: "#061017",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,159,28,0.14)",
  },
  name: { color: "#FFB35A", fontWeight: "800", marginBottom: 6 },
  text: { color: "#E6EEF2", fontSize: 14 },
});
