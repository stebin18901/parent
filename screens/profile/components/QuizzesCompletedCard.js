import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const COLORS = {
  card: "#FFFFFF",
  border: "#E2E8F0",
  textMain: "#0F172A",
  textSub: "#475569",
  accent: "#4338CA",
};

export default function QuizzesCompletedCard({ count = 0 }) {
  return (
    <View style={styles.card}>
      <View style={styles.left}>
        <View style={styles.iconWrap}>
          <MaterialCommunityIcons name="book-check-outline" size={22} color={COLORS.accent} />
        </View>
        <View>
          <Text style={styles.title}>Quizzes Completed</Text>
          <Text style={styles.sub}>Subject quiz attempts finished</Text>
        </View>
      </View>
      <Text style={styles.count}>{count}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: 12,
    backgroundColor: COLORS.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.textMain,
  },
  sub: {
    marginTop: 2,
    fontSize: 12,
    color: COLORS.textSub,
  },
  count: {
    fontSize: 28,
    fontWeight: "900",
    color: COLORS.accent,
    marginLeft: 10,
  },
});
