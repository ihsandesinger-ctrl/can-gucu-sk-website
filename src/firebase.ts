import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const storage = getStorage(app);

// For debugging
if (typeof window !== 'undefined') {
  (window as any).db = db;
  (window as any).auth = auth;
  console.log("Firebase Configured:", {
    projectId: firebaseConfig.projectId,
    databaseId: firebaseConfig.firestoreDatabaseId
  });
}

export default app;
