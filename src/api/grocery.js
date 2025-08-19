import { collection, doc, deleteDoc, serverTimestamp, writeBatch,Timestamp, getDoc, getDocs } from "firebase/firestore";
import { db } from "../api/initFirebase";
import Grocery from "../models/Grocery";

export async function saveNew(grocery) {
  const sharedWith = Array.from(new Set(grocery.sharedWith || [])).filter(uid => uid && uid !== grocery.owner);
  const groceryRef = doc(collection(db, "groceries"));
  const groceryId = groceryRef.id;
  const date = grocery.date instanceof Date ? grocery.date : new Date(grocery.date);

  const root = {
    name: grocery.name,
    date: Timestamp.fromDate(date),
    owner: grocery.owner,
    type: grocery.type,
    status: "active",
    createdAt: serverTimestamp(),
    sharedWith: sharedWith,
  };

  const batch = writeBatch(db);
  batch.set(groceryRef, root);

  const ownerBacklinkRef = doc(db, "users", grocery.owner, "groceries", groceryId);
  batch.set(ownerBacklinkRef,root);

  sharedWith.forEach(user => {
    const ref = doc(db, "users", user, "sharedGroceries", groceryId);
    batch.set(ref, root);
  });

  try {
    await batch.commit();
    return { success: true, groceryId };
  } catch (error) {
    console.error("Error adding grocery:", error);
    try { await deleteDoc(groceryRef); } catch {}
    return { success: false, error };
  }
}

export default async function removeGrocery(ownerUid, groceryId, sharedWith = []) {
  const batch = writeBatch(db);
  batch.delete(doc(db, "groceries", groceryId));
  batch.delete(doc(db, "users", ownerUid, "groceries", groceryId));
  sharedWith.forEach(user => {
    batch.delete(doc(db, "users", user, "sharedGroceries", groceryId));
  });

  try {
    await batch.commit();
    return { success: true };
  } catch (error) {
    console.error("Error deleting grocery:", error);
    return { success: false, error };
  }
}


export async function getGroceryById(groceryId) {
  if (!groceryId) throw new Error("groceryId is null");
  try {
    const groceryRef = doc(db, "groceries", groceryId);
    const itemsRef   = collection(db, "groceries", groceryId, "items");
    const [grocerySnap, itemsSnap] = await Promise.all([
      getDoc(groceryRef),
      getDocs(itemsRef)
    ]);
    if (!grocerySnap.exists()) return null;
    const groceryData = grocerySnap.data();
    const items = itemsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    console.log(new Grocery(grocerySnap.id, { ...groceryData, items }))
    return new Grocery(grocerySnap.id, { ...groceryData, items });
  } catch (err) {
    console.error("Failed to fetch grocery:", err);
    throw err;
  }
}





