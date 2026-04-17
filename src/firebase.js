// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyB5BZQzUaf4Y20_ZzEXRSkQZi-T5fEbj4w",
  authDomain: "easylife-dashboard.firebaseapp.com",
  projectId: "easylife-dashboard",
  storageBucket: "easylife-dashboard.firebasestorage.app",
  messagingSenderId: "599203317502",
  appId: "1:599203317502:web:e94e46cf55af0c9f9ac7af",
  measurementId: "G-PW2GW8GM50"
};

// Initialize Firebase and the Database
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
