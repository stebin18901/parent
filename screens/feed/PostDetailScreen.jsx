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
} from "react-native";

import { listenToComments, addComment } from "../../services/firebase/feed";

export default function PostDetailScreen({ route }) {
  const { postId, postText, postImage, postImages } = route.params;

  const [comments, setComments] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);

  const listRef = useRef(null);

  const images =
    postImages && postImages.length > 0
      ? postImages
      : postImage
      ? [postImage]
      : [];

  /* ───────── LOAD COMMENTS ───────── */
  useEffect(() => {
    const unsubscribe = listenToComments(postId, (data) => {
      setComments(data);
      setLoading(false);

      // Auto scroll to bottom when new comment arrives
      setTimeout(() => {
        listRef.current?.scrollToEnd({ animated: true });
      }, 100);
    });

    return () => unsubscribe && unsubscribe();
  }, [postId]);

  /* ───────── SEND COMMENT ───────── */
  const handleSend = async () => {
    if (!text.trim()) return;
    await addComment(postId, text.trim());
    setText("");
  };

  return (
    <KeyboardAvoidingView
      style={styles.safe}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      {/* ───────── CONTENT ───────── */}
      <View style={styles.container}>
        {/* POST */}
        <View style={styles.postCard}>
          {postText && <Text style={styles.postText}>{postText}</Text>}

          {images.length > 0 && (
            <FlatList
              data={images}
              keyExtractor={(u, i) => u + i}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              renderItem={({ item }) => (
                <Image source={{ uri: item }} style={styles.postImage} />
              )}
            />
          )}
        </View>

        {/* COMMENTS */}
        {loading ? (
          <ActivityIndicator color="#FF9F1C" style={{ marginTop: 20 }} />
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
                <Image
                  source={{
                    uri:
                      item.authorPhoto ||
                      "https://ui-avatars.com/api/?name=User",
                  }}
                  style={styles.avatar}
                />

                <View style={styles.commentBody}>
                  <Text style={styles.commentName}>
                    {item.authorName}
                  </Text>
                  <Text style={styles.commentText}>
                    {item.text}
                  </Text>
                </View>
              </View>
            )}
          />
        )}
      </View>

      {/* ───────── INPUT BAR (NO ABSOLUTE POSITION) ───────── */}
      <View style={styles.inputBar}>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Write a comment…"
          placeholderTextColor="#9CA3AF"
          style={styles.input}
          multiline
        />

        <TouchableOpacity
          onPress={handleSend}
          disabled={!text.trim()}
        >
          <Text
            style={[
              styles.send,
              !text.trim() && { opacity: 0.4 },
            ]}
          >
            Send
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

/* ───────── STYLES ───────── */

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#F5F6F8",
  },

  container: {
    flex: 1,
    padding: 12,
  },

  /* POST */
  postCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 14,
    marginBottom: 10,
    elevation: 3,
  },

  postText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1C1C1E",
    marginBottom: 12,
    lineHeight: 22,
  },

  postImage: {
    width: 320,
    height: 240,
    borderRadius: 16,
    marginRight: 10,
  },

  /* COMMENTS */
  commentCard: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    padding: 12,
    borderRadius: 18,
    marginBottom: 10,
    elevation: 2,
  },

  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
    backgroundColor: "#FF9F1C",
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

  /* INPUT BAR */
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

  send: {
    fontSize: 15,
    fontWeight: "900",
    color: "#FF9F1C",
    paddingBottom: 6,
  },
});
