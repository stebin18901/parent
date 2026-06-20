import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StatusBar,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
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
  const navigation = useNavigation();
  const student = useStudentStore((s) => s.selectedStudent);

  const { teamId, teamName } = route.params || {};

  const [requests, setRequests] = useState([]);
  const [members, setMembers] = useState([]);
  const [teamInfo, setTeamInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    if (!teamId) return;

    // Listeners
    const unsubRequests = listenToJoinRequests(teamId, setRequests);
    const unsubMembers = listenToTeamMembers(teamId, (rows) => {
      setMembers(rows);
      setLoading(false);
    });

    getTeamInfo(teamId).then(setTeamInfo);

    return () => {
      unsubRequests();
      unsubMembers();
    };
  }, [teamId]);

  const handleApprove = async (targetStudentId) => {
    try {
      setProcessingId(targetStudentId);
      await approveJoinRequest({ teamId, hostStudentId: student.id, targetStudentId });
    } catch (err) {
      Alert.alert("Error", err.message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (targetStudentId) => {
    try {
      setProcessingId(targetStudentId);
      await rejectJoinRequest({ teamId, hostStudentId: student.id, targetStudentId });
    } catch (err) {
      Alert.alert("Error", err.message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleRemoveMember = (target) => {
    Alert.alert("Remove Member?", `Are you sure you want to remove ${target.name}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          try {
            await removeTeamMember({ teamId, hostStudentId: student.id, targetStudentId: target.id });
          } catch (err) {
            Alert.alert("Error", err.message);
          }
        },
      },
    ]);
  };

  const renderHeader = () => (
    <View>
      {/* Back & Title */}
      <View style={styles.topNav}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Manage Team</Text>
      </View>

      {/* Team Summary Card */}
      <LinearGradient colors={["#1E293B", "#334155"]} style={styles.teamHeader}>
        <View style={styles.headerRow}>
          <View flex={1}>
            <Text style={styles.titleText}>{teamInfo?.name || teamName}</Text>
            <View style={styles.codeBadge}>
              <Text style={styles.codeText}>CODE: {teamInfo?.joinCode}</Text>
            </View>
          </View>
          <MaterialCommunityIcons name="shield-check" size={40} color="#FF9F1C" />
        </View>
        <View style={styles.divider} />
        <Text style={styles.subMeta}>
          <Text style={{ fontWeight: "800", color: "#FDE68A" }}>{members.length}</Text> Members  •  Host: {teamInfo?.hostName || "You"}
        </Text>
      </LinearGradient>

      {/* Join Requests Section */}
      <View style={styles.sectionTitleRow}>
        <Text style={styles.sectionTitle}>Join Requests</Text>
        <View style={styles.countBadge}><Text style={styles.countText}>{requests.length}</Text></View>
      </View>

      {requests.length === 0 && <Text style={styles.emptyText}>No pending requests at the moment.</Text>}
      {requests.map((item) => (
        <View key={item.id} style={styles.requestCard}>
          <View>
            <Text style={styles.memberName}>{item.name}</Text>
            <Text style={styles.memberClass}>Class {item.class}</Text>
          </View>
          <View style={styles.requestActions}>
            <TouchableOpacity onPress={() => handleReject(item.id)} disabled={!!processingId}>
              <View style={[styles.actionIconBtn, { backgroundColor: "#FEE2E2" }]}>
                <MaterialCommunityIcons name="close" size={20} color="#EF4444" />
              </View>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleApprove(item.id)} disabled={!!processingId}>
              <LinearGradient colors={["#22C55E", "#16A34A"]} style={styles.approveBtn}>
                {processingId === item.id ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={styles.approveBtnText}>Approve</Text>}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      ))}

      <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Current Members</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF9F1C" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />
      <FlatList
        data={members}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.scrollContent}
        renderItem={({ item }) => (
          <View style={styles.memberItem}>
            <View style={styles.memberAvatar}>
              <Text style={styles.avatarText}>{item.name.charAt(0)}</Text>
            </View>
            <View flex={1}>
              <Text style={styles.memberName}>{item.name}</Text>
              <Text style={styles.memberClass}>Class {item.class}</Text>
            </View>
            {item.id === teamInfo?.hostStudentId ? (
              <View style={styles.hostBadge}><Text style={styles.hostBadgeText}>HOST</Text></View>
            ) : (
              student?.id === teamInfo?.hostStudentId && (
                <TouchableOpacity onPress={() => handleRemoveMember(item)}>
                  <MaterialCommunityIcons name="account-remove-outline" size={24} color="#94A3B8" />
                </TouchableOpacity>
              )
            )}
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F8FAFF" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  scrollContent: { padding: 20, paddingBottom: 50 },
  
  topNav: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
  iconBtn: { padding: 8, backgroundColor: "#FFF", borderRadius: 12, elevation: 2, marginRight: 12 },
  headerTitle: { fontSize: 20, fontWeight: "800", color: "#1E293B" },

  teamHeader: { borderRadius: 24, padding: 24, elevation: 8, shadowColor: "#1E293B", shadowOpacity: 0.3, shadowRadius: 10 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  titleText: { fontSize: 24, fontWeight: "900", color: "#FFFFFF" },
  codeBadge: { backgroundColor: "rgba(255,255,255,0.2)", alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginTop: 8 },
  codeText: { color: "#FFF", fontWeight: "800", fontSize: 12, letterSpacing: 1 },
  divider: { height: 1, backgroundColor: "rgba(255,255,255,0.1)", marginVertical: 16 },
  subMeta: { color: "#CBD5E1", fontSize: 14, fontWeight: "600" },

  sectionTitleRow: { flexDirection: "row", alignItems: "center", marginTop: 20, marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: "800", color: "#1E293B" },
  countBadge: { backgroundColor: "#FF9F1C", marginLeft: 8, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  countText: { color: "#FFF", fontSize: 12, fontWeight: "900" },
  
  emptyText: { color: "#94A3B8", fontSize: 14, fontStyle: "italic", marginBottom: 10 },

  requestCard: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  requestActions: { flexDirection: "row", alignItems: "center", gap: 10 },
  actionIconBtn: { width: 40, height: 40, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  approveBtn: { paddingHorizontal: 16, height: 40, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  approveBtnText: { color: "#FFF", fontWeight: "800", fontSize: 13 },

  memberItem: {
    backgroundColor: "#FFF",
    padding: 12,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  memberAvatar: { width: 44, height: 44, borderRadius: 15, backgroundColor: "#F1F5F9", justifyContent: "center", alignItems: "center", marginRight: 12 },
  avatarText: { fontSize: 18, fontWeight: "800", color: "#64748B" },
  memberName: { fontSize: 16, fontWeight: "700", color: "#1E293B" },
  memberClass: { fontSize: 13, color: "#94A3B8", fontWeight: "600" },
  
  hostBadge: { backgroundColor: "#FEF3C7", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  hostBadgeText: { color: "#D97706", fontSize: 10, fontWeight: "900" },
});