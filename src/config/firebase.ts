
import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { getAnalytics } from 'firebase/analytics';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAbDCoY9FPqsVlGuvyFHqs1Ii5pUrplmow",
  authDomain: "icct-rfid-system.firebaseapp.com",
  databaseURL: "https://icct-rfid-system-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "icct-rfid-system",
  storageBucket: "icct-rfid-system.firebasestorage.app",
  messagingSenderId: "485301176925",
  appId: "1:485301176925:web:4b6dab4e3f24e0a315dbb4",
  measurementId: "G-0D7JQJNMN3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Analytics (only in production)
let analytics;
if (typeof window !== 'undefined') {
  analytics = getAnalytics(app);
}

// Initialize Realtime Database and get a reference to the service
export const database = getDatabase(app);

export { analytics };
export default app;
