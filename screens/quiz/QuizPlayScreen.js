import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  Dimensions,
  ScrollView,
  Animated,
  StatusBar,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRoute, useNavigation } from "@react-navigation/native";
import { useStudentStore } from "../../state/useStudentStore";
import { getFullChapterQuiz, saveQuizAttempt } from "../../services/firebase/quiz";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

// Helper to handle the LaTeX bits found in your JSON
const formatLatex = (text) => {
  if (!text) return "";
  return text
    .replace(/\\\(|\\\)/g, "") 
    .replace(/\\frac\{([^}]*)\}\{([^}]*)\}/g, "($1/$2)") 
    .replace(/\\Delta/g, "Δ") 
    .replace(/\^2/g, "²") 
    .replace(/\\,/g, " ")
    .replace(/\\text\{([^}]*)\}/g, "$1"); // Clean up \text{...}
};

const LatexText = ({ content, style }) => (
  <Text style={style}>{formatLatex(content)}</Text>
);

const COLORS = {
  bg: "#0F172A", // Deep Navy
  surface: "#FFFFFF",
  cardBg: "#F8FAFC",
  accent: "#FACC15", // Vibrant Yellow
  accentDark: "#EAB308",
  border: "#E2E8F0",
  textMain: "#1E293B",
  textMuted: "#64748B",
  correct: "#10B981",
  wrong: "#EF4444",
  difficulty: {
    Beginner: "#22C55E",
    Intermediate: "#3B82F6",
    Advanced: "#F59E0B",
    Challenging: "#EC4899",
    Master: "#8B5CF6"
  }
};

export default function QuizPlayScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { subject, chapter, topic } = route.params;
  const student = useStudentStore((s) => s.selectedStudent);

  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const [showResult, setShowResult] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [loading, setLoading] = useState(true);

  const STORAGE_KEY = `quiz_progress_${student?.id}_${subject}_${chapter}_${topic}`;

  useEffect(() => {
    const loadQuiz = async () => {
      try {
        setLoading(true);
        const data = await getFullChapterQuiz(student?.class, subject, chapter);
        const filtered = data.questions.filter(q => q.concept === topic || data.metadata?.concept === topic);
        const finalQuestions = filtered.length > 0 ? filtered : data.questions;
        setQuestions(finalQuestions);

        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          setCurrent(parsed.current < finalQuestions.length ? parsed.current : 0);
          setAnswers(parsed.answers || {});
          setShowResult(!!parsed.answers?.[parsed.current]);
        }
      } catch (err) {
        console.error("Load Error:", err);
      } finally {
        setLoading(false);
      }
    };
    loadQuiz();
  }, []);

  useEffect(() => {
    if (questions.length > 0) {
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ current, answers }));
    }
  }, [current, answers]);

  if (loading || questions.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.accent} />
      </View>
    );
  }

  const question = questions[current];
  const selected = answers[current];
  const isCorrect = selected === question?.answer;

  const handleSelect = (key) => {
    if (showResult) return;
    setAnswers(prev => ({ ...prev, [current]: key }));
    setShowResult(true);
  };

  const handleAction = async () => {
    if (current < questions.length - 1) {
      setShowResult(false);
      setShowHelp(false);
      setCurrent(prev => prev + 1);
    } else {
      let correctCount = 0;
      questions.forEach((q, i) => { if (answers[i] === q.answer) correctCount++; });
      const score = Math.round((correctCount / questions.length) * 100);

      await saveQuizAttempt({
        studentId: student.id,
        subject, chapter, topic,
        total: questions.length,
        correct: correctCount,
        scorePercent: score
      });

      await AsyncStorage.removeItem(STORAGE_KEY);
      navigation.replace("QuizReport", { subject, chapter, topic, total: questions.length, correct: correctCount, scorePercent: score });
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />
      
      {/* HEADER SECTION */}
      <LinearGradient colors={[COLORS.bg, "#1E293B"]} style={styles.header}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.topicTitle} numberOfLines={1}>{topic}</Text>
            <Text style={styles.chapterSubtitle}>{chapter}</Text>
          </View>
        </View>

        <View style={styles.progressContainer}>
          <View style={styles.progressTextRow}>
            <Text style={styles.progressLabel}>Question {current + 1} of {questions.length}</Text>
            <View style={[styles.diffBadge, { backgroundColor: (COLORS.difficulty[question.difficulty] || COLORS.accent) + '30' }]}>
              <Text style={[styles.diffText, { color: COLORS.difficulty[question.difficulty] || COLORS.accent }]}>{question.difficulty}</Text>
            </View>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${((current + 1) / questions.length) * 100}%` }]} />
          </View>
        </View>
      </LinearGradient>

      {/* QUESTION CONTENT */}
      <ScrollView style={styles.content} contentContainerStyle={styles.scrollPadding} showsVerticalScrollIndicator={false}>
        <View style={styles.questionCard}>
          <Text style={styles.questionType}>{question.type}</Text>
          <LatexText content={question.question} style={styles.questionText} />
          
          <TouchableOpacity onPress={() => setShowHelp(!showHelp)} style={styles.hintButton}>
            <Ionicons name="bulb-outline" size={18} color={COLORS.accentDark} />
            <Text style={styles.hintButtonText}>{showHelp ? "Close Explanation" : "Stuck? View Concept"}</Text>
          </TouchableOpacity>
        </View>

        {showHelp && <ConceptBox question={question} />}

        {/* OPTION LIST */}
        <View style={styles.optionsWrapper}>
          {Object.entries(question.options).map(([key, val]) => {
            const isSelected = selected === key;
            const isAnswer = question.answer === key;
            
            let cardStyle = styles.optionCard;
            let iconName = "ellipse-outline";
            let iconColor = COLORS.border;

            if (showResult) {
              if (isAnswer) {
                cardStyle = [styles.optionCard, styles.correctCard];
                iconName = "checkmark-circle";
                iconColor = COLORS.correct;
              } else if (isSelected) {
                cardStyle = [styles.optionCard, styles.wrongCard];
                iconName = "close-circle";
                iconColor = COLORS.wrong;
              }
            } else if (isSelected) {
              cardStyle = [styles.optionCard, styles.selectedCard];
              iconName = "radio-button-on";
              iconColor = COLORS.accentDark;
            }

            return (
              <TouchableOpacity key={key} style={cardStyle} onPress={() => handleSelect(key)} activeOpacity={0.7}>
                <Ionicons name={iconName} size={22} color={iconColor} style={styles.optionIcon} />
                <LatexText content={val} style={styles.optionText} />
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* BOTTOM ACTION */}
      {showResult && (
        <View style={styles.footer}>
          <LinearGradient 
            colors={isCorrect ? ["#ECFDF5", "#FFFFFF"] : ["#FEF2F2", "#FFFFFF"]} 
            style={styles.feedbackBar}
          >
            <Ionicons name={isCorrect ? "happy-outline" : "alert-circle-outline"} size={24} color={isCorrect ? COLORS.correct : COLORS.wrong} />
            <Text style={[styles.feedbackText, { color: isCorrect ? COLORS.correct : COLORS.wrong }]}>
              {isCorrect ? "Brilliant Work!" : "Learning Moment!" }
            </Text>
          </LinearGradient>

          <TouchableOpacity onPress={handleAction} style={styles.actionBtn}>
            <LinearGradient colors={[COLORS.accent, COLORS.accentDark]} style={styles.actionGradient}>
              <Text style={styles.actionBtnText}>{current === questions.length - 1 ? "Finish Journey" : "Next Question"}</Text>
              <Ionicons name="arrow-forward" size={20} color={COLORS.bg} />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const ConceptBox = ({ question }) => {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => { Animated.spring(anim, { toValue: 1, useNativeDriver: true }).start(); }, []);

  return (
    <Animated.View style={[styles.conceptBox, { transform: [{ scale: anim }], opacity: anim }]}>
      <View style={styles.conceptHeader}>
        <Image 
          source={{ uri: "https://firebasestorage.googleapis.com/v0/b/dreamprojects-cda5b.appspot.com/o/Character%2FGemini_Generated_Image_xvno8dxvno8dxvno-Photoroom.png?alt=media&token=621dc826-ff90-4c96-896b-d419100745cd" }} 
          style={styles.avatar} 
        />
        <View style={styles.conceptMeta}>
          <Text style={styles.conceptLabel}>CORE CONCEPT</Text>
          <LatexText content={question.concept} style={styles.conceptTitle} />
        </View>
      </View>
      
      <View style={styles.divider} />
      
      <View style={styles.conceptSection}>
        <Text style={styles.sectionTitle}>WHY THIS WORKS</Text>
        
        <LatexText content={question.explanation} style={styles.sectionBody} />
      </View>
      
      <View style={styles.conceptSection}>
        <Text style={styles.sectionTitle}>REAL WORLD EXAMPLE</Text>
        <LatexText content={question.example} style={styles.sectionBody} />
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F1F5F9" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  
  header: { paddingHorizontal: 20, paddingTop: 50, paddingBottom: 25, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  topBar: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  headerTitleContainer: { marginLeft: 15, flex: 1 },
  topicTitle: { color: '#FFF', fontSize: 18, fontWeight: '800' },
  chapterSubtitle: { color: '#94A3B8', fontSize: 12, fontWeight: '600' },
  
  progressContainer: { marginTop: 5 },
  progressTextRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  progressLabel: { color: '#CBD5E1', fontSize: 12, fontWeight: '700' },
  diffBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  diffText: { fontSize: 10, fontWeight: '900' },
  progressTrack: { height: 8, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: COLORS.accent, borderRadius: 4 },

  content: { flex: 1 },
  scrollPadding: { padding: 20, paddingBottom: 150 },
  
  questionCard: { backgroundColor: '#FFF', borderRadius: 24, padding: 20, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 },
  questionType: { color: COLORS.accentDark, fontSize: 11, fontWeight: '900', textTransform: 'uppercase', marginBottom: 8, letterSpacing: 1 },
  questionText: { color: COLORS.textMain, fontSize: 19, fontWeight: '800', lineHeight: 28 },
  hintButton: { flexDirection: 'row', alignItems: 'center', marginTop: 15, alignSelf: 'flex-start' },
  hintButtonText: { color: COLORS.accentDark, fontSize: 13, fontWeight: '700', marginLeft: 6 },

  optionsWrapper: { marginTop: 20 },
  optionCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 18, borderRadius: 20, marginBottom: 12, borderWidth: 1.5, borderColor: '#F1F5F9' },
  selectedCard: { borderColor: COLORS.accent, backgroundColor: '#FFFDF5' },
  correctCard: { borderColor: COLORS.correct, backgroundColor: '#ECFDF5' },
  wrongCard: { borderColor: COLORS.wrong, backgroundColor: '#FEF2F2' },
  optionIcon: { marginRight: 12 },
  optionText: { color: COLORS.textMain, fontSize: 16, fontWeight: '600', flex: 1 },

  conceptBox: { backgroundColor: '#F8FAFC', borderRadius: 24, padding: 20, marginTop: 20, borderLeftWidth: 5, borderLeftColor: COLORS.accent },
  conceptHeader: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 50, height: 70, resizeMode: 'contain' },
  conceptMeta: { marginLeft: 15, flex: 1 },
  conceptLabel: { fontSize: 10, fontWeight: '900', color: '#64748B' },
  conceptTitle: { fontSize: 14, fontWeight: '700', color: COLORS.textMain },
  divider: { height: 1, backgroundColor: '#E2E8F0', marginVertical: 15 },
  conceptSection: { marginBottom: 15 },
  sectionTitle: { fontSize: 10, fontWeight: '900', color: '#94A3B8', marginBottom: 5 },
  sectionBody: { fontSize: 13, color: '#475569', lineHeight: 20, fontWeight: '600' },

  footer: { position: 'absolute', bottom: 0, width: '100%', backgroundColor: '#FFF', padding: 20, borderTopLeftRadius: 30, borderTopRightRadius: 30, elevation: 25 },
  feedbackBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 15, marginBottom: 15 },
  feedbackText: { fontSize: 15, fontWeight: '800', marginLeft: 10 },
  actionBtn: { borderRadius: 20, overflow: 'hidden' },
  actionGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 18 },
  actionBtnText: { color: COLORS.bg, fontSize: 16, fontWeight: '900', marginRight: 10 }
});