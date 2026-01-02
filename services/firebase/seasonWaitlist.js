import {
  addDoc,
  collection,
  serverTimestamp,
  query,
  where,
  getDocs,
  limit,
} from "firebase/firestore";
import { db, auth } from "../../firebase/config";

export const hasAlreadyBookedSlot = async (leagueId) => {
  const user = auth.currentUser;
  if (!user) return false;

  const q = query(
    collection(db, "season_waitlist"),
    where("uid", "==", user.uid),
    where("leagueId", "==", leagueId),
    limit(1)
  );

  const snap = await getDocs(q);
  return !snap.empty;
};

export const secureSeasonSlot = async (leagueId) => {
  const user = auth.currentUser;
  if (!user) throw new Error("User not logged in");

  return addDoc(collection(db, "season_waitlist"), {
    uid: user.uid,
    name: user.displayName || "Unknown",
    email: user.email,
    leagueId,
    createdAt: serverTimestamp(),
  });
};
