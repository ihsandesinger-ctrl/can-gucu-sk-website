import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Environment variables from Netlify/Vite
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  firestoreDatabaseId: import.meta.env.VITE_FIREBASE_DATABASE_ID
};

// If environment variables are missing (likely local dev), 
// we try to use the local config file.
// We use a safe check to avoid "Module not found" errors on Netlify.
if (!firebaseConfig.apiKey) {
  try {
    // This is a workaround to allow local dev without env vars
    // while not breaking the build on Netlify where the file is gitignored.
    // @ts-ignore
    const config = await import('./firebase-applet-config.json');
    Object.assign(firebaseConfig, config.default || config);
  } catch (e) {
    console.error("Firebase configuration is missing! Please set environment variables in Netlify or provide firebase-applet-config.json locally.");
  }
}

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const storage = getStorage(app);

export default app;
