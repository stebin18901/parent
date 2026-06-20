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
  SafeAreaView,
  useWindowDimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { createStudent } from "../../services/firebase/student";
import { useAuthStore } from "../../state/useAuthStore";

export default function CreateStudentScreen({ navigation }) {
  const [name, setName] = useState("");
  const [studentClass, setStudentClass] = useState("");
  const [section, setSection] = useState("");
  const [loading, setLoading] = useState(false);
  const { width } = useWindowDimensions();

  const parent = useAuthStore((state) => state.user);

  const handleCreate = async () => {
    if (!name || !studentClass) {
      Alert.alert("Validation", "Student Name and Class are required");
      return;
    }

    try {
      setLoading(true);
      await createStudent(parent.uid, {
        name,
        class: studentClass,
        section: section || null,
      });

      Alert.alert("Success", "Student created successfully");
      navigation.replace("SelectStudent");
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  const cardWidth = Math.min(width - 32, 560);

  return (
    <SafeAreaView style={styles.safe}>
      <LinearGradient colors={["#F8FAFF", "#EEF2FF"]} style={styles.gradient}>
        <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <View style={[styles.card, { width: cardWidth }]}>
            <Text style={styles.title}>Create Student</Text>

            <TextInput placeholder="Student Name" value={name} onChangeText={setName} style={styles.input} />

            <TextInput placeholder="Class (eg: 6)" value={studentClass} onChangeText={setStudentClass} style={styles.input} />

            <TextInput placeholder="Section (optional)" value={section} onChangeText={setSection} style={styles.input} />

            <TouchableOpacity style={styles.button} onPress={handleCreate} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Create Student</Text>}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#F5F6F8",
  },
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    padding: 28,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: "#1C1C1E",
    marginBottom: 22,
    textAlign: "center",
  },
  input: {
    backgroundColor: "#F9FAFB",
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 16,
    fontSize: 16,
    color: "#1C1C1E",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  button: {
    backgroundColor: "#FF9F1C",
    paddingVertical: 16,
    borderRadius: 18,
    alignItems: "center",
    marginTop: 12,
    shadowColor: "#FF9F1C",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
  },
});

