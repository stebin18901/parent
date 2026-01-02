import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../../firebase/config";

/* ✅ LIVE STUDENT LISTENER */
export const listenToStudentLive = (studentId, callback) => {
  if (!studentId) return () => {};

  const ref = doc(db, "students", studentId);

  return onSnapshot(ref, (snap) => {
    if (snap.exists()) {
      callback({ id: snap.id, ...snap.data() });
    }
  });
};
