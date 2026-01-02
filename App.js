// /App.js
import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { View, ActivityIndicator } from "react-native";
import { onAuthStateChanged } from "firebase/auth";

import AuthNavigator from "./navigation/AuthNavigator";
import AppNavigator from "./navigation/AppNavigator";

import { auth } from "./firebase/config";
import { useAuthStore } from "./state/useAuthStore";
import { useStudentStore } from "./state/useStudentStore";

import { listenToStudentLive } from "./services/firebase/studentLive";

import SpeakProvider from "./providers/SpeakProvider";
import SubtitleProvider from "./providers/SubtitleProvider";

export default function App() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);

  const student = useStudentStore((s) => s.selectedStudent);
  const setLiveStudent = useStudentStore((s) => s.setLiveStudent);

  const [booting, setBooting] = useState(true);

  /* ───────── AUTH BOOTSTRAP ───────── */
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser || null);
      setBooting(false);
    });

    return unsubscribe;
  }, []);

  /* ───────── LIVE STUDENT DATA ───────── */
  useEffect(() => {
    if (!student?.id) return;

    const unsub = listenToStudentLive(student.id, (liveData) => {
      setLiveStudent(liveData);
    });

    return () => unsub && unsub();
  }, [student?.id]);

  if (booting) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      
          {user ? <AppNavigator /> : <AuthNavigator />}
        
    </NavigationContainer>
  );
}
