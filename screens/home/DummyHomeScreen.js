import React, { useEffect, useState } from "react";
import {
  FlatList,
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

export default function StudentCommandHome() {
  const navigation = useNavigation();
  const student = useStudentStore((s) => s.selectedStudent);
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const [subjects, setSubjects] = useState([]);

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
              </View>

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
  heroHello: { fontSize: 16, fontWeight: "600", color: COLORS.textMuted },
  heroName: { fontSize: 36, fontWeight: "900", color: COLORS.textMain, marginTop: 4 },
  heroMeta: { marginTop: 8, fontSize: 13, fontWeight: "700", color: COLORS.accent },

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
});
