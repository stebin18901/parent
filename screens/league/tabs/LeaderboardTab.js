import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  StyleSheet
} from "react-native";
import { fetchLeaderboard } from "../../../services/firebase/league";

export default function LeaderboardTab({ leagueId }) {
  const [table, setTable] = useState([]);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    const data = await fetchLeaderboard(leagueId);
    setTable(data);
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.hRank}>#</Text>
        <Text style={styles.hTeam}>Team</Text>
        <Text style={styles.h}>P</Text>
        <Text style={styles.h}>W</Text>
        <Text style={styles.h}>Pts</Text>
      </View>

      <FlatList
        data={table}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Text style={styles.rank}>{item.rank}</Text>

            <View style={styles.team}>
              <Image source={{ uri: item.logoUrl }} style={styles.logo} />
              <Text style={styles.teamName}>{item.name}</Text>
            </View>

            <Text style={styles.cell}>{item.played}</Text>
            <Text style={styles.cell}>{item.won}</Text>
            <Text style={styles.points}>{item.points}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  headerRow: {
    flexDirection: "row",
    marginBottom: 10,
  },
  hRank: { width: 30, color: "#9ca3af", fontWeight: "700" },
  hTeam: { flex: 1, color: "#9ca3af", fontWeight: "700" },
  h: { width: 32, textAlign: "center", color: "#9ca3af" },

  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderColor: "rgba(255,255,255,0.1)",
  },
  rank: { width: 30, color: "#fff", fontWeight: "700" },

  team: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  logo: {
    width: 28,
    height: 28,
    marginRight: 10,
  },
  teamName: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 13,
  },
  cell: {
    width: 32,
    textAlign: "center",
    color: "#d1d5db",
  },
  points: {
    width: 32,
    textAlign: "center",
    color: "#EAB308",
    fontWeight: "900",
  },
});
