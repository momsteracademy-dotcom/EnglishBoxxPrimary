import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getFirestore,
  Firestore,
  collection,
  getDocs,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  getDocFromServer
} from "firebase/firestore";
import fs from "fs";
import path from "path";

let dbInstance: Firestore | null = null;

export function getFirebaseFirestore(): Firestore | null {
  if (dbInstance) return dbInstance;
  try {
    const configPath = path.join(process.cwd(), "firebase-applet-config.json");
    if (!fs.existsSync(configPath)) {
      return null;
    }
    const configRaw = fs.readFileSync(configPath, "utf8");
    const firebaseConfig = JSON.parse(configRaw);

    if (!firebaseConfig.projectId || !firebaseConfig.apiKey) {
      return null;
    }

    const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    if (firebaseConfig.firestoreDatabaseId) {
      dbInstance = getFirestore(app, firebaseConfig.firestoreDatabaseId);
    } else {
      dbInstance = getFirestore(app);
    }
    return dbInstance;
  } catch (error) {
    console.warn("Failed to initialize Firebase Firestore:", error);
    return null;
  }
}

export function isFirebaseConfigured(): boolean {
  return getFirebaseFirestore() !== null;
}

export async function testFirebaseConnection(): Promise<boolean> {
  const db = getFirebaseFirestore();
  if (!db) return false;
  try {
    await getDocFromServer(doc(db, "test", "connection"));
    return true;
  } catch (error: any) {
    if (error?.message?.includes("offline") || error?.message?.includes("ENOTFOUND")) {
      return false;
    }
    // If permission or document not found, connection itself reached server
    return true;
  }
}

// Worksheet Firestore Helpers
export async function getFirebaseWorksheets() {
  const db = getFirebaseFirestore();
  if (!db) return null;
  try {
    const querySnapshot = await getDocs(collection(db, "worksheets"));
    const list: any[] = [];
    querySnapshot.forEach((d) => {
      list.push({ id: d.id, ...d.data() });
    });
    list.sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""));
    return list;
  } catch (err) {
    console.warn("Error reading worksheets from Firebase:", err);
    return null;
  }
}

export async function saveFirebaseWorksheet(data: {
  id: string;
  created_at: string;
  grade: string;
  topic: string;
  exercise_style: string;
  data: any;
}) {
  const db = getFirebaseFirestore();
  if (!db) return null;
  try {
    await setDoc(doc(db, "worksheets", data.id), data);
    return data;
  } catch (err) {
    console.error("Error saving worksheet to Firebase:", err);
    return null;
  }
}

export async function deleteFirebaseWorksheet(id: string) {
  const db = getFirebaseFirestore();
  if (!db) return false;
  try {
    await deleteDoc(doc(db, "worksheets", id));
    return true;
  } catch (err) {
    console.error("Error deleting worksheet from Firebase:", err);
    return false;
  }
}

// Question Bank Firestore Helpers
export async function getFirebaseQuestionBank() {
  const db = getFirebaseFirestore();
  if (!db) return null;
  try {
    const querySnapshot = await getDocs(collection(db, "question_bank"));
    const list: any[] = [];
    querySnapshot.forEach((d) => {
      list.push({ id: d.id, ...d.data() });
    });
    return list;
  } catch (err) {
    console.warn("Error reading question bank from Firebase:", err);
    return null;
  }
}

export async function saveFirebaseQuestionBankItem(item: any) {
  const db = getFirebaseFirestore();
  if (!db) return null;
  try {
    const docId = String(item.id || "qb_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5));
    await setDoc(doc(db, "question_bank", docId), item);
    return item;
  } catch (err) {
    console.error("Error saving question bank item to Firebase:", err);
    return null;
  }
}

export async function saveMultipleFirebaseQuestionBankItems(items: any[]) {
  const db = getFirebaseFirestore();
  if (!db || !Array.isArray(items) || items.length === 0) return false;
  try {
    for (const item of items) {
      const docId = String(item.id || "qb_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5));
      await setDoc(doc(db, "question_bank", docId), item);
    }
    return true;
  } catch (err) {
    console.error("Error batch saving question bank items to Firebase:", err);
    return false;
  }
}

export async function deleteFirebaseQuestionBankItem(id: string) {
  const db = getFirebaseFirestore();
  if (!db) return false;
  try {
    await deleteDoc(doc(db, "question_bank", String(id)));
    return true;
  } catch (err) {
    console.error("Error deleting question bank item from Firebase:", err);
    return false;
  }
}

// User Profile / Download Quota Helpers
export async function getFirebaseProfile(userId: string) {
  const db = getFirebaseFirestore();
  if (!db) return null;
  try {
    const docSnap = await getDoc(doc(db, "profiles", userId));
    if (docSnap.exists()) {
      return docSnap.data();
    }
    return null;
  } catch (err) {
    console.warn("Error fetching profile from Firebase:", err);
    return null;
  }
}

export async function saveFirebaseProfile(userId: string, data: any) {
  const db = getFirebaseFirestore();
  if (!db) return null;
  try {
    await setDoc(doc(db, "profiles", userId), data, { merge: true });
    return data;
  } catch (err) {
    console.error("Error saving profile to Firebase:", err);
    return null;
  }
}

// Teacher Profile Firebase Helpers
export async function getFirebaseTeacherProfile(userId: string) {
  const db = getFirebaseFirestore();
  if (!db) return null;
  try {
    const cleanId = userId.replace(/[/\\?%*:|"<>]/g, "_");
    const docSnap = await getDoc(doc(db, "teacher_profiles", cleanId));
    if (docSnap.exists()) {
      return docSnap.data();
    }
    return null;
  } catch (err) {
    console.warn("Error fetching teacher profile from Firebase:", err);
    return null;
  }
}

export async function saveFirebaseTeacherProfile(userId: string, data: any) {
  const db = getFirebaseFirestore();
  if (!db) return null;
  try {
    const cleanId = userId.replace(/[/\\?%*:|"<>]/g, "_");
    await setDoc(doc(db, "teacher_profiles", cleanId), data, { merge: true });
    return data;
  } catch (err) {
    console.error("Error saving teacher profile to Firebase:", err);
    return null;
  }
}
