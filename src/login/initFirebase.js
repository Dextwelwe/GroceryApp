import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDOe246gMyjYJtQxTnURKBu6nJVaN91aXo",
  authDomain: "groceryapp-4d882.firebaseapp.com",
  projectId: "groceryapp-4d882",
  appId: "438935961209",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app); 
const db = getFirestore(app);

export { auth, db };