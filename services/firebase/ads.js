import { collection, onSnapshot, orderBy, query, where, limit } from "firebase/firestore";
import { db } from "../../firebase/config";
import { addDoc, serverTimestamp } from "firebase/firestore";

export const listenToAds = (callback, maxItems = 6) => {
  const q = query(
    collection(db, "ads"),
    where("active", "==", true),
    orderBy("order", "asc"),
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

export const seedDefaultAd = async () => {
  await addDoc(collection(db, "ads"), {
    active: true,
    order: 1,
    title: "Story Mode Quiz",
    subtitle: "Adventure-driven quizzes with rewards and checkpoints.",
    imageUrl: "https://firebasestorage.googleapis.com/v0/b/dreamprojects-cda5b.appspot.com/o/home%2Fplayercard-Photoroom%20(2).png?alt=media",
    ctaText: "Learn more",
    ctaRoute: "StoryModePromo",
    bgStart: "#4338CA",
    bgEnd: "#312E81",
    createdAt: serverTimestamp(),
  });
};
