import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRoute, useNavigation } from "@react-navigation/native";
import { useStudentStore } from "../../state/useStudentStore";
import {
  getChaptersBySubject,
  getConceptsByChapter,
} from "../../services/firebase/quiz";
import { LinearGradient } from "expo-linear-gradient";

/* ───────── ADVANCED COLOR SYSTEM ───────── */
const COLORS = {
  bgTop: "#000000ff",
  bgMid: "#101010ff",
  bgBottom: "#414141ff",

  glass: "rgba(43, 43, 43, 0.96)",
  border: "rgba(255,255,255,0.18)",

  textMain: "#ffffffff",
  textMuted: "#7a7a7aff",

  gold: "#EAB308",
  goldDark: "#CA8A04",

  successBg: "#ECFDF5",
  successText: "#15803D",
};

export default function ChapterSelectScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const subject = route.params?.subject || "Subject";
  const student = useStudentStore((s) => s.selectedStudent);

  const [chapters, setChapters] = useState([]);
  const [expandedChapter, setExpandedChapter] = useState(null);
  const [conceptMap, setConceptMap] = useState({});
  const [resumeMap, setResumeMap] = useState({});
  const [loading, setLoading] = useState(true);

  /* ───────── LOAD CHAPTERS ───────── */
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const result = await getChaptersBySubject(
          student?.class,
          subject
        );
        setChapters(result);
        await checkResumeStates(result);
      } finally {
        setLoading(false);
      }
    };

    if (student?.class && subject) load();
  }, [student?.class, subject]);

  /* ───────── RESUME STATE ───────── */
  const checkResumeStates = async (list) => {
    if (!student?.id) return;
    const map = {};
    for (const ch of list) {
      const key = `quiz_progress_${student.id}_${subject}_${ch}`;
      map[ch] = !!(await AsyncStorage.getItem(key));
    }
    setResumeMap(map);
  };

  const toggleChapter = async (chapter) => {
    if (expandedChapter === chapter) {
      setExpandedChapter(null);
      return;
    }
    setExpandedChapter(chapter);

    if (!conceptMap[chapter]) {
      const concepts = await getConceptsByChapter(
        student.class,
        subject,
        chapter
      );
      setConceptMap((p) => ({ ...p, [chapter]: concepts }));
    }
  };

  const handleStart = (chapter) => {
    navigation.navigate("QuizPlay", { subject, chapter });
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.gold} />
      </View>
    );
  }

  return (
    <LinearGradient
      colors={[COLORS.bgTop, COLORS.bgMid, COLORS.bgBottom]}
      locations={[0, 0.3, 1]}
      style={{ flex: 1 }}
    >
      {/* ───────── HERO HEADER ───────── */}
      <View style={styles.hero}>
        <Text style={styles.heroSubject}>{subject}</Text>
        <Text style={styles.heroSub}>
          Select a chapter to begin your learning path
        </Text>
      </View>

      {/* ───────── CHAPTERS ───────── */}
      <FlatList
        data={chapters}
        keyExtractor={(item) => item}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 140 }}
        renderItem={({ item }) => {
          const expanded = expandedChapter === item;
          const concepts = conceptMap[item] || [];
          const isResume = resumeMap[item];

          return (
            <View style={styles.chapterCard}>
              {/* HEADER */}
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => toggleChapter(item)}
                style={styles.chapterHeader}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.chapterTitle}>{item}</Text>
                  <Text style={styles.chapterMeta}>
                    {isResume ? "In progress" : "Not started"}
                  </Text>
                </View>

                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() => handleStart(item)}
                >
                  <LinearGradient
                    colors={
                      isResume
                        ? [COLORS.successText, COLORS.successText]
                        : [COLORS.gold, COLORS.goldDark]
                    }
                    style={styles.actionBtn}
                  >
                    <Text style={styles.actionText}>
                      {isResume ? "Resume" : "Start"}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </TouchableOpacity>

              {/* EXPANDED */}
              {expanded && (
                <View style={styles.expandArea}>
                  <Text style={styles.expandTitle}>
                    Concepts Covered
                  </Text>

                  {concepts.length > 0 ? (
                    concepts.map((c) => (
                      <Text key={c.id} style={styles.concept}>
                        • {c.concept}
                      </Text>
                    ))
                  ) : (
                    <Text style={styles.empty}>
                      Concepts will be added soon.
                    </Text>
                  )}
                </View>
              )}
            </View>
          );
        }}
      />
    </LinearGradient>
  );
}

/* ───────── STYLES ───────── */

const SHADOW_GLASS = {
  shadowColor: "#000",
  shadowOpacity: 0.12,
  shadowRadius: 24,
  shadowOffset: { width: 0, height: 14 },
  elevation: 8,
};

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center" },

  hero: {
    paddingTop: 38,
    paddingHorizontal: 24,
    paddingBottom: 18,
  },
  heroSubject: {
    fontSize: 30,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  heroSub: {
    fontSize: 14,
    color: "#CBD5E1",
    marginTop: 6,
  },

  chapterCard: {
    backgroundColor: COLORS.glass,
    borderRadius: 26,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOW_GLASS,
  },

  chapterHeader: {
    padding: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  chapterTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: COLORS.textMain,
  },

  chapterMeta: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 4,
  },

  actionBtn: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 14,
  },

  actionText: {
    fontSize: 12,
    fontWeight: "900",
    color: "#0B1220",
  },

  expandArea: {
    borderTopWidth: 1,
    borderColor: "#E5E7EB",
    padding: 18,
    backgroundColor: "#FFFFFF",
  },

  expandTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: COLORS.textMain,
    marginBottom: 10,
  },

  concept: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginBottom: 6,
    fontWeight: "600",
  },

  empty: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontStyle: "italic",
  },
});
