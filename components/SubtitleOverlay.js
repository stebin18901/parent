import React, { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, Animated, Image } from "react-native";

export default function SubtitleOverlay({ messages = [] }) {
  const [localMessages, setLocalMessages] = useState([]);
  const animRefs = useRef({});

  useEffect(() => {
    setLocalMessages((prev) => {
      // Map to track updates to existing bubbles
      const newMessages = [...prev];
      
      messages.forEach((incoming) => {
        const index = newMessages.findIndex((m) => m.id === incoming.id);
        
        if (index > -1) {
          // UPDATE EXISTING: Keep the same bubble, just update text
          newMessages[index] = { ...newMessages[index], text: incoming.text };
        } else {
          // ADD NEW
          newMessages.push({ ...incoming, localId: incoming.id });
        }
      });

      return newMessages.slice(-5); // Keep visible count low
    });
  }, [messages]);

  useEffect(() => {
    localMessages.forEach((m) => {
      if (animRefs.current[m.id]) return;

      const opacity = new Animated.Value(0);
      animRefs.current[m.id] = { opacity };

      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();

      // Auto-remove after 4 seconds of no updates
      setTimeout(() => {
        setLocalMessages((prev) => prev.filter((x) => x.id !== m.id));
        delete animRefs.current[m.id];
      }, 4000);
    });
  }, [localMessages]);

  return (
    <View pointerEvents="none" style={styles.container}>
      {localMessages.map((m) => (
        <Animated.View key={m.id} style={[styles.bubble, { opacity: animRefs.current[m.id]?.opacity }]}>
          <Image source={{ uri: m.photo }} style={styles.avatar} />
          <View style={styles.textWrap}>
            <Text style={styles.name}>{m.name}</Text>
            <Text style={[styles.text, !m.isFinal && styles.streamingText]}>
              {m.text}{!m.isFinal ? "..." : ""}
            </Text>
          </View>
        </Animated.View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { position: "absolute", left: 15, top: 40, width: "70%", zIndex: 9999 },
  bubble: { flexDirection: "row", backgroundColor: "rgba(15, 23, 42, 0.9)", padding: 10, borderRadius: 15, marginTop: 8, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" },
  avatar: { width: 32, height: 32, borderRadius: 16, marginRight: 8, backgroundColor: '#334155' },
  textWrap: { flex: 1 },
  name: { color: "#94A3B8", fontSize: 10, fontWeight: "bold", textTransform: 'uppercase' },
  text: { color: "#F8FAFC", fontSize: 14, fontWeight: "500" },
  streamingText: { color: "#38BDF8", fontStyle: 'italic' } // Blue-ish color for live typing
});