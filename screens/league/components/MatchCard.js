import React from "react";
import { View, Text, Image, StyleSheet, Dimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

const { width } = Dimensions.get("window");

export default function MatchCard({ match }) {
  if (!match || !match.teamA || !match.teamB) return null;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#2a2a2a", "#1a1a1a", "#000000"]}
        style={styles.card}
      >
        {/* MATCH OVERLAY GLOW */}
        <View style={styles.glow} />

        {/* TIME BADGE */}
        <View style={styles.timeBadge}>
          <Text style={styles.matchTime}>
             {match.startTime || "20:00"}
          </Text>
        </View>

        <View style={styles.vsRow}>
          {/* TEAM A PLAYER */}
          <View style={styles.playerContainer}>
            <Image
              source={{ uri: match.teamA.captain?.imageLeftUrl }}
              style={styles.playerImage}
            />
            <View style={styles.teamLogoContainer}>
               <Image source={{ uri: match.teamA.logoUrl }} style={styles.miniLogo} />
            </View>
          </View>

          {/* VS SECTION */}
          <View style={styles.vsContainer}>
            <Text style={styles.vsText}>VS</Text>
            <View style={styles.dateContainer}>
               <Text style={styles.dateText}>{match.date}</Text>
            </View>
          </View>

          {/* TEAM B PLAYER */}
          <View style={styles.playerContainer}>
            <Image
              source={{ uri: match.teamB.captain?.imageRightUrl }}
              style={styles.playerImage}
            />
            <View style={[styles.teamLogoContainer, { right: 0, left: undefined }]}>
               <Image source={{ uri: match.teamB.logoUrl }} style={styles.miniLogo} />
            </View>
          </View>
        </View>

        {/* TEAM NAMES FOOTER */}
        <View style={styles.footer}>
          <Text style={styles.teamName} numberOfLines={1}>{match.teamA.name}</Text>
          <View style={styles.footerDivider} />
          <Text style={styles.teamName} numberOfLines={1}>{match.teamB.name}</Text>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 10,
    marginRight: 16,
    borderRadius: 24,
  },
  card: {
    width: 280,
    height: 180,
    borderRadius: 24,
    padding: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
  },
  glow: {
    position: 'absolute',
    top: -50,
    left: '25%',
    width: 150,
    height: 150,
    backgroundColor: 'rgba(234, 179, 8, 0.1)',
    borderRadius: 75,
    filter: 'blur(40px)',
  },
  timeBadge: {
    alignSelf: 'center',
    backgroundColor: '#EAB308',
    paddingHorizontal: 12,
    paddingVertical: 2,
    borderRadius: 12,
    zIndex: 10,
  },
  matchTime: {
    fontSize: 10,
    fontWeight: "900",
    color: "#000",
  },
  vsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: -5,
  },
  playerContainer: {
    width: 90,
    height: 110,
    position: 'relative',
  },
  playerImage: {
    width: '100%',
    height: '100%',
    resizeMode: "contain",
  },
  teamLogoContainer: {
    position: 'absolute',
    bottom: 5,
    left: 0,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 2,
    borderWidth: 1,
    borderColor: '#EAB308',
  },
  miniLogo: {
    width: 18,
    height: 18,
    borderRadius: 8,
  },
  vsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  vsText: {
    fontSize: 24,
    fontWeight: "900",
    color: "#ffffff",
    fontStyle: 'italic',
    opacity: 0.8,
  },
  dateContainer: {
    marginTop: 4,
  },
  dateText: {
    fontSize: 9,
    color: "#9ca3af",
    fontWeight: "600",
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingVertical: 6,
    borderRadius: 12,
  },
  teamName: {
    flex: 1,
    fontSize: 11,
    fontWeight: "800",
    color: "#ffffff",
    textAlign: "center",
    paddingHorizontal: 4,
  },
  footerDivider: {
    width: 1,
    height: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
  }
});