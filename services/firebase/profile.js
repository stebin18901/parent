import {
  doc,
  onSnapshot,
  collection,
  query,
  orderBy,
  limit,
} from "firebase/firestore";
import { db } from "../../firebase/config";

/**
 * ✅ Live stats for a student
 * Expects document at: studentStats/{studentId}
 * Gracefully falls back to defaults if missing.
 */
export const listenToStudentStats = (studentId, callback) => {
  if (!studentId) return () => {};

  const statsRef = doc(db, "studentStats", studentId);

  return onSnapshot(
    statsRef,
    (snap) => {
      if (!snap.exists()) {
        callback({
          contestsPlayed: 0,
          wins: 0,
          podiums: 0,
        });
      } else {
        const data = snap.data();
        callback({
          contestsPlayed: data.contestsPlayed ?? 0,
          wins: data.wins ?? 0,
          podiums: data.podiums ?? 0,
        });
      }
    },
    () => {
      // On error, still give safe defaults
      callback({
        contestsPlayed: 0,
        wins: 0,
        podiums: 0,
      });
    }
  );
};

/**
 * ✅ Recent contest history (latest 10)
 * Expects documents at: studentHistory/{studentId}/contests/{docId}
 */
export const listenToStudentHistory = (studentId, callback) => {
  if (!studentId) return () => {};

  const historyRef = collection(db, "studentHistory", studentId, "contests");
  const q = query(historyRef, orderBy("playedAt", "desc"), limit(10));

  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));
      callback(items);
    },
    () => {
      callback([]);
    }
  );
};
