import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// In Netlify, you should set these environment variables in the dashboard
// to avoid "Exposed secrets detected" warnings.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  firestoreDatabaseId: import.meta.env.VITE_FIREBASE_DATABASE_ID
};

// Fallback to local config if environment variables are missing
// This is done this way to prevent Netlify's scanner from seeing the keys in the bundle
// if they are provided via environment variables.
if (!firebaseConfig.apiKey) {
  try {
    // @ts-ignore - This file might not exist in production/Netlify if ignored
    const localConfig = await import('./firebase-applet-config.json');
    Object.assign(firebaseConfig, localConfig.default);
  } catch (e) {
    console.warn('Firebase configuration missing. Please set environment variables or provide firebase-applet-config.json');
  }
}

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const storage = getStorage(app);

export default app;
