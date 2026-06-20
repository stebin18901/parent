import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";

import { useStudentStore } from "../../state/useStudentStore";
import {
  listenToTeamMessages,
  listenToTeamQuestions,
  sendTeamMessage,
  createTeamQuestion,
  submitTeamAnswer,
  getMyAnswerMap,
} from "../../services/firebase/teamChat";
import { listenToTeamMembers, getTeamInfo } from "../../services/firebase/team";

const COLORS = {
  bgTop: "#F7FAFF",
  bgBottom: "#EEF2FF",
  surface: "#FFFFFF",
  border: "#E2E8F0",
  textMain: "#0F172A",
  textSub: "#475569",
  textMuted: "#94A3B8",
  accent: "#2563EB",
  accentDark: "#1D4ED8",
  success: "#10B981",
  chip: "#E0E7FF",
  bubbleMine: "#DBEAFE",
  bubbleOther: "#FFFFFF",
};

export default function TeamChatScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { teamId, teamName = "Team", joinCode } = route.params || {};
  const student = useStudentStore((s) => s.selectedStudent);

  const [tab, setTab] = useState("chat");
  const [message, setMessage] = useState("");
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", "", "", ""]);
  const [answerIndex, setAnswerIndex] = useState(0);
  const [showComposer, setShowComposer] = useState(false);
  const [imagePreview, setImagePreview] = useState("");
  const [imageBase64, setImageBase64] = useState("");
  const [imageType, setImageType] = useState("");
  const [messages, setMessages] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [answersMap, setAnswersMap] = useState({});
  const [members, setMembers] = useState([]);
  const [teamInfo, setTeamInfo] = useState(null);

  const listRef = useRef(null);
  const optionLabels = useMemo(() => ["A", "B", "C", "D"], []);

  // --- Listeners ---
  useEffect(() => {
    if (!teamId) return;
    const unsubMessages = listenToTeamMessages(teamId, setMessages);
    const unsubQuestions = listenToTeamQuestions(teamId, setQuestions);
    const unsubMembers = listenToTeamMembers(teamId, setMembers);
    getTeamInfo(teamId).then(setTeamInfo).catch(() => {});
    return () => {
      unsubMessages?.();
      unsubQuestions?.();
      unsubMembers?.();
    };
  }, [teamId]);

  useEffect(() => {
    if (!teamId || !student?.id || questions.length === 0) return;
    const ids = questions.map((q) => q.id);
    getMyAnswerMap({ teamId, questionIds: ids, studentId: student.id })
      .then((map) => setAnswersMap(map))
      .catch(() => {});
  }, [teamId, student?.id, questions]);

  useEffect(() => {
    if (!listRef.current || tab !== "chat" || messages.length === 0) return;
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messages, tab]);

  const canSend = message.trim().length > 0;
  const canPostQuestion = question.trim().length > 0 && options.every((o) => o.trim().length > 0);

  // --- Handlers ---
  const handleSend = async () => {
    if (!canSend || !teamId || !student) return;
    await sendTeamMessage({ teamId, student, text: message, type: "doubt" });
    setMessage("");
  };

  const handlePostQuestion = async () => {
    if (!canPostQuestion || !teamId || !student) return;
    await createTeamQuestion({
      teamId,
      student,
      question,
      options,
      correctIndex: answerIndex,
      imageBase64,
      imageType,
    });
    setQuestion("");
    setOptions(["", "", "", ""]);
    setAnswerIndex(0);
    setImagePreview("");
    setImageBase64("");
    setImageType("");
    setTab("questions");
    setShowComposer(false);
  };

  const handleAttachImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Please allow photo access to attach images.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
      base64: true,
    });
    if (result.canceled || !result.assets?.length) return;
    const asset = result.assets[0];
    try {
      const manipulated = await ImageManipulator.manipulateAsync(
        asset.uri,
        [{ resize: { width: 900 } }],
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG, base64: true }
      );
      setImagePreview(manipulated.uri);
      setImageBase64(manipulated.base64);
      setImageType("image/jpeg");
    } catch (err) {
      Alert.alert("Image error", "Unable to process the image.");
    }
  };

  const handleAnswer = async (questionItem, selectedIndex) => {
    if (!teamId || !student) return;
    await submitTeamAnswer({
      teamId,
      questionId: questionItem.id,
      student,
      selectedIndex,
      correctIndex: questionItem.correctIndex ?? 0,
    });
    setAnswersMap((prev) => ({
      ...prev,
      [questionItem.id]: {
        selectedIndex,
        isCorrect: selectedIndex === (questionItem.correctIndex ?? 0),
      },
    }));
  };

  // --- Header UI Components ---
  const ListHeader = () => (
    <View style={{ backgroundColor: 'transparent' }}>
      {/* Members Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Members</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.friendRow}>
          {members.length === 0 ? (
            <Text style={styles.emptyText}>No members yet.</Text>
          ) : (
            members.map((m) => (
              <View key={m.id || m.studentId} style={styles.memberChip}>
                <View style={styles.memberAvatar}>
                  <Text style={styles.memberInitial}>{String(m.name || "P").charAt(0).toUpperCase()}</Text>
                </View>
                <Text style={styles.memberName} numberOfLines={1}>{m.name || "Player"}</Text>
              </View>
            ))
          )}
        </ScrollView>
      </View>

      {/* Tab Switcher */}
      <View style={styles.tabRow}>
        <TouchableOpacity style={[styles.tabBtn, tab === "chat" && styles.tabActive]} onPress={() => setTab("chat")}>
          <Text style={[styles.tabText, tab === "chat" && styles.tabTextActive]}>Chat</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tabBtn, tab === "questions" && styles.tabActive]} onPress={() => setTab("questions")}>
          <Text style={[styles.tabText, tab === "questions" && styles.tabTextActive]}>Questions</Text>
        </TouchableOpacity>
      </View>

      {/* Question Composer (Only in Questions Tab) */}
      {tab === "questions" && (
        <>
          <View style={styles.questionsHeader}>
            <View>
              <Text style={styles.questionsTitle}>Team Questions</Text>
              <Text style={styles.questionsSub}>Collaborative learning</Text>
            </View>
            <TouchableOpacity style={styles.addBtn} onPress={() => setShowComposer(!showComposer)}>
              <MaterialCommunityIcons name={showComposer ? "close" : "plus"} size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {showComposer && (
            <View style={styles.card}>
              <TextInput
                value={question}
                onChangeText={setQuestion}
                placeholder="Write question..."
                style={[styles.input, styles.inputQuestion]}
                multiline
              />
              {options.map((opt, idx) => (
                <View key={idx} style={styles.optionRow}>
                  <View style={styles.optionLabel}><Text style={styles.optionLabelText}>{optionLabels[idx]}</Text></View>
                  <TextInput
                    value={opt}
                    onChangeText={(t) => { let n = [...options]; n[idx] = t; setOptions(n); }}
                    placeholder={`Option ${optionLabels[idx]}`}
                    style={styles.optionInput}
                  />
                  <TouchableOpacity
                    style={[styles.answerChip, answerIndex === idx && styles.answerChipActive]}
                    onPress={() => setAnswerIndex(idx)}
                  >
                    <Text style={[styles.answerText, answerIndex === idx && styles.answerTextActive]}>✓</Text>
                  </TouchableOpacity>
                </View>
              ))}
              <View style={styles.actionsRow}>
                <TouchableOpacity onPress={handleAttachImage} style={styles.attachBtn}>
                  <MaterialCommunityIcons name="camera" size={18} color={COLORS.accent} />
                  <Text style={styles.attachText}>{imagePreview ? "Change" : "Add Image"}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handlePostQuestion} disabled={!canPostQuestion}>
                  <LinearGradient colors={[COLORS.accent, COLORS.accentDark]} style={styles.postGradient}>
                    <Text style={styles.postText}>Post</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          )}
          <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Recent Questions</Text>
        </>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <LinearGradient colors={[COLORS.bgTop, COLORS.bgBottom]} style={styles.container}>
          
          {/* FIXED TOP HEADER */}
          <View style={styles.headerCard}>
            <View>
              <Text style={styles.title}>{teamName}</Text>
              <View style={styles.metaRow}>
                <View style={styles.metaPill}>
                  <MaterialCommunityIcons name="account-group" size={12} color={COLORS.textSub} />
                  <Text style={styles.metaText}>{members.length} members</Text>
                </View>
                {joinCode && (
                  <View style={styles.metaPill}>
                    <Text style={styles.metaText}>Code: {joinCode}</Text>
                  </View>
                )}
              </View>
            </View>
            <TouchableOpacity style={styles.inviteBtn} onPress={() => Alert.alert("Join Code", joinCode)}>
              <MaterialCommunityIcons name="account-multiple-plus" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* MAIN UNIFIED LIST */}
          <FlatList
            ref={listRef}
            data={tab === "chat" ? messages : questions}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={ListHeader}
            contentContainerStyle={{ paddingBottom: 160 }}
            renderItem={({ item }) => {
              if (tab === "chat") {
                const isMine = item.authorId === student?.id;
                return (
                  <View style={[styles.messageRow, isMine && styles.messageRowMine]}>
                    {!isMine && <Image source={{ uri: item.authorPhoto || "https://ui-avatars.com/api/?name=U" }} style={styles.avatar} />}
                    <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleOther]}>
                      {!isMine && <Text style={styles.bubbleName}>{item.authorName}</Text>}
                      <Text style={styles.bubbleText}>{item.text}</Text>
                    </View>
                  </View>
                );
              } else {
                const ans = answersMap[item.id];
                return (
                  <View style={styles.questionCard}>
                    <Text style={styles.questionText}>{item.question}</Text>
                    {item.imageBase64 && <Image source={{ uri: `data:${item.imageType};base64,${item.imageBase64}` }} style={styles.questionImage} />}
                    <View style={styles.optionGrid}>
                      {item.options?.map((opt, idx) => (
                        <TouchableOpacity
                          key={idx}
                          style={[styles.optionBtn, ans?.selectedIndex === idx && styles.optionBtnSelected, ans && idx === item.correctIndex && styles.optionBtnCorrect]}
                          disabled={!!ans}
                          onPress={() => handleAnswer(item, idx)}
                        >
                          <Text style={styles.optionItem}>{optionLabels[idx]}. {opt}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                );
              }
            }}
          />

          {/* CHAT INPUT (Pinned at bottom, only in Chat tab) */}
          {tab === "chat" && (
            <View style={[styles.inputWrap, { bottom: insets.bottom + 70 }]}>
              <TextInput
                value={message}
                onChangeText={setMessage}
                placeholder="Ask a doubt..."
                placeholderTextColor={COLORS.textMuted}
                style={styles.input}
                multiline
              />
              <TouchableOpacity
                style={[styles.sendBtn, !canSend && styles.sendBtnDisabled]}
                disabled={!canSend}
                onPress={handleSend}
              >
                <MaterialCommunityIcons name="send" size={18} color={canSend ? "#FFFFFF" : "#CBD5E1"} />
              </TouchableOpacity>
            </View>
          )}

        </LinearGradient>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bgTop },
  container: { flex: 1, paddingHorizontal: 16 },

  headerCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    padding: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  title: { fontSize: 18, fontWeight: "900", color: COLORS.textMain },
  metaRow: { flexDirection: "row", gap: 6, marginTop: 4 },
  metaPill: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: COLORS.chip, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  metaText: { fontSize: 10, fontWeight: "800", color: COLORS.textSub },
  inviteBtn: { width: 34, height: 34, borderRadius: 10, backgroundColor: COLORS.accent, alignItems: "center", justifyContent: "center" },

  section: { marginTop: 8, marginBottom: 12 },
  sectionTitle: { fontSize: 11, fontWeight: "900", color: COLORS.textSub, letterSpacing: 1.2, marginBottom: 8 },
  friendRow: { gap: 8 },
  memberChip: { flexDirection: "row", alignItems: "center", backgroundColor: COLORS.chip, padding: 6, borderRadius: 16, gap: 6 },
  memberAvatar: { width: 22, height: 22, borderRadius: 11, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center" },
  memberInitial: { fontSize: 10, fontWeight: "900", color: COLORS.accent },
  memberName: { fontSize: 10, fontWeight: "800" },

  tabRow: { flexDirection: "row", backgroundColor: COLORS.surface, borderRadius: 14, padding: 4, borderWidth: 1, borderColor: COLORS.border, marginBottom: 10 },
  tabBtn: { flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: "center" },
  tabActive: { backgroundColor: COLORS.chip },
  tabText: { fontSize: 12, fontWeight: "800", color: COLORS.textMuted },
  tabTextActive: { color: COLORS.accent },

  messageRow: { flexDirection: "row", alignItems: "flex-end", gap: 8, marginBottom: 10 },
  messageRowMine: { justifyContent: "flex-end" },
  avatar: { width: 28, height: 28, borderRadius: 14 },
  bubble: { padding: 12, borderRadius: 16, maxWidth: "80%", borderWidth: 1, borderColor: COLORS.border },
  bubbleMine: { backgroundColor: COLORS.bubbleMine },
  bubbleOther: { backgroundColor: COLORS.bubbleOther },
  bubbleName: { fontSize: 10, fontWeight: "800", color: COLORS.textSub, marginBottom: 2 },
  bubbleText: { fontSize: 13, color: COLORS.textMain, fontWeight: "600" },

  inputWrap: {
    position: "absolute",
    left: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  input: { flex: 1, fontSize: 14, maxHeight: 100, paddingHorizontal: 12 },
  sendBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: COLORS.accent, alignItems: "center", justifyContent: "center" },
  sendBtnDisabled: { backgroundColor: COLORS.border },

  questionsHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 10 },
  questionsTitle: { fontSize: 16, fontWeight: "900" },
  questionsSub: { fontSize: 11, color: COLORS.textSub },
  addBtn: { width: 32, height: 32, borderRadius: 8, backgroundColor: COLORS.accent, alignItems: "center", justifyContent: "center" },
  card: { backgroundColor: COLORS.surface, borderRadius: 16, padding: 12, marginTop: 12, borderWidth: 1, borderColor: COLORS.border },
  inputQuestion: { minHeight: 60, fontSize: 13 },
  optionRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 8 },
  optionLabel: { width: 24, height: 24, borderRadius: 6, backgroundColor: COLORS.chip, alignItems: "center", justifyContent: "center" },
  optionLabelText: { fontSize: 10, fontWeight: "900" },
  optionInput: { flex: 1, backgroundColor: "#F8FAFC", borderRadius: 8, padding: 6, fontSize: 12, borderWidth: 1, borderColor: COLORS.border },
  answerChip: { padding: 6, borderRadius: 8, backgroundColor: "#F1F5F9" },
  answerChipActive: { backgroundColor: "#DCFCE7" },
  actionsRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 12, alignItems: "center" },
  attachBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
  attachText: { fontSize: 11, fontWeight: "700" },
  postGradient: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
  postText: { color: "#FFF", fontWeight: "900", fontSize: 12 },

  questionCard: { backgroundColor: COLORS.surface, borderRadius: 14, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: COLORS.border },
  questionText: { fontSize: 13, fontWeight: "800", marginBottom: 10 },
  questionImage: { width: "100%", height: 150, borderRadius: 10, marginBottom: 10 },
  optionGrid: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  optionBtn: { width: "48%", padding: 8, borderRadius: 8, backgroundColor: "#F8FAFC", borderWidth: 1, borderColor: COLORS.border },
  optionBtnSelected: { backgroundColor: COLORS.bubbleMine, borderColor: COLORS.accent },
  optionBtnCorrect: { backgroundColor: "#DCFCE7", borderColor: COLORS.success },
  optionItem: { fontSize: 11, fontWeight: "600" },
  emptyText: { fontSize: 11, color: COLORS.textMuted, textAlign: "center", marginTop: 10 }
});
