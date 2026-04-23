import { initializeApp } from "firebase/app";
import { getAuth, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyDnWbVIGyWVhSx_TKE68PDL2xsP_Hq2zbE",
  authDomain: "pulseapp-c57ad.firebaseapp.com",
  projectId: "pulseapp-c57ad",
  storageBucket: "pulseapp-c57ad.firebasestorage.app",
  messagingSenderId: "1079164853775",
  appId: "1:1079164853775:web:f59cf1db6444d3554e8d7a",
  measurementId: "G-7Y5490375W"
};

const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);
export const auth = getAuth(app);
setPersistence(auth, browserLocalPersistence);
export const db = getFirestore(app);
export const storage = getStorage(app);
