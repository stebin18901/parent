import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  SafeAreaView,
  Image,
  ImageBackground,
  StatusBar,
  useWindowDimensions,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";

import {
  listenToFeed,
  likePost,
  unlikePost,
  hasUserLikedPost,
} from "../../services/firebase/feed";
import { fetchHomeMessage } from "../../services/firebase/messages";
import { useStudentStore } from "../../state/useStudentStore";

const COLORS = {
  bg: "#F8FAFC",
  card: "#FFFFFF",
  border: "#E2E8F0",
  accent: "#4F46E5",
  accentDark: "#3730A3",
  textMain: "#0F172A",
  textSub: "#475569",
  textMuted: "#94A3B8",
  like: "#F43F5E",
};

export default function FeedHomeScreen({ navigation }) {
  const student = useStudentStore((s) => s.selectedStudent);
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  
  const isLandscape = width > height;
  const cardWidth = isLandscape ? Math.min(width - 56, 980) : width - 24; 
  const reelHeight = isLandscape ? Math.min(height - 140, 520) : height - (tabBarHeight + insets.top + 80);
  const fabBottom = isLandscape ? tabBarHeight + 10 : tabBarHeight + 14;

  const [posts, setPosts] = useState([]);
  const [likedMap, setLikedMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [homeMessage, setHomeMessage] = useState(null);

  useEffect(() => {
    loadMessage();
  }, []);

  useEffect(() => {
    if (!student) return;

    const unsub = listenToFeed(student, async (data) => {
      setPosts(data);
      setLoading(false);

      const map = {};
      await Promise.all(
        data.map(async (p) => {
          map[p.id] = await hasUserLikedPost(p.id);
        })
      );
      setLikedMap(map);
    });

    return () => unsub && unsub();
  }, [student]);

  const loadMessage = async () => {
    try {
      const msg = await fetchHomeMessage();
      setHomeMessage(msg);
    } catch (e) {
      console.log("Message fetch error", e);
    }
  };

  const toggleLike = async (id) => {
    const isCurrentlyLiked = likedMap[id];
    setLikedMap((prev) => ({ ...prev, [id]: !isCurrentlyLiked }));

    try {
      isCurrentlyLiked ? await unlikePost(id) : await likePost(id);
    } catch (error) {
      setLikedMap((prev) => ({ ...prev, [id]: isCurrentlyLiked }));
    }
  };

  const renderPost = useCallback(
    ({ item }) => {
      const isLiked = likedMap[item.id];
      const media = item.mediaUrls?.[0] || item.mediaUrl;
      return (
        <View style={[styles.reelCard, { width: cardWidth, height: reelHeight }]}>
          <ImageBackground
            source={{ uri: media || "https://images.unsplash.com/photo-1482062364825-616fd23b8fc1?q=80&w=1000" }}
            style={styles.reelMedia}
            imageStyle={styles.reelMediaImage}
          >
            <LinearGradient
              colors={["rgba(0,0,0,0.5)", "transparent", "rgba(0,0,0,0.8)"]}
              style={styles.reelOverlay}
            >
              <View style={styles.reelHeader}>
                <View style={styles.avatarWrapper}>
                  <Image
                    source={{
                      uri: item.authorPhoto ||
                        `https://ui-avatars.com/api/?background=4F46E5&color=fff&name=${item.authorName || "S"}`,
                    }}
                    style={styles.avatar}
                  />
                </View>
                <View style={styles.authorInfo}>
                  <Text style={styles.authorName}>{item.authorName || "Arena Athlete"}</Text>
                  <View style={styles.roleTag}>
                    <Text style={styles.roleText}>{item.authorRole || "Elite"}</Text>
                  </View>
                </View>
                <TouchableOpacity style={styles.moreOptions}>
                   <MaterialCommunityIcons name="dots-vertical" size={20} color="#FFF" />
                </TouchableOpacity>
              </View>

              <View style={styles.reelFooter}>
                <View style={styles.reelTextBlock}>
                  {item.text && <Text style={styles.reelText} numberOfLines={3}>{item.text}</Text>}
                </View>
                
                <View style={styles.reelActions}>
                  <TouchableOpacity style={styles.reelActionBtn} onPress={() => toggleLike(item.id)}>
                    <View style={[styles.actionIconCircle, isLiked && styles.likedCircle]}>
                        <Ionicons name={isLiked ? "heart" : "heart-outline"} size={22} color="#FFFFFF" />
                    </View>
                    <Text style={styles.reelActionText}>{item.likesCount || 0}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.reelActionBtn}
                    onPress={() => navigation.navigate("PostDetail", { postId: item.id })}
                  >
                    <View style={styles.actionIconCircle}>
                        <Ionicons name="chatbubble-outline" size={20} color="#FFFFFF" />
                    </View>
                    <Text style={styles.reelActionText}>{item.commentsCount || 0}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </LinearGradient>
          </ImageBackground>
        </View>
      );
    },
    [likedMap, reelHeight, cardWidth, navigation]
  );

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={COLORS.accent} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      

      
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={[styles.postWrap, { width: cardWidth }]}>
            {renderPost({ item })}
          </View>
        )}
        pagingEnabled
        snapToInterval={reelHeight + 12} // Matches card height + margin
        decelerationRate="fast"
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: tabBarHeight + insets.bottom + 100 },
          isLandscape && styles.listLandscape,
        ]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name=" trophies-outline" size={48} color={COLORS.textMuted} />
            <Text style={styles.emptyText}>The arena is empty. Start the hype.</Text>
          </View>
        }
      />

      {/* Floating Action Button */}
      <TouchableOpacity
        activeOpacity={0.85}
        style={[
          styles.fabWrapper,
          isLandscape && styles.fabLandscape,
          { bottom: fabBottom },
        ]}
        onPress={() => navigation.navigate("CreatePost")}
      >
        <LinearGradient 
          colors={[COLORS.accent, COLORS.accentDark]} 
          start={{x:0, y:0}} 
          end={{x:1, y:1}} 
          style={styles.fab}
        >
          <Ionicons name="add-circle" size={20} color="#FFFFFF" />
          <Text style={styles.fabText}>NEW POST</Text>
        </LinearGradient>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  loader: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: COLORS.bg },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  headerLandscape: { maxWidth: 980, alignSelf: "center", width: "100%", paddingTop: 8 },
  headerTitle: {
    fontSize: 26,
    fontWeight: "900",
    color: COLORS.textMain,
    letterSpacing: -1,
  },
  headerSub: {
    fontSize: 10,
    color: COLORS.accent,
    fontWeight: "800",
    letterSpacing: 2.5,
    marginTop: -4,
  },
  profileCircle: { 
    padding: 2, 
    borderRadius: 22, 
    borderWidth: 1.5, 
    borderColor: COLORS.border,
    backgroundColor: '#FFF' 
  },
  smallAvatar: { width: 34, height: 34, borderRadius: 17 },

  // Message Banner
  messageBanner: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(79, 70, 229, 0.1)",
  },
  bannerGradient: { paddingVertical: 12, paddingHorizontal: 16 },
  messageRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  iconBg: { backgroundColor: '#FFF', padding: 4, borderRadius: 6 },
  messageText: { color: COLORS.textMain, fontSize: 13, fontWeight: "600", flex: 1 },

  // Feed / Cards
  listContent: { paddingHorizontal: 12 },
  listLandscape: { paddingTop: 6, alignItems: "center" },
  postWrap: { alignSelf: "center", marginBottom: 12 },
  reelCard: {
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: "#0F172A",
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 10 },
      android: { elevation: 6 },
    }),
  },
  reelMedia: { flex: 1 },
  reelMediaImage: { width: "100%", height: "100%", opacity: 0.9 },
  reelOverlay: { flex: 1, justifyContent: "space-between", padding: 20 },
  
  reelHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatarWrapper: { borderRadius: 14, borderWidth: 2, borderColor: "rgba(255,255,255,0.3)", overflow: 'hidden' },
  avatar: { width: 44, height: 44 },
  authorInfo: { flex: 1 },
  authorName: { color: "#FFFFFF", fontSize: 16, fontWeight: "800", textShadowColor: 'rgba(0,0,0,0.5)', textShadowRadius: 4 },
  roleTag: { backgroundColor: COLORS.accent, alignSelf: 'flex-start', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginTop: 2 },
  roleText: { color: "#FFF", fontSize: 10, fontWeight: "900", textTransform: "uppercase" },
  moreOptions: { padding: 4 },

  reelFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
  reelTextBlock: { flex: 1, paddingRight: 15 },
  reelText: { 
    color: "#FFFFFF", 
    fontSize: 15, 
    lineHeight: 22, 
    fontWeight: "600", 
    textShadowColor: 'rgba(0,0,0,0.8)', 
    textShadowRadius: 8 
  },
  
  reelActions: { gap: 16, alignItems: "center", backgroundColor: 'rgba(0,0,0,0.4)', padding: 8, borderRadius: 30 },
  reelActionBtn: { alignItems: "center", gap: 4 },
  actionIconCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  likedCircle: { backgroundColor: COLORS.like },
  reelActionText: { color: "#FFFFFF", fontSize: 12, fontWeight: "900" },

  // FAB
  fabWrapper: {
    position: "absolute",
    alignSelf: "center",
    ...Platform.select({
        ios: { shadowColor: COLORS.accent, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.4, shadowRadius: 15 },
        android: { elevation: 12 },
    }),
  },
  fabLandscape: { right: 24, alignSelf: "auto" },
  fab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 26,
    paddingVertical: 14,
    borderRadius: 30,
  },
  fabText: { fontSize: 14, fontWeight: "900", color: "#FFFFFF", letterSpacing: 1.5 },

  emptyState: { alignItems: "center", marginTop: 120, gap: 10 },
  emptyText: { color: COLORS.textMuted, fontSize: 15, fontWeight: "600" },
});