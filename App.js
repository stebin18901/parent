// /App.js
import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { View, ActivityIndicator } from "react-native";
import {
  SafeAreaProvider,
  SafeAreaView,
} from "react-native-safe-area-context";
import { onAuthStateChanged } from "firebase/auth";

import AuthNavigator from "./navigation/AuthNavigator";
import AppNavigator from "./navigation/AppNavigator";

import { auth } from "./firebase/config";
import { useAuthStore } from "./state/useAuthStore";
import { useStudentStore } from "./state/useStudentStore";
import { listenToStudentLive } from "./services/firebase/studentLive";

import { StatusBar } from "expo-status-bar";
import * as NavigationBar from "expo-navigation-bar";

export default function App() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);

  const student = useStudentStore((s) => s.selectedStudent);
  const setLiveStudent = useStudentStore((s) => s.setLiveStudent);

  const [booting, setBooting] = useState(true);

  /* AUTH */
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser || null);
      setBooting(false);
    });

    return unsubscribe;
  }, []);

  /* LIVE STUDENT */
  useEffect(() => {
    if (!student?.id) return;

    const unsub = listenToStudentLive(student.id, (liveData) => {
      setLiveStudent(liveData);
    });

    return () => unsub && unsub();
  }, [student?.id]);

  /* SYSTEM UI */
  useEffect(() => {
    NavigationBar.setBackgroundColorAsync("transparent");
    NavigationBar.setButtonStyleAsync("light");
  }, []);

  if (booting) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="light" translucent backgroundColor="transparent" />

      {/* ✅ GLOBAL SAFE AREA */}
      <SafeAreaView style={{ flex: 1 }} edges={["bottom"]}>
        <NavigationContainer>
          {user ? <AppNavigator /> : <AuthNavigator />}
        </NavigationContainer>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}