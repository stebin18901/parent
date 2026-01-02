import {
  collection,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  doc,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../../../firebase/config";

/* ===========================
   CONFIG
=========================== */

// Match days: Tue, Thu, Sun
const MATCH_DAYS = [2, 4, 0];

// League duration
const LEAGUE_DURATION_DAYS = 60;

// Match duration (minutes)
const MATCH_DURATION_MINUTES = 30;

/* =========================================================
   PUBLIC API (SAFE TO CALL ON EVERY APP OPEN)
========================================================= */
/* =========================================================
   ROUND ROBIN SCHEDULER (FIXED LOGIC)
========================================================= */
export async function runLeagueEngine(league) {
  if (!league?.id) return;

  // 1. Check if fixtures already exist to prevent double-generation
  const existing = await getDocs(
    query(collection(db, "leagueFixtures"), where("leagueId", "==", league.id))
  );
  if (!existing.empty) return;

  const teamsSnap = await getDocs(
    query(collection(db, "teams"), where("leagueId", "==", league.id))
  );

  let teams = teamsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  if (teams.length < 2) return;

  // If odd number of teams, add a "BYE" team (standard practice)
  if (teams.length % 2 !== 0) {
    teams.push({ id: "bye", name: "BYE", isBye: true });
  }

  const numTeams = teams.length;
  const numRounds = numTeams - 1;
  const half = numTeams / 2;

  let matchDayCursor = new Date(league.startDate || league.leagueStartDate || new Date());
  let fixtureCount = 0;

  // Rotate teams for Round Robin
  for (let round = 0; round < numRounds; round++) {
    for (let i = 0; i < half; i++) {
      const teamA = teams[i];
      const teamB = teams[numTeams - 1 - i];

      // Skip the match if it's a "BYE"
      if (teamA.isBye || teamB.isBye) continue;

      // Assign to specific match days (Tue, Thu, Sun)
      while (!MATCH_DAYS.includes(matchDayCursor.getDay())) {
        matchDayCursor.setDate(matchDayCursor.getDate() + 1);
      }

      const fixtureId = `${league.id}_round_${round}_match_${i}`;
      
      await setDoc(doc(db, "leagueFixtures", fixtureId), {
        leagueId: league.id,
        matchIndex: fixtureCount,
        date: matchDayCursor.toISOString().split("T")[0],
        startTime: league.dailyMatchTime || "18:00",
        status: "UPCOMING",
        teamA: { teamId: teamA.id, name: teamA.name, logoUrl: teamA.logoUrl || null },
        teamB: { teamId: teamB.id, name: teamB.name, logoUrl: teamB.logoUrl || null },
        createdAt: serverTimestamp()
      });

      fixtureCount++;
    }
    
    // Rotate teams array for next round (keep first team fixed)
    teams.splice(1, 0, teams.pop());
    
    // Move to next available match day for the next round
    matchDayCursor.setDate(matchDayCursor.getDate() + 1);
  }
}

/* =========================================================
   STEP 1 — FIXTURE GENERATION (RUN ONCE)
========================================================= */
async function generateFixturesIfNeeded(league) {
  // 1. Safety Check: If fixtures exist, do nothing
  const existing = await getDocs(
    query(collection(db, "leagueFixtures"), where("leagueId", "==", league.id))
  );
  if (!existing.empty) return;

  // 2. Get and Shuffle Teams
  const teamsSnap = await getDocs(
    query(collection(db, "teams"), where("leagueId", "==", league.id))
  );
  let teams = teamsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  
  // Shuffle to ensure Palakkad isn't always Team 1
  teams = teams.sort(() => Math.random() - 0.5);

  if (teams.length < 2) return;

  // 3. Handle Odd Numbers (BYE)
  if (teams.length % 2 !== 0) {
    teams.push({ id: "bye", name: "BYE", isBye: true });
  }

  const numTeams = teams.length;
  const numRounds = numTeams - 1;
  const half = numTeams / 2;
  let cursor = new Date(league.leagueStartDate || league.startDate);

  // 4. Round Robin Rotation
  for (let round = 0; round < numRounds; round++) {
    for (let i = 0; i < half; i++) {
      const teamA = teams[i];
      const teamB = teams[numTeams - 1 - i];

      if (teamA.isBye || teamB.isBye) continue;

      // Find next valid match day (Tue, Thu, Sun)
      while (!MATCH_DAYS.includes(cursor.getDay())) {
        cursor.setDate(cursor.getDate() + 1);
      }

      const fixtureId = `${league.id}_round_${round}_match_${i}`;
      await setDoc(doc(db, "leagueFixtures", fixtureId), {
        leagueId: league.id,
        date: cursor.toISOString().split("T")[0],
        startTime: league.dailyMatchTime || "20:00",
        status: "UPCOMING",
        teamA: { teamId: teamA.id, name: teamA.name, logoUrl: teamA.logoUrl || null },
        teamB: { teamId: teamB.id, name: teamB.name, logoUrl: teamB.logoUrl || null },
        createdAt: serverTimestamp(),
      });
    }
    // Rotate teams (keeping the first one fixed)
    teams.splice(1, 0, teams.pop());
    cursor.setDate(cursor.getDate() + 1);
  }
}

/* =========================================================
   STEP 2 — RESULT GENERATION (TIME-BASED)
========================================================= */
async function generateResultsIfDue(league) {
  const now = new Date();

  const fixturesSnap = await getDocs(
    query(
      collection(db, "leagueFixtures"),
      where("leagueId", "==", league.id),
      where("status", "==", "UPCOMING")
    )
  );

  for (const snap of fixturesSnap.docs) {
    const match = snap.data();
    const matchStart = new Date(`${match.date}T${match.startTime}`);

    // Not started yet → skip
    if (now < matchStart) continue;

    // Generate realistic scores
    const scoreA = generateScore(match.teamA.teamId);
    const scoreB = generateScore(match.teamB.teamId);

    const winnerTeamId =
      scoreA === scoreB
        ? Math.random() > 0.5
          ? match.teamA.teamId
          : match.teamB.teamId
        : scoreA > scoreB
        ? match.teamA.teamId
        : match.teamB.teamId;

    await updateDoc(doc(db, "leagueFixtures", snap.id), {
      status: "COMPLETED",

      teamA: {
        ...match.teamA,
        score: scoreA,
      },
      teamB: {
        ...match.teamB,
        score: scoreB,
      },

      winnerTeamId,
      completedAt: serverTimestamp(),
    });

    // Update league status once first match completes
    if (league.status !== "LIVE") {
      await updateDoc(doc(db, "leagues", league.id), {
        status: "LIVE",
        startedAt: serverTimestamp(),
      });
    }
  }
}

/* =========================================================
   SCORE LOGIC (REALISTIC & STABLE)
========================================================= */
function generateScore(teamId) {
  // Simple, believable score band
  return Math.floor(60 + Math.random() * 40);
}
