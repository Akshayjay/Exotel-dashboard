import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth"; // <--- This is the new part for passwords

const firebaseConfig = {
  apiKey: "AIzaSyB5BZQzUaf4Y20_ZzEXRSkQZi-T5fEbj4w",
  authDomain: "easylife-dashboard.firebaseapp.com",
  projectId: "easylife-dashboard",
  storageBucket: "easylife-dashboard.firebasestorage.app",
  messagingSenderId: "599203317502",
  appId: "1:599203317502:web:e94e46cf55af0c9f9ac7af",
  measurementId: "G-PW2GW8GM50"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export the Database and the Auth tools so App.jsx can use them
export const db = getFirestore(app);
export const auth = getAuth(app);
