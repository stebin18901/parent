import React, { useEffect, useState } from "react";
import { FlatList } from "react-native";
import MatchCard from "./MatchCard";
import { fetchUpcomingMatches } from "../../../services/firebase/league";

export default function HorizontalMatchSlider({ leagueId }) {
  const [matches, setMatches] = useState([]);

  useEffect(() => {
    loadMatches();
  }, []);

  const loadMatches = async () => {
    const data = await fetchUpcomingMatches(leagueId, 5);
    setMatches(data);
  };

  return (
    <FlatList
      data={matches}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingLeft: 20, paddingVertical: 14 }}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <MatchCard match={item} />}
    />
  );
}
