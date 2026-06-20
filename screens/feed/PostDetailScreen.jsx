import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { listenToComments, addComment } from "../../services/firebase/feed";

export default function PostDetailScreen({ route }) {
  const { postId, postText, postImage, postImages } = route.params;
  const { width } = useWindowDimensions();

  const [comments, setComments] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);

  const listRef = useRef(null);

  const images = postImages && postImages.length > 0 ? postImages : postImage ? [postImage] : [];

  useEffect(() => {
    const unsubscribe = listenToComments(postId, (data) => {
      setComments(data);
      setLoading(false);

      setTimeout(() => {
        listRef.current?.scrollToEnd({ animated: true });
      }, 100);
    });

    return () => unsubscribe && unsubscribe();
  }, [postId]);

  const handleSend = async () => {
    if (!text.trim()) return;
    await addComment(postId, text.trim());
    setText("");
  };

  const imageWidth = Math.max(width - 52, 220);
  const imageHeight = Math.round(imageWidth * 0.72);

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.safe}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <View style={styles.container}>
          <View style={styles.postCard}>
            {postText ? <Text style={styles.postText}>{postText}</Text> : null}

            {images.length > 0 && (
              <FlatList
                data={images}
                keyExtractor={(u, i) => u + i}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                renderItem={({ item }) => <Image source={{ uri: item }} style={[styles.postImage, { width: imageWidth, height: imageHeight }]} />}
              />
            )}
          </View>

          {loading ? (
            <ActivityIndicator color="#4F46E5" style={{ marginTop: 20 }} />
          ) : (
            <FlatList
              ref={listRef}
              data={comments}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingBottom: 12 }}
              renderItem={({ item }) => (
                <View style={styles.commentCard}>
                  <Image source={{ uri: item.authorPhoto || "https://ui-avatars.com/api/?name=User" }} style={styles.avatar} />

                  <View style={styles.commentBody}>
                    <Text style={styles.commentName}>{item.authorName}</Text>
                    <Text style={styles.commentText}>{item.text}</Text>
                  </View>
                </View>
              )}
            />
          )}
        </View>

        <View style={styles.inputBar}>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Write a comment..."
            placeholderTextColor="#9CA3AF"
            style={styles.input}
            multiline
          />

          <TouchableOpacity onPress={handleSend} disabled={!text.trim()} style={styles.sendBtn}>
            <Ionicons name="send" size={18} color={text.trim() ? "#4F46E5" : "#CBD5E1"} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#F5F6F8",
  },
  container: {
    flex: 1,
    padding: 12,
  },
  postCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  postText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1C1C1E",
    marginBottom: 12,
    lineHeight: 22,
  },
  postImage: {
    borderRadius: 16,
    marginRight: 10,
    backgroundColor: "#0F172A",
  },
  commentCard: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    padding: 12,
    borderRadius: 18,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
    backgroundColor: "#D1D5DB",
  },
  commentBody: {
    flex: 1,
  },
  commentName: {
    fontSize: 13,
    fontWeight: "900",
    color: "#1C1C1E",
    marginBottom: 3,
  },
  commentText: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 20,
    fontWeight: "500",
  },
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
  },
  input: {
    flex: 1,
    backgroundColor: "#F9FAFB",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    fontSize: 14,
    color: "#111827",
    maxHeight: 120,
    marginRight: 10,
  },
  sendBtn: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
});

