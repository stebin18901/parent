import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase/config";

export const fetchSeasonTeaserLink = async () => {
  const ref = doc(db, "links", "video");
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    throw new Error("Video link not found");
  }

  return snap.data().link;
};
