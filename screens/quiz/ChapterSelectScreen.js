import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  LayoutAnimation,
  Platform,
  UIManager,
  SafeAreaView,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRoute, useNavigation, useIsFocused } from "@react-navigation/native";
import { useStudentStore } from "../../state/useStudentStore";
import { getChaptersBySubject, getConceptsByChapter } from "../../services/firebase/quiz";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const COLORS = {
  bgTop: "#000000",
  bgMid: "#121212",
  bgBottom: "#1A1A1A",
  glass: "rgba(255, 255, 255, 0.05)",
  border: "rgba(255, 255, 255, 0.12)",
  textMain: "#FFFFFF",
  textMuted: "#7a7a7a",
  gold: "#EAB308",
  success: "#10B981",
};

export default function ChapterSelectScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const isFocused = useIsFocused(); // To refresh states when coming back from Report
  const subject = route.params?.subject || "Subject";
  const student = useStudentStore((s) => s.selectedStudent);

  const [chapters, setChapters] = useState([]);
  const [expandedChapter, setExpandedChapter] = useState(null);
  const [conceptMap, setConceptMap] = useState({});
  const [resumeMap, setResumeMap] = useState({}); 
  const [scoreMap, setScoreMap] = useState({}); // Stores previous scores
  const [loading, setLoading] = useState(true);

  /* ───────── LOAD CHAPTERS ───────── */
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const result = await getChaptersBySubject(student?.class, subject);
        setChapters(result);
      } finally {
        setLoading(false);
      }
    };
    if (student?.class && subject) load();
  }, [student?.class, subject]);

  /* ───────── REFRESH TOPIC STATES ───────── */
  // Refreshes whenever screen is focused or a chapter is expanded
  useEffect(() => {
    if (expandedChapter) {
      updateTopicStates(expandedChapter, conceptMap[expandedChapter] || []);
    }
  }, [isFocused, expandedChapter]);

  const updateTopicStates = async (chapterName, concepts) => {
    if (!concepts.length) return;
    
    const newResumeMap = { ...resumeMap };
    const newScoreMap = { ...scoreMap };

    for (const item of concepts) {
      const topicKey = `${chapterName}_${item.concept}`;
      
      // 1. Check for Resume Session
      const resKey = `quiz_progress_${student.id}_${subject}_${chapterName}_${item.concept}`;
      const savedProgress = await AsyncStorage.getItem(resKey);
      newResumeMap[topicKey] = !!savedProgress;

      // 2. Check for Previous Score (saved in ReportScreen)
      const scoreKey = `quiz_result_${student.id}_${subject}_${chapterName}_${item.concept}`;
      const savedScore = await AsyncStorage.getItem(scoreKey);
      newScoreMap[topicKey] = savedScore; 
    }
    
    setResumeMap(newResumeMap);
    setScoreMap(newScoreMap);
  };

  const toggleChapter = async (chapter) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    
    if (expandedChapter === chapter) {
      setExpandedChapter(null);
      return;
    }

    setExpandedChapter(chapter);

    if (!conceptMap[chapter]) {
      const concepts = await getConceptsByChapter(student.class, subject, chapter);
      setConceptMap((p) => ({ ...p, [chapter]: concepts }));
      await updateTopicStates(chapter, concepts);
    }
  };

  const handleStartTopic = (chapter, topic) => {
    navigation.navigate("QuizPlay", { subject, chapter, topic });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.gold} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <LinearGradient colors={[COLORS.bgTop, COLORS.bgMid, COLORS.bgBottom]} style={styles.screen}>
        <View style={styles.hero}>
          <Text style={styles.heroSubject}>{subject}</Text>
          <Text style={styles.heroSub}>Tap a chapter to manage your topics</Text>
        </View>

        <FlatList
          data={chapters}
          keyExtractor={(item) => item}
          contentContainerStyle={styles.listContent}
          renderItem={({ item: chapterName }) => {
            const isExpanded = expandedChapter === chapterName;
            const topics = conceptMap[chapterName] || [];

            return (
              <View style={[styles.chapterCard, isExpanded && styles.activeCard]}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => toggleChapter(chapterName)}
                  style={styles.chapterHeader}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.chapterTitle}>{chapterName}</Text>
                    <Text style={styles.topicCount}>
                      {isExpanded ? "Choose a topic" : `${topics.length || "?"} Topics available`}
                    </Text>
                  </View>
                  <Ionicons 
                    name={isExpanded ? "chevron-up" : "chevron-down"} 
                    size={20} 
                    color={COLORS.textMuted} 
                  />
                </TouchableOpacity>

                {isExpanded && (
                  <View style={styles.topicList}>
                    {topics.length > 0 ? (
                      topics.map((item, index) => {
                        const topicKey = `${chapterName}_${item.concept}`;
                        const isResumable = resumeMap[topicKey];
                        const prevScore = scoreMap[topicKey];

                        return (
                          <View key={index} style={styles.topicRow}>
                            <View style={{ flex: 1, paddingRight: 10 }}>
                              <Text style={styles.topicName}>{item.concept}</Text>
                              {prevScore && !isResumable && (
                                  <Text style={styles.scoreBadge}>Last Score: {prevScore}%</Text>
                              )}
                            </View>
                            
                            <TouchableOpacity 
                              onPress={() => handleStartTopic(chapterName, item.concept)}
                              style={[
                                  styles.topicBtn, 
                                  isResumable ? styles.btnResume : prevScore ? styles.btnRetry : styles.btnStart
                              ]}
                            >
                              <Text style={[
                                  styles.topicBtnText, 
                                  { color: isResumable ? COLORS.success : prevScore ? COLORS.textMain : COLORS.gold }
                              ]}>
                                {isResumable ? "RESUME" : prevScore ? `${prevScore}% RETRY` : "START"}
                              </Text>
                            </TouchableOpacity>
                          </View>
                        );
                      })
                    ) : (
                      <ActivityIndicator color={COLORS.gold} style={{ margin: 20 }} />
                    )}
                  </View>
                )}
              </View>
            );
          }}
        />
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bgTop },
  screen: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  hero: { paddingTop: 16, paddingHorizontal: 24, paddingBottom: 16 },
  heroSubject: { fontSize: 32, fontWeight: "800", color: "#FFF" },
  heroSub: { fontSize: 14, color: COLORS.textMuted, marginTop: 4 },
  listContent: { paddingHorizontal: 20, paddingBottom: 100 },

  chapterCard: {
    backgroundColor: COLORS.glass,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden",
  },
  activeCard: {
    borderColor: "rgba(234, 179, 8, 0.4)",
    backgroundColor: "rgba(255, 255, 255, 0.08)",
  },
  chapterHeader: {
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
  },
  chapterTitle: { fontSize: 18, fontWeight: "700", color: COLORS.textMain },
  topicCount: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },

  topicList: {
    paddingHorizontal: 20,
    paddingBottom: 15,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.05)",
  },
  topicRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
  },
  topicName: { fontSize: 14, color: "#E2E8F0", fontWeight: "600" },
  scoreBadge: { fontSize: 11, color: COLORS.success, marginTop: 2, fontWeight: "700" },
  
  topicBtn: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 85,
    alignItems: "center",
  },
  btnStart: { borderColor: COLORS.gold },
  btnResume: { borderColor: COLORS.success, backgroundColor: "rgba(16, 185, 129, 0.1)" },
  btnRetry: { borderColor: COLORS.border, backgroundColor: "rgba(255,255,255,0.05)" },
  
  topicBtnText: { fontSize: 10, fontWeight: "900" },
});
