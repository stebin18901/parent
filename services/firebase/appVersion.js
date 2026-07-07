import { doc, getDoc } from "firebase/firestore";

import { db } from "../../firebase/config";

const APP_CONFIG_PATH = ["app_metadata", "android_config"];

export async function fetchAndroidVersionPolicy() {
  const snapshot = await getDoc(doc(db, ...APP_CONFIG_PATH));

  if (!snapshot.exists()) {
    return null;
  }

  const data = snapshot.data();

  return {
    minVersion: data?.min_version || "0.0.0",
    downloadUrl: data?.download_url || "",
    isForceUpdate: Boolean(data?.is_force_update),
  };
}
