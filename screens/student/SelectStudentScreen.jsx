import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Image,
  SafeAreaView,
  Dimensions,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";

import { getStudentsByParent } from "../../services/firebase/student";
import { logoutParent } from "../../services/firebase/auth";

import { useAuthStore } from "../../state/useAuthStore";
import { useStudentStore } from "../../state/useStudentStore";

const { width } = Dimensions.get("window");

/* ───────── ADVANCED COLOR SYSTEM ───────── */
const COLORS = {
  bgTop: "#000000ff",
  bgMid: "#101010ff",
  bgBottom: "#414141ff",

  glass: "rgba(43, 43, 43, 0.96)",
  border: "rgba(255,255,255,0.18)",

  textMain: "#ffffffff",
  textMuted: "#b5b5b5ff",

  gold: "#EAB308",
  goldDark: "#CA8A04",

  successBg: "#ECFDF5",
  successText: "#15803D",
};

export default function SelectStudentScreen({ navigation }) {
  const parent = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const setStudents = useStudentStore((s) => s.setStudents);
  const setSelectedStudent = useStudentStore(
    (s) => s.setSelectedStudent
  );

  const [loading, setLoading] = useState(true);
  const [students, setLocalStudents] = useState([]);

  useFocusEffect(
    useCallback(() => {
      const load = async () => {
        try {
          setLoading(true);
          const data = await getStudentsByParent(parent.uid);
          setLocalStudents(data);
          setStudents(data);
        } catch (e) {
          Alert.alert("Error", e.message);
        } finally {
          setLoading(false);
        }
      };
      load();
    }, [])
  );

  const handleLogout = () => {
    Alert.alert("Logout", "Logout from parent account?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await logoutParent();
          setUser(null);
          setStudents([]);
          setSelectedStudent(null);
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={COLORS.gold} />
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <LinearGradient
        colors={[COLORS.bgTop, COLORS.bgMid, COLORS.bgBottom]}
        locations={[0, 0.35, 1]}
        style={{ flex: 1 }}
      >
        {/* ───────── HERO HEADER ───────── */}
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>Choose Student</Text>
          <Text style={styles.heroSub}>
            Continue learning with the selected profile
          </Text>

          <TouchableOpacity onPress={handleLogout}>
            <Text style={styles.logout}>Logout</Text>
          </TouchableOpacity>
        </View>

        {/* ───────── STUDENT LIST ───────── */}
        <FlatList
          data={students}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingBottom: 160,
          }}
          renderItem={({ item }) => (
            <TouchableOpacity
              activeOpacity={0.92}
              style={styles.card}
              onPress={() => {
                setSelectedStudent(item);
                navigation.replace("ParentHome");
              }}
            >
              <View style={styles.cardLeft}>
                {item.profilePic ? (
                  <Image
                    source={{ uri: item.profilePic }}
                    style={styles.avatar}
                  />
                ) : (
                  <View style={styles.avatarFallback}>
                    <Text style={styles.avatarText}>
                      {item.name?.[0]?.toUpperCase() || "S"}
                    </Text>
                  </View>
                )}

                <View>
                  <Text style={styles.name}>{item.name}</Text>
                  <Text style={styles.meta}>
                    Class {item.class}
                    {item.section ? ` · ${item.section}` : ""}
                  </Text>
                </View>
              </View>

              <View style={styles.statusPill}>
                <Text style={styles.statusText}>
                  {item.status || "Active"}
                </Text>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              No student profiles yet.
            </Text>
          }
        />

        {/* ───────── FLOATING CTA ───────── */}
        <View style={styles.ctaWrap}>
          <TouchableOpacity
            activeOpacity={0.95}
            onPress={() => navigation.navigate("CreateStudent")}
          >
            <LinearGradient
              colors={[COLORS.gold, COLORS.goldDark]}
              style={styles.cta}
            >
              <Text style={styles.ctaText}>Add Student</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

/* ───────── STYLES ───────── */

const SHADOW_GLASS = {
  shadowColor: "#000",
  shadowOpacity: 0.12,
  shadowRadius: 24,
  shadowOffset: { width: 0, height: 14 },
  elevation: 8,
};

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: COLORS.bgBottom,
  },

  hero: {
    paddingTop: 28,
    paddingHorizontal: 22,
    paddingBottom: 18,
  },
  heroTitle: {
    fontSize: 30,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  heroSub: {
    fontSize: 14,
    color: "#CBD5E1",
    marginTop: 6,
  },
  logout: {
    marginTop: 10,
    fontSize: 13,
    color: "#94A3B8",
    fontWeight: "600",
  },

  card: {
    backgroundColor: COLORS.glass,
    borderRadius: 50,
    padding: 18,
    marginBottom: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOW_GLASS,
  },

  cardLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },

  avatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
  },

  avatarFallback: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: COLORS.gold,
    alignItems: "center",
    justifyContent: "center",
  },

  avatarText: {
    color: "#111827",
    fontSize: 22,
    fontWeight: "900",
  },

  name: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.textMain,
  },

  meta: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 4,
  },

  statusPill: {
    backgroundColor: COLORS.successBg,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
  },

  statusText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.successText,
  },

  emptyText: {
    textAlign: "center",
    marginTop: 80,
    fontSize: 14,
    color: COLORS.textMuted,
  },

  ctaWrap: {
    position: "absolute",
    bottom: 30,
    left: 24,
    right: 24,
  },

  cta: {
    paddingVertical: 18,
    borderRadius: 26,
    alignItems: "center",
    ...SHADOW_GLASS,
  },

  ctaText: {
    color: "#0B1220",
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: 0.4,
  },
});
