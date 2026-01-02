// /state/useStudentStore.js
import { create } from "zustand";

export const useStudentStore = create((set) => ({
  /* ───────── STATIC / IDENTITY DATA ───────── */
  students: [],
  selectedStudent: null, // identity, auth-time, stable

  /* ───────── LIVE / MUTABLE DATA ───────── */
  liveStudent: null, // xp, coins, live stats, presence

  /* ───────── ACTIONS ───────── */
  setStudents: (students) => set({ students }),

  setSelectedStudent: (student) =>
    set({
      selectedStudent: student,
      liveStudent: null, // reset live data on identity change
    }),

  setLiveStudent: (liveData) =>
    set({
      liveStudent: liveData,
    }),

  clearStudents: () =>
    set({
      students: [],
      selectedStudent: null,
      liveStudent: null,
    }),
}));
