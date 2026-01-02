import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../../firebase/config";

// ✅ REGISTER
export const registerParent = async (name, email, password) => {
  const res = await createUserWithEmailAndPassword(auth, email, password);
  const user = res.user;

  await setDoc(doc(db, "parents", user.uid), {
    name,
    email,
    createdAt: serverTimestamp(),
  });

  return user;
};

// ✅ LOGIN
export const loginParent = async (email, password) => {
  const res = await signInWithEmailAndPassword(auth, email, password);
  return res.user;
};

// ✅ LOGOUT
export const logoutParent = async () => {
  await signOut(auth);
};

// ✅ GET PROFILE
export const getParentProfile = async (uid) => {
  const docRef = doc(db, "parents", uid);
  const snapshot = await getDoc(docRef);
  return snapshot.exists() ? snapshot.data() : null;
};

// ✅ FORGOT PASSWORD (NEW)
export const resetPassword = async (email) => {
  if (!email) throw new Error("Please enter your email");
  await sendPasswordResetEmail(auth, email);
};
