import {
  collection,
  getDocs,
  getDoc,
  query,
  where,
  doc,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../../firebase/config";

/* ✅ 1. GET SUBJECTS BY CLASS (NUMBER SAFE) */
export const getSubjectsByClass = async (studentClass) => {
  if (!studentClass) return [];

  const q = query(
    collection(db, "quizzes"),
    where("metadata.class", "==", Number(studentClass))
  );

  const snap = await getDocs(q);
  const subjects = [];

  snap.docs.forEach((doc) => {
    const data = doc.data();
    const subject = data?.metadata?.subject;
    if (subject) subjects.push(subject);
  });

  return [...new Set(subjects)];
};

/* ✅ 2. GET CHAPTERS BY CLASS + SUBJECT (NUMBER SAFE) */
export const getChaptersBySubject = async (studentClass, subject) => {
  if (!studentClass || !subject) return [];

  const q = query(
    collection(db, "quizzes"),
    where("metadata.class", "==", Number(studentClass)),
    where("metadata.subject", "==", subject)
  );

  const snap = await getDocs(q);
  const chapters = [];

  snap.docs.forEach((doc) => {
    const data = doc.data();
    const chapter = data?.metadata?.chapter;
    if (chapter) chapters.push(chapter);
  });

  return [...new Set(chapters)];
};



/* ✅ 4. SAVE QUIZ ATTEMPT + UPDATE STUDENT STATS */
export const saveQuizAttempt = async ({
  studentId,
  subject,
  chapter,
  total,
  correct,
  scorePercent,
}) => {
  if (!studentId) return;

  const studentRef = doc(db, "students", studentId);
  const historyCollectionRef = collection(
    db,
    "studentHistory",
    studentId,
    "quizzes"
  );

  const wrong = total - correct;

  await runTransaction(db, async (transaction) => {
    const studentSnap = await transaction.get(studentRef);

    if (!studentSnap.exists()) {
      throw new Error("Student not found");
    }

    const data = studentSnap.data();

    const prevAttempts = data.totalQuizzesAttempted || 0;
    const prevCorrect = data.totalCorrectAnswers || 0;
    const prevWrong = data.totalWrongAnswers || 0;
    const prevAvgScore = data.avgScore || 0;

    const newAttempts = prevAttempts + 1;
    const newTotalCorrect = prevCorrect + correct;
    const newTotalWrong = prevWrong + wrong;

    const newAccuracy =
      newTotalCorrect + newTotalWrong > 0
        ? (newTotalCorrect / (newTotalCorrect + newTotalWrong)) * 100
        : 0;

    const newAvgScore =
      (prevAvgScore * prevAttempts + scorePercent) / newAttempts;

    transaction.update(studentRef, {
      totalQuizzesAttempted: newAttempts,
      totalCorrectAnswers: newTotalCorrect,
      totalWrongAnswers: newTotalWrong,
      avgAccuracy: newAccuracy,
      avgScore: newAvgScore,
    });

    const attemptRef = doc(historyCollectionRef);
    transaction.set(attemptRef, {
      subject,
      chapter,
      totalQuestions: total,
      correctAnswers: correct,
      wrongAnswers: wrong,
      scorePercent,
      playedAt: serverTimestamp(),
    });
  });
};
export const getConceptsByChapter = async (studentClass, subject, chapter) => {
  const q = query(
    collection(db, "quizzes"),
    where("metadata.class", "==", Number(studentClass)),
    where("metadata.subject", "==", subject),
    where("metadata.chapter", "==", chapter)
  );

  const snap = await getDocs(q);

  return snap.docs.map((d) => ({
    id: d.id,
    concept: d.data().metadata?.concept,
    totalQuestions: d.data()?.questions?.length || 0,
  }));
};
export const getFullChapterQuiz = async (studentClass, subject, chapter) => {
  const q = query(
    collection(db, "quizzes"),
    where("metadata.class", "==", Number(studentClass)),
    where("metadata.subject", "==", subject),
    where("metadata.chapter", "==", chapter)
  );

  const snap = await getDocs(q);
  if (snap.empty) return null;

  let allQuestions = [];

  snap.docs.forEach((d) => {
    const data = d.data();
    const questions = data.questions || [];

    questions.forEach((q) => {
      allQuestions.push({
        ...q,
        concept: data.metadata?.concept || "General",
      });
    });
  });

  return {
    subject,
    chapter,
    totalQuestions: allQuestions.length,
    questions: allQuestions,
  };
};
