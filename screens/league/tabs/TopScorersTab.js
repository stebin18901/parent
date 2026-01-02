import React, { useEffect, useState } from "react";
import { View, Text, FlatList, StyleSheet } from "react-native";
import { fetchTopScorers } from "../../../services/firebase/league";

export default function TopScorersTab({ leagueId }) {
  const [players, setPlayers] = useState([]);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    const data = await fetchTopScorers(leagueId);
    setPlayers(data);
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={players}
        keyExtractor={(i) => i.name}
        ListEmptyComponent={
          <Text style={styles.empty}>No data yet</Text>
        }
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Text style={styles.rank}>{item.rank}</Text>

            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.team}>{item.team}</Text>
            </View>

            <Text style={styles.score}>{item.score}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderColor: "rgba(255,255,255,0.1)",
  },
  rank: {
    width: 26,
    color: "#EAB308",
    fontWeight: "900",
  },
  name: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 14,
  },
  team: {
    fontSize: 12,
    color: "#9ca3af",
  },
  score: {
    color: "#fff",
    fontWeight: "900",
  },
  empty: {
    textAlign: "center",
    color: "#9ca3af",
    marginTop: 40,
  },
});
