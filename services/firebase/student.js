import { collection, addDoc, query, where, getDocs, serverTimestamp } from "firebase/firestore";
import { db } from "../../firebase/config";

// ✅ Create Student WITH ALL REQUIRED DEFAULTS
export const createStudent = async (parentId, data) => {
  const docRef = await addDoc(collection(db, "students"), {
    parentId,
    name: data.name,
    schoolId: null,
    class: data.class,
    section: data.section || "",
    status: "UNVERIFIED",

    // ✅ GAMIFICATION DEFAULTS
    coins: 50,          // 🎁 Welcome Coins
    xp: 0,
    level: 1,
    streak: 0,

    // ✅ PERFORMANCE DEFAULTS
    totalQuizzesAttempted: 0,
    totalCorrectAnswers: 0,
    totalWrongAnswers: 0,
    avgAccuracy: 0,
    avgScore: 0,

    // ✅ CONTEST DEFAULTS
    totalContestsPlayed: 0,
    totalContestsWon: 0,
    bestRank: null,

    // ✅ LEAGUE PREP (FUTURE)
    activeLeagueId: null,
    activeTeamId: null,

    createdAt: serverTimestamp(),
  });

  return docRef.id;
};

// ✅ Get Students by Parent (NO CHANGE)
export const getStudentsByParent = async (parentId) => {
  const q = query(collection(db, "students"), where("parentId", "==", parentId));
  const querySnapshot = await getDocs(q);

  const students = [];
  querySnapshot.forEach((doc) => {
    students.push({ id: doc.id, ...doc.data() });
  });

  return students;
};
