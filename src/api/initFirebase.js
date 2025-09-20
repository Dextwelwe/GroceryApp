import { initializeApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore } from "firebase/firestore";


const firebaseConfig = {
  apiKey: process.env.REACT_APP_API_FIREBASE_KEY,
  authDomain: process.env.REACT_APP_API_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_API_FIREBASE_PROJECT_NAME,
  appId: process.env.REACT_APP_API_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app); 
const db = getFirestore(app);


setPersistence(auth, browserLocalPersistence)
  .catch((error) => {
    console.error("Error setting persistence:", error);
  });

export { auth, db };