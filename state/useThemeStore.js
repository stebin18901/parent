import { create } from 'zustand';

export const THEMES = {
  dark: {
    bg: "#000000",
    surface: "#111827",
    glass: "rgba(255,255,255,0.04)",
    border: "rgba(255,255,255,0.08)",
    textMain: "#F9FAFB",
    textSub: "#CBD5F5",
    textMuted: "#94A3B8",
    accent: "#FACC15",
    success: "#22C55E",
    danger: "#EF4444",
    isDark: true,
  },
  light: {
    bg: "#F3F4F6",
    surface: "#FFFFFF",
    glass: "rgba(0,0,0,0.04)",
    border: "rgba(0,0,0,0.1)",
    textMain: "#111827",
    textSub: "#374151",
    textMuted: "#6B7280",
    accent: "#EAB308",
    success: "#16A34A",
    danger: "#DC2626",
    isDark: false,
  },
};

export const useThemeStore = create((set) => ({
  theme: THEMES.dark,
  toggleTheme: () => set((state) => ({
    theme: state.theme.isDark ? THEMES.light : THEMES.dark
  })),
}));