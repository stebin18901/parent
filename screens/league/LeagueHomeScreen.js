import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ScrollView,
  Linking,
  SafeAreaView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

import HorizontalMatchSlider from "./components/HorizontalMatchSlider";
import LeagueTabs from "./components/LeagueTabs";

import { fetchActiveLeague } from "../../services/firebase/league";
import { fetchSeasonTeaserLink } from "../../services/firebase/links";
import {
  secureSeasonSlot,
  hasAlreadyBookedSlot,
} from "../../services/firebase/seasonWaitlist";
import { runLeagueEngine } from "../league/engine/leagueEngine";

const { height } = Dimensions.get("window");

/* ───────── COLORS ───────── */

const COLORS = {
  bgTop: "#000000",
  bgMid: "#0a0a0c",
  bgBottom: "#12121a",
  glass: "rgba(7, 10, 20, 0.92)",
  textMain: "#ffffff",
  textMuted: "#94a3b8",
  gold: "#FACC15",
  accentBlue: "#2563eb",
  successGreen: "#10b981",
};

export default function LeagueHomeScreen() {
  const navigation = useNavigation();

  const [league, setLeague] = useState(null);
  const [videoLink, setVideoLink] = useState(null);

  const [slotBooked, setSlotBooked] = useState(false);
  const [checkingSlot, setCheckingSlot] = useState(true);

  /* ───────── INIT (SINGLE SOURCE OF TRUTH) ───────── */

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    try {
      // 1️⃣ Fetch league
      const activeLeague = await fetchActiveLeague();
      if (!activeLeague) {
        setCheckingSlot(false);
        return;
      }

      setLeague(activeLeague);

      // 2️⃣ Check slot booking
      const booked = await hasAlreadyBookedSlot(activeLeague.id);
      setSlotBooked(booked);

      // 3️⃣ Release UI (IMPORTANT)
      setCheckingSlot(false);

      // 4️⃣ Run engine safely in background
      setTimeout(() => {
        runLeagueEngine(activeLeague);
      }, 0);

      // 5️⃣ Fetch teaser link
      const link = await fetchSeasonTeaserLink();
      setVideoLink(link);
    } catch (err) {
      console.log("LeagueHome init error:", err);
      setCheckingSlot(false);
    }
  };

  /* ───────── ACTIONS ───────── */

  const handleSecureSlot = async () => {
    if (slotBooked || checkingSlot || !league) return;

    try {
      await secureSeasonSlot(league.id);
      setSlotBooked(true);
      navigation.navigate("SeasonConfirmation");
    } catch (e) {
      console.log("Secure slot error:", e);
      alert("Unable to secure slot. Try again.");
    }
  };

  const handleWatchTeaser = async () => {
    try {
      if (!videoLink) {
        alert("Teaser not available yet");
        return;
      }
      await Linking.openURL(videoLink);
    } catch (e) {
      console.log("Teaser open error:", e);
      alert("Unable to open video");
    }
  };

  if (!league) return null;

  /* ───────── UI ───────── */

  return (
    <SafeAreaView style={styles.safe}>
      <View style={{ flex: 1, backgroundColor: "#000" }}>
      {/* BACKGROUND PREVIEW */}
      <View style={{ flex: 1, opacity: 0.25 }}>
        <LinearGradient
          colors={[COLORS.bgTop, COLORS.bgMid, COLORS.bgBottom]}
          style={{ flex: 1 }}
        >
          <View style={styles.header}>
            <Text style={styles.leagueTitle}>{league.name}</Text>
            <Text style={styles.leagueMeta}>Quiz League · Season Live</Text>
          </View>

          <Text style={styles.sectionTitle}>Upcoming Matches</Text>

          {/* FEATURE COMPONENTS (UNCHANGED) */}
          <HorizontalMatchSlider leagueId={league.id} />
          <LeagueTabs leagueId={league.id} />
        </LinearGradient>
      </View>

      {/* LOCK OVERLAY */}
      <View style={styles.lockOverlay}>
        <LinearGradient
          colors={["transparent", COLORS.glass, "#070a14"]}
          style={styles.fullScreen}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* STATUS */}
            <View style={styles.bookingStatusBox}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>
                FIRST LEAGUE BOOKING COMPLETED
              </Text>
            </View>

            <View style={styles.iconCircle}>
              <MaterialCommunityIcons
                name="trophy-variant"
                color={COLORS.gold}
                size={50}
              />
            </View>

            <Text style={styles.lockTitle}>
              The Championship{"\n"}Arena
            </Text>

            <Text style={styles.dateAnnouncement}>
              LEAGUE BEGINS ON:{" "}
              <Text style={{ color: COLORS.gold }}>March 15, 2026</Text>
            </Text>

            {/* FEATURE GRID */}
            <View style={styles.featureGrid}>
              <Feature icon="certificate" text="Verified E-Certificates" />
              <Feature icon="school" text="Academic Scholarships" />
              <Feature icon="chart-areaspline" text="State-wide Rankings" />
              <Feature icon="shield-star" text="Inter-School Prestige" />
            </View>

            {/* CTA */}
            <TouchableOpacity
              style={[
                styles.waitlistBtn,
                (slotBooked || checkingSlot) && { opacity: 0.5 },
              ]}
              onPress={handleSecureSlot}
              disabled={slotBooked || checkingSlot}
            >
              <LinearGradient
                colors={
                  slotBooked
                    ? ["#334155", "#334155"]
                    : [COLORS.accentBlue, "#1d4ed8"]
                }
                style={styles.btnGradient}
              >
                <Text style={styles.waitlistBtnText}>
                  {slotBooked
                    ? "SLOT ALREADY BOOKED"
                    : "SECURE NEXT SEASON SLOT"}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={handleWatchTeaser}
              disabled={!videoLink}
            >
              <Text style={styles.secondaryBtnText}>
                WATCH SEASON TEASER
              </Text>
            </TouchableOpacity>

            <Text style={styles.footerNote}>
              Limited to 500 participants per district.
            </Text>
          </ScrollView>
        </LinearGradient>
      </View>
      </View>
    </SafeAreaView>
  );
}

/* ───────── FEATURE ITEM ───────── */

const Feature = ({ icon, text }) => (
  <View style={styles.featureItem}>
    <MaterialCommunityIcons name={icon} size={24} color={COLORS.accentBlue} />
    <Text style={styles.featureItemText}>{text}</Text>
  </View>
);

/* ───────── STYLES ───────── */

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#000" },
  header: { paddingTop: 18, paddingHorizontal: 24 },
  leagueTitle: { fontSize: 26, fontWeight: "900", color: "#fff" },
  leagueMeta: { fontSize: 13, color: COLORS.textMuted },
  sectionTitle: {
    marginTop: 28,
    marginLeft: 24,
    fontSize: 18,
    fontWeight: "900",
    color: "#fff",
  },

  lockOverlay: { ...StyleSheet.absoluteFillObject },
  fullScreen: { flex: 1, paddingHorizontal: 30 },
  scrollContent: {
    alignItems: "center",
    paddingTop: height * 0.12,
    paddingBottom: 50,
  },

  bookingStatusBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(16,185,129,0.15)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.successGreen,
    marginBottom: 20,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.successGreen,
    marginRight: 8,
  },
  statusText: {
    color: COLORS.successGreen,
    fontSize: 10,
    fontWeight: "900",
  },

  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(250,204,21,0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },

  lockTitle: {
    color: "#fff",
    fontSize: 32,
    fontWeight: "900",
    textAlign: "center",
  },

  dateAnnouncement: {
    color: "#fff",
    fontSize: 14,
    marginTop: 15,
  },

  featureGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: 35,
    width: "100%",
  },
  featureItem: {
    width: "48%",
    backgroundColor: "rgba(255,255,255,0.03)",
    padding: 15,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: "center",
  },
  featureItemText: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 8,
    textAlign: "center",
  },

  waitlistBtn: {
    marginTop: 30,
    width: "100%",
    borderRadius: 12,
    overflow: "hidden",
  },
  btnGradient: {
    paddingVertical: 18,
    alignItems: "center",
  },
  waitlistBtnText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 14,
  },

  secondaryBtn: { marginTop: 15 },
  secondaryBtnText: {
    color: COLORS.textMuted,
    fontWeight: "700",
    fontSize: 12,
  },

  footerNote: {
    color: "#475569",
    fontSize: 10,
    marginTop: 25,
  },
});
