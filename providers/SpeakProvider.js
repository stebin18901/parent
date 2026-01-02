// /providers/SpeakProvider.js
import React, { createContext, useContext, useEffect, useState } from "react";
import { View } from "react-native";
import FloatingMicButton from "../components/FloatingMicButton";
import { useStudentStore } from "../state/useStudentStore";
import { getMyTeams } from "../services/firebase/team";

const SpeakContext = createContext(null);

export function useSpeak() {
  return useContext(SpeakContext);
}

export default function SpeakProvider({ children }) {
  const student = useStudentStore((s) => s.selectedStudent);
  const [teams, setTeams] = useState([]);

  /* ───────── LOAD STUDENT TEAMS ───────── */
  useEffect(() => {
    let mounted = true;

    if (!student?.id) {
      setTeams([]);
      return;
    }

    (async () => {
      try {
        const teamList = await getMyTeams(student.id);
        if (mounted) {
          setTeams(teamList || []);
        }
      } catch (err) {
        console.warn("SpeakProvider.getMyTeams error:", err);
        if (mounted) setTeams([]);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [student?.id]);

  return (
    <SpeakContext.Provider value={{ student, teams }}>
      <View style={{ flex: 1 }}>
        {children}

        {/* 🔴 SINGLE GLOBAL MIC INSTANCE */}
        {!!student?.id && (
          <FloatingMicButton
            student={student}
            teams={teams}
          />
        )}
      </View>
    </SpeakContext.Provider>
  );
}
