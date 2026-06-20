import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Image,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";

import { useAuthStore } from "../../state/useAuthStore";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  updateDoc,
  doc,
} from "firebase/firestore";
import { db } from "../../firebase/config";

export default function LikesNotificationScreen({ navigation }) {
  const user = useAuthStore((state) => state.user);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (!user?.uid) return;

    const q = query(
      collection(db, "users", user.uid, "notifications"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const data = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));

      setNotifications(data);

      // ✅ MARK ALL AS SEEN
      for (const item of data) {
        if (!item.seen) {
          await updateDoc(
            doc(db, "users", user.uid, "notifications", item.id),
            { seen: true }
          );
        }
      }
    });

    return () => unsubscribe();
  }, [user?.uid]);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.header}>Activity</Text>

        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={
            <Text style={styles.empty}>No activity yet.</Text>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() =>
                navigation.navigate("PostDetail", {
                  postId: item.postId,
                  postText: item.postText || "",
                })
              }
            >
              <Image
                source={{ uri: item.fromPhoto }}
                style={styles.avatar}
              />

              <View style={{ flex: 1 }}>
                <Text style={styles.text}>
                  <Text style={styles.bold}>{item.fromName}</Text> liked your post
                </Text>

                {item.postText ? (
                  <Text style={styles.preview} numberOfLines={1}>
                    {item.postText}
                  </Text>
                ) : null}
              </View>
            </TouchableOpacity>
          )}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F5F6F8" },
  container: {
    flex: 1,
    backgroundColor: "#F5F6F8",
    padding: 14,
  },

  header: {
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 12,
    color: "#1C1C1E",
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    flexDirection: "row",
    padding: 12,
    marginBottom: 10,
    alignItems: "center",
  },

  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    marginRight: 10,
  },

  text: {
    fontSize: 14,
    color: "#1C1C1E",
  },

  bold: {
    fontWeight: "800",
  },

  preview: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
  },

  empty: {
    textAlign: "center",
    color: "#6B7280",
    marginTop: 40,
  },
});
