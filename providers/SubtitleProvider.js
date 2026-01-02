// /providers/SubtitleProvider.js
import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { listenToSubtitles } from "../services/firebase/teamSubtitles";
import { useStudentStore } from "../state/useStudentStore";
import SubtitleOverlay from "../components/SubtitleOverlay";

const SubtitleContext = createContext(null);

export function useSubtitles() {
  return useContext(SubtitleContext);
}

export default function SubtitleProvider({ children }) {
  const student = useStudentStore((s) => s.selectedStudent);
  const [messages, setMessages] = useState([]);

  // Track last seen subtitle per team to avoid re-adding old ones
  const lastSeenRef = useRef({}); // { teamId: lastSubtitleId }

  useEffect(() => {
    if (!student?.teamIds?.length) {
      setMessages([]);
      return;
    }

    const unsubscribes = student.teamIds.map((teamId) =>
      listenToSubtitles(teamId, (rows) => {
        if (!rows.length) return;

        const latest = rows[rows.length - 1];

        // Prevent duplicate adds
        if (lastSeenRef.current[teamId] === latest.id) return;
        lastSeenRef.current[teamId] = latest.id;

        addMessage(latest);
      })
    );

    return () => {
      unsubscribes.forEach((u) => u && u());
      lastSeenRef.current = {};
    };
  }, [student?.teamIds?.join(",")]);

  const addMessage = (subtitle) => {
    const localId = `${subtitle.id}_${Date.now()}`;

    const bubble = {
      ...subtitle,
      localId,
    };

    setMessages((prev) => [...prev, bubble].slice(-3));

    // Auto-remove after 3s (overlay responsibility only)
    setTimeout(() => {
      setMessages((prev) => prev.filter((m) => m.localId !== localId));
    }, 3000);
  };

  return (
    <SubtitleContext.Provider value={{}}>
      {children}

      {/* 🔴 SINGLE GLOBAL SUBTITLE OVERLAY */}
      <SubtitleOverlay messages={messages} />
    </SubtitleContext.Provider>
  );
}
