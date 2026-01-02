import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  PanResponder,
  Dimensions,
  Image,
  Animated,
  Easing,
  Platform,
  Vibration,
} from "react-native";
import Voice from "@react-native-voice/voice";
import { sendSubtitle } from "../services/firebase/teamSubtitles";

const { width: W, height: H } = Dimensions.get("window");

/* ---------- Constants ---------- */
const BUTTON_SIZE = 70;
const ICON_SIZE = 58;
const MENU_RADIUS = 125;
const LONG_PRESS_MS = 250;
const EDGE_PADDING = 15;
const AUTO_HIDE_MS = 5000;
const PEEK_WIDTH = 20;

export default function FloatingMicButton({ teams = [], student, teamId: propTeamId }) {
  /* ---------- Position & Animation Refs ---------- */
  const animatedLeft = useRef(new Animated.Value(20)).current;
  const animatedTop = useRef(new Animated.Value(H - 160)).current;
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  const lastFreePos = useRef({ left: 20, top: H - 160 });
  const docked = useRef(false);
  
  /* ---------- Logical Refs ---------- */
  const holdingMode = useRef(false);
  const currentTarget = useRef(null);
  const holdTimer = useRef(null);
  const inactivityTimer = useRef(null);
  const isRecording = useRef(false);

  /* ---------- State ---------- */
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(null);
  const [volume, setVolume] = useState(0);

  /* ================== INACTIVITY LOGIC ======================= */

  const resetInactivity = () => {
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    if (docked.current) restoreFromDock();
    inactivityTimer.current = setTimeout(dockToEdge, AUTO_HIDE_MS);
  };

  const dockToEdge = () => {
    if (holdingMode.current || isRecording.current) return;
    docked.current = true;
    const side = lastFreePos.current.left < W / 2 ? "left" : "right";
    const dockLeft = side === "left" ? - (BUTTON_SIZE - PEEK_WIDTH) : W - PEEK_WIDTH;

    Animated.parallel([
      Animated.timing(animatedLeft, { toValue: dockLeft, duration: 400, useNativeDriver: false }),
      Animated.timing(opacityAnim, { toValue: 0.5, duration: 400, useNativeDriver: false })
    ]).start();
  };

  const restoreFromDock = () => {
    docked.current = false;
    Animated.parallel([
      Animated.timing(animatedLeft, { toValue: lastFreePos.current.left, duration: 250, useNativeDriver: false }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 250, useNativeDriver: false })
    ]).start();
  };

  /* ================= VOICE & FIREBASE STREAMING ================= */

  useEffect(() => {
    Voice.onSpeechStart = () => {
      isRecording.current = true;
      Vibration.vibrate(40);
    };

    Voice.onSpeechPartialResults = (e) => {
      const text = e.value?.[0];
      if (!text || !currentTarget.current || !student) return;
      // Stream partials with a 'isPartial' flag for live UI updates on receiver end
      sendSubtitle(currentTarget.current.id, student, text, true);
    };

    Voice.onSpeechResults = (e) => {
      const text = e.value?.[0];
      if (!text || !currentTarget.current || !student) return;
      // Send final result
      sendSubtitle(currentTarget.current.id, student, text, false);
    };

    Voice.onSpeechVolumeChanged = (e) => {
      setVolume(e.value || 0);
    };

    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    };
  }, [student]);

  // Voice Pulse Animation
  useEffect(() => {
    if (isRecording.current) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.3, duration: 400, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1.1, duration: 400, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isRecording.current]);

  const startVoice = async () => {
    try {
      await Voice.start("en-US");
    } catch (e) { console.error("Voice Start Error", e); }
  };

  const stopVoice = async () => {
    try {
      await Voice.stop();
      isRecording.current = false;
    } catch (e) { console.error("Voice Stop Error", e); }
  };

  /* ================= PAN GESTURE SYSTEM ================= */

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        resetInactivity();
        holdTimer.current = setTimeout(() => {
          holdingMode.current = true;
          setMenuOpen(true);
          Vibration.vibrate(Platform.OS === 'ios' ? 1 : 10);
          Animated.spring(scaleAnim, { toValue: 1, friction: 8, useNativeDriver: true }).start();
        }, LONG_PRESS_MS);
      },

      onPanResponderMove: (evt) => {
        resetInactivity();
        const { pageX, pageY } = evt.nativeEvent;

        // Mode 1: Repositioning
        if (!holdingMode.current) {
          const newLeft = pageX - BUTTON_SIZE / 2;
          const newTop = pageY - BUTTON_SIZE / 2;
          animatedLeft.setValue(newLeft);
          animatedTop.setValue(newTop);
          lastFreePos.current = { left: newLeft, top: newTop };
          return;
        }

        // Mode 2: Selecting / Routing
        const centerX = lastFreePos.current.left + BUTTON_SIZE / 2;
        const centerY = lastFreePos.current.top + BUTTON_SIZE / 2;
        const dx = pageX - centerX;
        const dy = pageY - centerY;
        const dist = Math.hypot(dx, dy);

        // Cancellation Zone (Back to center)
        if (dist < BUTTON_SIZE / 1.5) {
          if (isRecording.current) stopVoice();
          setActiveIdx(null);
          currentTarget.current = null;
          return;
        }

        // Target Detection Logic
        let angle = Math.atan2(dy, dx);
        if (angle < 0) angle += Math.PI * 2;
        
        // We only care about the top semi-circle (PI to 2PI)
        if (angle >= Math.PI && angle <= Math.PI * 2) {
          const t = (angle - Math.PI) / Math.PI;
          const idx = Math.round(t * (teams.length - 1));
          
          if (idx !== activeIdx && teams[idx]) {
            Vibration.vibrate(5);
            setActiveIdx(idx);
            currentTarget.current = teams[idx];
            startVoice();
          }
        }
      },

      onPanResponderRelease: () => {
        if (holdTimer.current) clearTimeout(holdTimer.current);
        holdingMode.current = false;
        stopVoice();
        setMenuOpen(false);
        setActiveIdx(null);
        currentTarget.current = null;
        Animated.timing(scaleAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start();
        resetInactivity();
      },
    })
  ).current;

  /* ================= RENDERING ================= */

  const getTargetPos = (i) => {
    const n = Math.max(1, teams.length);
    const t = n === 1 ? 0.5 : i / (n - 1);
    const angle = Math.PI + Math.PI * t;
    return { 
      x: Math.cos(angle) * MENU_RADIUS, 
      y: Math.sin(angle) * MENU_RADIUS 
    };
  };

  return (
    <Animated.View
      style={[
        styles.wrapper,
        { left: animatedLeft, top: animatedTop, opacity: opacityAnim },
      ]}
      {...panResponder.panHandlers}
    >
      {/* Target Menu */}
      <Animated.View style={[styles.radial, { transform: [{ scale: scaleAnim }] }]}>
        {teams.map((t, i) => {
          const pos = getTargetPos(i);
          const isActive = activeIdx === i;
          return (
            <View
              key={t.id}
              style={[
                styles.itemContainer,
                { transform: [{ translateX: pos.x }, { translateY: pos.y }] }
              ]}
            >
              <View style={[styles.iconBg, isActive && styles.activeIconBg]}>
                {t.photoURL ? (
                  <Image source={{ uri: t.photoURL }} style={styles.iconImg} />
                ) : (
                  <Text style={[styles.initialText, isActive && styles.activeInitialText]}>
                    {t.name?.[0] || "T"}
                  </Text>
                )}
              </View>
              <Text style={styles.teamLabel}>{t.name}</Text>
            </View>
          );
        })}
      </Animated.View>

      {/* Main Mic Button */}
      <View style={[styles.button, isRecording.current && styles.buttonRecording]}>
        {isRecording.current && (
           <Animated.View style={[styles.pulse, { transform: [{ scale: pulseAnim }] }]} />
        )}
        <Text style={styles.micIcon}>{isRecording.current ? "🛑" : "🎙️"}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: { position: "absolute", zIndex: 99999 },
  radial: {
    position: "absolute",
    left: -MENU_RADIUS,
    top: -MENU_RADIUS,
    width: MENU_RADIUS * 2 + BUTTON_SIZE,
    height: MENU_RADIUS * 2 + BUTTON_SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
  itemContainer: { position: "absolute", alignItems: "center" },
  iconBg: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    borderRadius: ICON_SIZE / 2,
    backgroundColor: "#1A202C",
    borderWidth: 2,
    borderColor: "#2D3748",
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
  },
  activeIconBg: {
    backgroundColor: "#FF9F1C",
    borderColor: "#FFF",
    transform: [{ scale: 1.15 }],
  },
  iconImg: {
    width: ICON_SIZE - 4,
    height: ICON_SIZE - 4,
    borderRadius: (ICON_SIZE - 4) / 2,
  },
  initialText: { color: "#CBD5E0", fontWeight: "900", fontSize: 18 },
  activeInitialText: { color: "#FFF" },
  teamLabel: {
    color: "#FFF",
    fontSize: 10,
    fontWeight: "600",
    marginTop: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10
  },
  button: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    backgroundColor: "#FF9F1C",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.3)",
    elevation: 8,
  },
  buttonRecording: {
    backgroundColor: "#E53E3E",
  },
  micIcon: { fontSize: 26 },
  pulse: {
    position: "absolute",
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    backgroundColor: "rgba(229, 62, 62, 0.4)",
  },
});