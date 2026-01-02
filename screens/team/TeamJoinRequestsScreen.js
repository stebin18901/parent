import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRoute } from "@react-navigation/native";
import { useStudentStore } from "../../state/useStudentStore";
import {
  listenToJoinRequests,
  approveJoinRequest,
  rejectJoinRequest,
  listenToTeamMembers,
  removeTeamMember,
  getTeamInfo,
} from "../../services/firebase/team";
import { LinearGradient } from "expo-linear-gradient";

export default function TeamManagementScreen() {
  const route = useRoute();
  const student = useStudentStore((s) => s.selectedStudent);

  const { teamId, teamName } = route.params || {};

  const [requests, setRequests] = useState([]);
  const [members, setMembers] = useState([]);
  const [teamInfo, setTeamInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  /* ============================
        JOIN REQUEST LISTENER
     ============================ */
  useEffect(() => {
    if (!teamId) return;

    const unsub = listenToJoinRequests(teamId, (rows) => {
      setRequests(rows);
      setLoading(false);
    });

    return unsub;
  }, [teamId]);

  /* ============================
         TEAM MEMBERS LISTENER
     ============================ */
  useEffect(() => {
    if (!teamId) return;

    const unsub = listenToTeamMembers(teamId, (rows) => {
      setMembers(rows);
    });

    return unsub;
  }, [teamId]);

  /* ============================
            TEAM INFO
     ============================ */
  useEffect(() => {
    if (!teamId) return;
    getTeamInfo(teamId).then(setTeamInfo);
  }, [teamId]);

  /* ============================
        APPROVE REQUEST
     ============================ */
  const handleApprove = async (targetStudentId) => {
    if (!student?.id) return;

    try {
      setProcessingId(targetStudentId);

      await approveJoinRequest({
        teamId,
        hostStudentId: student.id,
        targetStudentId,
      });
    } catch (err) {
      Alert.alert("Error", err.message || "Failed to approve");
    } finally {
      setProcessingId(null);
    }
  };

  /* ============================
         REJECT REQUEST
     ============================ */
  const handleReject = async (targetStudentId) => {
    if (!student?.id) return;

    try {
      setProcessingId(targetStudentId);

      await rejectJoinRequest({
        teamId,
        hostStudentId: student.id,
        targetStudentId,
      });
    } catch (err) {
      Alert.alert("Error", err.message || "Failed to reject");
    } finally {
      setProcessingId(null);
    }
  };

  /* ============================
          REMOVE MEMBER
     ============================ */
  const handleRemoveMember = async (targetStudentId) => {
    Alert.alert(
      "Remove Member",
      "Are you sure you want to remove this member?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              await removeTeamMember({
                teamId,
                hostStudentId: student.id,
                targetStudentId,
              });
            } catch (err) {
              Alert.alert("Error", err.message || "Failed to remove member");
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#FF9F1C" />
      </View>
    );
  }

  return (
    <LinearGradient colors={["#F8FAFF", "#FFF4EC"]} style={styles.root}>
      {/* =====================================
              TEAM HEADER INFORMATION
         ===================================== */}
      <LinearGradient
        colors={["#FFFFFF", "#FFF7ED"]}
        style={styles.teamHeader}
      >
        <Text style={styles.title}>{teamInfo?.name || teamName}</Text>
        <Text style={styles.subTitle}>Team Code: {teamInfo?.joinCode}</Text>
        <Text style={styles.subMeta}>
          Members: {members.length} | Host: {teamInfo?.hostName}
        </Text>
      </LinearGradient>

      {/* =====================================
                   TEAM MEMBERS LIST
         ===================================== */}
      <Text style={styles.sectionTitle}>Team Members</Text>

      {members.length === 0 ? (
        <Text style={styles.empty}>No members yet.</Text>
      ) : (
        <FlatList
          data={members}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <LinearGradient
              colors={["#FFFFFF", "#F8FAFC"]}
              style={styles.memberCard}
            >
              <View>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.meta}>Class {item.class}</Text>
              </View>

              {item.id === teamInfo?.hostStudentId ? (
                <Text style={styles.hostBadge}>HOST</Text>
              ) : (
                student?.id === teamInfo?.hostStudentId && (
                  <TouchableOpacity
                    onPress={() => handleRemoveMember(item.id)}
                    style={styles.removeBtn}
                  >
                    <Text style={styles.removeText}>Remove</Text>
                  </TouchableOpacity>
                )
              )}
            </LinearGradient>
          )}
        />
      )}

      {/* =====================================
                   JOIN REQUEST LIST
         ===================================== */}
      <Text style={styles.sectionTitle}>Join Requests</Text>

      {requests.length === 0 ? (
        <Text style={styles.empty}>No pending requests.</Text>
      ) : (
        <FlatList
          data={requests}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 30 }}
          renderItem={({ item }) => (
            <LinearGradient
              colors={["#FFFFFF", "#FFF7ED"]}
              style={styles.requestCard}
            >
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.meta}>Class {item.class}</Text>

              <View style={styles.actions}>
                {/* Approve */}
                <TouchableOpacity
                  onPress={() => handleApprove(item.id)}
                  disabled={processingId === item.id}
                >
                  <LinearGradient
                    colors={["#22C55E", "#16A34A"]}
                    style={styles.btn}
                  >
                    <Text style={styles.btnText}>
                      {processingId === item.id ? "..." : "Approve"}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>

                {/* Reject */}
                <TouchableOpacity
                  onPress={() => handleReject(item.id)}
                  disabled={processingId === item.id}
                >
                  <LinearGradient
                    colors={["#F87171", "#DC2626"]}
                    style={styles.btn}
                  >
                    <Text style={styles.btnText}>Reject</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          )}
        />
      )}
    </LinearGradient>
  );
}

/* ===========================================================
   STYLES
=========================================================== */

const styles = StyleSheet.create({
  root: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  /* HEADER */
  teamHeader: {
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
    elevation: 4,
  },

  title: {
    fontSize: 22,
    fontWeight: "900",
    color: "#111827",
  },

  subTitle: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "600",
    marginTop: 4,
  },

  subMeta: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 6,
  },

  /* SECTIONS */
  sectionTitle: {
    marginTop: 16,
    marginBottom: 8,
    fontSize: 16,
    fontWeight: "900",
    color: "#111827",
  },

  empty: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 12,
    fontWeight: "600",
  },

  /* TEAM MEMBERS */
  memberCard: {
    padding: 16,
    borderRadius: 20,
    marginBottom: 10,
    elevation: 3,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  hostBadge: {
    backgroundColor: "#FF9F1C",
    color: "#fff",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    fontSize: 11,
    fontWeight: "900",
  },

  removeBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: "#FEE2E2",
    borderRadius: 10,
  },

  removeText: {
    color: "#B91C1C",
    fontWeight: "800",
  },

  /* REQUESTS */
  requestCard: {
    padding: 16,
    borderRadius: 20,
    marginBottom: 12,
    elevation: 4,
  },

  name: {
    fontSize: 16,
    fontWeight: "900",
    color: "#111827",
  },

  meta: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 4,
  },

  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 14,
  },

  btn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 14,
    elevation: 3,
  },

  btnText: {
    color: "#FFFFFF",
    fontWeight: "900",
    fontSize: 13,
  },
});
