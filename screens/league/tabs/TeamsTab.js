import React, { useEffect, useState } from "react";
import { View, Text, FlatList, StyleSheet, Image } from "react-native";
import { fetchLeagueTeams } from "../../../services/firebase/league";

export default function TeamsTab({ leagueId }) {
  const [teams, setTeams] = useState([]);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    const data = await fetchLeagueTeams(leagueId);
    setTeams(data);
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={teams}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Image source={{ uri: item.logoUrl }} style={styles.logo} />
            <Text style={styles.name}>{item.name}</Text>
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
  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    backgroundColor: "rgba(40,40,40,0.9)",
    borderRadius: 14,
    marginBottom: 12,
  },
  logo: {
    width: 36,
    height: 36,
    marginRight: 12,
    borderRadius: 18,
  },
  name: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 15,
  },
});
