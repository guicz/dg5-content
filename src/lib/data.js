import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  writeBatch,
} from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { db, functions, storage } from "./firebase";
import { seedWorkspace } from "./seed";

export const workspaceCollections = [
  "clients",
  "brandBrains",
  "plannedContents",
  "contents",
  "notifications",
  "creativeReviews",
  "approvals",
  "clientFiles",
];

export function subscribeWorkspace(onChange, onError) {
  const state = Object.fromEntries(workspaceCollections.map((name) => [name, []]));
  const ready = new Set();

  const unsubscribers = workspaceCollections.map((name) =>
    onSnapshot(
      collection(db, name),
      (snapshot) => {
        const records = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
        const clientOrder = (client) => client.sortOrder ?? 99;
        state[name] = name === "clients"
          ? records.sort((a, b) => clientOrder(a) - clientOrder(b) || a.name.localeCompare(b.name, "pt-BR"))
          : records;
        ready.add(name);
        onChange({ ...state }, ready.size === workspaceCollections.length);
      },
      onError,
    ),
  );

  return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
}

export async function ensureProfile(user) {
  const owner = user.email?.toLowerCase() === "patricia@dg5.com.br";
  const profileRef = doc(db, "users", user.uid);
  const existing = await getDoc(profileRef);
  const profile = {
    name: user.displayName || "Patricia DG5",
    email: user.email,
    photoURL: user.photoURL || "",
    updatedAt: serverTimestamp(),
  };
  if (!existing.exists()) profile.role = owner ? "admin" : "operator";
  if (owner) profile.role = "admin";
  await setDoc(
    profileRef,
    profile,
    { merge: true },
  );
}

export async function saveRecord(collectionName, id, values) {
  const recordId = id || crypto.randomUUID();
  await setDoc(
    doc(db, collectionName, recordId),
    { ...values, updatedAt: serverTimestamp() },
    { merge: true },
  );
  return recordId;
}

export async function bootstrapDemoWorkspace() {
  const batch = writeBatch(db);
  for (const [collectionName, records] of Object.entries(seedWorkspace)) {
    for (const record of records) {
      batch.set(doc(db, collectionName, record.id), {
        ...record,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  }
  await batch.commit();
}

export async function uploadClientAsset({ clientId, file, kind, contentId }) {
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
  const storagePath = `clients/${clientId}/${kind}/${crypto.randomUUID()}-${safeName}`;
  const fileRef = ref(storage, storagePath);
  await uploadBytes(fileRef, file, { contentType: file.type });
  const downloadURL = await getDownloadURL(fileRef);
  const id = crypto.randomUUID();
  const metadata = {
    id,
    clientId,
    contentId: contentId || null,
    name: file.name,
    type: file.type,
    size: file.size,
    kind,
    storagePath,
    downloadURL,
    createdAt: serverTimestamp(),
  };
  await setDoc(doc(db, "clientFiles", id), metadata);
  return metadata;
}

export async function runAgent(name, payload) {
  const callable = httpsCallable(functions, name, { timeout: 120_000 });
  const response = await callable(payload);
  return response.data;
}
