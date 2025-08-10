import { collection, doc, deleteDoc, serverTimestamp, writeBatch,Timestamp } from "firebase/firestore";
import { db } from "../api/initFirebase";

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
    status: "pending",
    createdAt: serverTimestamp(),
    sharedWith: sharedWith,
  };

  const batch = writeBatch(db);
  batch.set(groceryRef, root);

  const ownerBacklinkRef = doc(db, "users", grocery.owner, "groceries", groceryId);
  batch.set(ownerBacklinkRef,root);

  sharedWith.forEach(user => {
    const ref = doc(db, "users", user.id, "sharedGroceries", groceryId);
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
  debugger
  batch.delete(doc(db, "groceries", groceryId));
  batch.delete(doc(db, "users", ownerUid, "groceries", groceryId));
  sharedWith.forEach(user => {
    batch.delete(doc(db, "users", user.id, "sharedGroceries", groceryId));
  });

  try {
    await batch.commit();
    return { success: true };
  } catch (error) {
    console.error("Error deleting grocery:", error);
    return { success: false, error };
  }
}




