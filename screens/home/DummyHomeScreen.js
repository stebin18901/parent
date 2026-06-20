import React, { useEffect, useState } from "react";
import {
  FlatList,
  Image,
  StatusBar,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { useStudentStore } from "../../state/useStudentStore";
import { getSubjectsByClass } from "../../services/firebase/quiz";
import { listenToAds } from "../../services/firebase/ads";
import { listenToDailyTask } from "../../services/firebase/dailyTask";

const COLORS = {
  bgTop: "#F6FAFF",
  bgMid: "#EDF4FF",
  bgBottom: "#E3EDFF",
  glass: "rgba(255,255,255,0.9)",
  textMain: "#0F172A",
  textMuted: "#64748B",
  accent: "#4338CA",
  success: "#059669",
};

const getSubjectConfig = (name) => {
  const sub = name.toLowerCase();
  if (sub.includes("math")) return { icon: "calculator", color: "#4F46E5" };
  if (sub.includes("sci") || sub.includes("phys")) return { icon: "atom", color: "#0D9488" };
  if (sub.includes("chem")) return { icon: "flask", color: "#DB2777" };
  if (sub.includes("bio")) return { icon: "dna", color: "#16A34A" };
  if (sub.includes("hist") || sub.includes("soc")) return { icon: "earth", color: "#D97706" };
  if (sub.includes("eng") || sub.includes("lang")) return { icon: "book-open-variant", color: "#2563EB" };
  return { icon: "book-outline", color: "#64748B" };
};

function ProgressRow({ label, value }) {
  return (
    <View style={styles.progressRow}>
      <View style={styles.progressMeta}>
        <Text style={styles.progressLabel}>{label}</Text>
        <Text style={styles.progressValue}>{value}%</Text>
      </View>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${value}%` }]} />
      </View>
    </View>
  );
}

export default function StudentCommandHome() {
  const navigation = useNavigation();
  const student = useStudentStore((s) => s.selectedStudent);
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const [subjects, setSubjects] = useState([]);
  const [ads, setAds] = useState([]);
  const [dailyTask, setDailyTask] = useState(null);

  useEffect(() => {
    if (!student?.class) return;
    (async () => {
      try {
        const subs = await getSubjectsByClass(student.class);
        setSubjects(subs);
      } catch (err) {
        console.error(err);
      }
    })();
  }, [student?.class]);

  useEffect(() => {
    const unsub = listenToAds(setAds);
    return () => unsub && unsub();
  }, []);

  useEffect(() => {
    const unsub = listenToDailyTask(setDailyTask);
    return () => unsub && unsub();
  }, []);

  return (
    <SafeAreaView style={styles.safe}>
      <LinearGradient colors={[COLORS.bgTop, COLORS.bgMid, COLORS.bgBottom]} style={styles.screen}>
        <StatusBar barStyle="dark-content" />
        <FlatList
          data={[{ key: "home" }]}
          keyExtractor={(item) => item.key}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.content, isLandscape && styles.contentLandscape]}
          renderItem={() => (
            <View style={styles.maxWidth}>
            <View style={[styles.hero, isLandscape && styles.heroLandscape]}>
              <View style={styles.heroTextWrap}>
                <Text style={styles.heroHello}>Welcome back</Text>
                <Text style={styles.heroName}>{student?.name || "Student"}</Text>
                <Text style={styles.heroMeta}>Class {student?.class || "N/A"}</Text>
              </View>
              <View style={styles.heroActionWrap}>
                <FlatList
                  data={ads}
                  keyExtractor={(item) => item.id}
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  snapToAlignment="start"
                  decelerationRate="fast"
                  ListEmptyComponent={
                    <LinearGradient colors={[COLORS.accent, "#312E81"]} style={styles.heroActionCard}>
                      <View style={styles.heroActionTextWrap}>
                        <Text style={styles.heroTitle}>Master your curriculum</Text>
                        <Text style={styles.heroDesc}>with our story mode game quizzes</Text>
                        <TouchableOpacity
                          style={styles.actionBtn}
                          onPress={() => navigation.navigate("StoryModePromo")}
                        >
                          <Text style={styles.actionBtnText}>Coming soon</Text>
                        </TouchableOpacity>
                      </View>
                      <Image
                        source={{
                          uri: "https://firebasestorage.googleapis.com/v0/b/dreamprojects-cda5b.appspot.com/o/home%2Fplayercard-Photoroom%20(2).png?alt=media",
                        }}
                        style={styles.heroImage}
                        resizeMode="contain"
                      />
                    </LinearGradient>
                  }
                  renderItem={({ item }) => (
                    <LinearGradient colors={[item?.bgStart || COLORS.accent, item?.bgEnd || "#312E81"]} style={styles.heroActionCard}>
                      <View style={styles.heroActionTextWrap}>
                        <Text style={styles.heroTitle}>{item.title || "Story Mode Quiz"}</Text>
                        <Text style={styles.heroDesc}>{item.subtitle || "Adventure-driven quizzes are coming soon."}</Text>
                        <TouchableOpacity
                          style={styles.actionBtn}
                          onPress={() => {
                            if (item.ctaRoute) {
                              navigation.navigate(item.ctaRoute);
                            } else {
                              navigation.navigate("StoryModePromo");
                            }
                          }}
                        >
                          <Text style={styles.actionBtnText}>{item.ctaText || "Learn more"}</Text>
                        </TouchableOpacity>
                      </View>
                      {item.imageUrl ? (
                        <Image source={{ uri: item.imageUrl }} style={styles.heroImage} resizeMode="contain" />
                      ) : null}
                    </LinearGradient>
                  )}
                />
              </View>
            </View>

              {dailyTask?.active !== false &&
              (!dailyTask?.quizClass || Number(dailyTask?.quizClass) === Number(student?.class)) ? (
                <View style={styles.dailyTaskCard}>
                  <View style={styles.dailyTaskText}>
                    <Text style={styles.dailyTaskLabel}>Daily Task</Text>
                    <Text style={styles.dailyTaskTitle}>{dailyTask?.title || "New challenge available"}</Text>
                    <Text style={styles.dailyTaskDesc}>{dailyTask?.description || "Complete today’s task to earn extra points."}</Text>
                    {dailyTask?.quizSubject ? (
                      <Text style={styles.dailyTaskMeta}>
                        {dailyTask.quizSubject} · {dailyTask.quizChapter} · {dailyTask.quizTopic}
                      </Text>
                    ) : null}
                    <View style={styles.dailyTaskMetaRow}>
                      <Text style={styles.dailyTaskPoints}>{Number(dailyTask?.points || 0)} pts</Text>
                      <TouchableOpacity
                        style={styles.dailyTaskBtn}
                        onPress={() => {
                          if (dailyTask?.quizSubject && dailyTask?.quizChapter && dailyTask?.quizTopic) {
                            navigation.navigate("QuizPlay", {
                              subject: dailyTask.quizSubject,
                              chapter: dailyTask.quizChapter,
                              topic: dailyTask.quizTopic,
                            });
                          } else if (dailyTask?.ctaRoute) {
                            navigation.navigate(dailyTask.ctaRoute);
                          }
                        }}
                      >
                        <Text style={styles.dailyTaskBtnText}>{dailyTask?.ctaText || "Start now"}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  {dailyTask?.imageUrl ? (
                    <Image source={{ uri: dailyTask.imageUrl }} style={styles.dailyTaskImage} />
                  ) : null}
                </View>
              ) : null}

              <Text style={styles.sectionTitle}>Subjects</Text>
              <View style={styles.subjectGrid}>
                {subjects.map((sub) => {
                  const config = getSubjectConfig(sub);
                  return (
                    <TouchableOpacity
                      key={sub}
                      style={[styles.subjectCard, isLandscape && styles.subjectCardLandscape]}
                      onPress={() => navigation.navigate("ChapterSelect", { subject: sub })}
                    >
                      <View style={[styles.iconContainer, { backgroundColor: `${config.color}18` }]}>
                        <MaterialCommunityIcons name={config.icon} size={28} color={config.color} />
                      </View>
                      <Text style={styles.subjectText}>{sub}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}
        />
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bgTop },
  screen: { flex: 1 },
  content: { paddingBottom: 100, paddingTop: 4 },
  contentLandscape: { paddingTop: 8 },
  maxWidth: { width: "100%", maxWidth: 1100, alignSelf: "center" },

  hero: { paddingHorizontal: 22, paddingTop: 12, gap: 14 },
  heroLandscape: { flexDirection: "row", alignItems: "stretch" },
  heroTextWrap: { flex: 1, justifyContent: "center" },
  heroActionWrap: { flex: 1.6 },
  heroHello: { fontSize: 16, fontWeight: "600", color: COLORS.textMuted },
  heroName: { fontSize: 36, fontWeight: "900", color: COLORS.textMain, marginTop: 4 },
  heroMeta: { marginTop: 8, fontSize: 13, fontWeight: "700", color: COLORS.accent },
  heroActionCard: {
    minHeight: 190,
    borderRadius: 30,
    padding: 22,
    width: "80%",
    overflow: "hidden",
    justifyContent: "center",
  },
  heroActionTextWrap: { width: "68%" },
  heroTitle: { color: "#FFFFFF", fontSize: 26, lineHeight: 30, fontWeight: "900" },
  heroDesc: { marginTop: 8, color: "rgba(255,255,255,0.8)", fontSize: 14, lineHeight: 20 },
  actionBtn: {
    marginTop: 14,
    backgroundColor: "#FFFFFF",
    alignSelf: "flex-start",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  actionBtnText: { color: COLORS.accent, fontWeight: "800" },
  heroImage: { position: "absolute", right: -8, bottom: -16, width: 130, height: 178 },

  dailyTaskCard: {
    marginTop: 24,
    marginHorizontal: 22,
    backgroundColor: "#0F172A",
    borderRadius: 24,
    padding: 18,
    flexDirection: "row",
    gap: 14,
    alignItems: "center",
  },
  dailyTaskText: { flex: 1 },
  dailyTaskLabel: { color: "#93C5FD", fontSize: 12, fontWeight: "800", letterSpacing: 1 },
  dailyTaskTitle: { color: "#FFFFFF", fontSize: 20, fontWeight: "900", marginTop: 6 },
  dailyTaskDesc: { color: "#CBD5F5", fontSize: 13, marginTop: 6, lineHeight: 18 },
  dailyTaskMeta: { color: "#93C5FD", fontSize: 12, marginTop: 6, fontWeight: "700" },
  dailyTaskMetaRow: { marginTop: 12, flexDirection: "row", alignItems: "center", gap: 12 },
  dailyTaskPoints: { color: "#FCD34D", fontSize: 13, fontWeight: "800" },
  dailyTaskBtn: {
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
  },
  dailyTaskBtnText: { color: "#0F172A", fontWeight: "800", fontSize: 12 },
  dailyTaskImage: { width: 90, height: 90, borderRadius: 18, resizeMode: "cover" },

  sectionTitle: { marginTop: 24, marginHorizontal: 22, fontSize: 20, fontWeight: "900", color: COLORS.textMain },
  subjectGrid: { paddingHorizontal: 20, paddingTop: 14, flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  subjectCard: {
    width: "48%",
    minHeight: 132,
    marginBottom: 12,
    backgroundColor: COLORS.glass,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.8)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  subjectCardLandscape: { width: "32%" },
  iconContainer: { width: 56, height: 56, borderRadius: 18, justifyContent: "center", alignItems: "center", marginBottom: 10 },
  subjectText: { fontSize: 15, fontWeight: "800", color: COLORS.textMain, textAlign: "center" },

  landscapeColumns: { flexDirection: "row", gap: 12, paddingHorizontal: 20, marginTop: 2 },
  column: { flex: 1 },
  glassCard: {
    backgroundColor: COLORS.glass,
    borderRadius: 24,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.8)",
  },
  cardTitle: { fontSize: 18, fontWeight: "900", color: COLORS.textMain },
  cardDesc: { marginTop: 8, fontSize: 14, color: COLORS.textMuted },
  bullet: { marginTop: 8, fontSize: 14, color: COLORS.textMuted },

  progressRow: { marginTop: 14 },
  progressMeta: { flexDirection: "row", justifyContent: "space-between" },
  progressLabel: { color: COLORS.textMuted, fontSize: 13 },
  progressValue: { color: COLORS.textMain, fontWeight: "800", fontSize: 13 },
  progressTrack: { marginTop: 8, height: 8, borderRadius: 8, backgroundColor: "#DCE7FF", overflow: "hidden" },
  progressFill: { height: "100%", backgroundColor: COLORS.success, borderRadius: 8 },

  challengeCard: {
    backgroundColor: "#1E293B",
    borderRadius: 24,
    padding: 22,
    marginBottom: 12,
  },
  challengeTitle: { color: "#FFFFFF", fontSize: 21, fontWeight: "900" },
  challengeDesc: { color: "#A5B4FC", fontSize: 14, marginTop: 8, lineHeight: 20 },
  challengeCta: { color: "#C7D2FE", marginTop: 14, fontSize: 14, fontWeight: "800" },
  leaderboardItem: { marginTop: 10, fontSize: 15, color: COLORS.textMain, fontWeight: "600" },
  highlight: { marginTop: 16, color: COLORS.accent, fontSize: 14, fontWeight: "800" },
});
