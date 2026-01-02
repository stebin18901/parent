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
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
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

  /* ✅ LOAD MY TEAMS */
  const loadTeams = async () => {
    if (!student?.id) return;
    setRefreshing(true);
    try {
      const res = await getMyTeams(student.id);
      setTeams(res);
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

  /* ✅ CREATE TEAM */
  const handleCreateTeam = async () => {
    if (!teamName.trim()) return Alert.alert("Team name required");
    if (!student?.id) return Alert.alert("No student selected");

    try {
      setLoading(true);

      const res = await createTeam({
        studentId: student.id,
        name: teamName.trim(),
        studentName: student.name,
        studentClass: student.class,
      });

      Alert.alert("Team Created", `Team Code: ${res.joinCode}`);
      setTeamName("");
      setMode("none");
      await loadTeams();
    } catch (err) {
      Alert.alert("Error", err.message || "Failed to create team");
    } finally {
      setLoading(false);
    }
  };

  /* ✅ JOIN TEAM */
  const handleJoinTeam = async () => {
    const code = joinCode.trim().toUpperCase();
    if (!code) return Alert.alert("Enter a team code");
    if (!student?.id) return Alert.alert("No student selected");

    try {
      setLoading(true);
      const team = await findTeamByJoinCode(code);

      if (!team) return Alert.alert("No team found");

      await requestJoinTeam({ teamId: team.id, student });

      Alert.alert("Request Sent");
      setJoinCode("");
      setMode("none");
    } catch (err) {
      Alert.alert("Error", err.message || "Failed to request join");
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (next) => {
    LayoutAnimation.easeInEaseOut();
    setMode(next);
  };

  return (
    <LinearGradient colors={["#F8FAFF", "#FFF4EC"]} style={styles.root}>
      <Text style={styles.title}>Teams</Text>
      <Text style={styles.subTitle}>
        Create or join teams. You can be in maximum 3 teams.
      </Text>

      {/* ✅ SINGLE SMART CARD */}
      <LinearGradient colors={["#FFFFFF", "#FFF7ED"]} style={styles.smartCard}>
        {/* ✅ HEADER */}
        <View style={styles.smartHeader}>
          <Text style={styles.cardTitle}>
            {mode === "create"
              ? "Create Team"
              : mode === "join"
              ? "Join Team"
              : "Create or Join a Team"}
          </Text>

          {mode === "none" && (
            <TouchableOpacity
              style={styles.plusBtn}
              onPress={() => switchMode("create")}
            >
              <Text style={styles.plusText}>＋</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ✅ CREATE MODE */}
        {mode === "create" && (
          <>
            <TextInput
              style={styles.input}
              placeholder="Enter team name"
              value={teamName}
              onChangeText={setTeamName}
            />

            <TouchableOpacity onPress={handleCreateTeam} disabled={loading}>
              <LinearGradient
                colors={["#FFB347", "#FF9F1C"]}
                style={styles.primaryBtn}
              >
                <Text style={styles.primaryText}>
                  {loading ? "Please wait..." : "Create Team"}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* ✅ SMALL JOIN SWITCH */}
            <TouchableOpacity
              style={styles.smallSwitch}
              onPress={() => switchMode("join")}
            >
              <Text style={styles.switchText}>
                Have a code? Join a team →
              </Text>
            </TouchableOpacity>
          </>
        )}

        {/* ✅ JOIN MODE */}
        {mode === "join" && (
          <>
            <TextInput
              style={styles.input}
              placeholder="Enter team code"
              autoCapitalize="characters"
              value={joinCode}
              onChangeText={setJoinCode}
            />

            <TouchableOpacity onPress={handleJoinTeam} disabled={loading}>
              <LinearGradient
                colors={["#E5E7EB", "#F1F5F9"]}
                style={styles.secondaryBtn}
              >
                <Text style={styles.secondaryText}>
                  {loading ? "Please wait..." : "Request to Join"}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* ✅ SMALL CREATE SWITCH */}
            <TouchableOpacity
              style={styles.smallSwitch}
              onPress={() => switchMode("create")}
            >
              <Text style={styles.switchText}>
                Want to start your own team? Create →
              </Text>
            </TouchableOpacity>
          </>
        )}
      </LinearGradient>

      {/* ✅ MY TEAMS */}
      <Text style={styles.sectionTitle}>Your Teams</Text>

      {refreshing ? (
        <ActivityIndicator color="#FF9F1C" />
      ) : (
        <FlatList
          data={teams}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <LinearGradient
              colors={["#FFFFFF", "#FFF7ED"]}
              style={styles.teamRow}
            >
              <View>
                <Text style={styles.teamName}>{item.name}</Text>
                <Text style={styles.teamMeta}>
                  Code: {item.joinCode} · Members: {item.memberCount || 1}
                </Text>
              </View>

              {item.hostStudentId === student?.id && (
                <TouchableOpacity
                  onPress={() =>
                    navigation.navigate("TeamJoinRequests", {
                      teamId: item.id,
                      teamName: item.name,
                    })
                  }
                >
                  <LinearGradient
                    colors={["#60A5FA", "#2563EB"]}
                    style={styles.requestBtn}
                  >
                    <Text style={styles.requestBtnText}>View Requests</Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}
            </LinearGradient>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              You are not in any team yet.
            </Text>
          }
        />
      )}
    </LinearGradient>
  );
}

/* ✅ STYLES */

const styles = StyleSheet.create({
  root: { flex: 1, padding: 16 },

  title: { fontSize: 22, fontWeight: "900", color: "#111827" },

  subTitle: {
    fontSize: 13,
    color: "#6B7280",
    marginBottom: 16,
    fontWeight: "600",
  },

  smartCard: {
    borderRadius: 2,
    padding: 16,
    marginBottom: 14,
    elevation: 4,
  },

  smartHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  plusBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FF9F1C",
    alignItems: "center",
    justifyContent: "center",
  },

  plusText: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "900",
  },

  cardTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: "#111827",
  },

  input: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginVertical: 12,
    fontSize: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  primaryBtn: {
    paddingVertical: 12,
    borderRadius: 18,
    alignItems: "center",
    elevation: 4,
  },

  primaryText: {
    color: "#FFFFFF",
    fontWeight: "900",
    fontSize: 14,
  },

  secondaryBtn: {
    paddingVertical: 12,
    borderRadius: 18,
    alignItems: "center",
  },

  secondaryText: {
    color: "#111827",
    fontWeight: "800",
    fontSize: 14,
  },

  smallSwitch: {
    marginTop: 10,
    alignItems: "center",
  },

  switchText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#2563EB",
  },

  sectionTitle: {
    marginTop: 10,
    marginBottom: 8,
    fontSize: 15,
    fontWeight: "900",
    color: "#111827",
  },

  teamRow: {
    borderRadius: 18,
    padding: 14,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    elevation: 3,
  },

  teamName: {
    fontSize: 14,
    fontWeight: "900",
    color: "#111827",
  },

  teamMeta: {
    fontSize: 12,
    color: "#6B7280",
  },

  requestBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    elevation: 3,
  },

  requestBtnText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "900",
  },

  emptyText: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 16,
    textAlign: "center",
    fontWeight: "600",
  },
});
