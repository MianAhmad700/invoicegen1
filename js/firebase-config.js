// Import Firebase functions from CDN (using v9.22.0 for compatibility without bundler)
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-analytics.js";
import { getFirestore, collection, addDoc, getDocs, doc, getDoc, query, where, orderBy, updateDoc } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCyIeCMHIkgosvyCANTwN1NVsL7YcG0ens",
    authDomain: "invoice-generator-f7ee1.firebaseapp.com",
    projectId: "invoice-generator-f7ee1",
    storageBucket: "invoice-generator-f7ee1.firebasestorage.app",
    messagingSenderId: "383895819931",
    appId: "1:383895819931:web:e18a0e955d640300a2983e",
    measurementId: "G-VCD0LK1SWS"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);

// Helper for error handling
function handleFirebaseError(error, context) {
    console.error(`Error in ${context}:`, error);
    if (error.code === 'permission-denied') {
        alert(`Permission Denied (${context}):\nPlease update your Firestore Security Rules in the Firebase Console to allow read/write access.\n\nExample Rule:\nallow read, write: if true;`);
    } else {
        alert(`Error ${context}: ${error.message}`);
    }
}

export { db, collection, addDoc, getDocs, doc, getDoc, query, where, orderBy, updateDoc, analytics, handleFirebaseError };
