// Firebase config and initialization
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDyzxtWi8yygzEMQCiyYh17szqyhl_nVRM",
  authDomain: "autocket.firebaseapp.com",
  projectId: "autocket",
  storageBucket: "autocket.firebasestorage.app",
  messagingSenderId: "135111216930",
  appId: "1:135111216930:web:a97b56978fc3c755249f7b",
  measurementId: "G-8DZ72Q9PRD"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
