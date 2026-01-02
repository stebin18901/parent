import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
  FlatList,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { createFeedPost } from "../../services/firebase/feed";
import { LinearGradient } from "expo-linear-gradient";

export default function CreatePostScreen({ navigation }) {
  const [text, setText] = useState("");
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);

  const pickFromLibrary = async () => {
    if (images.length >= 5) {
      Alert.alert("Limit Reached", "You can upload maximum 5 images per post.");
      return;
    }

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission Required", "Gallery access is needed.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      setImages((prev) => [...prev, uri].slice(0, 5));
    }
  };

  const pickFromCamera = async () => {
    if (images.length >= 5) {
      Alert.alert("Limit Reached", "You can upload maximum 5 images per post.");
      return;
    }

    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission Required", "Camera access is needed.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      setImages((prev) => [...prev, uri].slice(0, 5));
    }
  };

  const removeImage = (uri) => {
    setImages((prev) => prev.filter((u) => u !== uri));
  };

  const handleSubmit = async () => {
    if (!text.trim() && images.length === 0) {
      Alert.alert("Validation", "Post cannot be empty");
      return;
    }

    try {
      setLoading(true);
      await createFeedPost({ text, imageUris: images });
      Alert.alert("Success", "Post published successfully");
      navigation.goBack();
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <LinearGradient
        colors={["#F8FAFF", "#FFF4EC"]}
        style={styles.card}
      >
        <Text style={styles.title}>Create Post</Text>

        <TextInput
          placeholder="What's on your mind?"
          value={text}
          onChangeText={setText}
          style={styles.input}
          multiline
        />

        {/* ✅ IMAGE PREVIEW GRID */}
        {images.length > 0 && (
          <FlatList
            data={images}
            keyExtractor={(uri, index) => uri + index}
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginBottom: 14 }}
            renderItem={({ item }) => (
              <View style={styles.previewWrap}>
                <Image source={{ uri: item }} style={styles.preview} />
                <TouchableOpacity
                  style={styles.removeBadge}
                  onPress={() => removeImage(item)}
                >
                  <Text style={styles.removeText}>✕</Text>
                </TouchableOpacity>
              </View>
            )}
          />
        )}

        {/* ✅ IMAGE ACTIONS */}
        <View style={styles.row}>
          <TouchableOpacity onPress={pickFromLibrary} style={styles.outlineBtn}>
            <LinearGradient
              colors={["#FFF1E0", "#FFE8CC"]}
              style={styles.secondaryBtn}
            >
              <Text style={styles.secondaryText}>+ Gallery</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity onPress={pickFromCamera} style={styles.outlineBtn}>
            <LinearGradient
              colors={["#FFF1E0", "#FFE8CC"]}
              style={styles.secondaryBtn}
            >
              <Text style={styles.secondaryText}>📷 Camera</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* ✅ POST BUTTON */}
        <TouchableOpacity onPress={handleSubmit} activeOpacity={0.85}>
          <LinearGradient
            colors={["#FFB347", "#FF9F1C"]}
            style={styles.button}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Post</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

/* ✅ PREMIUM GRADIENT STYLES */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F6F8",
    justifyContent: "center",
    padding: 20,
  },

  card: {
    borderRadius: 30,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 18,
    elevation: 12,
  },

  title: {
    color: "#1C1C1E",
    fontSize: 24,
    fontWeight: "900",
    marginBottom: 18,
    textAlign: "center",
  },

  input: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    minHeight: 120,
    textAlignVertical: "top",
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    fontSize: 16,
    color: "#1C1C1E",
  },

  previewWrap: {
    marginRight: 10,
    position: "relative",
  },

  preview: {
    width: 92,
    height: 92,
    borderRadius: 16,
  },

  removeBadge: {
    position: "absolute",
    top: -6,
    right: -6,
    backgroundColor: "#EF4444",
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },

  removeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900",
  },

  row: {
    flexDirection: "row",
    marginBottom: 18,
  },

  outlineBtn: {
    flex: 1,
    marginRight: 8,
  },

  secondaryBtn: {
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#FF9F1C",
  },

  secondaryText: {
    color: "#FF9F1C",
    fontWeight: "800",
    fontSize: 13,
  },

  button: {
    paddingVertical: 17,
    borderRadius: 22,
    alignItems: "center",
    shadowColor: "#FF9F1C",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 10,
  },

  buttonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "800",
  },
});
