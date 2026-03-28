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
// you should create a .env file with VITE_FIREBASE_* variables.
let app;
let auth: any;
let db: any;
let storage: any;

if (firebaseConfig.apiKey && firebaseConfig.apiKey !== "undefined") {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
    storage = getStorage(app);

    // Enable offline persistence
    import('firebase/firestore').then(({ enableIndexedDbPersistence }) => {
      enableIndexedDbPersistence(db).catch((err) => {
        if (err.code === 'failed-precondition') {
          console.warn('Firestore persistence failed: Multiple tabs open');
        } else if (err.code === 'unimplemented') {
          console.warn('Firestore persistence failed: Browser not supported');
        }
      });
    });
  } catch (error) {
    console.error("Firebase initialization failed:", error);
  }
} else {
  console.warn("Firebase configuration is missing! Please set environment variables (VITE_FIREBASE_API_KEY, etc.) in your environment or .env file.");
}

export { auth, db, storage };
export default app;
