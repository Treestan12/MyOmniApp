import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth"; 

const firebaseConfig = {
  apiKey: "AIzaSyApe6BPGhGhYtvROboSjRn3Zy_d19Ix8nM",
  authDomain: "thesis-bcc4a.firebaseapp.com",
  projectId: "thesis-bcc4a",
  storageBucket: "thesis-bcc4a.appspot.com",
  messagingSenderId: "387189396419",
  appId: "1:387189396419:web:93c5c67b7d4b7e68176376",
  measurementId: "G-NJ6ZFY2ZCQ"
};

const app = initializeApp(firebaseConfig);

const db = getFirestore(app);

const auth = getAuth(app);

export { db, auth };
