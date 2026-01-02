import { 
  collection, doc, setDoc, addDoc, serverTimestamp, 
  query, orderBy, onSnapshot, limit 
} from "firebase/firestore";
import { db } from "../../firebase/config";

/**
 * Sends subtitles. 
 * If isFinal is false, it updates a "live" document to show real-time typing.
 */
export async function sendSubtitle(teamId, sender, text, isFinal = false) {
  if (!teamId || !sender?.id || !text?.trim()) return null;

  try {
    // For partial results, we use a fixed ID per student to "stream" text into one bubble
    // For final results, we can let it become a permanent record
    const docId = isFinal ? null : `live_${sender.id}`;
    
    const payload = {
      studentId: sender.id,
      name: sender.name || "Player",
      photo: sender.photoURL || null,
      text: text.trim(),
      isFinal: isFinal,
      createdAt: serverTimestamp(),
    };

    if (isFinal) {
      // Create a permanent record
      await addDoc(collection(db, "teams", teamId, "subtitles"), payload);
      // Clean up the live doc if it exists
      await setDoc(doc(db, "teams", teamId, "subtitles", `live_${sender.id}`), { text: "" }, { merge: true });
    } else {
      // Update the live "typing" bubble
      await setDoc(doc(db, "teams", teamId, "subtitles", docId), payload, { merge: true });
    }
  } catch (err) {
    console.error("sendSubtitle failed:", err);
  }
}

export function listenToSubtitles(teamId, callback) {
  if (!teamId) return () => {};
  // Only grab the last 5 messages to keep the overlay clean
  const q = query(
    collection(db, "teams", teamId, "subtitles"),
    orderBy("createdAt", "desc"),
    limit(5)
  );

  return onSnapshot(q, (snap) => {
    const rows = snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .filter(m => m.text !== "") // Filter out cleaned-up live docs
      .reverse(); // Back to chronological for the UI
    callback(rows);
  });
}