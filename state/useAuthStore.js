import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      parentProfile: null,

      setUser: (user) => set({ user }),
      setParentProfile: (profile) => set({ parentProfile: profile }),

      logout: () => set({ user: null, parentProfile: null }),
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
