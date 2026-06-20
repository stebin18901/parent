import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage"; // Added for local persistence
import { useRoute, useNavigation } from "@react-navigation/native";
import { useStudentStore } from "../../state/useStudentStore";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

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
    topic, 
  } = route.params;

  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const doSave = async () => {
      if (!student?.id || saved) return;

      try {
        // Save locally so ChapterSelectScreen can show the score immediately
        const resultKey = `quiz_result_${student.id}_${subject}_${chapter}_${topic}`;
        await AsyncStorage.setItem(resultKey, scorePercent.toString());

      } catch (err) {
        console.log("Quiz attempt save error:", err);
      } finally {
        setSaved(true);
      }
    };

    doSave();
  }, [student?.id, saved, subject, chapter, topic, total, correct, scorePercent]);

  const wrong = total - correct;

  /* Performance Logic */
  let performanceLabel = "Keep Practicing";
  let performanceIcon = "rocket-outline";
  
  if (scorePercent >= 80) {
    performanceLabel = "Excellent!";
    performanceIcon = "trophy";
  } else if (scorePercent >= 60) {
    performanceLabel = "Well Done!";
    performanceIcon = "star";
  } else if (scorePercent >= 40) {
    performanceLabel = "Good Effort";
    performanceIcon = "thumbs-up";
  }

  return (
    <SafeAreaView style={styles.safe}>
      <LinearGradient colors={["#F8FAFF", "#FFF4EC"]} style={styles.root}>
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.title}>Topic Completed</Text>
        <Text style={styles.subTitle}>
          {chapter} • {topic}
        </Text>
      </View>

      {/* SCORE CARD */}
      <LinearGradient colors={["#FFF7ED", "#FFFBEB"]} style={styles.scoreCard}>
        <Ionicons name={performanceIcon} size={48} color="#B45309" style={{ marginBottom: 10 }} />
        <Text style={styles.scoreLabel}>YOUR SCORE</Text>
        <Text style={styles.scoreValue}>{scorePercent}%</Text>
        <Text style={styles.scoreTag}>{performanceLabel}</Text>
      </LinearGradient>

      {/* STATS */}
      <View style={styles.statsRow}>
        <StatItem label="Questions" value={total} colors={["#FFFFFF", "#F8FAFC"]} />
        <StatItem label="Correct" value={correct} colors={["#ECFDF5", "#DCFCE7"]} textColor="#16A34A" />
        <StatItem label="Wrong" value={wrong} colors={["#FEF2F2", "#FEE2E2"]} textColor="#DC2626" />
      </View>

      {/* FOOTER BUTTONS */}
      <View style={styles.footerButtons}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => navigation.popToTop()}
          style={styles.shadowWrapper}
        >
          <LinearGradient colors={["#FFB347", "#FF9F1C"]} style={styles.primaryBtn}>
            <Text style={styles.primaryBtnText}>Continue Journey</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() =>
            navigation.replace("QuizPlay", { subject, chapter, topic })
          }
        >
          <LinearGradient colors={["#F1F5F9", "#E5E7EB"]} style={styles.secondaryBtn}>
            <Text style={styles.secondaryBtnText}>Retry Topic</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

const StatItem = ({ label, value, colors, textColor = "#111827" }) => (
  <LinearGradient colors={colors} style={styles.statBox}>
    <Text style={[styles.statNumber, { color: textColor }]}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </LinearGradient>
);

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F8FAFF" },
  root: { flex: 1, padding: 24, paddingTop: 28 },
  header: { marginBottom: 30 },
  title: { fontSize: 28, fontWeight: "900", color: "#111827" },
  subTitle: { fontSize: 14, color: "#6B7280", marginTop: 4, fontWeight: "600" },
  
  scoreCard: {
    borderRadius: 30,
    paddingVertical: 35,
    alignItems: "center",
    marginBottom: 25,
    elevation: 8,
    shadowColor: "#B45309",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
  },
  scoreLabel: { fontSize: 12, color: "#92400E", fontWeight: "800", letterSpacing: 1 },
  scoreValue: { fontSize: 50, fontWeight: "900", color: "#B45309", marginVertical: 5 },
  scoreTag: { fontSize: 18, fontWeight: "800", color: "#92400E" },

  statsRow: { flexDirection: "row", justifyContent: "space-between", gap: 10 },
  statBox: { flex: 1, borderRadius: 20, paddingVertical: 20, alignItems: "center", elevation: 3 },
  statNumber: { fontSize: 20, fontWeight: "900" },
  statLabel: { fontSize: 11, color: "#6B7280", marginTop: 4, fontWeight: "700" },

  footerButtons: { marginTop: "auto", paddingBottom: 20 },
  primaryBtn: { paddingVertical: 18, borderRadius: 22, alignItems: "center" },
  primaryBtnText: { color: "#FFFFFF", fontWeight: "900", fontSize: 16 },
  secondaryBtn: { paddingVertical: 15, borderRadius: 22, alignItems: "center", marginTop: 12 },
  secondaryBtnText: { color: "#4B5563", fontWeight: "800", fontSize: 14 },
  shadowWrapper: { 
    elevation: 5, 
    shadowColor: "#FF9F1C", 
    shadowOpacity: 0.3, 
    shadowRadius: 10, 
    shadowOffset: { width: 0, height: 5 } 
  }
});
