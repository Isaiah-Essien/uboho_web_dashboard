// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, setPersistence, browserSessionPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCPOM5eIjBnY-X9uDSVQ--_Y0EqDg6O-v4",
  authDomain: "uboho-b3934.firebaseapp.com",
  projectId: "uboho-b3934",
  storageBucket: "uboho-b3934.firebasestorage.app",
  messagingSenderId: "1018064061286",
  appId: "1:1018064061286:web:b16632b50cda2f2a1f7ea7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

// Initialize Cloud Storage and get a reference to the service
export const storage = getStorage(app);

export default app;
