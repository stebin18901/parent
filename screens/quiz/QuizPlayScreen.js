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
  Easing,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRoute, useNavigation } from "@react-navigation/native";
import { useStudentStore } from "../../state/useStudentStore";
import {
  getFullChapterQuiz,
  saveQuizAttempt,
} from "../../services/firebase/quiz";
import { LinearGradient } from "expo-linear-gradient";

const { width } = Dimensions.get("window");

/* ───────── COLORS ───────── */
const COLORS = {
  bg: "#0B1220",
  surface: "#FFFFFF",
  border: "#E5E7EB",

  textMain: "#020617",
  textMuted: "#64748B",

  accent: "#FACC15",
  accentDark: "#EAB308",

  correctBg: "#ECFDF5",
  correctText: "#15803D",

  wrongBg: "#FEE2E2",
  wrongText: "#B91C1C",
};

export default function QuizPlayScreen() {
  const route = useRoute();
  const navigation = useNavigation();

  const { subject, chapter } = route.params;
  const student = useStudentStore((s) => s.selectedStudent);

  const [quiz, setQuiz] = useState(null);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const [showResult, setShowResult] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [loading, setLoading] = useState(true);

  const resumeLoadedRef = useRef(false);
  const STORAGE_KEY = `quiz_progress_${student?.id}_${subject}_${chapter}`;

  /* ───────── LOAD QUIZ ───────── */
  useEffect(() => {
    const loadQuiz = async () => {
      try {
        setLoading(true);
        const qz = await getFullChapterQuiz(
          student?.class,
          subject,
          chapter
        );
        setQuiz(qz);

        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          setCurrent(parsed.current || 0);
          setAnswers(parsed.answers || {});
          setShowResult(!!parsed.answers?.[parsed.current]);
        }

        resumeLoadedRef.current = true;
      } finally {
        setLoading(false);
      }
    };

    if (student?.class && subject && chapter) loadQuiz();
  }, [student?.class, subject, chapter]);

  /* ───────── AUTO SAVE ───────── */
  useEffect(() => {
    if (!resumeLoadedRef.current) return;
    AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ current, answers })
    );
  }, [current, answers]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.accent} />
      </View>
    );
  }

  const questions = quiz.questions;
  const question = questions[current];
  const selected = answers[current];
  const isCorrect = selected === question.answer;

  /* ───────── ANSWER ───────── */
  const selectAnswer = (key) => {
    if (showResult) return;
    setAnswers((p) => ({ ...p, [current]: key }));
    setShowResult(true);
  };

  /* ───────── NEXT / FINISH ───────── */
  const next = () => {
    setShowResult(false);
    setShowHelp(false);
    setCurrent((c) => c + 1);
  };

  const finish = async () => {
    let correct = 0;
    questions.forEach((q, i) => {
      if (answers[i] === q.answer) correct++;
    });

    await saveQuizAttempt({
      studentId: student.id,
      subject,
      chapter,
      total: questions.length,
      correct,
      scorePercent: Math.round((correct / questions.length) * 100),
    });

    await AsyncStorage.removeItem(STORAGE_KEY);

    navigation.replace("QuizReport", {
      subject,
      chapter,
      total: questions.length,
      correct,
    });
  };

  const progress = (current + 1) / questions.length;

  return (
    <View style={styles.root}>
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.subject}>{subject}</Text>
        <Text style={styles.meta}>
          {chapter} · Question {current + 1} of {questions.length}
        </Text>

        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${progress * 100}%` },
            ]}
          />
        </View>
      </View>

      {/* CONTENT */}
      <ScrollView
        style={styles.card}
        contentContainerStyle={{ paddingBottom: 180 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.questionRow}>
          <Text style={styles.question}>{question.question}</Text>

          <TouchableOpacity
            onPress={() => setShowHelp((p) => !p)}
            style={styles.helpBtn}
          >
            <Text style={styles.helpText}>
              {showHelp ? "Hide" : "Help"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* GAME HELP */}
        {showHelp && <GameHelpAnimated question={question} />}

        {/* OPTIONS */}
        {Object.entries(question.options || {}).map(([key, val]) => {
          let bg = "#F9FAFB";
          let border = COLORS.border;
          let text = COLORS.textMain;

          if (showResult) {
            if (question.answer === key) {
              bg = COLORS.correctBg;
              border = COLORS.correctText;
              text = COLORS.correctText;
            } else if (selected === key) {
              bg = COLORS.wrongBg;
              border = COLORS.wrongText;
              text = COLORS.wrongText;
            }
          } else if (selected === key) {
            bg = "#FEF3C7";
            border = COLORS.accent;
          }

          return (
            <TouchableOpacity
              key={key}
              style={[
                styles.option,
                { backgroundColor: bg, borderColor: border },
              ]}
              onPress={() => selectAnswer(key)}
              activeOpacity={0.85}
            >
              <Text style={[styles.optionText, { color: text }]}>
                {key}. {val}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* FOOTER */}
      {showResult && (
        <View style={styles.footer}>
          <Text
            style={[
              styles.feedback,
              { color: isCorrect ? COLORS.correctText : COLORS.wrongText },
            ]}
          >
            {isCorrect ? "Correct!" : "Incorrect"}
          </Text>

          <TouchableOpacity
            onPress={
              current === questions.length - 1 ? finish : next
            }
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={[COLORS.accent, COLORS.accentDark]}
              style={styles.actionBtn}
            >
              <Text style={styles.actionText}>
                {current === questions.length - 1
                  ? "Finish Quiz"
                  : "Next Question"}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

/* ───────── GAME HELP WITH DELAYED ANIMATION ───────── */

const GameHelpAnimated = ({ question }) => {
  const avatarAnim = useRef(new Animated.Value(0)).current;
  const bubbleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(avatarAnim, {
        toValue: 1,
        duration: 350,
        easing: Easing.out(Easing.back(1.2)),
        useNativeDriver: true,
      }),
      Animated.timing(bubbleAnim, {
        toValue: 1,
        duration: 250,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <View style={styles.gameHelpWrapper}>
      <Animated.View
        style={[
          styles.avatarStage,
          {
            opacity: avatarAnim,
            transform: [
              {
                translateY: avatarAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0],
                }),
              },
              {
                scale: avatarAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.9, 1],
                }),
              },
            ],
          },
        ]}
      >
        <Image
          source={{
            uri: "https://firebasestorage.googleapis.com/v0/b/dreamprojects-cda5b.appspot.com/o/Character%2FGemini_Generated_Image_xvno8dxvno8dxvno-Photoroom.png?alt=media&token=621dc826-ff90-4c96-896b-d419100745cd",
          }}
          style={styles.gameAvatar}
          resizeMode="contain"
        />
      </Animated.View>

      <Animated.View
        style={[
          styles.speechBubble,
          {
            opacity: bubbleAnim,
            transform: [
              {
                translateX: bubbleAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-12, 0],
                }),
              },
            ],
          },
        ]}
      >
        <Text style={styles.bubbleTitle}>💡 Concept</Text>
        <Text style={styles.bubbleText}>{question.concept}</Text>

        <Text style={styles.bubbleTitle}>🎯 Example</Text>
        <Text style={styles.bubbleText}>{question.example}</Text>

        <Text style={styles.bubbleTitle}>🧠 Why this works</Text>
        <Text style={styles.bubbleText}>{question.explanation}</Text>
      </Animated.View>
    </View>
  );
};

/* ───────── STYLES ───────── */

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },

  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  header: { paddingTop: 36, paddingHorizontal: 20, paddingBottom: 16 },

  subject: { fontSize: 22, fontWeight: "900", color: "#FFF" },

  meta: { fontSize: 13, color: "#CBD5E1", marginTop: 4 },

  progressBar: {
    height: 6,
    backgroundColor: "#1F2937",
    borderRadius: 999,
    marginTop: 14,
  },

  progressFill: { height: "100%", backgroundColor: COLORS.accent },

  card: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
  },

  questionRow: { flexDirection: "row", gap: 10 },

  question: {
    flex: 1,
    fontSize: 17,
    fontWeight: "800",
    color: COLORS.textMain,
  },

  helpBtn: {
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 14,
    height: 30,
    paddingVertical: 6,
    borderRadius: 999,
  },

  helpText: { fontSize: 12, fontWeight: "900", color: "#92400E" },

  option: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    marginTop: 12,
  },

  optionText: { fontSize: 14, fontWeight: "700" },

  gameHelpWrapper: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginTop: 18,
  },

  avatarStage: {
    width: 100,
    height: 160,
    justifyContent: "flex-end",
    alignItems: "center",
  },

  gameAvatar: {
    width: 140,
    height: 170,
  },

  speechBubble: {
    flex: 1,
    backgroundColor: "#FFF7D6",
    padding: 14,
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    borderWidth: 2,
    borderColor: "#FACC15",
    marginLeft: 6,
    elevation: 4,
  },

  bubbleTitle: {
    fontSize: 12,
    fontWeight: "900",
    color: "#92400E",
    marginTop: 6,
  },

  bubbleText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1F2937",
    lineHeight: 18,
  },

  footer: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    padding: 20,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderColor: COLORS.border,
  },

  feedback: {
    textAlign: "center",
    fontSize: 14,
    fontWeight: "800",
    marginBottom: 12,
  },

  actionBtn: {
    paddingVertical: 16,
    borderRadius: 22,
    alignItems: "center",
  },

  actionText: {
    fontSize: 15,
    fontWeight: "900",
    color: "#0B1220",
  },
});
