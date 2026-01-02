import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useStudentStore } from "../../state/useStudentStore";
import { useAuthStore } from "../../state/useAuthStore";
import {
  listenToStudentStats,
  listenToStudentHistory,
} from "../../services/firebase/profile";
import { logoutParent } from "../../services/firebase/auth";

/* ───────── THEME ───────── */
const COLORS = {
  bg: "#000000ff",
  surface: "#111827",
  glass: "rgba(255,255,255,0.04)",
  border: "rgba(255,255,255,0.08)",

  textMain: "#F9FAFB",
  textSub: "#CBD5F5",
  textMuted: "#94A3B8",

  accent: "#FACC15",
  success: "#22C55E",
  danger: "#EF4444",
};

export default function ProfileScreen() {
  const navigation = useNavigation();
  const student = useStudentStore((s) => s.selectedStudent);
  const setUser = useAuthStore((s) => s.setUser);
  const clearStudents = useStudentStore((s) => s.clearStudents);

  const [stats, setStats] = useState({
    contestsPlayed: 0,
    wins: 0,
    podiums: 0,
  });
  const [history, setHistory] = useState([]);

  useEffect(() => {
    if (!student?.id) return;

    const unsubStats = listenToStudentStats(student.id, setStats);
    const unsubHistory = listenToStudentHistory(student.id, setHistory);

    return () => {
      unsubStats && unsubStats();
      unsubHistory && unsubHistory();
    };
  }, [student?.id]);

  if (!student) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.emptyTitle}>No player selected</Text>
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => navigation.navigate("SelectStudent")}
        >
          <Text style={styles.primaryText}>Select Player</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const avatar =
    student.photoUrl ||
    `https://ui-avatars.com/api/?background=0B1220&color=FACC15&name=${student.name}`;

  const { contestsPlayed, wins } = stats;
  const winRate =
    contestsPlayed > 0
      ? Math.round((wins / contestsPlayed) * 100)
      : 0;

  const handleLogout = () => {
    Alert.alert("Logout", "Logout from parent account?", [
      { text: "Cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await logoutParent();
          setUser(null);
          clearStudents();
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        {/* ───── IDENTITY HEADER ───── */}
        <View style={styles.header}>
          <Image source={{ uri: avatar }} style={styles.avatar} />

          <Text style={styles.name}>{student.name}</Text>
          <Text style={styles.sub}>
            Class {student.class}
            {student.section ? ` · ${student.section}` : ""}
          </Text>

          {/* XP BAR */}
          <View style={styles.xpBar}>
            <View
              style={[
                styles.xpFill,
                { width: `${Math.min(student.xp || 0, 100)}%` },
              ]}
            />
          </View>
          <Text style={styles.xpText}>
            XP {student.xp || 0}
          </Text>
        </View>

        {/* ───── STAT STRIP ───── */}
        <View style={styles.statStrip}>
          <Stat label="Contests" value={contestsPlayed} />
          <Stat label="Wins" value={wins} />
          <Stat label="Win %" value={winRate} />
        </View>

        {/* ───── ACTIVITY ───── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>

          {history.length === 0 ? (
            <Text style={styles.emptyText}>
              No contests played yet.
            </Text>
          ) : (
            history.map((h) => (
              <View key={h.id} style={styles.activityRow}>
                <View style={styles.dot} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.activityTitle}>
                    {h.contestName || "Contest"}
                  </Text>
                  <Text style={styles.activityMeta}>
                    Position #{h.position ?? "-"} · Score {h.score ?? "-"}
                  </Text>
                </View>
                {h.coinsWon ? (
                  <Text style={styles.reward}>
                    +{h.coinsWon}
                  </Text>
                ) : null}
              </View>
            ))
          )}
        </View>

        {/* ───── ACCOUNT ───── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>

          <TouchableOpacity
            style={styles.action}
            onPress={() => navigation.navigate("SelectStudent")}
          >
            <Text style={styles.actionText}>Switch Player</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.action, styles.danger]}
            onPress={handleLogout}
          >
            <Text style={styles.dangerText}>Logout Parent</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/* ───────── SUB COMPONENT ───────── */

function Stat({ label, value }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

/* ───────── STYLES ───────── */

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },

  center: {
    flex: 1,
    backgroundColor: COLORS.bg,
    alignItems: "center",
    justifyContent: "center",
  },

  header: {
    alignItems: "center",
    paddingVertical: 32,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
  },

  avatar: {
    width: 92,
    height: 92,
    borderRadius: 46,
    marginBottom: 12,
  },

  name: {
    fontSize: 22,
    fontWeight: "900",
    color: COLORS.textMain,
  },

  sub: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 4,
  },

  xpBar: {
    marginTop: 14,
    width: "70%",
    height: 6,
    borderRadius: 6,
    backgroundColor: COLORS.glass,
    overflow: "hidden",
  },

  xpFill: {
    height: "100%",
    backgroundColor: COLORS.accent,
  },

  xpText: {
    marginTop: 6,
    fontSize: 12,
    color: COLORS.textMuted,
  },

  statStrip: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
  },

  stat: {
    alignItems: "center",
  },

  statValue: {
    fontSize: 20,
    fontWeight: "900",
    color: COLORS.textMain,
  },

  statLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 4,
  },

  section: {
    padding: 18,
  },

  sectionTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.textMain,
    marginBottom: 12,
  },

  activityRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },

  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.accent,
    marginRight: 12,
  },

  activityTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.textSub,
  },

  activityMeta: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },

  reward: {
    color: COLORS.success,
    fontWeight: "800",
    fontSize: 13,
  },

  action: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
  },

  actionText: {
    color: COLORS.textSub,
    fontWeight: "700",
  },

  danger: {
    borderBottomWidth: 0,
    marginTop: 6,
  },

  dangerText: {
    color: COLORS.danger,
    fontWeight: "800",
  },

  emptyTitle: {
    color: COLORS.textMain,
    fontSize: 18,
    marginBottom: 12,
  },

  emptyText: {
    color: COLORS.textMuted,
    fontSize: 13,
  },

  primaryBtn: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 16,
    marginTop: 10,
  },

  primaryText: {
    fontWeight: "900",
    color: "#000",
  },
});
