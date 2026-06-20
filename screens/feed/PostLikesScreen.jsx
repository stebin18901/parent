import React, { useEffect, useState } from "react";
import { View, Text, FlatList, Image, StyleSheet, SafeAreaView } from "react-native";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../../firebase/config";
import { LinearGradient } from "expo-linear-gradient";

export default function PostLikesScreen({ route }) {
  const { postId } = route.params;
  const [likes, setLikes] = useState([]);

  useEffect(() => {
    const ref = collection(db, "feedPosts", postId, "likes");
    const unsub = onSnapshot(ref, (snap) => {
      const data = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setLikes(data);
    });

    return unsub;
  }, [postId]);

  return (
    <SafeAreaView style={styles.safe}>
      <LinearGradient
        colors={["#F8FAFF", "#FFF4EC"]}
        style={styles.container}
      >
        <Text style={styles.title}>Liked By</Text>

        <FlatList
          data={likes}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
          renderItem={({ item }) => (
            <LinearGradient
              colors={["#FFFFFF", "#F8FAFC"]}
              style={styles.row}
            >
              <Image source={{ uri: item.photo }} style={styles.avatar} />
              <Text style={styles.name}>{item.name}</Text>
            </LinearGradient>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No likes yet.</Text>
          }
        />
      </LinearGradient>
    </SafeAreaView>
  );
}

/* ✅ PREMIUM GRADIENT STYLES */

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F8FAFF" },
  container: {
    flex: 1,
    padding: 16,
  },

  title: {
    fontSize: 22,
    fontWeight: "900",
    marginBottom: 16,
    color: "#1C1C1E",
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 10,
    elevation: 3,
  },

  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    marginRight: 12,
    backgroundColor: "#FF9F1C",
  },

  name: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1C1C1E",
  },

  emptyText: {
    textAlign: "center",
    marginTop: 40,
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "600",
  },
});
