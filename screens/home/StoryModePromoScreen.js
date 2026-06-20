import React, { useEffect, useRef, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  StatusBar,
  Image,
  Dimensions,
  Animated,
  TouchableOpacity,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { listenToStoryModePromos } from "../../services/firebase/storyMode";

const { width, height } = Dimensions.get("window");

const DEFAULT_DATA = [
  {
    id: "1",
    title: "THE LOST",
    subtitle: "KINGDOM",
    description: "A forgotten crown. A rising darkness. The fate of the realm hangs by a single thread.",
    image: "https://wallpapercave.com/wp/wp6148047.jpg",
    color: "#6366f1",
  },
  {
    id: "2",
    title: "NEO",
    subtitle: "TOKYO",
    description: "In a city of chrome and shadows, the line between man and machine begins to fade.",
    image: "https://i.pinimg.com/originals/8d/d8/82/8dd8821048fb89ab267409770306998d.jpg",
    color: "#f43f5e",
  },
  {
    id: "3",
    title: "DRAGON",
    subtitle: "LEGACY",
    description: "Ancient bloodlines stir. Awaken the fire within and reclaim your stolen birthright.",
    image: "https://images.unsplash.com/photo-1618336753974-aae8e04506aa?q=80&w=1200",
    color: "#fbbf24",
  },
];

export default function PerfectCarousel() {
  const scrollX = useRef(new Animated.Value(0)).current;
  const [data, setData] = useState(DEFAULT_DATA);

  useEffect(() => {
    const unsub = listenToStoryModePromos((items) => {
      if (items && items.length) {
        const mapped = items.map((item, index) => ({
          id: item.id || String(index + 1),
          title: item.title || "Story",
          subtitle: item.subtitle || "Mode",
          description: item.description || "New adventures coming soon.",
          image: item.image || item.imageUrl || DEFAULT_DATA[index % DEFAULT_DATA.length].image,
          color: item.color || DEFAULT_DATA[index % DEFAULT_DATA.length].color,
        }));
        setData(mapped);
      } else {
        setData(DEFAULT_DATA);
      }
    });
    return () => unsub && unsub();
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Background Layer - Dynamic Crossfade */}
      {data.map((item, index) => {
        const opacity = scrollX.interpolate({
          inputRange: [(index - 1) * width, index * width, (index + 1) * width],
          outputRange: [0, 1, 0],
        });
        return (
          <Animated.Image
            key={`bg-${item.id}`}
            source={{ uri: item.image }}
            style={[StyleSheet.absoluteFillObject, { opacity }]}
            blurRadius={Platform.OS === "ios" ? 40 : 20}
          />
        );
      })}

      <LinearGradient
        colors={["rgba(0,0,0,0.2)", "rgba(0,0,0,0.6)", "#020617"]}
        style={StyleSheet.absoluteFillObject}
      />

      <Animated.FlatList
        data={data}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
        renderItem={({ item, index }) => {
          const inputRange = [(index - 1) * width, index * width, (index + 1) * width];

          const scale = scrollX.interpolate({
            inputRange,
            outputRange: [0.85, 1, 0.85],
          });

          const translateY = scrollX.interpolate({
            inputRange,
            outputRange: [80, 0, 80],
          });

          return (
            <View style={styles.slide}>
              {/* Poster Card */}
              <Animated.View style={[styles.posterContainer, { transform: [{ scale }] }]}
              >
                <Image source={{ uri: item.image }} style={styles.poster} />
                <LinearGradient
                  colors={["transparent", "rgba(0,0,0,0.4)"]}
                  style={StyleSheet.absoluteFillObject}
                />
              </Animated.View>

              {/* Glass Info Card */}
              <Animated.View style={[styles.infoContainer, { transform: [{ translateY }] }]}
              >
                <View style={styles.glassCard}>
                  <Text style={styles.mainTitle}>{item.title}</Text>
                  <Text style={[styles.subTitle, { color: item.color }]}>{item.subtitle}</Text>
                  <Text style={styles.description}>{item.description}</Text>

                  <TouchableOpacity activeOpacity={0.8} style={[styles.btn, { backgroundColor: item.color }]}
                  >
                    <Text style={styles.btnText}>LOCKED</Text>
                  </TouchableOpacity>
                </View>
              </Animated.View>
            </View>
          );
        }}
      />

      {/* FIXED LIQUID PAGINATION (Using ScaleX instead of Width) */}
      <View style={styles.pagination}>
        {data.map((_, index) => {
          const inputRange = [(index - 1) * width, index * width, (index + 1) * width];

          // scaleX is supported by native driver
          const scaleX = scrollX.interpolate({
            inputRange,
            outputRange: [1, 3, 1],
            extrapolate: "clamp",
          });

          const opacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.3, 1, 0.3],
            extrapolate: "clamp",
          });

          return (
            <Animated.View
              key={index}
              style={[
                styles.dot,
                { opacity, transform: [{ scaleX }] }
              ]}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#020617" },
  slide: { width, height, alignItems: "center", justifyContent: "center" },
  posterContainer: {
    width: width * 0.8,
    height: height * 0.5,
    borderRadius: 30,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 15 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
      },
      android: { elevation: 15 },
    }),
  },
  poster: { ...StyleSheet.absoluteFillObject, resizeMode: "cover" },
  infoContainer: {
    position: "absolute",
    bottom: height * 0.07,
    width: width * 0.9,
  },
  glassCard: {
    padding: 24,
    borderRadius: 30,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    alignItems: "center",
  },
  mainTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: 6,
    opacity: 0.6,
  },
  subTitle: {
    fontSize: 44,
    fontWeight: "900",
    marginTop: -4,
    marginBottom: 10,
    letterSpacing: -1,
  },
  description: {
    fontSize: 15,
    color: "#94a3b8",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
    paddingHorizontal: 10,
  },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 100,
    gap: 4,
  },
  btnText: { color: "#fff", fontWeight: "900", fontSize: 13, letterSpacing: 1.5 },
  pagination: {
    position: "absolute",
    bottom: 40,
    flexDirection: "row",
    alignSelf: "center",
    height: 10,
    alignItems: "center"
  },
  dot: {
    height: 6,
    width: 10,
    borderRadius: 3,
    backgroundColor: "#fff",
    marginHorizontal: 8,
  },
});
