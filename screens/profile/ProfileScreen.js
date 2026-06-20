import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Image,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur"; // 🧊 Real frosted glass effect

import { useStudentStore } from "../../state/useStudentStore";
import { useAuthStore } from "../../state/useAuthStore";
import {
  listenToStudentHistory,
  listenToStudentStats,
} from "../../services/firebase/profile";
import { logoutParent } from "../../services/firebase/auth";
import QuizzesCompletedCard from "./components/QuizzesCompletedCard";

const COLORS = {
  bg: "#F8FAFC",
  card: "#FFFFFF",
  accent: "#6366F1",
  success: "#10B981",
  danger: "#EF4444",
  textMain: "#1E293B",
  textMuted: "#64748B",
};

const DEFAULT_AVATAR = "https://img.freepik.com/premium-vector/illustration-faceless-person-with-flat-design-style_995281-14054.jpg";

/* 🎨 SCORE COLOR ENGINE */
const getScoreGradient = (score = 0) => {
  if (score == 100) return ["#000000", "#3c3c3c"]
  if (score >= 95) return ["#ffb300", "#ff6600"]; 
  if (score >= 80) return ["#064E3B", "#10B981"]; 
  if (score >= 50) return ["#92400E", "#F59E0B"]; 
  return ["#7F1D1D", "#EF4444"];
};

function Stat({ label, value, icon }) {
  return (
    <View style={styles.stat}>
      <View style={styles.statIconCircle}>
        <MaterialCommunityIcons name={icon} size={18} color={COLORS.accent} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export default function ProfileScreen() {
  const navigation = useNavigation();
  const { width } = useWindowDimensions();
  const isWide = width >= 900;

  const student = useStudentStore((s) => s.selectedStudent);
  const liveStudent = useStudentStore((s) => s.liveStudent);
  const setUser = useAuthStore((s) => s.setUser);
  const clearStudents = useStudentStore((s) => s.clearStudents);

  const [stats, setStats] = useState({ quizzesCompleted: 0, avgScore: 0, avgAccuracy: 0 });
  const [history, setHistory] = useState([]);

  /* SUBJECT SUMMARY LOGIC */
  const subjectSummaries = useMemo(() => {
    if (!history.length) return [];
    const map = new Map();

    history.forEach((item) => {
      const key = item.subject || "Subject";
      const current = map.get(key) || {
        subject: key,
        attempts: 0,
        totalScore: 0,
        totalCorrect: 0,
        totalQuestions: 0,
      };
      current.attempts += 1;
      current.totalScore += Number(item.scorePercent || 0);
      current.totalCorrect += Number(item.correctAnswers || 0);
      current.totalQuestions += Number(item.totalQuestions || 0);
      map.set(key, current);
    });

    return Array.from(map.values())
      .map((item) => ({
        ...item,
        avgScore: item.attempts ? Math.round(item.totalScore / item.attempts) : 0,
        accuracy: item.totalQuestions ? Math.round((item.totalCorrect / item.totalQuestions) * 100) : 0,
      }))
      .sort((a, b) => b.attempts - a.attempts);
  }, [history]);

  useEffect(() => {
    if (!student?.id) return;
    const unsubStats = listenToStudentStats(student.id, setStats);
    const unsubHistory = listenToStudentHistory(student.id, setHistory);
    return () => { unsubStats?.(); unsubHistory?.(); };
  }, [student?.id]);

  if (!student) return <SafeAreaView style={styles.center}><Text>No student selected</Text></SafeAreaView>;

  const xp = liveStudent?.xp ?? student.xp ?? 0;
  const gradientColors = getScoreGradient(stats.avgScore);

  const handleLogout = () => {
    Alert.alert("Logout", "Logout from parent account?", [
      { text: "Cancel", style: "cancel" },
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
      <StatusBar barStyle="dark-content" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.maxWidth}>
          
          {/* 🏆 THE ULTRA GLASS CARD */}
          <View style={styles.glassContainer}>
            <LinearGradient colors={gradientColors} start={{x:0, y:0}} end={{x:1, y:1}} style={styles.absoluteBg} />
            
            {/* Background decorative orbs for depth */}
            <View style={[styles.orb, { top: -30, right: -20, backgroundColor: 'rgba(255,255,255,0.15)' }]} />
            <View style={[styles.orb, { bottom: -50, left: -20, width: 100, height: 100, backgroundColor: 'rgba(255,255,255,0.1)' }]} />
            
            <BlurView intensity={50} tint="light" style={styles.blurWrapper}>
              {/* Shine effect */}
              <LinearGradient 
                colors={['transparent', 'rgba(255,255,255,0.2)', 'transparent']} 
                start={{x:0, y:0}} end={{x:1, y:1}} 
                style={styles.shineStripe} 
              />

              <View style={styles.glassHeader}>
                <View style={styles.avatarWrapper}>
                   <Image source={{ uri: student.photoUrl || DEFAULT_AVATAR }} style={styles.mainAvatar} />
                   {/* 🏷️ Chest Name Badge Integration */}
                   <View style={styles.chestNameBadge}>
                      <Text numberOfLines={1} style={styles.chestNameText}>
                        {student.name.split(" ")[0]}
                      </Text>
                   </View>
                   <View style={styles.onlineIndicator} />
                </View>

                <View style={styles.headerInfo}>
                  <Text style={styles.glassName}>{student.name}</Text>
                  <View style={styles.glassTag}>
                    <Text style={styles.glassTagText}>Grade {student.class} • {student.section || 'A'}</Text>
                  </View>
                </View>

                <View style={styles.scoreCircle}>
                  <Text style={styles.scoreCircleText}>{stats.avgScore}%</Text>
                </View>
              </View>

              <View style={styles.glassBody}>
                <View style={styles.xpRow}>
                   <Text style={styles.glassLabel}>Level Progression</Text>
                   <Text style={styles.glassXpText}>{xp} <Text style={{fontSize: 10}}>XP</Text></Text>
                </View>
                <View style={styles.glassProgressTrack}>
                  <LinearGradient 
                    colors={['#FFFFFF', '#F1F5F9']} 
                    start={{x:0, y:0}} end={{x:1, y:0}} 
                    style={[styles.glassProgressFill, { width: `${Math.min(xp, 100)}%` }]} 
                  />
                </View>
              </View>
            </BlurView>
          </View>

          <QuizzesCompletedCard count={stats.quizzesCompleted} />

          {/* STATS STRIP */}
          <View style={styles.statsGrid}>
            <Stat label="Avg Score" value={`${stats.avgScore}%`} icon="lightning-bolt" />
            <Stat label="Accuracy" value={`${stats.avgAccuracy}%`} icon="target" />
            <Stat label="Quizzes" value={stats.quizzesCompleted} icon="check-decagram" />
          </View>

          {/* SUBJECT RESULTS CARD */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Subject Quiz Results</Text>
            {subjectSummaries.length === 0 ? (
              <Text style={styles.emptyText}>No quiz results yet.</Text>
            ) : (
              subjectSummaries.map((s, index) => (
                <TouchableOpacity
                  key={s.subject}
                  style={[styles.menuItem, index === subjectSummaries.length - 1 && { borderBottomWidth: 0 }]}
                  onPress={() => navigation.navigate("SubjectQuizResults", { studentId: student.id, subject: s.subject })}
                >
                  <View style={[styles.menuIcon, {backgroundColor: '#F1F5F9'}]}>
                    <MaterialCommunityIcons name="book-open-variant" size={20} color={COLORS.accent} />
                  </View>
                  <View style={{flex: 1, marginLeft: 12}}>
                    <Text style={styles.menuTextMain}>{s.subject}</Text>
                    <Text style={styles.menuTextSub}>Avg {s.avgScore}% | {s.attempts} attempts</Text>
                  </View>
                  <MaterialCommunityIcons name="chevron-right" size={20} color={COLORS.textMuted} />
                </TouchableOpacity>
              ))
            )}
          </View>

          {/* MANAGEMENT CARD */}
          <View style={[styles.card, {marginTop: 15}]}>
            <Text style={styles.cardTitle}>Management</Text>
            <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate("SelectStudent")}>
              <View style={[styles.menuIcon, {backgroundColor: '#EEF2FF'}]}>
                <MaterialCommunityIcons name="account-convert" size={20} color={COLORS.accent} />
              </View>
              <Text style={styles.menuTextMain}>Switch Student Profile</Text>
              <MaterialCommunityIcons name="chevron-right" size={20} color={COLORS.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity style={[styles.menuItem, {borderBottomWidth: 0}]} onPress={handleLogout}>
              <View style={[styles.menuIcon, {backgroundColor: '#FEF2F2'}]}>
                <MaterialCommunityIcons name="logout-variant" size={20} color={COLORS.danger} />
              </View>
              <Text style={[styles.menuTextMain, {color: COLORS.danger}]}>Logout Parent Account</Text>
            </TouchableOpacity>
          </View>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  scrollContent: { paddingBottom: 100, paddingTop: 10 },
  maxWidth: { width: "100%", maxWidth: 600, alignSelf: "center", paddingHorizontal: 20 },

  /* --- 🧊 THE GLASS ENGINE --- */
  glassContainer: {
    borderRadius: 32,
    overflow: 'hidden',
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    marginBottom: 15,
  },
  absoluteBg: { ...StyleSheet.absoluteFillObject },
  blurWrapper: {
    padding: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  shineStripe: {
    position: 'absolute',
    top: -100, left: -100, width: 200, height: 400,
    transform: [{ rotate: '45deg' }],
    opacity: 0.4,
  },
  orb: { position: 'absolute', width: 140, height: 140, borderRadius: 70 },
  
  /* --- GLASS CONTENT --- */
  glassHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  avatarWrapper: { position: 'relative' },
  mainAvatar: { 
    width: 85, height: 85, 
    borderRadius: 28, 
    borderWidth: 3, 
    borderColor: 'rgba(255,255,255,0.6)' 
  },
  chestNameBadge: {
    position: "absolute",
    bottom: 8,
    alignSelf: 'center',
    backgroundColor: "rgba(67, 56, 202, 0.95)", 
    paddingHorizontal: 8, paddingVertical: 2,
    borderRadius: 8,
    maxWidth: "90%",
  },
  chestNameText: { color: "#FFF", fontSize: 9, fontWeight: "800", textTransform: "uppercase" },
  onlineIndicator: {
    position: 'absolute', top: -2, right: -2,
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: COLORS.success,
    borderWidth: 3, borderColor: '#FFF',
  },
  headerInfo: { flex: 1, marginLeft: 16 },
  glassName: { fontSize: 24, fontWeight: '900', color: '#FFF', textShadowColor: 'rgba(0,0,0,0.15)', textShadowRadius: 4 },
  glassTag: { 
    backgroundColor: 'rgba(255,255,255,0.25)', 
    alignSelf: 'flex-start', 
    paddingHorizontal: 10, paddingVertical: 4, 
    borderRadius: 10, marginTop: 6 
  },
  glassTagText: { color: '#FFF', fontSize: 11, fontWeight: '700' },
  scoreCircle: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)',
  },
  scoreCircleText: { color: '#FFF', fontWeight: '900', fontSize: 17 },
  glassBody: { marginTop: 5 },
  xpRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 8 },
  glassLabel: { color: '#FFF', fontSize: 13, opacity: 0.9, fontWeight: '600' },
  glassXpText: { color: '#FFF', fontWeight: '900', fontSize: 20 },
  glassProgressTrack: { height: 12, backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 6, overflow: 'hidden' },
  glassProgressFill: { height: '100%', borderRadius: 6 },

  /* --- UI CARDS --- */
  statsGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  stat: { 
    flex: 1, backgroundColor: '#FFF', 
    marginHorizontal: 4, padding: 15, 
    borderRadius: 24, alignItems: 'center',
    elevation: 3, shadowOpacity: 0.08 
  },
  statIconCircle: { 
    width: 38, height: 38, borderRadius: 19, 
    backgroundColor: '#F5F7FF', 
    justifyContent: 'center', alignItems: 'center', marginBottom: 6 
  },
  statValue: { fontSize: 16, fontWeight: '800', color: COLORS.textMain },
  statLabel: { fontSize: 10, color: COLORS.textMuted },
  card: { backgroundColor: '#FFF', borderRadius: 28, padding: 20, elevation: 4 },
  cardTitle: { fontSize: 17, fontWeight: '800', marginBottom: 15, color: COLORS.textMain },
  menuItem: { 
    flexDirection: 'row', alignItems: 'center', 
    paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' 
  },
  menuIcon: { width: 42, height: 42, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  menuTextMain: { fontWeight: '700', color: COLORS.textMain, fontSize: 15 },
  menuTextSub: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  emptyText: { textAlign: "center", paddingVertical: 20, color: COLORS.textMuted },
});