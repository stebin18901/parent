import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  Alert,
  LayoutAnimation,
  Platform,
  UIManager,
  SafeAreaView,
  StatusBar,
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useStudentStore } from "../../state/useStudentStore";
import {
  createTeam,
  findTeamByJoinCode,
  requestJoinTeam,
  getMyTeams,
} from "../../services/firebase/team";
import { LinearGradient } from "expo-linear-gradient";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function TeamHubScreen() {
  const navigation = useNavigation();
  const student = useStudentStore((s) => s.selectedStudent);

  const [teamName, setTeamName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [teams, setTeams] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [mode, setMode] = useState("none"); // none | create | join

  const loadTeams = async () => {
    if (!student?.id) return;
    setRefreshing(true);
    try {
      const res = await getMyTeams(student.id);
      setTeams(res || []);
    } catch (err) {
      console.log("load teams error:", err);
    } finally {
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadTeams();
    }, [student?.id])
  );

  const handleCreateTeam = async () => {
    if (teams.length >= 3) return Alert.alert("Limit Reached", "You can only be in 3 teams.");
    if (!teamName.trim()) return Alert.alert("Team name required");

    try {
      setLoading(true);
      const res = await createTeam({
        studentId: student.id,
        name: teamName.trim(),
        studentName: student.name,
        studentClass: student.class,
      });

      Alert.alert("Success!", `Team Created. Code: ${res.joinCode}`);
      setTeamName("");
      setMode("none");
      await loadTeams();
      navigation.navigate("TeamChat", {
        teamId: res.teamId,
        teamName: teamName.trim(),
        joinCode: res.joinCode,
      });
    } catch (err) {
      Alert.alert("Error", err.message || "Failed to create team");
    } finally {
      setLoading(false);
    }
  };

  const handleJoinTeam = async () => {
    const code = joinCode.trim().toUpperCase();
    if (!code) return Alert.alert("Enter a team code");

    try {
      setLoading(true);
      const team = await findTeamByJoinCode(code);
      if (!team) return Alert.alert("Not Found", "No team found with this code.");

      await requestJoinTeam({ teamId: team.id, student });
      Alert.alert("Requested", "Your request to join has been sent to the captain.");
      setJoinCode("");
      setMode("none");
    } catch (err) {
      Alert.alert("Error", err.message || "Failed to request join");
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (next) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setMode(next);
  };

  const renderTeamItem = ({ item }) => {
    const isHost = item.hostStudentId === student?.id;
    return (
      <TouchableOpacity
        activeOpacity={0.7}
        style={styles.teamCardWrapper}
        onPress={() => navigation.navigate("TeamChat", {
          teamId: item.id,
          teamName: item.name,
          joinCode: item.joinCode,
        })}
      >
        <View style={styles.teamRow}>
          <View style={styles.teamInfo}>
            <View style={styles.iconCircle}>
              <MaterialCommunityIcons name="account-group" size={24} color="#FF9F1C" />
            </View>
            <View>
              <Text style={styles.teamName}>{item.name}</Text>
              <Text style={styles.teamMeta}>
                Code: <Text style={styles.boldCode}>{item.joinCode}</Text> • {item.memberCount || 1} Members
              </Text>
            </View>
          </View>

          {isHost ? (
            <TouchableOpacity
              onPress={() => navigation.navigate("TeamJoinRequests", { teamId: item.id, teamName: item.name })}
            >
              <LinearGradient colors={["#60A5FA", "#2563EB"]} style={styles.requestBtn}>
                <Text style={styles.requestBtnText}>Requests</Text>
              </LinearGradient>
            </TouchableOpacity>
          ) : (
            <MaterialCommunityIcons name="chevron-right" size={24} color="#CBD5E1" />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />
      <LinearGradient colors={["#F8FAFF", "#F1F5F9"]} style={styles.root}>
        
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Team Hub</Text>
            <View style={styles.limitBadge}>
              <Text style={styles.limitText}>{teams.length}/3 Teams Active</Text>
            </View>
          </View>
          <View style={styles.headerBadge}>
            <Text style={styles.headerBadgeText}>LIVE</Text>
          </View>
        </View>

        {/* Action Card */}
        <View style={[styles.smartCard, mode !== 'none' && styles.expandedCard]}>
          <View style={styles.smartHeader}>
            <View style={styles.cardTitleRow}>
              {mode !== "none" && (
                <TouchableOpacity onPress={() => switchMode("none")} style={styles.backBtn}>
                  <MaterialCommunityIcons name="arrow-left" size={20} color="#64748B" />
                </TouchableOpacity>
              )}
              <Text style={styles.cardTitle}>
                {mode === "create" ? "Create New Team" : mode === "join" ? "Join a Team" : "Team Options"}
              </Text>
            </View>

            {mode === "none" && (
              <View style={styles.actionRow}>
                <TouchableOpacity style={styles.actionBtnGhost} onPress={() => switchMode("join")}>
                  <Text style={styles.actionGhostText}>Join</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.actionBtnPrimary, teams.length >= 3 && { opacity: 0.5 }]} 
                  onPress={() => teams.length < 3 ? switchMode("create") : Alert.alert("Limit Reached")}
                >
                  <Text style={styles.actionPrimaryText}>Create</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {mode === "create" && (
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Ex: The Avengers"
                placeholderTextColor="#94A3B8"
                value={teamName}
                onChangeText={setTeamName}
                maxLength={20}
              />
              <TouchableOpacity onPress={handleCreateTeam} disabled={loading}>
                <LinearGradient colors={["#FFB347", "#FF9F1C"]} style={styles.primaryBtn}>
                  {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.primaryText}>Launch Team</Text>}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {mode === "join" && (
            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.input, styles.codeInput]}
                placeholder="ENTER CODE"
                placeholderTextColor="#94A3B8"
                autoCapitalize="characters"
                value={joinCode}
                onChangeText={setJoinCode}
                maxLength={6}
              />
              <TouchableOpacity onPress={handleJoinTeam} disabled={loading}>
                <LinearGradient colors={["#475569", "#1E293B"]} style={styles.primaryBtn}>
                  {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.primaryText}>Send Join Request</Text>}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* My Teams Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Your Groups</Text>
          {refreshing && <ActivityIndicator size="small" color="#FF9F1C" />}
        </View>

        <FlatList
          data={teams}
          keyExtractor={(item) => item.id}
          renderItem={renderTeamItem}
          contentContainerStyle={{ paddingBottom: 100 }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="account-group-outline" size={60} color="#CBD5E1" />
              <Text style={styles.emptyText}>You haven't joined any teams yet.</Text>
            </View>
          }
          refreshing={refreshing}
          onRefresh={loadTeams}
        />
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F8FAFF" },
  root: { flex: 1, paddingHorizontal: 20, paddingTop: 10 },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
    marginTop: 10,
  },
  title: { fontSize: 28, fontWeight: "900", color: "#0F172A", letterSpacing: -0.5 },
  limitBadge: { backgroundColor: "#FEF3C7", alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginTop: 4 },
  limitText: { fontSize: 11, color: "#D97706", fontWeight: "700" },
  headerBadge: {
    backgroundColor: "#DCFCE7",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },
  headerBadgeText: { fontSize: 10, fontWeight: "900", color: "#166534" },

  smartCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 20,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10 },
      android: { elevation: 3 },
    }),
  },
  expandedCard: { borderColor: "#FDE68A", backgroundColor: "#FFFEFA" },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center' },
  backBtn: { marginRight: 10, padding: 4, backgroundColor: '#F1F5F9', borderRadius: 8 },
  smartHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  cardTitle: { fontSize: 16, fontWeight: "800", color: "#1E293B" },

  actionRow: { flexDirection: "row", gap: 10 },
  actionBtnGhost: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, backgroundColor: "#F8FAFC", borderWidth: 1, borderColor: "#E2E8F0" },
  actionGhostText: { fontSize: 13, fontWeight: "700", color: "#64748B" },
  actionBtnPrimary: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, backgroundColor: "#FF9F1C" },
  actionPrimaryText: { fontSize: 13, fontWeight: "700", color: "#FFFFFF" },

  inputContainer: { marginTop: 20 },
  input: {
    backgroundColor: "#F8FAFC",
    borderRadius: 15,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    color: "#1E293B",
    marginBottom: 15,
  },
  codeInput: { textAlign: 'center', letterSpacing: 4, fontWeight: '800', fontSize: 18 },
  primaryBtn: { paddingVertical: 15, borderRadius: 15, alignItems: "center" },
  primaryText: { color: "#FFFFFF", fontWeight: "800", fontSize: 15 },

  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 15 },
  sectionTitle: { fontSize: 18, fontWeight: "800", color: "#1E293B" },

  teamCardWrapper: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    overflow: 'hidden',
  },
  teamRow: { padding: 16, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  teamInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  iconCircle: { width: 44, height: 44, borderRadius: 14, backgroundColor: "#FFF7ED", alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  teamName: { fontSize: 16, fontWeight: "800", color: "#1E293B" },
  teamMeta: { fontSize: 12, color: "#64748B", marginTop: 2 },
  boldCode: { color: "#FF9F1C", fontWeight: "700" },

  requestBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  requestBtnText: { color: "#fff", fontSize: 11, fontWeight: "800" },

  emptyContainer: { alignItems: 'center', marginTop: 40 },
  emptyText: { fontSize: 14, color: "#94A3B8", marginTop: 10, fontWeight: "500" },
});