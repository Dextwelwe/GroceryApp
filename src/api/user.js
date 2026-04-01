import { doc, getDoc, getDocs, collection, query, where, limit} from "firebase/firestore";
import { db } from "../api/initFirebase";
import User from "../models/User";

export async function fetchUser(uid) {
  const userRef = doc(db, "users", uid);
  const userSnap = await getDoc(userRef);
  if (!userSnap.exists()) return null;

  const userData = userSnap.data();
  const user = new User(uid, userData);
  return user;
}

export async function getUserIdFromEmail(email){
  const normalized = email?.trim().toLowerCase();
  if (!normalized) return false;
    const q = query(collection(db, "users"),where("email", "==", normalized),limit(1));
    const snap = await getDocs(q);
    if (snap.empty) return null;
    return snap.docs[0].id;
}


