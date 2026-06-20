import React, { useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Image,
  SafeAreaView,
  StatusBar,
  useWindowDimensions,
  Animated,
  Pressable,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { getStudentsByParent } from "../../services/firebase/student";
import { logoutParent } from "../../services/firebase/auth";

import { useAuthStore } from "../../state/useAuthStore";
import { useStudentStore } from "../../state/useStudentStore";

const COLORS = {
  primary: "#6366F1",
  secondary: "#8B5CF6",
  bg1: "#F8FAFF",
  bg2: "#EEF2FF",
  text: "#0F172A",
  sub: "#64748B",
};

export default function SelectStudentScreen({ navigation }) {
  const { width } = useWindowDimensions();

  const parent = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const setStudents = useStudentStore((s) => s.setStudents);
  const setSelectedStudent = useStudentStore((s) => s.setSelectedStudent);

  const [loading, setLoading] = useState(true);
  const [students, setLocalStudents] = useState([]);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useFocusEffect(
    useCallback(() => {
      const load = async () => {
        try {
          setLoading(true);
          const data = await getStudentsByParent(parent.uid);
          setLocalStudents(data);
          setStudents(data);

          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }).start();
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

  const renderItem = ({ item, index }) => {
    const scale = new Animated.Value(1);

    const onPressIn = () => {
      Animated.spring(scale, {
        toValue: 0.96,
        useNativeDriver: true,
      }).start();
    };

    const onPressOut = () => {
      Animated.spring(scale, {
        toValue: 1,
        friction: 4,
        useNativeDriver: true,
      }).start();
    };

    return (
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [
            { scale },
            {
              translateY: fadeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [40, 0],
              }),
            },
          ],
        }}
      >
        <Pressable
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          onPress={() => {
            setSelectedStudent(item);
            navigation.replace("ParentHome");
          }}
        >
          <BlurView intensity={50} tint="light" style={styles.card}>
            <View style={styles.left}>
              {item.profilePic ? (
                <Image source={{ uri: item.profilePic }} style={styles.avatar} />
              ) : (
                <LinearGradient
                  colors={[COLORS.primary, COLORS.secondary]}
                  style={styles.avatarFallback}
                >
                  <Text style={styles.avatarText}>
                    {item.name?.[0]?.toUpperCase()}
                  </Text>
                </LinearGradient>
              )}

              <View>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.meta}>
                  Class {item.class} • {item.section || "A"}
                </Text>
              </View>
            </View>

            <MaterialCommunityIcons
              name="chevron-right"
              size={26}
              color="#CBD5F5"
            />
          </BlurView>
        </Pressable>
      </Animated.View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <StatusBar barStyle="dark-content" />

      <LinearGradient colors={[COLORS.bg1, COLORS.bg2]} style={{ flex: 1 }}>
        {/* HEADER */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Select Student</Text>
            <Text style={styles.subtitle}>Manage profiles easily</Text>
          </View>

          <Pressable onPress={handleLogout} style={styles.logout}>
            <MaterialCommunityIcons name="logout" size={20} />
          </Pressable>
        </View>

        {/* LIST */}
        <FlatList
          data={students}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16, paddingBottom: 140 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.empty}>
              <MaterialCommunityIcons name="account-off" size={70} color="#CBD5F5" />
              <Text style={styles.emptyText}>No Students Found</Text>
            </View>
          }
        />

        {/* FLOATING CTA */}
        <Animated.View style={styles.ctaWrapper}>
          <Pressable onPress={() => navigation.navigate("CreateStudent")}>
            <LinearGradient
              colors={[COLORS.primary, COLORS.secondary]}
              style={styles.cta}
            >
              <MaterialCommunityIcons name="plus" size={22} color="#fff" />
              <Text style={styles.ctaText}>Add Student</Text>
            </LinearGradient>
          </Pressable>
        </Animated.View>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loader: { flex: 1, justifyContent: "center" },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 20,
    alignItems: "center",
  },

  title: {
    fontSize: 30,
    fontWeight: "900",
    color: "#0F172A",
  },

  subtitle: {
    color: "#64748B",
    marginTop: 4,
  },

  logout: {
    backgroundColor: "#E2E8F0",
    padding: 10,
    borderRadius: 12,
  },

  card: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 22,
    marginBottom: 14,
    backgroundColor: "rgba(255,255,255,0.6)",
  },

  left: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },

  avatar: {
    width: 60,
    height: 60,
    borderRadius: 18,
  },

  avatarFallback: {
    width: 60,
    height: 60,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },

  avatarText: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "800",
  },

  name: {
    fontSize: 17,
    fontWeight: "800",
  },

  meta: {
    color: "#64748B",
    fontSize: 13,
  },

  empty: {
    alignItems: "center",
    marginTop: 100,
  },

  emptyText: {
    marginTop: 10,
    color: "#94A3B8",
  },

  ctaWrapper: {
    position: "absolute",
    bottom: 30,
    left: 20,
    right: 20,
  },

  cta: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: 18,
    borderRadius: 20,
    gap: 10,
  },

  ctaText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 16,
  },
});