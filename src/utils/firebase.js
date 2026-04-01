import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, getDoc, updateDoc, onSnapshot, collection, query, where, getDocs } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Replace with your project's credentials
// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCcgia42QYQArvVF22E12LZbPd6xs_3J3U",
  authDomain: "shift-master-app-ed452.firebaseapp.com",
  projectId: "shift-master-app-ed452",
  storageBucket: "shift-master-app-ed452.firebasestorage.app",
  messagingSenderId: "1094490886954",
  appId: "1:1094490886954:web:9e2497cafa6791313a4453"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { auth, db, doc, setDoc, getDoc, updateDoc, onSnapshot, collection, query, where, getDocs };
