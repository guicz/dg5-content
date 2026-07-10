import { initializeApp } from "firebase/app";
import {
  connectAuthEmulator,
  createUserWithEmailAndPassword,
  getAuth,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import { connectFirestoreEmulator, getFirestore } from "firebase/firestore";
import { connectFunctionsEmulator, getFunctions } from "firebase/functions";
import { connectStorageEmulator, getStorage } from "firebase/storage";

const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID || "demo-dg5";
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "demo-api-key",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || `${projectId}.firebaseapp.com`,
  projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || `${projectId}.appspot.com`,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "000000000000",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:000000000000:web:dg5local",
};

export const isLocalFirebase = import.meta.env.VITE_USE_FIREBASE_EMULATORS === "true" || projectId === "demo-dg5";
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app, "southamerica-east1");
export const storage = getStorage(app);

if (isLocalFirebase && !globalThis.__DG5_FIREBASE_EMULATORS__) {
  connectAuthEmulator(auth, "http://localhost:9099", { disableWarnings: true });
  connectFirestoreEmulator(db, "localhost", 8080);
  connectFunctionsEmulator(functions, "localhost", 5001);
  connectStorageEmulator(storage, "localhost", 9199);
  globalThis.__DG5_FIREBASE_EMULATORS__ = true;
}

export async function loginWithGoogle() {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ hd: "dg5.com.br", prompt: "select_account" });
  return signInWithPopup(auth, provider);
}

export async function loginLocalDemo() {
  const email = "patricia@dg5.com.br";
  const password = "dg5-local-emulator";
  try {
    return await signInWithEmailAndPassword(auth, email, password);
  } catch (error) {
    if (error.code !== "auth/user-not-found" && error.code !== "auth/invalid-credential") throw error;
    return createUserWithEmailAndPassword(auth, email, password);
  }
}

export function logout() {
  return signOut(auth);
}
