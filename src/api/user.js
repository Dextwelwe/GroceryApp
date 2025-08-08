import { doc, getDoc, getDocs, collection} from "firebase/firestore";
import { db } from "../api/initFirebase";
import User from "../models/User";

export async function fetchUser(uid) {
  const userRef = doc(db, "users", uid);
  const userSnap = await getDoc(userRef);
  if (!userSnap.exists()) return null;

  const [groceriesSnap, sharedGroceriesSnap] = await Promise.all([
    getDocs(collection(userRef, "groceries")),
    getDocs(collection(userRef, "sharedGroceries")),
  ]);

  const user = new User(uid, userSnap.data());
  user.groceries = groceriesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  user.sharedGroceries = sharedGroceriesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  return user;
}

export async function fetchUserGroceries(userId, type) {
  if (!userId) throw new Error("Missing userId");

  const subCollection = type === 'shared' ? "sharedGroceries" : "groceries";
  const groceriesRef = collection(db, "users", userId, subCollection);
  const snapshot = await getDocs(groceriesRef);

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  }));
}

