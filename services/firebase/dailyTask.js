import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../../firebase/config";

export const listenToDailyTask = (callback) => {
  const ref = doc(db, "dailyTask", "current");
  return onSnapshot(
    ref,
    (snap) => {
      if (snap.exists()) {
        callback({ id: snap.id, ...snap.data() });
      } else {
        callback(null);
      }
    },
    () => callback(null)
  );
};
