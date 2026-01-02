import React, { useEffect, useState } from "react";
import { TouchableOpacity, Text, StyleSheet, View } from "react-native";
import Voice from "@react-native-voice/voice";
import { sendSubtitle } from "../services/firebase/teamSubtitles";

export default function MicButton({ teamId, student }) {
  const [isListening, setIsListening] = useState(false);

  useEffect(() => {
    Voice.onSpeechResults = (e) => {
      const text = e.value[0];
      if (text) {
        sendSubtitle(teamId, student, text);
      }
    };

    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, []);

  const startListening = async () => {
    setIsListening(true);
    try {
      await Voice.start("en-US");
    } catch (e) {
      console.log("Voice Start Error:", e);
    }
  };

  const stopListening = async () => {
    setIsListening(false);
    try {
      await Voice.stop();
    } catch (e) {
      console.log("Voice Stop Error:", e);
    }
  };

  return (
    <View style={styles.micContainer}>
      <TouchableOpacity
        onPressIn={startListening}
        onPressOut={stopListening}
        style={[
          styles.micButton,
          isListening && styles.micPressed,
        ]}
      >
        <Text style={styles.micText}>
          {isListening ? "Listening..." : "Hold to Speak"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  micContainer: {
    position: "absolute",
    bottom: 20,
    left: 0,
    right: 0,
    alignItems: "center",
  },

  micButton: {
    backgroundColor: "#4F46E5",
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 30,
  },

  micPressed: {
    backgroundColor: "#4338CA",
  },

  micText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "800",
  },
});
