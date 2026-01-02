import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { useStudentStore } from "../../state/useStudentStore";
import { saveQuizAttempt } from "../../services/firebase/quiz";
import { LinearGradient } from "expo-linear-gradient";

export default function QuizReportScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const student = useStudentStore((s) => s.selectedStudent);

  const {
    total,
    correct,
    scorePercent,
    subject,
    chapter,
  } = route.params;

  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const doSave = async () => {
      if (!student?.id || saved) return;

      try {
        await saveQuizAttempt({
          studentId: student.id,
          subject,
          chapter,
          total,
          correct,
          scorePercent,
        });
      } catch (err) {
        console.log("Quiz attempt save error:", err);
      } finally {
        setSaved(true);
      }
    };

    doSave();
  }, [student?.id, saved, subject, chapter, total, correct, scorePercent]);

  const wrong = total - correct;

  let performanceLabel = "Keep Practicing";
  if (scorePercent >= 80) performanceLabel = "Excellent";
  else if (scorePercent >= 60) performanceLabel = "Good";
  else if (scorePercent >= 40) performanceLabel = "Needs Improvement";

  return (
    <LinearGradient
      colors={["#F8FAFF", "#FFF4EC"]}
      style={styles.root}
    >
      <Text style={styles.title}>Quiz Report</Text>
      <Text style={styles.subTitle}>
        {subject} - {chapter}
      </Text>

      {/* ✅ SCORE CARD */}
      <LinearGradient
        colors={["#FFF7ED", "#FFFBEB"]}
        style={styles.scoreCard}
      >
        <Text style={styles.scoreLabel}>Score</Text>
        <Text style={styles.scoreValue}>{scorePercent}%</Text>
        <Text style={styles.scoreTag}>{performanceLabel}</Text>
      </LinearGradient>

      {/* ✅ STATS */}
      <View style={styles.statsRow}>
        <LinearGradient
          colors={["#FFFFFF", "#F8FAFC"]}
          style={styles.statBox}
        >
          <Text style={styles.statNumber}>{total}</Text>
          <Text style={styles.statLabel}>Questions</Text>
        </LinearGradient>

        <LinearGradient
          colors={["#ECFDF5", "#DCFCE7"]}
          style={styles.statBox}
        >
          <Text style={[styles.statNumber, { color: "#16A34A" }]}>
            {correct}
          </Text>
          <Text style={styles.statLabel}>Correct</Text>
        </LinearGradient>

        <LinearGradient
          colors={["#FEF2F2", "#FEE2E2"]}
          style={styles.statBox}
        >
          <Text style={[styles.statNumber, { color: "#DC2626" }]}>
            {wrong}
          </Text>
          <Text style={styles.statLabel}>Wrong</Text>
        </LinearGradient>
      </View>

      {/* ✅ FOOTER BUTTONS */}
      <View style={styles.footerButtons}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => navigation.popToTop()}
        >
          <LinearGradient
            colors={["#FFB347", "#FF9F1C"]}
            style={styles.primaryBtn}
          >
            <Text style={styles.primaryBtnText}>
              Back to Home
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() =>
            navigation.replace("QuizPlay", { subject, chapter })
          }
        >
          <LinearGradient
            colors={["#F1F5F9", "#E5E7EB"]}
            style={styles.secondaryBtn}
          >
            <Text style={styles.secondaryBtnText}>
              Retry Quiz
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

/* ✅ STYLES */

const styles = StyleSheet.create({
  root: {
    flex: 1,
    padding: 20,
  },

  title: {
    fontSize: 24,
    fontWeight: "900",
    color: "#111827",
  },

  subTitle: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 22,
    fontWeight: "600",
  },

  scoreCard: {
    borderRadius: 22,
    paddingVertical: 26,
    paddingHorizontal: 16,
    alignItems: "center",
    marginBottom: 22,
    elevation: 4,
  },

  scoreLabel: {
    fontSize: 13,
    color: "#92400E",
    fontWeight: "600",
  },

  scoreValue: {
    fontSize: 38,
    fontWeight: "900",
    color: "#B45309",
    marginVertical: 4,
  },

  scoreTag: {
    fontSize: 14,
    fontWeight: "800",
    color: "#92400E",
  },

  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
  },

  statBox: {
    flex: 1,
    marginHorizontal: 4,
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: "center",
    elevation: 3,
  },

  statNumber: {
    fontSize: 18,
    fontWeight: "900",
    color: "#111827",
  },

  statLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 4,
    fontWeight: "600",
  },

  footerButtons: {
    marginTop: 34,
  },

  primaryBtn: {
    paddingVertical: 15,
    borderRadius: 22,
    marginBottom: 14,
    alignItems: "center",
    elevation: 4,
  },

  primaryBtnText: {
    color: "#FFFFFF",
    fontWeight: "900",
    fontSize: 15,
  },

  secondaryBtn: {
    paddingVertical: 13,
    borderRadius: 22,
    alignItems: "center",
    elevation: 2,
  },

  secondaryBtnText: {
    color: "#374151",
    fontWeight: "800",
    fontSize: 14,
  },
});
