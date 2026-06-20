import {
  doc,
  onSnapshot,
  collection,
  query,
  orderBy,
  limit,
} from "firebase/firestore";
import { db } from "../../firebase/config";

export const listenToStudentStats = (studentId, callback) => {
  if (!studentId) return () => {};

  const studentRef = doc(db, "students", studentId);

  return onSnapshot(
    studentRef,
    (snap) => {
      if (!snap.exists()) {
        callback({
          quizzesCompleted: 0,
          avgScore: 0,
          avgAccuracy: 0,
        });
        return;
      }

      const data = snap.data();
      callback({
        quizzesCompleted: data.totalQuizzesAttempted ?? 0,
        avgScore: Math.round(data.avgScore ?? 0),
        avgAccuracy: Math.round(data.avgAccuracy ?? 0),
      });
    },
    () => {
      callback({
        quizzesCompleted: 0,
        avgScore: 0,
        avgAccuracy: 0,
      });
    }
  );
};

export const listenToStudentHistory = (studentId, callback, maxItems = 20) => {
  if (!studentId) return () => {};

  const historyRef = collection(db, "studentHistory", studentId, "quizzes");
  const q = query(historyRef, orderBy("playedAt", "desc"), limit(maxItems));

  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs.map((docSnap) => {
        const d = docSnap.data();
        return {
          id: docSnap.id,
          subject: d.subject || "Subject",
          chapter: d.chapter || "Chapter",
          scorePercent: d.scorePercent ?? 0,
          correctAnswers: d.correctAnswers ?? 0,
          totalQuestions: d.totalQuestions ?? 0,
          playedAt: d.playedAt,
        };
      });
      callback(items);
    },
    () => callback([])
  );
};
