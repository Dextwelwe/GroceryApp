import { collection, doc, setDoc, addDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../api/initFirebase";

export async function saveNew(grocery) {
  let groceryRef = null;
  let userGroceryRef = null;
  try {
    let groceryObj = {
      name: grocery.name,
      date: new Date(grocery.date),
      owner : grocery.owner,
      type : "personal",
      status : "pending",
      createdAt: serverTimestamp()
    }
    groceryRef = await addDoc(collection(db, "groceries"), groceryObj);
    let userGroceryDoc = doc(db, "users", grocery.owner, "groceries", groceryRef.id);
    await setDoc(userGroceryDoc, groceryObj);
    return {success: true};
  } catch (error) {
    console.error("Error adding document: ", error);
    // ROLLBACKS
     if (groceryRef) {
      try {
        await deleteDoc(groceryRef);
      } catch (err) {
        console.error("Failed to rollback grocery doc:", err);
      }
    }

    if (userGroceryRef) {
      try {
        await deleteDoc(userGroceryRef);
      } catch (err) {
        console.error("Failed to rollback user grocery doc:", err);
      }
    }
    return { success: false, error};
  }
}

export default async function removeGrocery(userId, groceryId) {
  try {
    const globalRef = doc(db, "groceries", groceryId);
    await deleteDoc(globalRef);

    const userRef = doc(db, "users", userId, "groceries", groceryId);
    await deleteDoc(userRef);

    return { success: true };
  } catch (error) {
    console.error("Error deleting grocery:", error);
    return { success: false, error };
  }
}




