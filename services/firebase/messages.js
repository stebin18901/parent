import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase/config";

export const fetchHomeMessage = async () => {
  const ref = doc(db, "messages", "guide"); // document ID
  const snap = await getDoc(ref);

  if (!snap.exists()) return null;

  return snap.data().message;
};
