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
  Dimensions,
  StatusBar,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient"; 

import {
  listenToFeed,
  likePost,
  unlikePost,
  hasUserLikedPost,
} from "../../services/firebase/feed";
import { fetchHomeMessage } from "../../services/firebase/messages";
import { useStudentStore } from "../../state/useStudentStore";

const { width } = Dimensions.get("window");

const COLORS = {
  bg: "#000000",
  card: "#0D0D0D",
  border: "rgba(255,255,255,0.08)",
  accent: "#FACC15", 
  accentDark: "#A1840B",
  textMain: "#FFFFFF",
  textSub: "#A1A1AA",
  textMuted: "#52525B",
  like: "#EF4444",
};

export default function FeedHomeScreen({ navigation }) {
  const student = useStudentStore((s) => s.selectedStudent);

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

  const renderPost = useCallback(({ item }) => {
    const isLiked = likedMap[item.id];
    const media = item.mediaUrls?.[0] || item.mediaUrl;

    return (
      <View style={styles.postCard}>
        {/* HEADER */}
        <View style={styles.authorRow}>
          <View style={styles.avatarWrapper}>
            <Image
              source={{
                uri: item.authorPhoto || `https://ui-avatars.com/api/?background=333&color=fff&name=${item.authorName || "S"}`,
              }}
              style={styles.avatar}
            />
          </View>
          <View style={styles.authorInfo}>
            <Text style={styles.authorName}>{item.authorName || "Arena Athlete"}</Text>
            <View style={styles.roleBadge}>
               <Text style={styles.roleText}>{item.authorRole || "Elite"}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.moreOptions}>
            <Text style={styles.moreOptionsText}>•••</Text>
          </TouchableOpacity>
        </View>

        {/* CONTENT */}
        {item.text && (
          <Text style={styles.bodyText}>
            {item.text}
          </Text>
        )}

        {/* MEDIA */}
        {media && (
          <TouchableOpacity 
            activeOpacity={0.95}
            onPress={() => navigation.navigate("PostDetail", { postId: item.id })}
            style={styles.mediaContainer}
          >
            <Image source={{ uri: media }} style={styles.mediaImage} />
          </TouchableOpacity>
        )}

        {/* INTERACTION BAR */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.interactionBtn}
            onPress={() => toggleLike(item.id)}
          >
            <Text style={[styles.actionIcon, isLiked && { color: COLORS.like }]}>
              {isLiked ? "❤️" : "♡"}
            </Text>
            <Text style={[styles.actionCount, isLiked && { color: COLORS.like }]}>
              {item.likesCount || 0}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.interactionBtn}
            onPress={() => navigation.navigate("PostDetail", { postId: item.id })}
          >
            <Text style={styles.actionIcon}>💬</Text>
            <Text style={styles.actionCount}>{item.commentsCount || 0}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }, [likedMap]);

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="small" color={COLORS.accent} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* TOP BRANDING HEADER */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>ARENA</Text>
          <Text style={styles.headerSub}>CHAMPIONS FEED</Text>
        </View>
        <TouchableOpacity style={styles.profileCircle}>
          <Image
            source={{ uri: student?.photo || "https://ui-avatars.com/api/?name=Me" }}
            style={styles.smallAvatar}
          />
        </TouchableOpacity>
      </View>

      {/* ANNOUNCEMENT */}
      {homeMessage && (
        <View style={styles.messageBanner}>
          <LinearGradient
            colors={['rgba(250,204,21,0.15)', 'transparent']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={styles.bannerGradient}
          >
            <Text style={styles.messageText}>📢 {homeMessage}</Text>
          </LinearGradient>
        </View>
      )}

      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={renderPost}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>The arena is empty. Start the hype.</Text>
          </View>
        }
      />

      {/* CENTERED PREMIUM FAB */}
      <TouchableOpacity
        activeOpacity={0.9}
        style={styles.fabWrapper}
        onPress={() => navigation.navigate("CreatePost")}
      >
        <LinearGradient
          colors={[COLORS.accent, COLORS.accentDark]}
          style={styles.fab}
        >
          <Text style={styles.fabIcon}>+</Text>
          <Text style={styles.fabText}>NEW POST</Text>
        </LinearGradient>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  loader: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: COLORS.bg },

  /* Header */
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "900",
    color: COLORS.textMain,
    letterSpacing: -0.5,
  },
  headerSub: {
    fontSize: 9,
    color: COLORS.accent,
    fontWeight: "900",
    letterSpacing: 2,
    marginTop: -2,
  },
  profileCircle: { padding: 2, borderRadius: 20, borderWidth: 1, borderColor: COLORS.border },
  smallAvatar: { width: 32, height: 32, borderRadius: 16 },

  /* Banner */
  messageBanner: { marginHorizontal: 16, marginBottom: 12, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(250,204,21,0.2)' },
  bannerGradient: { paddingVertical: 10, paddingHorizontal: 16 },
  messageText: { color: COLORS.accent, fontSize: 12, fontWeight: "700" },

  /* List */
  listContent: { paddingBottom: 100 },
  postCard: {
    backgroundColor: COLORS.card,
    marginBottom: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
  },

  /* Post Header */
  authorRow: { flexDirection: "row", alignItems: "center", padding: 16 },
  avatarWrapper: { borderRadius: 10, overflow: 'hidden', marginRight: 12, backgroundColor: '#222' },
  avatar: { width: 40, height: 40 },
  authorInfo: { flex: 1 },
  authorName: { color: COLORS.textMain, fontSize: 15, fontWeight: "700" },
  roleBadge: { alignSelf: 'flex-start', marginTop: 2 },
  roleText: { color: COLORS.textMuted, fontSize: 11, fontWeight: "700", textTransform: 'uppercase' },
  moreOptionsText: { color: COLORS.textMuted, fontSize: 16, letterSpacing: 1 },

  /* Post Body */
  bodyText: {
    color: COLORS.textMain,
    fontSize: 15,
    lineHeight: 22,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  mediaContainer: { width: width, height: width, backgroundColor: '#050505' },
  mediaImage: { width: "100%", height: "100%", resizeMode: 'cover' },

  /* Footer Actions */
  actionRow: {
    flexDirection: "row",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.03)',
  },
  interactionBtn: { flexDirection: "row", alignItems: "center", marginRight: 24 },
  actionIcon: { fontSize: 20, color: COLORS.textMain },
  actionCount: { color: COLORS.textMain, fontSize: 14, fontWeight: "800", marginLeft: 8 },

  /* FAB */
  fabWrapper: {
    position: "absolute",
    bottom: 30,
    alignSelf: 'center',
    borderRadius: 30,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  fab: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 30,
  },
  fabIcon: { fontSize: 18, fontWeight: "bold", color: "#000", marginRight: 8 },
  fabText: { fontSize: 13, fontWeight: "900", color: "#000", letterSpacing: 1 },

  emptyState: { alignItems: "center", marginTop: 100 },
  emptyText: { color: COLORS.textMuted, fontSize: 14 },
});