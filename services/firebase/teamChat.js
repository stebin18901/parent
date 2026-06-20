import {
  addDoc,
  collection,
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  orderBy,
  query,
  limit,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../../firebase/config";

export const listenToTeamMessages = (teamId, callback, maxItems = 200) => {
  if (!teamId) return () => {};
  const q = query(
    collection(db, "teams", teamId, "messages"),
    orderBy("createdAt", "asc"),
    limit(maxItems)
  );
  return onSnapshot(
    q,
    (snap) => {
      const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      callback(rows);
    },
    () => callback([])
  );
};

export const sendTeamMessage = async ({ teamId, student, text, type = "chat" }) => {
  if (!teamId) throw new Error("Team is required");
  if (!student?.id) throw new Error("Student is required");
  const trimmed = String(text || "").trim();
  if (!trimmed) return;

  await addDoc(collection(db, "teams", teamId, "messages"), {
    text: trimmed,
    type,
    authorId: student.id,
    authorName: student.name || "Player",
    authorPhoto: student.photoUrl || "",
    createdAt: serverTimestamp(),
  });
};

export const listenToTeamQuestions = (teamId, callback, maxItems = 80) => {
  if (!teamId) return () => {};
  const q = query(
    collection(db, "teams", teamId, "questions"),
    orderBy("createdAt", "desc"),
    limit(maxItems)
  );
  return onSnapshot(
    q,
    (snap) => {
      const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      callback(rows);
    },
    () => callback([])
  );
};

export const createTeamQuestion = async ({ teamId, student, question, options, correctIndex, imageBase64, imageType }) => {
  if (!teamId) throw new Error("Team is required");
  if (!student?.id) throw new Error("Student is required");
  const qText = String(question || "").trim();
  if (!qText) throw new Error("Question is required");
  const safeOptions = (options || []).map((o) => String(o || "").trim()).filter(Boolean);
  if (safeOptions.length < 2) throw new Error("At least two options are required");

  await addDoc(collection(db, "teams", teamId, "questions"), {
    question: qText,
    options: safeOptions,
    correctIndex: Number.isFinite(correctIndex) ? correctIndex : 0,
    imageBase64: imageBase64 || "",
    imageType: imageType || "",
    authorId: student.id,
    authorName: student.name || "Player",
    createdAt: serverTimestamp(),
  });
};

export const submitTeamAnswer = async ({ teamId, questionId, student, selectedIndex, correctIndex }) => {
  if (!teamId || !questionId) throw new Error("Team and question are required");
  if (!student?.id) throw new Error("Student is required");
  const answerRef = doc(db, "teams", teamId, "questions", questionId, "answers", student.id);
  await setDoc(answerRef, {
    teamId,
    questionId,
    studentId: student.id,
    studentName: student.name || "Player",
    selectedIndex,
    correctIndex,
    isCorrect: Number(selectedIndex) === Number(correctIndex),
    answeredAt: serverTimestamp(),
  });
};

export const getMyAnswerMap = async ({ teamId, questionIds, studentId }) => {
  if (!teamId || !studentId || !Array.isArray(questionIds) || questionIds.length === 0) return {};
  const results = {};
  await Promise.all(
    questionIds.map(async (qid) => {
      const ref = doc(db, "teams", teamId, "questions", qid, "answers", studentId);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        results[qid] = snap.data();
      }
    })
  );
  return results;
};
