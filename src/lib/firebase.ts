import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyAEVUrnQWrOMIttn3t-4670sTv9_YROAZ4",
  authDomain: "vivoquest-website.firebaseapp.com",
  projectId: "vivoquest-website",
  storageBucket: "vivoquest-website.firebasestorage.app",
  messagingSenderId: "361510787041",
  appId: "1:361510787041:web:a5ea15ffe88b25b951e4a0",
  measurementId: "G-QG5SP1Z8B7"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// Only initialize analytics in the browser
if (typeof window !== 'undefined') {
  getAnalytics(app);
}
