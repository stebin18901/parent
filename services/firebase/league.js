import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit
} from "firebase/firestore";
import { db } from "../../firebase/config";

/* ===========================
   LEADERBOARD COMPUTATION
=========================== */
export async function fetchLeaderboard(leagueId) {
  const teamsSnap = await getDocs(
    query(collection(db, "teams"), where("leagueId", "==", leagueId))
  );

  const resultsSnap = await getDocs(
    query(collection(db, "matchResults"), where("leagueId", "==", leagueId))
  );

  const teams = {};
  teamsSnap.forEach(doc => {
    teams[doc.id] = {
      id: doc.id,
      name: doc.data().name,
      logoUrl: doc.data().logoUrl,
      played: 0,
      won: 0,
      score: 0,
      points: 0,
    };
  });

  resultsSnap.forEach(doc => {
    const r = doc.data();

    const a = teams[r.teamA.teamId];
    const b = teams[r.teamB.teamId];

    if (!a || !b) return;

    a.played++;
    b.played++;

    a.score += r.teamA.score;
    b.score += r.teamB.score;

    if (r.winnerTeamId === a.id) {
      a.won++;
      a.points += 2;
    } else {
      b.won++;
      b.points += 2;
    }
  });

  return Object.values(teams)
    .sort((x, y) =>
      y.points - x.points || y.score - x.score
    )
    .map((t, i) => ({ ...t, rank: i + 1 }));
}

// In league.js - update line 36
// services/firebase/league.js

export async function fetchAllMatches(leagueId) {
  try {
    // 1. Simplified query (No 'orderBy' here means no composite index needed)
    const fixtureSnap = await getDocs(
      query(
        collection(db, "leagueFixtures"), 
        where("leagueId", "==", leagueId)
      )
    );
    
    // 2. Sort the data in JavaScript instead
    let fixtures = fixtureSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    fixtures.sort((a, b) => new Date(a.date) - new Date(b.date));

    if (fixtures.length === 0) return [];

    // 3. Get Teams to join data
    const teamsSnap = await getDocs(
      query(collection(db, "teams"), where("leagueId", "==", leagueId))
    );
    
    const teamsMap = {};
    teamsSnap.forEach(doc => { teamsMap[doc.id] = doc.data(); });

    // 4. Join Data
    return fixtures.map(f => ({
      ...f,
      teamA: { ...f.teamA, ...(teamsMap[f.teamA.teamId] || teamsMap[f.teamA.id] || {}) },
      teamB: { ...f.teamB, ...(teamsMap[f.teamB.teamId] || teamsMap[f.teamB.id] || {}) }
    }));
  } catch (error) {
    console.error("Fetch All Matches Error:", error);
    return [];
  }
}

export async function fetchUpcomingMatches(leagueId, count = 5) {
  try {
    const q = query(
      collection(db, "leagueFixtures"),
      where("leagueId", "==", leagueId),
      where("status", "==", "UPCOMING"),
      orderBy("date", "asc"),
      limit(count)
    );
    const snap = await getDocs(q);
    const fixtures = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    if (fixtures.length === 0) return [];

    const teamsSnap = await getDocs(query(collection(db, "teams"), where("leagueId", "==", leagueId)));
    const teamsMap = {};
    teamsSnap.forEach(doc => { teamsMap[doc.id] = doc.data(); });

    return fixtures.map(f => ({
      ...f,
      teamA: { ...f.teamA, ...(teamsMap[f.teamA.teamId] || teamsMap[f.teamA.id] || {}) },
      teamB: { ...f.teamB, ...(teamsMap[f.teamB.teamId] || teamsMap[f.teamB.id] || {}) }
    }));
  } catch (error) {
    console.error("Fetch Upcoming Error:", error);
    return [];
  }
}
/* ===========================
   MATCH STATUS
=========================== */
export function getMatchStatus(match) {
  // If the database says it's COMPLETED, trust the database
  if (match.status === "COMPLETED") return "COMPLETED";

  const start = new Date(`${match.date}T${match.startTime || "00:00"}`);
  const end = new Date(start.getTime() + 60 * 60 * 1000); // 60 mins duration
  const now = new Date();

  if (now < start) return "UPCOMING";
  if (now >= start && now < end) return "LIVE";
  
  // If time has passed but status is still UPCOMING, 
  // you might want to show it as LIVE or COMPLETED
  return "COMPLETED"; 
}
/* ===========================
   TOP SCORERS (SIMULATED)
=========================== */
export async function fetchTopScorers(leagueId) {
  const teamsSnap = await getDocs(
    query(collection(db, "teams"), where("leagueId", "==", leagueId))
  );

  const resultsSnap = await getDocs(
    query(collection(db, "matchResults"), where("leagueId", "==", leagueId))
  );

  const players = {};

  // Build team-player map
  const teamMap = {};
  teamsSnap.forEach(doc => {
    teamMap[doc.id] = doc.data();
  });

  resultsSnap.forEach(doc => {
    const r = doc.data();

    ["teamA", "teamB"].forEach(side => {
      const teamId = r[side].teamId;
      const team = teamMap[teamId];
      if (!team) return;

      const members = team.members || [];
      if (!members.length) return;

      const captainName = team.captain?.name;
      const totalScore = r[side].score;

      // Captain weight
      const captainScore = Math.floor(totalScore * 0.28);
      const remaining = totalScore - captainScore;
      const perMember = Math.floor(remaining / (members.length - 1));

      // Add captain
      if (!players[captainName]) {
        players[captainName] = {
          name: captainName,
          team: team.name,
          score: 0,
        };
      }
      players[captainName].score += captainScore;

      // Add members
      members.forEach(m => {
        if (m === captainName) return;

        if (!players[m]) {
          players[m] = {
            name: m,
            team: team.name,
            score: 0,
          };
        }
        players[m].score += perMember;
      });
    });
  });

  return Object.values(players)
    .sort((a, b) => b.score - a.score)
    .slice(0, 20)
    .map((p, i) => ({ ...p, rank: i + 1 }));
}
export async function fetchActiveLeague() {
  const q = query(
    collection(db, "leagues"),
    where("status", "==", "ACTIVE")
  );

  const snap = await getDocs(q);

  if (snap.empty) return null;

  const docRef = snap.docs[0];
  return { id: docRef.id, ...docRef.data() };
}