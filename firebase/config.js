import { initializeApp } from "firebase/app";
import {
  getAuth,
  initializeAuth,
  getReactNativePersistence,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import AsyncStorage from "@react-native-async-storage/async-storage";

const firebaseConfig = {
  apiKey: "AIzaSyBQsaWdnRS3g8s7PtGym3pZzfgGFWOsqQM",
  authDomain: "dreamprojects-cda5b.firebaseapp.com",
  projectId: "dreamprojects-cda5b",
  storageBucket: "dreamprojects-cda5b.appspot.com",
  messagingSenderId: "1073238502278",
  appId: "1:1073238502278:web:14d03032e8cf4093ed9a07",
  measurementId: "G-BF0LDLJCJ4"
};

const app = initializeApp(firebaseConfig);

const persistence =
  typeof getReactNativePersistence === "function"
    ? getReactNativePersistence(AsyncStorage)
    : undefined;

export const auth = persistence
  ? initializeAuth(app, { persistence })
  : getAuth(app);

export const db = getFirestore(app);

export const storage = getStorage(app);


