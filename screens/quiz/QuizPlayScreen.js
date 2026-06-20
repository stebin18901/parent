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
  SafeAreaView,
  PanResponder,
} from "react-native";
import { WebView } from "react-native-webview";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRoute, useNavigation } from "@react-navigation/native";
import { useStudentStore } from "../../state/useStudentStore";
import { getFullChapterQuiz, saveQuizAttempt } from "../../services/firebase/quiz";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

const { width, height: screenHeight } = Dimensions.get("window");

const LatexText = ({ content, style, textColor = "#1E293B", fontSize = 16, fontWeight = 600 }) => {
  const [height, setHeight] = useState(36);
  const flat = StyleSheet.flatten(style) || {};
  const resolvedColor = flat.color || textColor;
  const resolvedSize = flat.fontSize || fontSize;
  const resolvedWeight = flat.fontWeight || fontWeight;
  
  const encodedContent = encodeURIComponent(String(content || ""));
  
  const html = `
    <!doctype html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css" />
        <style>
          html, body {
            width: 100%;
            max-width: 100%;
            overflow-x: hidden; /* Prevent body stretching */
            box-sizing: border-box;
          }
          *, *:before, *:after { box-sizing: inherit; }
          body {
            margin: 0;
            padding: 0;
            background: transparent;
            -webkit-user-select: none;
            user-select: none;
            -webkit-touch-callout: none;
          }
          #root {
            color: ${resolvedColor};
            font-size: ${resolvedSize}px;
            font-weight: ${resolvedWeight};
            line-height: 1.5;
            word-wrap: break-word;
            overflow-wrap: break-word;
            white-space: pre-wrap;
            -webkit-user-select: none;
            user-select: none;
            -webkit-touch-callout: none;
            width: 100%;
          }
          .katex-display { 
            margin: 0.35em 0; 
            overflow-x: auto; 
            overflow-y: hidden; 
            text-align: left !important; /* Fixes left-side cutoff for wide math */
            max-width: 100%;
          }
          .katex-display > .katex {
            text-align: left !important;
          }
        </style>
      </head>
      <body>
        <div id="root"></div>
        <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.js"></script>
        <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/contrib/auto-render.min.js"></script>
        <script>
          const content = decodeURIComponent("${encodedContent}");
          const root = document.getElementById('root');
          root.textContent = content;

          function sendHeight() {
            var h = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight, document.getElementById('root').scrollHeight, 30);
            window.ReactNativeWebView && window.ReactNativeWebView.postMessage(String(h));
          }
          window.addEventListener('load', function() {
            try {
              renderMathInElement(root, {
                delimiters: [
                  {left: "$$", right: "$$", display: true},
                  {left: "\\\\[", right: "\\\\]", display: true},
                  {left: "$", right: "$", display: false},
                  {left: "\\\\(", right: "\\\\)", display: false}
                ],
                throwOnError: false
              });
            } catch (e) {}
            setTimeout(sendHeight, 20);
            setTimeout(sendHeight, 150);
          });
        </script>
      </body>
    </html>
  `;

  return (
    <View style={[style, { minHeight: height, opacity: 0.99 }]}>
      <WebView
        originWhitelist={["*"]}
        source={{ html }}
        scrollEnabled={false}
        javaScriptEnabled
        textInteractionEnabled={false}
        bounces={false}
        onMessage={(e) => {
          const h = Number(e.nativeEvent.data);
          if (!Number.isNaN(h) && h > 0) setHeight(Math.ceil(h));
        }}
        style={{ backgroundColor: "transparent", height, width: '100%' }}
      />
    </View>
  );
};

const NoteHtml = ({ content }) => {
  const [height, setHeight] = useState(120);
  const encodedContent = encodeURIComponent(String(content || ""));
  
  const html = `
    <!doctype html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css" />
        <style>
          html, body {
            width: 100%;
            max-width: 100%;
            overflow-x: hidden; /* Prevents global horizontal scrolling and shifting */
            box-sizing: border-box;
          }
          *, *:before, *:after { box-sizing: inherit; }
          body {
            margin: 0;
            padding: 0;
            background: transparent;
            color: #1E293B;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
            font-size: 15px;
            line-height: 1.7;
            overflow-wrap: break-word;
            word-wrap: break-word;
          }
          #root {
            width: 100%;
          }
          img, video, iframe { 
            max-width: 100%; 
            height: auto; 
            border-radius: 14px; 
            margin: 12px 0; 
            border: 1px solid #E2E8F0; 
            display: block;
          }
          p { margin: 0 0 12px; }
          h1, h2, h3, h4 {
            color: #0F172A;
            margin: 16px 0 8px;
            line-height: 1.25;
            font-weight: 800;
          }
          h1 { font-size: 24px; }
          h2 { font-size: 21px; }
          h3 { font-size: 18px; }
          h4 { font-size: 16px; }
          ul, ol { padding-left: 22px; margin: 8px 0 14px; }
          li { margin-bottom: 8px; }
          strong, b { color: #0F172A; }
          em, i { color: #334155; }
          blockquote {
            margin: 12px 0;
            padding: 10px 12px;
            border-left: 4px solid #FACC15;
            background: #FFFBEB;
            color: #475569;
            border-radius: 10px;
          }
          code, pre {
            font-family: Menlo, Consolas, monospace;
            background: #F1F5F9;
            color: #0F172A;
            border-radius: 8px;
            max-width: 100%;
            overflow-x: auto;
          }
          code { padding: 2px 5px; }
          pre { padding: 12px; }
          table {
            display: block; /* Turns table into block container to enable localized horizontal scroll */
            overflow-x: auto; /* Fixes left-side clipping on tables */
            width: 100%;
            max-width: 100%;
            border-collapse: collapse;
            margin: 12px 0;
            border-radius: 12px;
          }
          td, th {
            border: 1px solid #E2E8F0;
            padding: 9px;
            vertical-align: top;
          }
          th { background: #F8FAFC; color: #0F172A; }
          .katex { color: #0F172A; font-size: 1.04em; }
          .katex-display {
            margin: 0.55em 0 0.8em;
            padding: 8px 10px;
            overflow-x: auto;
            overflow-y: hidden;
            background: #F8FAFC;
            border: 1px solid #E2E8F0;
            border-radius: 12px;
            max-width: 100%;
            text-align: left !important; /* Crucial: stops equation from centering out of left bounds */
          }
          .katex-display > .katex {
            text-align: left !important; 
          }
        </style>
      </head>
      <body>
        <div id="root"></div>
        <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.js"></script>
        <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/contrib/auto-render.min.js"></script>
        <script>
          const root = document.getElementById('root');
          root.innerHTML = decodeURIComponent("${encodedContent}");

          function sendHeight() {
            var h = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight, document.getElementById('root').scrollHeight, 90);
            window.ReactNativeWebView && window.ReactNativeWebView.postMessage(String(h));
          }

          function normalizeLatexTextNodes(node) {
            const skipTags = new Set(['SCRIPT', 'STYLE', 'TEXTAREA', 'PRE', 'CODE']);
            const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT, {
              acceptNode(textNode) {
                const parentTag = textNode.parentElement && textNode.parentElement.tagName;
                return skipTags.has(parentTag) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT;
              }
            });
            const textNodes = [];
            while (walker.nextNode()) textNodes.push(walker.currentNode);
            textNodes.forEach((textNode) => {
              textNode.nodeValue = textNode.nodeValue
                .replace(/\\\\\\\\([()[\\]])/g, '\\\\$1')
                .replace(/\\\\\\\\([a-zA-Z]+)/g, '\\\\$1')
                .replace(/\\\\\\[/g, '\\\\[')
                .replace(/\\\\\\]/g, '\\\\]')
                .replace(/\\\\\\(/g, '\\\\(')
                .replace(/\\\\\\)/g, '\\\\)');
            });
          }

          function renderLatex(attempt) {
            if (root.dataset.mathRendered === 'true') {
              sendHeight();
              return;
            }
            normalizeLatexTextNodes(root);
            if (window.renderMathInElement) {
              try {
                renderMathInElement(root, {
                  delimiters: [
                    {left: "$$", right: "$$", display: true},
                    {left: "\\\\[", right: "\\\\]", display: true},
                    {left: "\\\\(", right: "\\\\)", display: false},
                    {left: "$", right: "$", display: false}
                  ],
                  throwOnError: false,
                  strict: false,
                  trust: true,
                  processEscapes: true,
                  ignoredTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code']
                });
                root.dataset.mathRendered = 'true';
              } catch (e) {}
              setTimeout(sendHeight, 30);
              setTimeout(sendHeight, 180);
              setTimeout(sendHeight, 500);
              return;
            }

            if (attempt < 25) {
              setTimeout(function() { renderLatex(attempt + 1); }, 120);
            } else {
              sendHeight();
            }
          }

          renderLatex(0);
          window.addEventListener('load', function() { 
            renderLatex(0); 
            const imgs = document.querySelectorAll('img');
            imgs.forEach(img => img.addEventListener('load', sendHeight));
          });
          document.addEventListener('DOMContentLoaded', function() { renderLatex(0); });
        </script>
      </body>
    </html>
  `;

  return (
    <View style={{ minHeight: height, width: '100%', opacity: 0.99 }}>
      <WebView
        originWhitelist={["*"]}
        source={{ html }}
        scrollEnabled={false}
        javaScriptEnabled
        textInteractionEnabled={false}
        bounces={false}
        showsVerticalScrollIndicator={false}
        onMessage={(e) => {
          const h = Number(e.nativeEvent.data);
          if (!Number.isNaN(h) && h > 0) setHeight(Math.ceil(h));
        }}
        style={{ backgroundColor: "transparent", height, width: '100%' }}
      />
    </View>
  );
};

const getOptionImageUrl = (question, optionKey, optionIndex) => {
  if (!question?.optionImages) return null;
  if (Array.isArray(question.optionImages)) return question.optionImages[optionIndex] || null;
  if (typeof question.optionImages === "object") return question.optionImages[optionKey] || null;
  return null;
};

const COLORS = {
  bg: "#0F172A",
  surface: "#FFFFFF",
  cardBg: "#F8FAFC",
  accent: "#FACC15",
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
  const { subject, chapter, topic, section } = route.params;
  const student = useStudentStore((s) => s.selectedStudent);

  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const [showResult, setShowResult] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [noteHtml, setNoteHtml] = useState("");
  const [loading, setLoading] = useState(true);
  const noteHtmlRef = useRef("");

  const STORAGE_KEY = `quiz_progress_${student?.id}_${subject}_${chapter}_${topic}`;
  
  const headerPanResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) =>
        gestureState.dy > 12 && Math.abs(gestureState.dx) < 35,
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 24 && noteHtmlRef.current) setShowNotes(true);
      },
    })
  ).current;

  useEffect(() => {
    noteHtmlRef.current = noteHtml;
  }, [noteHtml]);

  useEffect(() => {
    const loadQuiz = async () => {
      try {
        setLoading(true);
        const data = await getFullChapterQuiz(student?.class, subject, chapter);
        if (!data?.questions?.length) return;
        const filtered = data.questions.filter((q) => {
          const conceptMatch = q.concept === topic || data.metadata?.concept === topic;
          const sectionMatch = section ? q.section === section : true;
          return conceptMatch && sectionMatch;
        });
        const finalQuestions = filtered.length > 0 ? filtered : data.questions;
        setQuestions(finalQuestions);
        const selectedNote =
          data.notesByConcept?.[topic] ||
          finalQuestions.find((q) => q.concept === topic)?.noteHtml ||
          finalQuestions[0]?.noteHtml ||
          "";
        setNoteHtml(selectedNote);

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
  const activeSection = question?.section || section || "General";
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
    <SafeAreaView style={styles.safe}>
      <View style={styles.root}>
        <StatusBar barStyle="light-content" />
        
        <LinearGradient 
          colors={[COLORS.bg, "#1E293B"]} 
          style={[styles.header, showNotes && styles.headerNotesOpen]} 
          {...(!showNotes ? headerPanResponder.panHandlers : {})}
        >
          <View style={styles.topBar}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Ionicons name="chevron-back" size={24} color="#FFF" />
            </TouchableOpacity>
            <View style={styles.headerTitleContainer}>
              <Text style={styles.topicTitle} numberOfLines={1}>{topic}</Text>
              <Text style={styles.chapterSubtitle}>{chapter}</Text>
            </View>
            <TouchableOpacity
              onPress={() => noteHtml && setShowNotes((prev) => !prev)}
              style={[styles.notesBtn, !noteHtml && styles.notesBtnDisabled]}
              activeOpacity={0.75}
              disabled={!noteHtml}
            >
              <Ionicons name={showNotes ? "reader" : "document-text-outline"} size={20} color={noteHtml ? COLORS.accent : "#64748B"} />
            </TouchableOpacity>
          </View>

          <View style={styles.progressContainer}>
            <View style={styles.progressTextRow}>
              <Text style={styles.progressLabel}>Question {current + 1} of {questions.length}</Text>
              <View style={styles.badgesRow}>
                <View style={styles.sectionBadge}>
                  <Text style={styles.sectionBadgeText}>{activeSection}</Text>
                </View>
                <View style={[styles.diffBadge, { backgroundColor: (COLORS.difficulty[question.difficulty] || COLORS.accent) + '30' }]}>
                  <Text style={[styles.diffText, { color: COLORS.difficulty[question.difficulty] || COLORS.accent }]}>{question.difficulty}</Text>
                </View>
              </View>
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${((current + 1) / questions.length) * 100}%` }]} />
            </View>
          </View>

          {showNotes && (
            <Animated.View style={styles.notesPanel}>
              <View style={styles.notesHandle} />
              <View style={styles.notesHeader}>
                <View>
                  <Text style={styles.notesLabel}>CONCEPT NOTE</Text>
                  <Text style={styles.notesTitle} numberOfLines={1}>{topic}</Text>
                </View>
                <TouchableOpacity onPress={() => setShowNotes(false)} style={styles.notesCloseBtn}>
                  <Ionicons name="close" size={18} color={COLORS.bg} />
                </TouchableOpacity>
              </View>
              <ScrollView 
                style={styles.notesScroll} 
                contentContainerStyle={styles.notesScrollContent} 
                nestedScrollEnabled 
                showsVerticalScrollIndicator={false}
              >
                <NoteHtml content={noteHtml} />
              </ScrollView>
            </Animated.View>
          )}
        </LinearGradient>

        <ScrollView style={styles.content} contentContainerStyle={styles.scrollPadding} showsVerticalScrollIndicator={false}>
          <View style={styles.questionCard}>
            <Text style={styles.questionType}>{question.type}</Text>
            <LatexText content={question.question} style={styles.questionText} />
            {!!question?.questionImage && (
              <Image source={{ uri: question.questionImage }} style={styles.questionImage} />
            )}
            
            <TouchableOpacity onPress={() => setShowHelp(!showHelp)} style={styles.hintButton}>
              <Ionicons name="bulb-outline" size={18} color={COLORS.accentDark} />
              <Text style={styles.hintButtonText}>{showHelp ? "Close Explanation" : "Stuck? View Concept"}</Text>
            </TouchableOpacity>
          </View>

          {showHelp && <ConceptBox question={question} />}

          <View style={styles.optionsWrapper}>
            {Object.entries(question.options).map(([key, val], optionIndex) => {
              const isSelected = selected === key;
              const isAnswer = question.answer === key;
              const optionImageUrl = getOptionImageUrl(question, key, optionIndex);
              
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
                  <View style={styles.optionContent}>
                    <LatexText content={val} style={styles.optionText} />
                    {!!optionImageUrl && (
                      <Image source={{ uri: optionImageUrl }} style={styles.optionImage} />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>

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
    </SafeAreaView>
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
  safe: { flex: 1, backgroundColor: "#0F172A" },
  root: { flex: 1, backgroundColor: "#F1F5F9" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  
  header: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 25, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  headerNotesOpen: { height: screenHeight * 0.9, paddingBottom: 16 },
  topBar: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  headerTitleContainer: { marginLeft: 15, flex: 1 },
  topicTitle: { color: '#FFF', fontSize: 18, fontWeight: '800' },
  chapterSubtitle: { color: '#94A3B8', fontSize: 12, fontWeight: '600' },
  notesBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(250,204,21,0.12)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(250,204,21,0.25)' },
  notesBtnDisabled: { backgroundColor: 'rgba(148,163,184,0.08)', borderColor: 'rgba(148,163,184,0.12)' },
  notesPanel: {
    marginTop: 18,
    padding: 16,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(226,232,240,0.85)',
    flex: 1,
    minHeight: 0,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 12,
  },
  notesHandle: { alignSelf: 'center', width: 46, height: 5, borderRadius: 999, backgroundColor: '#CBD5E1', marginBottom: 14 },
  notesHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  notesLabel: { color: COLORS.accentDark, fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  notesTitle: { color: COLORS.bg, fontSize: 17, fontWeight: '900', marginTop: 3, maxWidth: width - 118 },
  notesCloseBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
  notesScroll: { flex: 1, minHeight: 0 },
  notesScrollContent: { paddingBottom: 16 },
  
  progressContainer: { marginTop: 5 },
  progressTextRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  progressLabel: { color: '#CBD5E1', fontSize: 12, fontWeight: '700' },
  badgesRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, backgroundColor: 'rgba(148,163,184,0.25)' },
  sectionBadgeText: { color: '#E2E8F0', fontSize: 10, fontWeight: '800', maxWidth: 130 },
  diffBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  diffText: { fontSize: 10, fontWeight: '900' },
  progressTrack: { height: 8, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: COLORS.accent, borderRadius: 4 },

  content: { flex: 1 },
  scrollPadding: { padding: 20, paddingBottom: 150 },
  
  questionCard: { backgroundColor: '#FFF', borderRadius: 24, padding: 20, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 },
  questionType: { color: COLORS.accentDark, fontSize: 11, fontWeight: '900', textTransform: 'uppercase', marginBottom: 8, letterSpacing: 1 },
  questionText: { color: COLORS.textMain, fontSize: 19, fontWeight: '800', lineHeight: 28 },
  questionImage: { width: '100%', height: 180, marginTop: 14, borderRadius: 14, resizeMode: 'cover', backgroundColor: '#E2E8F0' },
  hintButton: { flexDirection: 'row', alignItems: 'center', marginTop: 15, alignSelf: 'flex-start' },
  hintButtonText: { color: COLORS.accentDark, fontSize: 13, fontWeight: '700', marginLeft: 6 },

  optionsWrapper: { marginTop: 20 },
  optionCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 18, borderRadius: 20, marginBottom: 12, borderWidth: 1.5, borderColor: '#F1F5F9' },
  selectedCard: { borderColor: COLORS.accent, backgroundColor: '#FFFDF5' },
  correctCard: { borderColor: COLORS.correct, backgroundColor: '#ECFDF5' },
  wrongCard: { borderColor: COLORS.wrong, backgroundColor: '#FEF2F2' },
  optionIcon: { marginRight: 12 },
  optionContent: { flex: 1 },
  optionText: { color: COLORS.textMain, fontSize: 16, fontWeight: '600' },
  optionImage: { width: '100%', height: 130, marginTop: 10, borderRadius: 12, resizeMode: 'cover', backgroundColor: '#E2E8F0' },

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