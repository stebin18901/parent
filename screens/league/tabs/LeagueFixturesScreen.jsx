import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { collection, getDocs, query, where, orderBy } from "firebase/firestore";
import { db } from "../../../firebase/config";

export default function LeagueFixturesScreen({ leagueId }) {
  const [fixtures, setFixtures] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFixtures();
  }, [leagueId]);

  const fetchFixtures = async () => {
    try {
      const q = query(
        collection(db, "matches"),
        where("leagueId", "==", leagueId),
        orderBy("date", "asc"),
        orderBy("startTime", "asc")
      );

      const snap = await getDocs(q);
      setFixtures(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error("Fixture load error", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <ActivityIndicator style={{ marginTop: 40 }} />;
  }

  if (!fixtures.length) {
    return (
      <Text style={styles.empty}>
        No fixtures scheduled yet
      </Text>
    );
  }

  return (
    <FlatList
      data={fixtures}
      keyExtractor={(item) => item.id}
      contentContainerStyle={{ paddingBottom: 80 }}
      renderItem={({ item, index }) => (
        <View style={styles.card}>
          <Text style={styles.matchNo}>Match {index + 1}</Text>

          <View style={styles.row}>
            <Text style={styles.team}>{item.teamA.name}</Text>
            <Text style={styles.vs}>vs</Text>
            <Text style={styles.team}>{item.teamB.name}</Text>
          </View>

          <Text style={styles.meta}>
            {item.date} · {item.startTime}
          </Text>

          <Text style={styles.status}>{item.status}</Text>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 16,
    backgroundColor: "#1F2933",
  },
  matchNo: {
    color: "#9CA3AF",
    fontSize: 12,
  },
  row: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 10,
  },
  team: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  vs: {
    marginHorizontal: 10,
    color: "#FACC15",
    fontWeight: "800",
  },
  meta: {
    textAlign: "center",
    color: "#9CA3AF",
    marginTop: 4,
  },
  status: {
    marginTop: 6,
    textAlign: "center",
    fontWeight: "700",
    color: "#22C55E",
  },
  empty: {
    marginTop: 60,
    textAlign: "center",
    color: "#9CA3AF",
  },
});
