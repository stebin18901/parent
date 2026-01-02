import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  FlatList,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useStudentStore } from "../../state/useStudentStore";
import { getSubjectsByClass } from "../../services/firebase/quiz";
import { LinearGradient } from "expo-linear-gradient";
import TeamHubScreen from "../team/TeamHubScreen";

const { width } = Dimensions.get("window");

/* ───────── ADVANCED COLOR SYSTEM ───────── */
const COLORS = {
  bgTop: "#000000ff",
  bgMid: "#101010ff",
  bgBottom: "#414141ff",

  glass: "rgba(43, 43, 43, 0.96)",
  border: "rgba(255,255,255,0.18)",

  textMain: "#ffffffff",
  textMuted: "#cececeff",

  gold: "#EAB308",
  goldDark: "#CA8A04",
};

/* ───────── TABS ───────── */

function NewsTab() {
  return (
    <View style={styles.glassCard}>
      <Image
        source={{ uri: "https://picsum.photos/1000/700" }}
        style={styles.newsImage}
      />
    </View>
  );
}

function ExploreTab() {
  return <TeamHubScreen />;
}

function NotesTab() {
  return (
    <View style={styles.glassCard}>
      <Text style={styles.cardTitle}>Patch Notes</Text>
      <Text style={styles.cardDesc}>
        Performance improvements, new features, and experience upgrades.
      </Text>
    </View>
  );
}

function EventsTab() {
  return (
    <View style={styles.glassCard}>
      <Text style={styles.cardTitle}>Events</Text>
      <Text style={styles.cardDesc}>
        Competitive leagues, special tournaments, and school challenges.
      </Text>
    </View>
  );
}

/* ───────── MAIN SCREEN ───────── */

export default function StudentCommandHome() {
  const navigation = useNavigation();
  const student = useStudentStore((s) => s.selectedStudent);

  const [subjects, setSubjects] = useState([]);
  const [loadingSubjects, setLoadingSubjects] = useState(false);

  const tabs = ["News", "Explore", "Notes", "Events"];
  const [activeTab, setActiveTab] = useState("News");

  useEffect(() => {
    if (!student?.class) return;

    (async () => {
      try {
        setLoadingSubjects(true);
        const subs = await getSubjectsByClass(student.class);
        setSubjects(subs);
      } finally {
        setLoadingSubjects(false);
      }
    })();
  }, [student?.class]);

  const renderActiveTab = () => {
    if (activeTab === "News") return <NewsTab />;
    if (activeTab === "Explore") return <ExploreTab />;
    if (activeTab === "Notes") return <NotesTab />;
    if (activeTab === "Events") return <EventsTab />;
    return null;
  };

  return (
    <LinearGradient
      colors={[COLORS.bgTop, COLORS.bgMid, COLORS.bgBottom]}
      locations={[0, 0.35, 1]}
      style={{ flex: 1 }}
    >
      <FlatList
        data={[{ key: "home" }]}
        keyExtractor={(i) => i.key}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 160 }}
        renderItem={() => (
          <>
            {/* ───────── HERO HEADER ───────── */}
            <View style={styles.hero}>
              <Text style={styles.heroHello}>Welcome</Text>
              <Text style={styles.heroName}>
                {student?.name || "Student"}
              </Text>
              <Text style={styles.heroMeta}>
                Class {student?.class}
              </Text>
            </View>
            {/* ───────── SUBJECTS ───────── */}
            <Text style={styles.sectionTitle}>Subjects</Text>

            {loadingSubjects ? (
              <Text style={styles.loading}>Loading…</Text>
            ) : (
              <View style={styles.subjectGrid}>
                {subjects.map((sub) => (
                  <TouchableOpacity
                    key={sub}
                    activeOpacity={0.9}
                    onPress={() =>
                      navigation.navigate("ChapterSelect", { subject: sub })
                    }
                    style={styles.subjectCard}
                  >
                    <Text style={styles.subjectText}>{sub}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* ───────── HERO CTA ───────── */}
            <View style={styles.heroActionCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.heroTitle}>
                  Focus. Compete. Master.
                </Text>
                <Text style={styles.heroDesc}>
                  Structured practice and competitive leagues designed to
                  sharpen real performance.
                </Text>

                <TouchableOpacity
                  onPress={() => navigation.navigate("LeagueHome")}
                >
                  <Text style={styles.heroCta}>Enter League →</Text>
                </TouchableOpacity>
              </View>

              <Image
                source={{
                  uri:
                    "https://firebasestorage.googleapis.com/v0/b/dreamprojects-cda5b.appspot.com/o/home%2Fplayercard-Photoroom%20(2).png?alt=media",
                }}
                style={styles.heroImage}
                resizeMode="contain"
              />
            </View>

            

            
          </>
        )}
      />
    </LinearGradient>
  );
}

/* ───────── STYLES ───────── */

const SHADOW_GLASS = {
  shadowColor: "#000",
  shadowOpacity: 0.12,
  shadowRadius: 24,
  shadowOffset: { width: 0, height: 14 },
  elevation: 8,
};

const styles = StyleSheet.create({
  hero: {
    paddingTop: 40,
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  heroHello: {
    fontSize: 13,
    color: "#CBD5E1",
  },
  heroName: {
    fontSize: 30,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  heroMeta: {
    fontSize: 14,
    color: "#94A3B8",
    marginTop: 2,
  },

  heroActionCard: {
    marginHorizontal: 20,
    marginTop: 10,
    backgroundColor: COLORS.glass,
    borderRadius: 28,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOW_GLASS,
  },

  heroTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: COLORS.textMain,
  },
  heroDesc: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 21,
    color: COLORS.textMuted,
  },
  heroCta: {
    marginTop: 14,
    fontSize: 14,
    fontWeight: "900",
    color: COLORS.gold,
  },
  heroImage: {
    width: 110,
    height: 190,
    marginLeft: 10,
  },

  sectionTitle: {
    marginTop: 34,
    marginLeft: 24,
    fontSize: 18,
    fontWeight: "900",
    color: COLORS.textMain,
  },

  loading: {
    marginLeft: 24,
    marginTop: 10,
    color: COLORS.textMuted,
  },

  subjectGrid: {
    marginTop: 16,
    marginHorizontal: 20,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  subjectCard: {
    width: "48%",
    paddingVertical: 24,
    borderRadius: 22,
    backgroundColor: COLORS.glass,
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOW_GLASS,
  },

  subjectText: {
    fontSize: 15,
    fontWeight: "900",
    color: COLORS.textMain,
  },

  tabs: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginTop: 34,
  },

  tabItem: {
    marginRight: 22,
  },

  tabText: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.textMuted,
  },

  tabTextActive: {
    color: COLORS.textMain,
  },

  tabUnderline: {
    height: 3,
    borderRadius: 2,
    backgroundColor: COLORS.gold,
    marginTop: 6,
  },

  glassCard: {
    marginTop: 20,
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 26,
    backgroundColor: COLORS.glass,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOW_GLASS,
  },

  cardTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: COLORS.textMain,
  },

  cardDesc: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 20,
    color: COLORS.textMuted,
  },

  newsImage: {
    width: "100%",
    height: width * 0.55,
    borderRadius: 20,
  },
});
