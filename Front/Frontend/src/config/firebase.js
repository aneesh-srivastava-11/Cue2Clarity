import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// --- DEBUGGING START ---
console.log("----------------- FIREBASE CONFIG DEBUG -----------------");
console.log("API Key found:", import.meta.env.VITE_FIREBASE_API_KEY);
console.log("Project ID found:", import.meta.env.VITE_FIREBASE_PROJECT_ID);
// If these say 'undefined', your .env file is not being read!
console.log("---------------------------------------------------------");
// --- DEBUGGING END ---

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);