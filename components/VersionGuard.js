import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  AppState,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import * as Application from "expo-application";
import * as Linking from "expo-linking";
import Constants from "expo-constants";

import { fetchAndroidVersionPolicy } from "../services/firebase/appVersion";

const FALLBACK_DOWNLOAD_URL = "https://hepsy.in/downloads";

function normalizeVersion(version) {
  if (!version || typeof version !== "string") {
    return [0, 0, 0];
  }

  return version
    .split(".")
    .slice(0, 3)
    .map((part) => Number.parseInt(part, 10) || 0)
    .concat([0, 0, 0])
    .slice(0, 3);
}

function compareVersions(currentVersion, minimumVersion) {
  const current = normalizeVersion(currentVersion);
  const minimum = normalizeVersion(minimumVersion);

  for (let index = 0; index < 3; index += 1) {
    if (current[index] < minimum[index]) {
      return -1;
    }

    if (current[index] > minimum[index]) {
      return 1;
    }
  }

  return 0;
}

function getInstalledVersion() {
  const expoConfigVersion = Constants.expoConfig?.version || "0.0.0";
  const executionEnvironment = Constants.executionEnvironment;
  const isStandaloneLike =
    executionEnvironment === "standalone" || executionEnvironment === "bare";

  if (!isStandaloneLike) {
    return expoConfigVersion;
  }

  return Application.nativeApplicationVersion || expoConfigVersion;
}

export default function VersionGuard({ children }) {
  const [loading, setLoading] = useState(true);
  const [policy, setPolicy] = useState({
    shouldBlock: false,
    minVersion: "",
    downloadUrl: FALLBACK_DOWNLOAD_URL,
  });
  const appStateRef = useRef(AppState.currentState);

  async function loadPolicy() {
    try {
      const nextPolicy = await fetchAndroidVersionPolicy();
      const installedVersion = getInstalledVersion();

      if (!nextPolicy) {
        setPolicy({
          shouldBlock: false,
          minVersion: "",
          downloadUrl: FALLBACK_DOWNLOAD_URL,
        });
        return;
      }

      const shouldBlock =
        nextPolicy.isForceUpdate &&
        compareVersions(installedVersion, nextPolicy.minVersion) < 0;

      setPolicy({
        shouldBlock,
        minVersion: nextPolicy.minVersion,
        downloadUrl: nextPolicy.downloadUrl || FALLBACK_DOWNLOAD_URL,
      });

      console.log("[VersionGuard]", {
        installedVersion,
        minVersion: nextPolicy.minVersion,
        isForceUpdate: nextPolicy.isForceUpdate,
        shouldBlock,
        executionEnvironment: Constants.executionEnvironment,
      });
    } catch (error) {
      console.log("Version policy lookup failed", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPolicy();

    const subscription = AppState.addEventListener("change", (nextAppState) => {
      const wasBackgrounded =
        appStateRef.current === "background" || appStateRef.current === "inactive";

      if (wasBackgrounded && nextAppState === "active") {
        setLoading(true);
        loadPolicy();
      }

      appStateRef.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, []);

  async function handleUpdatePress() {
    const targetUrl = policy.downloadUrl || FALLBACK_DOWNLOAD_URL;

    try {
      const supported = await Linking.canOpenURL(targetUrl);

      if (supported) {
        await Linking.openURL(targetUrl);
      }
    } catch (error) {
      console.log("Failed to open update URL", error);
    }
  }

  const installedVersion = getInstalledVersion();

  return (
    <View style={styles.screen}>
      {children}
      <Modal
        transparent
        animationType="fade"
        statusBarTranslucent
        presentationStyle="overFullScreen"
        onRequestClose={() => {}}
        visible={loading || policy.shouldBlock}
      >
        <View style={styles.backdrop}>
          {loading ? (
            <View style={styles.loadingCard}>
              <ActivityIndicator size="large" color="#2563eb" />
              <Text style={styles.loadingText}>Checking app version...</Text>
            </View>
          ) : (
            <View style={styles.card}>
              <Text style={styles.eyebrow}>Update Required</Text>
              <Text style={styles.title}>
                A critical app security or feature update is required to
                proceed
              </Text>
              <Text style={styles.body}>
                Installed version: {installedVersion}
              </Text>
              <Text style={styles.body}>
                Minimum version: {policy.minVersion}
              </Text>
              <Text style={styles.meta}>
                Environment: {String(Constants.executionEnvironment || "unknown")}
              </Text>
              <Pressable style={styles.button} onPress={handleUpdatePress}>
                <Text style={styles.buttonText}>Open Download Page</Text>
              </Pressable>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  backdrop: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(15, 23, 42, 0.92)",
  },
  loadingCard: {
    width: "100%",
    maxWidth: 340,
    borderRadius: 24,
    padding: 28,
    backgroundColor: "#ffffff",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    color: "#334155",
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
  },
  card: {
    width: "100%",
    maxWidth: 360,
    borderRadius: 28,
    paddingHorizontal: 24,
    paddingVertical: 28,
    backgroundColor: "#ffffff",
    shadowColor: "#000000",
    shadowOpacity: 0.18,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 20,
    elevation: 10,
  },
  eyebrow: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    overflow: "hidden",
    backgroundColor: "#ffedd5",
    color: "#c2410c",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.7,
  },
  title: {
    marginTop: 16,
    color: "#0f172a",
    fontSize: 24,
    lineHeight: 32,
    fontWeight: "700",
  },
  body: {
    marginTop: 12,
    color: "#475569",
    fontSize: 15,
    lineHeight: 22,
  },
  meta: {
    marginTop: 10,
    color: "#94a3b8",
    fontSize: 12,
    lineHeight: 18,
  },
  button: {
    marginTop: 24,
    borderRadius: 16,
    backgroundColor: "#2563eb",
    paddingVertical: 14,
    paddingHorizontal: 18,
    alignItems: "center",
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
});
