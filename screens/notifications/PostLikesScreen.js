import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Image,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "../../firebase/config";

export default function PostLikesScreen({ route, navigation }) {
  const { postId } = route.params;

  const [likes, setLikes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, "feedPosts", postId, "likes"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setLikes(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [postId]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#FF9F1C" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>Liked By</Text>

        <FlatList
          data={likes}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.row}>
              <Image
                source={{
                  uri:
                    item.photo ||
                    "https://ui-avatars.com/api/?background=FF9F1C&color=fff&name=Student",
                }}
                style={styles.avatar}
              />

              <View style={styles.info}>
                <Text style={styles.name}>{item.name || "Student"}</Text>
                <Text style={styles.role}>{item.role || "USER"}</Text>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <Text style={styles.empty}>No likes yet.</Text>
          }
        />
      </View>
    </SafeAreaView>
  );
}

/* ✅ PREMIUM STYLES */
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F5F6F8" },
  container: {
    flex: 1,
    backgroundColor: "#F5F6F8",
    padding: 16,
  },

  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1C1C1E",
    marginBottom: 14,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 12,
    borderRadius: 16,
    marginBottom: 10,

    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 4,
  },

  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    marginRight: 12,
    backgroundColor: "#FF9F1C",
  },

  info: {
    flex: 1,
  },

  name: {
    fontSize: 15,
    fontWeight: "800",
    color: "#1C1C1E",
  },

  role: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
    fontWeight: "600",
  },

  empty: {
    marginTop: 40,
    textAlign: "center",
    color: "#6B7280",
    fontSize: 14,
  },

  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
