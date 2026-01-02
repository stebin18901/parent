import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  runTransaction,
  serverTimestamp,
  onSnapshot,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";
import { db } from "../../firebase/config";

/** 🔐 Utility: random join code like AB29KQ */
const ALPHANUM = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

const generateJoinCode = (length = 6) => {
  let out = "";
  for (let i = 0; i < length; i++) {
    out += ALPHANUM.charAt(Math.floor(Math.random() * ALPHANUM.length));
  }
  return out;
};

/**
 * ✅ 1. CREATE TEAM
 * - student is HOST
 * - team document created
 * - member subdoc created
 * - student.teamIds updated
 * - enforces max 3 teams per student
 */
export const createTeam = async ({ studentId, name, studentName, studentClass }) => {
  if (!studentId) throw new Error("Student is required");
  if (!name) throw new Error("Team name is required");

  const studentRef = doc(db, "students", studentId);
  const teamsCol = collection(db, "teams");
  const newTeamRef = doc(teamsCol); // auto id
  const joinCode = generateJoinCode();

  await runTransaction(db, async (tx) => {
    const studentSnap = await tx.get(studentRef);
    if (!studentSnap.exists()) {
      throw new Error("Student not found");
    }

    const sData = studentSnap.data();
    const teamIds = sData.teamIds || [];

    if (teamIds.length >= 3) {
      throw new Error("You can be in maximum 3 teams.");
    }

    // ✅ Create team document
    tx.set(newTeamRef, {
      id: newTeamRef.id,
      joinCode,
      name,
      hostStudentId: studentId,
      hostStudentName: studentName || "Player",
      hostClass: studentClass || null,
      totalXP: 0,
      totalCoins: 0,
      memberCount: 1,
      status: "ACTIVE",
      createdAt: serverTimestamp(),
    });

    // ✅ Add host as member
    const memberRef = doc(db, "teams", newTeamRef.id, "members", studentId);
    tx.set(memberRef, {
      studentId,
      name: studentName || "Player",
      class: studentClass || null,
      xp: 0,
      coins: 0,
      role: "HOST",
      status: "APPROVED",
      joinedAt: serverTimestamp(),
    });

    // ✅ Update student profile with this team
    tx.update(studentRef, {
      teamIds: arrayUnion(newTeamRef.id),
    });
  });

  return {
    teamId: newTeamRef.id,
    joinCode,
  };
};

/**
 * ✅ 2. FIND TEAM BY JOIN CODE (for "Join by code" or invite link)
 */
export const findTeamByJoinCode = async (joinCode) => {
  const q = query(
    collection(db, "teams"),
    where("joinCode", "==", joinCode.toUpperCase())
  );

  const snap = await getDocs(q);
  if (snap.empty) return null;

  const docSnap = snap.docs[0];
  return { id: docSnap.id, ...docSnap.data() };
};

/**
 * ✅ 3. REQUEST TO JOIN TEAM
 * - Creates a join request under team
 * - No immediate membership
 * - Host will approve later
 */
export const requestJoinTeam = async ({ teamId, student }) => {
  if (!teamId) throw new Error("Team ID missing");
  if (!student?.id) throw new Error("Student missing");

  const teamRef = doc(db, "teams", teamId);
  const studentRef = doc(db, "students", student.id);
  const joinReqRef = doc(db, "teams", teamId, "joinRequests", student.id);
  const memberRef = doc(db, "teams", teamId, "members", student.id);

  await runTransaction(db, async (tx) => {
    const [teamSnap, studentSnap, memberSnap] = await Promise.all([
      tx.get(teamRef),
      tx.get(studentRef),
      tx.get(memberRef),
    ]);

    if (!teamSnap.exists()) {
      throw new Error("Team not found");
    }
    if (!studentSnap.exists()) {
      throw new Error("Student not found");
    }

    const sData = studentSnap.data();
    const teamIds = sData.teamIds || [];

    if (teamIds.length >= 3) {
      throw new Error("You can be in maximum 3 teams.");
    }

    if (memberSnap.exists()) {
      const m = memberSnap.data();
      if (m.status === "APPROVED") {
        throw new Error("You are already a member of this team.");
      }
    }

    tx.set(joinReqRef, {
      studentId: student.id,
      name: student.name || "Player",
      class: student.class || null,
      requestedAt: serverTimestamp(),
    });
  });
};

/**
 * ✅ 4. LISTEN TO JOIN REQUESTS (HOST VIEW)
 */
export const listenToJoinRequests = (teamId, callback) => {
  if (!teamId) return () => {};

  const reqCol = collection(db, "teams", teamId, "joinRequests");

  return onSnapshot(reqCol, (snap) => {
    const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(rows);
  });
};

/**
 * ✅ 5. APPROVE JOIN REQUEST (HOST ONLY)
 */
export const approveJoinRequest = async ({ teamId, hostStudentId, targetStudentId }) => {
  if (!teamId || !hostStudentId || !targetStudentId) {
    throw new Error("Missing required IDs");
  }

  const teamRef = doc(db, "teams", teamId);
  const targetStudentRef = doc(db, "students", targetStudentId);
  const memberRef = doc(db, "teams", teamId, "members", targetStudentId);
  const joinReqRef = doc(db, "teams", teamId, "joinRequests", targetStudentId);

  await runTransaction(db, async (tx) => {
    const [teamSnap, targetSnap] = await Promise.all([
      tx.get(teamRef),
      tx.get(targetStudentRef),
    ]);

    if (!teamSnap.exists()) throw new Error("Team not found");
    if (!targetSnap.exists()) throw new Error("Student not found");

    const tData = teamSnap.data();
    const sData = targetSnap.data();

    if (tData.hostStudentId !== hostStudentId) {
      throw new Error("Only host can approve members.");
    }

    const teamIds = sData.teamIds || [];
    if (teamIds.length >= 3) {
      throw new Error("Student already in maximum number of teams.");
    }

    const currentCount = tData.memberCount || 0;

    tx.set(memberRef, {
      studentId: targetStudentId,
      name: sData.name || "Player",
      class: sData.class || null,
      xp: 0,
      coins: 0,
      role: "MEMBER",
      status: "APPROVED",
      joinedAt: serverTimestamp(),
    });

    tx.update(teamRef, {
      memberCount: currentCount + 1,
    });

    tx.update(targetStudentRef, {
      teamIds: arrayUnion(teamId),
    });

    tx.delete(joinReqRef);
  });
};

/**
 * ✅ 6. GET ALL TEAMS A STUDENT IS PART OF
 * - Reads student.teamIds
 * - Fetches each team
 */
export const getMyTeams = async (studentId) => {
  if (!studentId) return [];

  const studentRef = doc(db, "students", studentId);
  const snap = await getDoc(studentRef);

  if (!snap.exists()) return [];

  const data = snap.data();
  const teamIds = data.teamIds || [];
  if (!teamIds.length) return [];

  const teams = [];
  for (const id of teamIds) {
    const tRef = doc(db, "teams", id);
    const tSnap = await getDoc(tRef);
    if (tSnap.exists()) {
      teams.push({ id, ...tSnap.data() });
    }
  }

  return teams;
};
/**
 * ✅ 7. REJECT JOIN REQUEST (HOST ONLY)
 */
export const rejectJoinRequest = async ({ teamId, hostStudentId, targetStudentId }) => {
  if (!teamId || !hostStudentId || !targetStudentId) {
    throw new Error("Missing required IDs");
  }

  const teamRef = doc(db, "teams", teamId);
  const joinReqRef = doc(db, "teams", teamId, "joinRequests", targetStudentId);

  await runTransaction(db, async (tx) => {
    const teamSnap = await tx.get(teamRef);
    if (!teamSnap.exists()) throw new Error("Team not found");

    const tData = teamSnap.data();

    if (tData.hostStudentId !== hostStudentId) {
      throw new Error("Only host can reject members.");
    }

    tx.delete(joinReqRef);
  });
};
export function listenToTeamMembers(teamId, callback) {
  try {
    const ref = collection(db, "teams", teamId, "members");
    const q = query(ref);

    return onSnapshot(q, (snapshot) => {
      const rows = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      callback(rows);
    });
  } catch (err) {
    console.error("listenToTeamMembers error:", err);
  }
}
export async function getTeamInfo(teamId) {
  try {
    const ref = doc(db, "teams", teamId);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      return {
        id: snap.id,
        ...snap.data(),
      };
    }
    return null;
  } catch (error) {
    console.error("getTeamInfo error:", error);
    return null;
  }
}
export const removeTeamMember = async ({
  teamId,
  hostStudentId,
  targetStudentId,
}) => {
  if (!teamId || !hostStudentId || !targetStudentId) {
    throw new Error("Missing required parameters");
  }

  const teamRef = doc(db, "teams", teamId);
  const targetStudentRef = doc(db, "students", targetStudentId);
  const memberRef = doc(db, "teams", teamId, "members", targetStudentId);

  await runTransaction(db, async (tx) => {
    const [teamSnap, targetSnap] = await Promise.all([
      tx.get(teamRef),
      tx.get(targetStudentRef),
    ]);

    if (!teamSnap.exists()) throw new Error("Team not found");
    if (!targetSnap.exists()) throw new Error("Student not found");

    const teamData = teamSnap.data();
    const studentData = targetSnap.data();

    // Only host can remove members
    if (teamData.hostStudentId !== hostStudentId) {
      throw new Error("Only the host can remove members.");
    }

    // Cannot remove host
    if (teamData.hostStudentId === targetStudentId) {
      throw new Error("Host cannot remove themselves.");
    }

    const teamIds = studentData.teamIds || [];
    const newCount = (teamData.memberCount || 1) - 1;

    // Remove member subdoc
    tx.delete(memberRef);

    // Update team count
    tx.update(teamRef, {
      memberCount: Math.max(newCount, 0),
    });

    // Remove team from student profile
    tx.update(targetStudentRef, {
      teamIds: arrayRemove(teamId),
    });
  });
};