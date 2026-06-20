import React, { useMemo, useState } from "react";
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
  ScrollView,
  SafeAreaView,
  FlatList,
  Modal,
  Dimensions,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { createFeedPost } from "../../services/firebase/feed";

const MAX_MEDIA = 5;
const { width, height } = Dimensions.get("window");
const TARGET_ASPECT = 9 / 16;
const ADJUST_STEP = 0.08;
const ZOOM_STEP = 0.12;

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

export default function CreatePostScreen({ navigation }) {
  const [text, setText] = useState("");
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [coverIndex, setCoverIndex] = useState(0);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [adjustIndex, setAdjustIndex] = useState(null);
  const [adjustments, setAdjustments] = useState({});

  const remaining = useMemo(() => MAX_MEDIA - images.length, [images.length]);
  const canPost = useMemo(() => text.trim().length > 0 || images.length > 0, [text, images.length]);

  const pickImages = async () => {
    if (images.length >= MAX_MEDIA) {
      Alert.alert("Limit Reached", `Max ${MAX_MEDIA} images allowed.`);
      return;
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Denied", "We need access to your gallery.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: MAX_MEDIA - images.length,
      quality: 0.8,
    });

    if (!result.canceled) {
      const selected = result.assets.map((asset) => ({ uri: asset.uri, adjustedUri: null }));
      setImages((prev) => {
        const merged = [...prev, ...selected];
        const deduped = merged.filter(
          (item, idx, arr) => idx === arr.findIndex((x) => x.uri === item.uri)
        );
        const next = deduped.slice(0, MAX_MEDIA);
        if (coverIndex >= next.length) setCoverIndex(0);
        return next;
      });
    }
  };

  const removeImage = (index) => {
    setImages((prev) => {
      const next = prev.filter((_, i) => i !== index);
      if (coverIndex >= next.length) setCoverIndex(0);
      return next;
    });
  };

  const swapImages = (from, to) => {
    setImages((prev) => {
      if (to < 0 || to >= prev.length) return prev;
      const next = [...prev];
      [next[from], next[to]] = [next[to], next[from]];
      if (coverIndex === from) setCoverIndex(to);
      else if (coverIndex === to) setCoverIndex(from);
      return next;
    });
  };

  const handlePost = async () => {
    if (!canPost) {
      Alert.alert("Empty Post", "Please add a caption or an image.");
      return;
    }

    try {
      setLoading(true);
      const orderedImages = [...images];
      if (coverIndex > 0 && coverIndex < orderedImages.length) {
        const [cover] = orderedImages.splice(coverIndex, 1);
        orderedImages.unshift(cover);
      }
      const finalUris = orderedImages.map((item) => item.adjustedUri || item.uri);
      await createFeedPost({ text, imageUris: finalUris });
      navigation.goBack();
    } catch (error) {
      Alert.alert("Upload Failed", error.message);
    } finally {
      setLoading(false);
    }
  };

  const coverImage = images[coverIndex]?.adjustedUri || images[coverIndex]?.uri || images[0]?.adjustedUri || images[0]?.uri;

  const ensureAdjustState = async (uri) => {
    if (adjustments[uri]) return adjustments[uri];

    const size = await new Promise((resolve, reject) => {
      Image.getSize(
        uri,
        (w, h) => resolve({ w, h }),
        (err) => reject(err)
      );
    });

    const base = { scale: 1, offsetX: 0, offsetY: 0, w: size.w, h: size.h };
    setAdjustments((prev) => ({ ...prev, [uri]: base }));
    return base;
  };

  const openAdjust = async (index) => {
    const uri = images[index]?.uri;
    if (!uri) return;
    setAdjustIndex(index);
    setAdjustOpen(true);
    try {
      await ensureAdjustState(uri);
    } catch (err) {
      Alert.alert("Adjust Error", "Unable to read image size.");
    }
  };

  const updateAdjustment = (uri, patch) => {
    setAdjustments((prev) => ({
      ...prev,
      [uri]: { ...prev[uri], ...patch },
    }));
  };

  const applyCrop = async (uri, adj) => {
    if (!adj) return uri;

    const { w, h, scale, offsetX, offsetY } = adj;
    const isWider = w / h > TARGET_ASPECT;
    let cropW = isWider ? h * TARGET_ASPECT : w;
    let cropH = isWider ? h : w / TARGET_ASPECT;

    cropW = cropW / scale;
    cropH = cropH / scale;

    const maxShiftX = (w - cropW) / 2;
    const maxShiftY = (h - cropH) / 2;

    const centerX = w / 2 + offsetX * maxShiftX;
    const centerY = h / 2 + offsetY * maxShiftY;

    const originX = clamp(Math.round(centerX - cropW / 2), 0, Math.round(w - cropW));
    const originY = clamp(Math.round(centerY - cropH / 2), 0, Math.round(h - cropH));

    const result = await ImageManipulator.manipulateAsync(
      uri,
      [
        {
          crop: {
            originX,
            originY,
            width: Math.round(cropW),
            height: Math.round(cropH),
          },
        },
      ],
      { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG }
    );

    return result.uri;
  };

  const saveAdjustment = async () => {
    if (adjustIndex === null) return;
    const item = images[adjustIndex];
    if (!item) return;
    const adj = adjustments[item.uri];
    try {
      const adjustedUri = await applyCrop(item.uri, adj);
      setImages((prev) => {
        const next = [...prev];
        next[adjustIndex] = { ...next[adjustIndex], adjustedUri };
        return next;
      });
      setAdjustOpen(false);
    } catch (err) {
      Alert.alert("Adjust Error", "Unable to apply adjustments.");
    }
  };

  const adjustItem = adjustIndex !== null ? images[adjustIndex] : null;
  const adjustUri = adjustItem?.uri;
  const adjustState = adjustUri ? adjustments[adjustUri] : null;
  const previewShiftX = adjustState ? (width * 0.18) * adjustState.offsetX : 0;
  const previewShiftY = adjustState ? (height * 0.12) * adjustState.offsetY : 0;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
          <Ionicons name="close" size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>New Reel</Text>
          <Text style={styles.headerSubtitle}>Preview before sharing</Text>
        </View>
        <TouchableOpacity
          onPress={() => setPreviewOpen(true)}
          style={[styles.previewChip, images.length === 0 && styles.previewChipDisabled]}
          disabled={images.length === 0}
        >
          <Ionicons name="play" size={14} color={images.length === 0 ? "#94A3B8" : "#111"} />
          <Text style={[styles.previewChipText, images.length === 0 && styles.previewChipTextDisabled]}>Preview</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.previewCard}>
            {coverImage ? (
              <Image source={{ uri: coverImage }} style={styles.previewImage} />
            ) : (
              <LinearGradient colors={["#0B1220", "#000"]} style={styles.previewPlaceholder}>
                <Ionicons name="images-outline" size={36} color="#FACC15" />
                <Text style={styles.previewTitle}>Select your best shots</Text>
                <Text style={styles.previewDesc}>Tap Gallery to begin</Text>
              </LinearGradient>
            )}
            <View style={styles.previewBadge}>
              <Text style={styles.previewBadgeText}>9:16 Reel Preview</Text>
            </View>
          </View>

          {images.length > 0 && (
            <View style={styles.sequenceWrap}>
              <View style={styles.sequenceHeader}>
                <Text style={styles.sectionTitle}>Sequence</Text>
                <Text style={styles.sectionHint}>Tap to set cover · Swap to reorder</Text>
              </View>
              <FlatList
                data={images}
                keyExtractor={(item, index) => item.uri + index}
                horizontal
                showsHorizontalScrollIndicator={false}
                renderItem={({ item, index }) => (
                  <TouchableOpacity
                    style={[styles.thumbWrap, index === coverIndex && styles.thumbActive]}
                    onPress={() => setCoverIndex(index)}
                    activeOpacity={0.85}
                  >
                    <Image source={{ uri: item.adjustedUri || item.uri }} style={styles.thumb} />
                    {index === coverIndex && (
                      <View style={styles.coverBadge}>
                        <Text style={styles.coverBadgeText}>Cover</Text>
                      </View>
                    )}
                    <View style={styles.thumbActions}>
                      <TouchableOpacity
                        style={styles.swapBtn}
                        onPress={() => swapImages(index, index - 1)}
                        disabled={index === 0}
                      >
                        <Ionicons
                          name="chevron-back"
                          size={14}
                          color={index === 0 ? "#64748B" : "#FFFFFF"}
                        />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.swapBtn}
                        onPress={() => swapImages(index, index + 1)}
                        disabled={index === images.length - 1}
                      >
                        <Ionicons
                          name="chevron-forward"
                          size={14}
                          color={index === images.length - 1 ? "#64748B" : "#FFFFFF"}
                        />
                      </TouchableOpacity>
                    </View>
                    <TouchableOpacity
                      style={styles.adjustBtn}
                      onPress={() => openAdjust(index)}
                    >
                      <Ionicons name="scan" size={14} color="#111" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.deleteBtn}
                      onPress={() => removeImage(index)}
                    >
                      <Ionicons name="close" size={14} color="#FFFFFF" />
                    </TouchableOpacity>
                  </TouchableOpacity>
                )}
              />
            </View>
          )}

          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.actionCard} onPress={pickImages}>
              <Ionicons name="images" size={22} color="#FACC15" />
              <Text style={styles.actionTitle}>Gallery</Text>
              <Text style={styles.actionSub}>Add {remaining} more</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionCard} onPress={pickImages}>
              <Ionicons name="camera" size={22} color="#FACC15" />
              <Text style={styles.actionTitle}>Camera</Text>
              <Text style={styles.actionSub}>Quick shot</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.captionCard}>
            <View style={styles.captionHeader}>
              <Text style={styles.sectionTitle}>Caption</Text>
              <Text style={styles.counter}>{text.length}/240</Text>
            </View>
            <TextInput
              placeholder="Tell the story behind this reel..."
              placeholderTextColor="#94A3B8"
              style={styles.textInput}
              multiline
              value={text}
              onChangeText={(value) => setText(value.slice(0, 240))}
            />
          </View>

          <TouchableOpacity
            onPress={handlePost}
            disabled={!canPost || loading}
            activeOpacity={0.9}
            style={[styles.postButton, (!canPost || loading) && styles.postButtonDisabled]}
          >
            {loading ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text style={styles.postButtonText}>Share Reel</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal visible={previewOpen} animationType="slide">
        <View style={styles.previewModal}>
          <TouchableOpacity style={styles.previewClose} onPress={() => setPreviewOpen(false)}>
            <Ionicons name="close" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <FlatList
            data={images}
            keyExtractor={(item, index) => item.uri + index}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => (
              <View style={styles.previewSlide}>
                <Image source={{ uri: item.adjustedUri || item.uri }} style={styles.previewSlideImage} />
              </View>
            )}
          />
          <View style={styles.previewFooter}>
            <Text style={styles.previewCaptionTitle}>Caption</Text>
            <Text style={styles.previewCaptionText} numberOfLines={2}>
              {text.trim() || "No caption yet."}
            </Text>
            <TouchableOpacity
              onPress={handlePost}
              disabled={!canPost || loading}
              activeOpacity={0.9}
              style={[styles.previewPostButton, (!canPost || loading) && styles.postButtonDisabled]}
            >
              {loading ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text style={styles.postButtonText}>Post Now</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={adjustOpen} animationType="slide" transparent>
        <View style={styles.adjustModalBackdrop}>
          <View style={styles.adjustModalCard}>
            <View style={styles.adjustHeader}>
              <Text style={styles.adjustTitle}>Adjust Position</Text>
              <TouchableOpacity onPress={() => setAdjustOpen(false)}>
                <Ionicons name="close" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            <View style={styles.adjustFrame}>
              {adjustUri && (
                <Image
                  source={{ uri: adjustUri }}
                  style={[
                    styles.adjustImage,
                    adjustState && {
                      transform: [
                        { scale: adjustState.scale },
                        { translateX: previewShiftX },
                        { translateY: previewShiftY },
                      ],
                    },
                  ]}
                  resizeMode="cover"
                />
              )}
            </View>
            {adjustState && (
              <View style={styles.adjustControls}>
                <View style={styles.controlRow}>
                  <TouchableOpacity
                    style={styles.controlBtn}
                    onPress={() => updateAdjustment(adjustUri, { offsetY: clamp(adjustState.offsetY - ADJUST_STEP, -1, 1) })}
                  >
                    <Ionicons name="chevron-up" size={18} color="#FFFFFF" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.controlBtn}
                    onPress={() => updateAdjustment(adjustUri, { offsetX: clamp(adjustState.offsetX - ADJUST_STEP, -1, 1) })}
                  >
                    <Ionicons name="chevron-back" size={18} color="#FFFFFF" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.controlBtn}
                    onPress={() => updateAdjustment(adjustUri, { offsetX: clamp(adjustState.offsetX + ADJUST_STEP, -1, 1) })}
                  >
                    <Ionicons name="chevron-forward" size={18} color="#FFFFFF" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.controlBtn}
                    onPress={() => updateAdjustment(adjustUri, { offsetY: clamp(adjustState.offsetY + ADJUST_STEP, -1, 1) })}
                  >
                    <Ionicons name="chevron-down" size={18} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
                <View style={styles.controlRow}>
                  <TouchableOpacity
                    style={styles.controlBtn}
                    onPress={() => updateAdjustment(adjustUri, { scale: clamp(adjustState.scale - ZOOM_STEP, 1, 2.5) })}
                  >
                    <Ionicons name="remove" size={18} color="#FFFFFF" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.controlBtn}
                    onPress={() => updateAdjustment(adjustUri, { scale: clamp(adjustState.scale + ZOOM_STEP, 1, 2.5) })}
                  >
                    <Ionicons name="add" size={18} color="#FFFFFF" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.resetBtn}
                    onPress={() => updateAdjustment(adjustUri, { scale: 1, offsetX: 0, offsetY: 0 })}
                  >
                    <Text style={styles.resetText}>Reset</Text>
                  </TouchableOpacity>
                </View>
                <TouchableOpacity style={styles.saveAdjustBtn} onPress={saveAdjustment}>
                  <Text style={styles.saveAdjustText}>Save Position</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#050505" },
  header: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { color: "#FFFFFF", fontSize: 18, fontWeight: "800" },
  headerSubtitle: { color: "#94A3B8", fontSize: 11 },
  previewChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FACC15",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  previewChipDisabled: { backgroundColor: "#1F2937" },
  previewChipText: { color: "#111", fontSize: 12, fontWeight: "700" },
  previewChipTextDisabled: { color: "#94A3B8" },
  scrollContent: { padding: 16, paddingBottom: 32 },
  previewCard: {
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: "#0B1220",
    aspectRatio: 9 / 16,
    marginBottom: 18,
  },
  previewImage: { width: "100%", height: "100%" },
  previewPlaceholder: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8 },
  previewTitle: { color: "#FFFFFF", fontSize: 16, fontWeight: "800" },
  previewDesc: { color: "#94A3B8", fontSize: 12 },
  previewBadge: {
    position: "absolute",
    top: 14,
    right: 14,
    backgroundColor: "rgba(0,0,0,0.65)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  previewBadgeText: { color: "#FFFFFF", fontSize: 10, fontWeight: "700" },
  sequenceWrap: { marginBottom: 18 },
  sequenceHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  sectionTitle: { color: "#FFFFFF", fontSize: 12, fontWeight: "800", letterSpacing: 1, textTransform: "uppercase" },
  sectionHint: { color: "#94A3B8", fontSize: 11 },
  thumbWrap: { marginRight: 12 },
  thumbActive: { borderWidth: 2, borderColor: "#FACC15", borderRadius: 14 },
  thumb: { width: 86, height: 110, borderRadius: 12 },
  coverBadge: {
    position: "absolute",
    bottom: 6,
    left: 6,
    backgroundColor: "rgba(0,0,0,0.7)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  coverBadgeText: { color: "#FFFFFF", fontSize: 10, fontWeight: "700" },
  deleteBtn: {
    position: "absolute",
    top: 6,
    right: 6,
    backgroundColor: "rgba(0,0,0,0.6)",
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  thumbActions: {
    position: "absolute",
    left: 6,
    top: 6,
    flexDirection: "row",
    gap: 4,
  },
  swapBtn: {
    backgroundColor: "rgba(0,0,0,0.55)",
    padding: 4,
    borderRadius: 8,
  },
  adjustBtn: {
    position: "absolute",
    bottom: 6,
    right: 6,
    backgroundColor: "#FACC15",
    padding: 4,
    borderRadius: 8,
  },
  actionRow: { flexDirection: "row", gap: 12, marginBottom: 18 },
  actionCard: {
    flex: 1,
    backgroundColor: "#111827",
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    gap: 6,
  },
  actionTitle: { color: "#FFFFFF", fontSize: 14, fontWeight: "800" },
  actionSub: { color: "#94A3B8", fontSize: 12 },
  captionCard: {
    backgroundColor: "#0F172A",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    marginBottom: 20,
  },
  captionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  counter: { color: "#FACC15", fontSize: 12, fontWeight: "700" },
  textInput: { color: "#FFFFFF", fontSize: 15, minHeight: 110, textAlignVertical: "top" },
  postButton: {
    backgroundColor: "#FACC15",
    paddingVertical: 14,
    borderRadius: 18,
    alignItems: "center",
    shadowColor: "#FACC15",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 10,
  },
  postButtonDisabled: { opacity: 0.6 },
  postButtonText: { color: "#111", fontSize: 16, fontWeight: "800" },
  previewModal: { flex: 1, backgroundColor: "#000" },
  previewClose: {
    position: "absolute",
    top: 44,
    right: 20,
    zIndex: 2,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 18,
    padding: 6,
  },
  previewSlide: { width, height, alignItems: "center", justifyContent: "center" },
  previewSlideImage: { width, height, resizeMode: "cover" },
  previewFooter: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    padding: 18,
    backgroundColor: "rgba(0,0,0,0.75)",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
  },
  previewCaptionTitle: { color: "#FACC15", fontSize: 11, fontWeight: "800", letterSpacing: 1, marginBottom: 6 },
  previewCaptionText: { color: "#FFFFFF", fontSize: 14, fontWeight: "600" },
  previewPostButton: {
    backgroundColor: "#FACC15",
    paddingVertical: 12,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 12,
  },
  adjustModalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  adjustModalCard: {
    width: "100%",
    backgroundColor: "#0B1220",
    borderRadius: 20,
    padding: 16,
  },
  adjustHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  adjustTitle: { color: "#FFFFFF", fontSize: 16, fontWeight: "800" },
  adjustFrame: {
    width: "100%",
    aspectRatio: 9 / 16,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#000",
    marginBottom: 12,
  },
  adjustImage: {
    width: "100%",
    height: "100%",
  },
  adjustControls: {
    gap: 12,
  },
  controlRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  controlBtn: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.08)",
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
  },
  resetBtn: {
    flex: 1.4,
    backgroundColor: "rgba(250,204,21,0.2)",
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
  },
  resetText: { color: "#FACC15", fontWeight: "800" },
  saveAdjustBtn: {
    backgroundColor: "#FACC15",
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: "center",
  },
  saveAdjustText: { color: "#111", fontWeight: "800" },
});
