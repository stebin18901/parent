import {
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  doc,
  setDoc,
  deleteDoc,
  updateDoc,
  increment,
  getDoc,
  serverTimestamp,
  addDoc,
} from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { auth, db, storage  } from "../../firebase/config";
import * as ImageManipulator from "expo-image-manipulator";
import * as FileSystem from "expo-file-system";
import { useStudentStore } from "../../state/useStudentStore";

/**
 * ✅ SIMPLE, ROBUST FEED LISTENER (GLOBAL ONLY FOR NOW)
 * - Shows all non-hidden posts
 * - Orders by createdAt (newest first)
 * - No school/class filtering yet (to avoid edge-case bugs)
 */
export const listenToFeed = (_student, callback) => {
  const q = query(
    collection(db, "feedPosts"),
    where("isHidden", "==", false),
    orderBy("createdAt", "desc"),
    limit(20)
  );

  return onSnapshot(q, (snapshot) => {
    const posts = snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    }));
    callback(posts);
  });
};


// ✅ CREATE POST — QUERY-SAFE
export const createFeedPost = async ({ text, imageUris = [] }) => {
  const user = auth.currentUser;
  if (!user) throw new Error("User not authenticated");

  const student = useStudentStore.getState().selectedStudent;

  // ✅ upload all images (max 5)
  const mediaUrls = await uploadPostImages(imageUris, user.uid);

  await addDoc(collection(db, "feedPosts"), {
    authorId: user.uid,

    authorName: student?.name || "Student",
    authorPhoto:
      student?.photoUrl ||
      "https://ui-avatars.com/api/?background=FF9F1C&color=fff&name=" +
        encodeURIComponent(student?.name || "Student"),

    authorRole: "USER",

    schoolId: null,
    class: null,

    text: text?.trim() || null,

    // ✅ new array field (multi-image)
    mediaUrls, // e.g. ["https://...", "https://..."]

    // ✅ BACKWARD COMPAT SAFE (for old code that still reads mediaUrl)
    mediaUrl: mediaUrls[0] || null,

    likesCount: 0,
    commentsCount: 0,

    sourceWeight: 40,
    computedFeedScore: Date.now(),
    isHidden: false,
    createdAt: serverTimestamp(),
  });
};



export const likePost = async (postId) => {
  const user = auth.currentUser;
  if (!user) throw new Error("User not authenticated");

  const student = useStudentStore.getState().selectedStudent;
  if (!student) throw new Error("No student selected");

  const likeRef = doc(db, "feedPosts", postId, "likes", user.uid);
  const postRef = doc(db, "feedPosts", postId);

  // ✅ Prevent duplicate like
  const existing = await getDoc(likeRef);
  if (existing.exists()) return;

  // ✅ Save like (identity snapshot)
  await setDoc(likeRef, {
    userId: user.uid,
    studentId: student.id,
    name: student.name,
    photo: student.photoUrl || null,
    createdAt: serverTimestamp(),
  });

  // ✅ Increment count
  await updateDoc(postRef, {
    likesCount: increment(1),
  });

  // ✅ Fetch post owner
  const postSnap = await getDoc(postRef);
  const postData = postSnap.data();
  if (!postData?.authorParentId) return;

  // ✅ Do not notify self
  if (postData.authorParentId === user.uid) return;

  // ✅ Create notification for post OWNER PARENT
  const notifyRef = collection(
    db,
    "users",
    postData.authorParentId,
    "notifications"
  );

  await addDoc(notifyRef, {
    type: "LIKE",
    fromUserId: user.uid,
    fromStudentId: student.id,
    fromName: student.name,
    fromPhoto: student.photoUrl || null,
    postId,
    postText: postData.text || "",
    seen: false,
    createdAt: serverTimestamp(),
  });
};

/* ---------------------------------- */
/* ✅ UNLIKE POST */
/* ---------------------------------- */
export const unlikePost = async (postId) => {
  const user = auth.currentUser;
  if (!user) throw new Error("User not authenticated");

  const likeRef = doc(db, "feedPosts", postId, "likes", user.uid);
  const postRef = doc(db, "feedPosts", postId);

  const existing = await getDoc(likeRef);
  if (!existing.exists()) return;

  await deleteDoc(likeRef);

  await updateDoc(postRef, {
    likesCount: increment(-1),
  });
};



// ✅ LISTEN TO COMMENTS OF A POST
export const listenToComments = (postId, callback) => {
  const q = query(
    collection(db, "feedPosts", postId, "comments"),
    orderBy("createdAt", "asc")
  );

  return onSnapshot(q, (snapshot) => {
    const comments = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    callback(comments);
  });
};

// ✅ ADD COMMENT
export const addComment = async (postId, text) => {
  const user = auth.currentUser;
  if (!user) throw new Error("User not authenticated");
  if (!text.trim()) throw new Error("Empty comment");

  // ✅ Get currently selected student (comment identity)
  const student = useStudentStore.getState().selectedStudent;

  const commentRef = collection(db, "feedPosts", postId, "comments");

  await addDoc(commentRef, {
    authorId: user.uid,

    // ✅ SNAPSHOT OF COMMENTER IDENTITY
    authorName: student?.name || "Student",
    authorPhoto:
      student?.photoUrl ||
      "https://ui-avatars.com/api/?background=FF9F1C&color=fff&name=" +
        encodeURIComponent(student?.name || "Student"),

    text: text.trim(),
    createdAt: serverTimestamp(),
  });

  // ✅ increment comment count
  await updateDoc(doc(db, "feedPosts", postId), {
    commentsCount: increment(1),
  });
};


/* ---------------------------------- */
/* ✅ REPLIES */
/* ---------------------------------- */

// ✅ LISTEN TO REPLIES
export const listenToReplies = (postId, commentId, callback) => {
  const q = query(
    collection(db, "feedPosts", postId, "comments", commentId, "replies"),
    orderBy("createdAt", "asc")
  );

  return onSnapshot(q, (snapshot) => {
    const replies = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    callback(replies);
  });
};

// ✅ ADD REPLY
export const addReply = async (postId, commentId, text) => {
  const user = auth.currentUser;
  if (!user) throw new Error("User not authenticated");

  if (!text.trim()) throw new Error("Empty reply");

  const replyRef = collection(
    db,
    "feedPosts",
    postId,
    "comments",
    commentId,
    "replies"
  );

  await addDoc(replyRef, {
    authorId: user.uid,
    text: text.trim(),
    createdAt: serverTimestamp(),
  });
};
// ✅ COMPRESS + UPLOAD IMAGE
// ✅ UPLOAD & COMPRESS MULTIPLE IMAGES (MAX 5)
const uploadPostImages = async (uris, userId) => {
  if (!uris || uris.length === 0) return [];

  const uploadedUrls = [];

  for (const uri of uris.slice(0, 5)) {
    // compress + resize
    const manipulated = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 1080 } }],
      {
        compress: 0.7,
        format: ImageManipulator.SaveFormat.JPEG,
      }
    );

    const response = await fetch(manipulated.uri);
    const blob = await response.blob();

    const filename = `feed/${userId}_${Date.now()}_${Math.random()
      .toString(36)
      .slice(2)}.jpg`;

    const storageRef = ref(storage, filename);
    await uploadBytes(storageRef, blob);
    const downloadUrl = await getDownloadURL(storageRef);

    uploadedUrls.push(downloadUrl);
  }

  return uploadedUrls;
};
export const hasUserLikedPost = async (postId) => {
  const user = auth.currentUser;
  if (!user) return false;

  const likeRef = doc(db, "feedPosts", postId, "likes", user.uid);
  const snap = await getDoc(likeRef);

  return snap.exists();
};

