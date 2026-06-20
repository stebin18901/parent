import React from "react";
import {
  Dimensions,
  ImageBackground,
  ScrollView,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const { width: screenWidth } = Dimensions.get("window");

const COLORS = {
  bg: "#F2F6FF",
  card: "#FFFFFF",
  border: "#E2E8F0",
  textMain: "#0F172A",
  textSub: "#64748B",
  accent: "#2563EB",
  locked: "#94A3B8",
  lockedBg: "#F1F5F9",
};

function CareerModuleCard({ title, subtitle, iconName, colors, isLocked }) {
  return (
    <View style={styles.cardWrapper}>
      <LinearGradient
        colors={isLocked ? [COLORS.lockedBg, COLORS.lockedBg] : colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.cardBorder}
      >
        <View style={[styles.cardContent, isLocked && styles.lockedContent]}>
          <View style={[styles.iconContainer, isLocked && styles.lockedIconBg]}>
            <MaterialCommunityIcons name={iconName} color={isLocked ? COLORS.textSub : "#FFFFFF"} size={28} />
          </View>
          <View style={styles.textContainer}>
            <View style={styles.titleRow}>
              <Text style={[styles.cardTitle, isLocked && styles.lockedText]}>{title}</Text>
              {isLocked && <MaterialCommunityIcons name="lock" color={COLORS.textSub} size={16} />}
            </View>
            <Text style={[styles.cardSubtitle, isLocked && styles.lockedSubtext]}>{subtitle}</Text>
            <View style={[styles.statusBadge, isLocked && styles.lockedBadge]}>
              <Text style={[styles.statusText, isLocked && styles.lockedBadgeText]}>
                {isLocked ? "COMING SOON" : "ENROLLMENT OPEN"}
              </Text>
            </View>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}

export default function CareerGuidance() {
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.maxWidth}>
          <ImageBackground
            source={{ uri: "https://images.unsplash.com/photo-1614064641938-3bbee52942c7?q=80&w=1000" }}
            style={[styles.heroImage, isLandscape && styles.heroImageLandscape]}
          >
            <LinearGradient colors={["transparent", COLORS.bg]} style={styles.heroOverlay}>
              <View style={styles.headerTag}>
                <MaterialCommunityIcons name="clock-outline" color={COLORS.accent} size={14} />
                <Text style={styles.headerTagText}>STAY TUNED | NEW UPDATES WEEKLY</Text>
              </View>
              <Text style={styles.heroTitle}>The Future Of Learning</Text>
              <Text style={styles.heroSubText}>
                We are building an ecosystem to prepare students for the global stage. Explore the upcoming roadmap.
              </Text>
            </LinearGradient>
          </ImageBackground>

          <View style={styles.contentPadding}>
            <View style={styles.readinessCard}>
              <View style={styles.readinessHeader}>
                <Text style={styles.readinessLabel}>Career Readiness Index</Text>
                <View style={styles.lockInfo}>
                  <MaterialCommunityIcons name="lock-clock" color={COLORS.textSub} size={14} />
                  <Text style={styles.lockInfoText}>UNLOCKS LEVEL 5</Text>
                </View>
              </View>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: "40%", backgroundColor: COLORS.accent }]} />
              </View>
              <Text style={styles.progressHint}>Psychometric analysis modules arriving soon.</Text>
            </View>

            <View style={styles.landscapeColumns}>
              <View style={styles.column}>
                <Text style={styles.sectionTitle}>PROGRAM ROADMAP</Text>
                <CareerModuleCard
                  title="The Innovation Lab"
                  subtitle="Design thinking and creative problem solving modules."
                  iconName="brush-variant"
                  colors={["#6366F1", "#4338CA"]}
                  isLocked
                />
                <CareerModuleCard
                  title="Competitive Edge"
                  subtitle="Foundational training for Olympiads, JEE, and SATs."
                  iconName="tournament"
                  colors={["#F43F5E", "#E11D48"]}
                  isLocked
                />
              </View>
              <View style={styles.column}>
                <Text style={styles.sectionTitle}>UPCOMING TRACKS</Text>
                <CareerModuleCard
                  title="Junior CEO Program"
                  subtitle="Entrepreneurship, financial literacy and pitching skills."
                  iconName="briefcase-variant-outline"
                  colors={["#0EA5E9", "#0369A1"]}
                  isLocked
                />

                <View style={styles.stayTunedBox}>
                  <MaterialCommunityIcons name="auto-fix" color={COLORS.accent} size={32} />
                  <Text style={styles.stayTunedTitle}>Stay Tuned</Text>
                  <Text style={styles.stayTunedDesc}>
                    Our educators and tech teams are finalizing these world-class modules.
                  </Text>
                  <TouchableOpacity style={styles.notifyBtn}>
                    <Text style={styles.notifyBtnText}>NOTIFY ME ON RELEASE</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  container: { flex: 1, backgroundColor: COLORS.bg },
  scrollContent: { paddingBottom: 120, paddingTop: 8 },
  maxWidth: { width: "100%", maxWidth: 1100, alignSelf: "center" },
  heroImage: { width: screenWidth, height: 270, justifyContent: "flex-end", overflow: "hidden" },
  heroImageLandscape: { height: 240, width: "100%", borderRadius: 28, marginHorizontal: 18 },
  heroOverlay: { padding: 24, paddingBottom: 18 },
  headerTag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#DBEAFE",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: "flex-start",
    marginBottom: 10,
  },
  headerTagText: { color: COLORS.accent, fontSize: 10, fontWeight: "900", marginLeft: 5 },
  heroTitle: { fontSize: 34, fontWeight: "900", color: COLORS.textMain, lineHeight: 38 },
  heroSubText: { color: COLORS.textSub, fontSize: 14, marginTop: 8, fontWeight: "600", lineHeight: 20, maxWidth: 700 },
  contentPadding: { paddingHorizontal: 18, paddingTop: 16 },

  readinessCard: { backgroundColor: COLORS.card, borderRadius: 22, padding: 18, borderWidth: 1, borderColor: COLORS.border, marginBottom: 14 },
  readinessHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  readinessLabel: { color: COLORS.textMain, fontSize: 14, fontWeight: "800" },
  lockInfo: { flexDirection: "row", alignItems: "center", gap: 4 },
  lockInfoText: { color: COLORS.textSub, fontSize: 10, fontWeight: "900" },
  progressTrack: { height: 8, backgroundColor: COLORS.lockedBg, borderRadius: 4, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 4 },
  progressHint: { color: COLORS.textSub, fontSize: 11, marginTop: 10, textAlign: "center", fontWeight: "600" },

  landscapeColumns: { flexDirection: "row", gap: 12 },
  column: { flex: 1 },
  sectionTitle: { color: COLORS.textSub, fontSize: 12, fontWeight: "900", letterSpacing: 1.3, marginBottom: 12 },

  cardWrapper: { marginBottom: 12 },
  cardBorder: { borderRadius: 18, padding: 0 },
  cardContent: { backgroundColor: COLORS.card, borderRadius: 18, padding: 16, flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: COLORS.border },
  lockedContent: { backgroundColor: COLORS.lockedBg },
  iconContainer: { width: 54, height: 54, borderRadius: 12, backgroundColor: COLORS.accent, justifyContent: "center", alignItems: "center", marginRight: 14 },
  lockedIconBg: { backgroundColor: "#CBD5E1" },
  textContainer: { flex: 1 },
  titleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  cardTitle: { color: COLORS.textMain, fontSize: 18, fontWeight: "800" },
  lockedText: { color: COLORS.textSub },
  cardSubtitle: { color: COLORS.textSub, fontSize: 13, marginTop: 4, lineHeight: 18 },
  lockedSubtext: { color: COLORS.textSub },
  statusBadge: { alignSelf: "flex-start", marginTop: 10, backgroundColor: "#DBEAFE", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  lockedBadge: { backgroundColor: "#E2E8F0" },
  statusText: { color: COLORS.accent, fontSize: 10, fontWeight: "900" },
  lockedBadgeText: { color: COLORS.textSub },

  stayTunedBox: {
    marginTop: 4,
    alignItems: "center",
    padding: 28,
    backgroundColor: COLORS.card,
    borderRadius: 24,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: COLORS.border,
  },
  stayTunedTitle: { color: COLORS.textMain, fontSize: 22, fontWeight: "900", marginTop: 14 },
  stayTunedDesc: { color: COLORS.textSub, fontSize: 14, textAlign: "center", marginTop: 8, lineHeight: 22 },
  notifyBtn: { marginTop: 18, backgroundColor: COLORS.accent, paddingVertical: 12, paddingHorizontal: 24, borderRadius: 28 },
  notifyBtnText: { color: "#FFFFFF", fontWeight: "900", fontSize: 12 },
});
