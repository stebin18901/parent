import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import LeaderboardTab from "../tabs/LeaderboardTab";
import MatchesTab from "../tabs/MatchesTab";
import LeagueFixturesScreen from "../tabs/LeagueFixturesScreen";
import TeamsTab from "../tabs/TeamsTab";
import TopScorersTab from "../tabs/TopScorersTab";


const tabs = ["Leaderboard", "Matches", "Top Scorers", "Teams"];


export default function LeagueTabs({ leagueId }) {
  const [active, setActive] = useState("Leaderboard");

  const renderTab = () => {
    if (active === "Leaderboard") return <LeaderboardTab leagueId={leagueId} />;
    if (active === "Matches") return <MatchesTab leagueId={leagueId} />;
    if (active === "Top Scorers") return <TopScorersTab leagueId={leagueId} />;
    if (active === "Teams") return <TeamsTab leagueId={leagueId} />;


    return null;
  };

  return (
    <View>
      <View style={styles.tabRow}>
        {tabs.map((t) => (
          <TouchableOpacity key={t} onPress={() => setActive(t)}>
            <Text style={[styles.tab, active === t && styles.active]}>
              {t}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {renderTab()}
    </View>
  );
}

const styles = StyleSheet.create({
  tabRow: {
    flexDirection: "row",
    marginTop: 28,
    paddingHorizontal: 24,
  },
  tab: {
    marginRight: 22,
    fontSize: 14,
    color: "#a3a3a3",
    fontWeight: "700",
  },
  active: {
    color: "#ffffff",
    borderBottomWidth: 3,
    borderColor: "#EAB308",
    paddingBottom: 6,
  },
});
