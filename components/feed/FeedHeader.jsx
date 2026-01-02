import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useStudentStore } from "../../state/useStudentStore";
import { useAuthStore } from "../../state/useAuthStore";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../../firebase/config";

export default function FeedHeader() {
  const navigation = useNavigation();

  const student = useStudentStore((state) => state.selectedStudent);
  const user = useAuthStore((state) => state.user);

  const [unseenCount, setUnseenCount] = useState(0);
  const [totalLikes, setTotalLikes] = useState(0);

  const profileImage =
    student?.photoUrl ||
    "https://ui-avatars.com/api/?background=FF9F1C&color=fff&name=" +
      encodeURIComponent(student?.name || "Student");

  const coins = student?.coins ?? 0;
  const xp = student?.xp ?? 0;

  // ✅ REAL-TIME LIKE NOTIFICATION LISTENER
  useEffect(() => {
    if (!user?.uid) return;

    const notifyRef = collection(db, "users", user.uid, "notifications");

    const totalQuery = query(notifyRef, where("type", "==", "LIKE"));
    const unsubTotal = onSnapshot(totalQuery, (snap) => {
      setTotalLikes(snap.size);
    });

    const unseenQuery = query(
      notifyRef,
      where("type", "==", "LIKE"),
      where("seen", "==", false)
    );

    const unsubUnseen = onSnapshot(unseenQuery, (snap) => {
      setUnseenCount(snap.size);
    });

    return () => {
      unsubTotal();
      unsubUnseen();
    };
  }, [user?.uid]);

  return (
    <View style={styles.container}>
      {/* ✅ LEFT: PROFILE */}
      <View style={styles.left}>
        <Image source={{ uri: profileImage }} style={styles.avatar} />
        <View>
          <Text style={styles.name}>{student?.name || "Student"}</Text>
          <View style={styles.activeRow}>
            <View style={styles.activeDot} />
            <Text style={styles.sub}>Active</Text>
          </View>
        </View>
      </View>

      {/* ✅ RIGHT: COINS + XP + HEART */}
      <View style={styles.right}>
        <View style={styles.statPill}>
          <Text style={styles.statIcon}>🪙</Text>
          <Text style={styles.statValue}>{coins}</Text>
        </View>

        <View style={styles.statPillGray}>
          <Text style={styles.statIcon}>⭐</Text>
          <Text style={styles.statValueGray}>{xp}</Text>
        </View>

        {/* ✅ HEART WITH PREMIUM BADGE */}
        <TouchableOpacity
          style={styles.heartWrap}
          onPress={() => navigation.navigate("LikesNotifications")}
          activeOpacity={0.8}
        >
          <Text style={styles.heart}>❤️</Text>

          {unseenCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {unseenCount > 99 ? "99+" : unseenCount}
              </Text>
            </View>
          )}

          {totalLikes > 0 && (
            <Text style={styles.totalLikeText}>{totalLikes}</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

/* ✅ OVERWATCH-STYLE PREMIUM HEADER */
const styles = StyleSheet.create({
  container: {
    paddingTop: 36,
    paddingBottom: 12,
    paddingHorizontal: 18,
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
    marginBottom: 12,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",

    
  },

  /* LEFT PROFILE */
  left: {
    flexDirection: "row",
    alignItems: "center",
  },

  avatar: {
    width: 46,
    height: 46,
    borderRadius: 24,
    marginRight: 10,
    backgroundColor: "#FF9F1C",
  },

  name: {
    color: "#1C1C1E",
    fontSize: 16,
    fontWeight: "800",
  },

  activeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },

  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 6,
    backgroundColor: "#00C853",
    marginRight: 6,
  },

  sub: {
    color: "#6B7280",
    fontSize: 12,
    fontWeight: "600",
  },

  /* RIGHT STATS */
  right: {
    flexDirection: "row",
    alignItems: "center",
  },

  statPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF1E0",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginLeft: 10,
  },

  statPillGray: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginLeft: 8,
  },

  statIcon: {
    fontSize: 12,
    marginRight: 6,
  },

  statValue: {
    fontSize: 13,
    fontWeight: "800",
    color: "#FF9F1C",
  },

  statValueGray: {
    fontSize: 13,
    fontWeight: "800",
    color: "#374151",
  },

  /* HEART */
  heartWrap: {
    marginLeft: 14,
    position: "relative",
    alignItems: "center",
  },

  heart: {
    fontSize: 22,
  },

  badge: {
    position: "absolute",
    top: -8,
    right: -16,
    backgroundColor: "#EF4444",
    minWidth: 26,
    height: 18,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },

  badgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "900",
  },

  totalLikeText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#6B7280",
    marginTop: 2,
  },
});
