import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator
} from "react-native";
import {
  fetchAllMatches,
  getMatchStatus
} from "../../../services/firebase/league";

const TABS = ["UPCOMING", "LIVE", "COMPLETED"];

export default function MatchesTab({ leagueId }) {
  const [matches, setMatches] = useState([]);
  const [active, setActive] = useState("UPCOMING");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (leagueId) {
      load();
    }
  }, [leagueId]);

  const load = async () => {
    setLoading(true);
    // This now calls the updated fetchAllMatches that includes team join logic
    const data = await fetchAllMatches(leagueId);
    setMatches(data);
    setLoading(false);
  };

  const filtered = matches.filter(
    m => getMatchStatus(m) === active
  );

  if (loading) return <ActivityIndicator color="#EAB308" style={{ marginTop: 50 }} />;

  return (
    <View style={styles.container}>
      {/* STATUS TABS */}
      <View style={styles.tabRow}>
        {TABS.map(t => (
          <TouchableOpacity key={t} onPress={() => setActive(t)}>
            <Text style={[styles.tab, active === t && styles.active]}>
              {t}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* MATCH LIST */}
      <FlatList
        data={filtered}
        keyExtractor={i => i.id}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <Text style={styles.empty}>No {active.toLowerCase()} matches right now</Text>
        }
        renderItem={({ item }) => (
          <View style={styles.matchItem}>
            <View style={styles.matchHeader}>
              <Text style={styles.dateText}>{item.date}</Text>
              <View style={styles.dot} />
              <Text style={styles.timeText}>{item.startTime || "20:00"}</Text>
            </View>

            <View style={styles.matchMain}>
              {/* Team A */}
              <View style={styles.teamSection}>
                <Image source={{ uri: item.teamA?.logoUrl }} style={styles.teamLogo} />
                <Text style={styles.teamNameText} numberOfLines={1}>{item.teamA?.name}</Text>
              </View>

              {/* Center Score/VS Area */}
              <View style={styles.scoreContainer}>
                {active === "COMPLETED" ? (
                  <Text style={styles.finalScore}>
                    {item.teamA?.score ?? 0} : {item.teamB?.score ?? 0}
                  </Text>
                ) : (
                  <View style={styles.vsBadge}>
                    <Text style={styles.vsText}>VS</Text>
                  </View>
                )}
                {active === "LIVE" && <Text style={styles.liveIndicator}>• LIVE</Text>}
              </View>

              {/* Team B */}
              <View style={[styles.teamSection, { alignItems: 'flex-end' }]}>
                <Image source={{ uri: item.teamB?.logoUrl }} style={styles.teamLogo} />
                <Text style={styles.teamNameText} numberOfLines={1}>{item.teamB?.name}</Text>
              </View>
            </View>
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
    flex: 1,
  },
  tabRow: {
    flexDirection: "row",
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  tab: {
    marginRight: 25,
    fontSize: 14,
    color: "#6b7280",
    fontWeight: "800",
    paddingBottom: 10,
  },
  active: {
    color: "#EAB308",
    borderBottomWidth: 3,
    borderColor: "#EAB308",
  },
  matchItem: {
    backgroundColor: "rgba(30,30,30,0.6)",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  matchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  dateText: { color: '#9ca3af', fontSize: 11, fontWeight: '600' },
  dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#4b5563', marginHorizontal: 8 },
  timeText: { color: '#EAB308', fontSize: 11, fontWeight: '700' },
  matchMain: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  teamSection: {
    flex: 1,
    alignItems: 'flex-start',
  },
  teamLogo: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#2d2d2d',
    marginBottom: 6,
  },
  teamNameText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
    width: '100%',
  },
  scoreContainer: {
    width: 80,
    alignItems: 'center',
  },
  finalScore: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 2,
  },
  vsBadge: {
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  vsText: { color: '#4b5563', fontWeight: '900', fontSize: 12 },
  liveIndicator: {
    color: '#ef4444',
    fontSize: 10,
    fontWeight: '900',
    marginTop: 4,
  },
  empty: {
    marginTop: 40,
    textAlign: "center",
    color: "#6b7280",
    fontSize: 14,
  },
});