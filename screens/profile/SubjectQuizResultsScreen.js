import React, { useEffect, useMemo, useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { listenToStudentHistory } from "../../services/firebase/profile";

const COLORS = {
  bg: "#F2F6FF",
  card: "#FFFFFF",
  border: "#E2E8F0",
  textMain: "#0F172A",
  textSub: "#475569",
  textMuted: "#94A3B8",
  accent: "#4338CA",
};

export default function SubjectQuizResultsScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { studentId, subject } = route.params || {};

  const [history, setHistory] = useState([]);

  useEffect(() => {
    if (!studentId || !subject) return;
    const unsub = listenToStudentHistory(studentId, (items) => {
      const filtered = items.filter((item) => item.subject === subject);
      setHistory(filtered);
    }, 200);
    return () => {
      unsub && unsub();
    };
  }, [studentId, subject]);

  const summary = useMemo(() => {
    const totalAttempts = history.length;
    const totalScore = history.reduce((sum, h) => sum + Number(h.scorePercent || 0), 0);
    const totalCorrect = history.reduce((sum, h) => sum + Number(h.correctAnswers || 0), 0);
    const totalQuestions = history.reduce((sum, h) => sum + Number(h.totalQuestions || 0), 0);
    const avgScore = totalAttempts ? Math.round(totalScore / totalAttempts) : 0;
    const accuracy = totalQuestions ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
    return { totalAttempts, avgScore, accuracy };
  }, [history]);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialCommunityIcons name="chevron-left" size={24} color={COLORS.textMain} />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.title}>{subject || "Subject"}</Text>
          <Text style={styles.subtitle}>Completed quiz attempts</Text>
        </View>
      </View>

      <View style={styles.summaryCard}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{summary.totalAttempts}</Text>
          <Text style={styles.summaryLabel}>Attempts</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{summary.avgScore}%</Text>
          <Text style={styles.summaryLabel}>Avg Score</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{summary.accuracy}%</Text>
          <Text style={styles.summaryLabel}>Accuracy</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Quiz History</Text>
        <View style={styles.card}>
          {history.length === 0 ? (
            <Text style={styles.emptyText}>No quiz results yet.</Text>
          ) : (
            history.map((h, index) => (
              <View key={h.id} style={[styles.activityRow, index === history.length - 1 && { borderBottomWidth: 0 }]}>
                <View style={styles.activityIcon}>
                  <MaterialCommunityIcons name="notebook-check-outline" size={18} color={COLORS.accent} />
                </View>
                <View style={styles.activityTextWrap}>
                  <Text style={styles.activityTitle}>{h.chapter}</Text>
                  <Text style={styles.activityMeta}>
                    Score {h.scorePercent}% | {h.correctAnswers}/{h.totalQuestions} correct
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg, paddingHorizontal: 18 },
  header: { flexDirection: "row", alignItems: "center", paddingVertical: 12 },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.card,
  },
  headerText: { marginLeft: 12 },
  title: { fontSize: 22, fontWeight: "900", color: COLORS.textMain },
  subtitle: { fontSize: 12, fontWeight: "700", color: COLORS.textMuted, marginTop: 2 },

  summaryCard: {
    marginTop: 6,
    backgroundColor: COLORS.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 16,
    paddingHorizontal: 10,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  summaryItem: { alignItems: "center", flex: 1 },
  summaryValue: { fontSize: 18, fontWeight: "900", color: COLORS.textMain },
  summaryLabel: { marginTop: 2, fontSize: 11, fontWeight: "700", color: COLORS.textMuted },

  scrollContent: { paddingTop: 16, paddingBottom: 40 },
  sectionTitle: { fontSize: 14, fontWeight: "900", color: COLORS.textSub, marginBottom: 8, marginLeft: 4 },
  card: { backgroundColor: COLORS.card, borderRadius: 20, borderWidth: 1, borderColor: COLORS.border, padding: 14 },

  activityRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#EEF2FF",
  },
  activityIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#EEF2FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  activityTextWrap: { flex: 1 },
  activityTitle: { fontSize: 14, fontWeight: "700", color: COLORS.textMain },
  activityMeta: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },

  emptyText: { fontSize: 13, color: COLORS.textMuted, textAlign: "center", paddingVertical: 18 },
});
