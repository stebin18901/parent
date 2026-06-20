import { collection, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { db } from "../../firebase/config";

export const listenToStoryModePromos = (callback, maxItems = 10) => {
  const q = query(
    collection(db, "storyModePromos"),
    where("active", "==", true),
    orderBy("order", "asc")
  );

  return onSnapshot(
    q,
    (snap) => {
      const rows = snap.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
      callback(rows.slice(0, maxItems));
    },
    () => callback([])
  );
};
