import React, { useEffect, useState } from "react";
import { TouchableOpacity, Text, StyleSheet, View } from "react-native";
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from "expo-speech-recognition";
import { sendSubtitle } from "../services/firebase/teamSubtitles";

export default function MicButton({ teamId, student }) {
  const [isListening, setIsListening] = useState(false);

  useSpeechRecognitionEvent("result", (event) => {
    const text = event.results?.[0]?.transcript?.trim();
    if (event.isFinal && text) {
      sendSubtitle(teamId, student, text);
    }
  });

  useSpeechRecognitionEvent("error", (event) => {
    console.log("Speech Recognition Error:", event);
    setIsListening(false);
  });

  useSpeechRecognitionEvent("end", () => {
    setIsListening(false);
  });

  useEffect(() => {
    return () => {
      ExpoSpeechRecognitionModule.stop();
    };
  }, []);

  const startListening = async () => {
    try {
      const permission = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!permission.granted) {
        setIsListening(false);
        return;
      }

      setIsListening(true);
      ExpoSpeechRecognitionModule.start({
        lang: "en-US",
        interimResults: false,
        addsPunctuation: true,
      });
    } catch (e) {
      setIsListening(false);
      console.log("Speech Recognition Start Error:", e);
    }
  };

  const stopListening = async () => {
    setIsListening(false);
    try {
      ExpoSpeechRecognitionModule.stop();
    } catch (e) {
      console.log("Speech Recognition Stop Error:", e);
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
