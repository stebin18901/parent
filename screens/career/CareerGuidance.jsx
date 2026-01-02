import React from 'react';
import { 
  StyleSheet, View, Text, ScrollView, TouchableOpacity, ImageBackground, Dimensions 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

// Reusable Component for Marketing Cards with "Locked" state
const CareerModuleCard = ({ title, subtitle, iconName, colors, isLocked }) => (
  <View style={styles.cardWrapper}>
    <LinearGradient 
      colors={isLocked ? ['#1e293b', '#0f172a'] : colors} 
      start={{ x: 0, y: 0 }} 
      end={{ x: 1, y: 0 }} 
      style={[styles.cardBorder, isLocked && styles.lockedBorder]}
    >
      <View style={[styles.cardContent, isLocked && styles.lockedContent]}>
        <View style={[styles.iconContainer, isLocked && styles.lockedIconBg]}>
          <MaterialCommunityIcons 
            name={iconName} 
            color={isLocked ? '#475569' : "#fff"} 
            size={28} 
          />
        </View>
        <View style={styles.textContainer}>
          <View style={styles.titleRow}>
            <Text style={[styles.cardTitle, isLocked && styles.lockedText]}>{title}</Text>
            {isLocked && <MaterialCommunityIcons name="lock" color="#64748b" size={16} />}
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

const CareerGuidance = () => {
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      
      {/* Hero Section */}
      <ImageBackground 
        source={{ uri: 'https://images.unsplash.com/photo-1614064641938-3bbee52942c7?q=80&w=1000' }} 
        style={styles.heroImage}
      >
        <LinearGradient colors={['transparent', '#020617']} style={styles.heroOverlay}>
          <View style={styles.headerTag}>
            <MaterialCommunityIcons name="clock-outline" color="#3b82f6" size={14} />
            <Text style={styles.headerTagText}>STAY TUNED • NEW UPDATES WEEKLY</Text>
          </View>
          <Text style={styles.heroTitle}>The Future Of{"\n"}Learning</Text>
          <Text style={styles.heroSubText}>
            We are building an ecosystem to prepare students for the global stage. Explore our upcoming roadmap below.
          </Text>
        </LinearGradient>
      </ImageBackground>

      <View style={styles.contentPadding}>
        
        {/* Readiness Section */}
        <View style={styles.readinessCard}>
          <View style={styles.readinessHeader}>
            <Text style={styles.readinessLabel}>Career Readiness Index</Text>
            <View style={styles.lockInfo}>
              <MaterialCommunityIcons name="lock-clock" color="#64748b" size={14} />
              <Text style={styles.lockInfoText}> UNLOCKS LEVEL 5</Text>
            </View>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: '40%', backgroundColor: '#334155' }]} />
          </View>
          <Text style={styles.progressHint}>Psychometric analysis modules arriving soon...</Text>
        </View>

        <Text style={styles.sectionTitle}>PROGRAM ROADMAP</Text>

        {/* Feature 1: Innovation (Live or Soon) */}
        <CareerModuleCard 
          title="The Innovation Lab"
          subtitle="Design Thinking & Creative Problem Solving modules."
          iconName="brush-variant"
          colors={['#6366f1', '#4338ca']}
          isLocked={true}
        />

        {/* Feature 2: Competitive Focus */}
        <CareerModuleCard 
          title="Competitive Edge"
          subtitle="Foundational training for Olympiads, JEE, and SATs."
          iconName="tournament"
          colors={['#f43f5e', '#e11d48']}
          isLocked={true}
        />

        {/* Feature 3: Entrepreneurship */}
        <CareerModuleCard 
          title="Junior CEO Program"
          subtitle="Entrepreneurship, Financial Literacy & Pitching Skills."
          iconName="briefcase-variant-outline"
          colors={['#0ea5e9', '#0369a1']}
          isLocked={true}
        />

        {/* Feature 4: Tech & AI */}
        <CareerModuleCard 
          title="AI & Tech Frontiers"
          subtitle="Applied Coding, Robotics, and Artificial Intelligence."
          iconName="robot-mop"
          colors={['#8b5cf6', '#6d28d9']}
          isLocked={true}
        />

        {/* Stay Tuned Footer */}
        <View style={styles.stayTunedBox}>
          <MaterialCommunityIcons name="auto-fix" color="#3b82f6" size={32} />
          <Text style={styles.stayTunedTitle}>Stay Tuned!</Text>
          <Text style={styles.stayTunedDesc}>
            Our educators and tech teams are finalizing these world-class modules. Notification will be sent once they are live.
          </Text>
          <TouchableOpacity style={styles.notifyBtn}>
            <Text style={styles.notifyBtnText}>NOTIFY ME ON RELEASE</Text>
          </TouchableOpacity>
        </View>

      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' },
  heroImage: { width: width, height: 320, justifyContent: 'flex-end' },
  heroOverlay: { padding: 25, paddingBottom: 20 },
  headerTag: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(59, 130, 246, 0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, alignSelf: 'flex-start', marginBottom: 12, borderWidth: 1, borderColor: 'rgba(59, 130, 246, 0.3)' },
  headerTagText: { color: '#3b82f6', fontSize: 10, fontWeight: 'bold', marginLeft: 5, letterSpacing: 0.5 },
  heroTitle: { fontSize: 36, fontWeight: '900', color: '#fff', textTransform: 'uppercase', lineHeight: 40 },
  heroSubText: { color: '#94a3b8', fontSize: 14, marginTop: 10, fontWeight: '500', lineHeight: 20 },
  contentPadding: { padding: 20 },
  
  // Readiness Score Styling
  readinessCard: { backgroundColor: '#0f172a', borderRadius: 20, padding: 20, marginBottom: 25, borderWidth: 1, borderColor: '#1e293b' },
  readinessHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  readinessLabel: { color: '#94a3b8', fontSize: 14, fontWeight: 'bold' },
  lockInfo: { flexDirection: 'row', alignItems: 'center' },
  lockInfoText: { color: '#64748b', fontSize: 10, fontWeight: 'bold' },
  progressTrack: { height: 8, backgroundColor: '#020617', borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },
  progressHint: { color: '#475569', fontSize: 11, marginTop: 10, textAlign: 'center' },
  
  sectionTitle: { color: '#334155', fontSize: 12, fontWeight: '900', letterSpacing: 2, marginBottom: 20, textAlign: 'center' },
  
  // Card Styling
  cardWrapper: { marginBottom: 15 },
  cardBorder: { borderRadius: 18, padding: 1.5 },
  lockedBorder: { borderColor: '#1e293b', borderWidth: 1, padding: 0 },
  cardContent: { backgroundColor: '#0f172a', borderRadius: 17, padding: 16, flexDirection: 'row', alignItems: 'center' },
  lockedContent: { opacity: 0.7 },
  iconContainer: { width: 54, height: 54, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  lockedIconBg: { backgroundColor: '#020617' },
  textContainer: { flex: 1 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  lockedText: { color: '#64748b' },
  cardSubtitle: { color: '#64748b', fontSize: 13, marginTop: 3, lineHeight: 18 },
  lockedSubtext: { color: '#334155' },
  statusBadge: { alignSelf: 'flex-start', marginTop: 10, backgroundColor: 'rgba(59, 130, 246, 0.1)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  lockedBadge: { backgroundColor: '#1e293b', borderWidth: 0 },
  statusText: { color: '#3b82f6', fontSize: 10, fontWeight: '900' },
  lockedBadgeText: { color: '#475569' },

  // Stay Tuned Section
  stayTunedBox: { marginTop: 30, marginBottom: 50, alignItems: 'center', padding: 30, backgroundColor: '#0f172a', borderRadius: 25, borderWidth: 1, borderStyle: 'dashed', borderColor: '#334155' },
  stayTunedTitle: { color: '#fff', fontSize: 22, fontWeight: 'bold', marginTop: 15 },
  stayTunedDesc: { color: '#64748b', fontSize: 14, textAlign: 'center', marginTop: 10, lineHeight: 22 },
  notifyBtn: { marginTop: 20, backgroundColor: 'transparent', paddingVertical: 12, paddingHorizontal: 25, borderRadius: 30, borderWidth: 1, borderColor: '#3b82f6' },
  notifyBtnText: { color: '#3b82f6', fontWeight: 'bold', fontSize: 12 }
});

export default CareerGuidance;