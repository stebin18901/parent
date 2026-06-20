import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

export default function SeasonConfirmationScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.safe}>
      <LinearGradient colors={["#020617", "#000"]} style={styles.container}>
        <Text style={styles.title}>Slot Secured Successfully</Text>
        <Text style={styles.sub}>
          Confirmation sent. We will notify you before season launch.
        </Text>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#020617" },
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { color: "#fff", fontSize: 26, fontWeight: "900" },
  sub: {
    color: "#94a3b8",
    marginTop: 10,
    marginBottom: 30,
    textAlign: "center",
  },
  btn: {
    backgroundColor: "#2563eb",
    paddingHorizontal: 30,
    paddingVertical: 14,
    borderRadius: 10,
  },
  btnText: { color: "#fff", fontWeight: "800" },
});
