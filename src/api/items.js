import { doc, deleteDoc, updateDoc } from "firebase/firestore";
import { db } from "../api/initFirebase";

export async function removeItem(groceryId, itemId) {
  if (!groceryId || !itemId) throw new Error("Missing groceryId or itemId");

  try {
    const itemRef = doc(db, "groceries", groceryId, "items", itemId);
    await deleteDoc(itemRef);
  } catch (err) {
    console.error("Failed to remove item:", err);
    throw err;
  }
}

export async function setItemStatus(groceryId, itemId, status) {
  const ref = doc(db, "groceries", groceryId, "items", itemId);
  await updateDoc(ref, { status });
}

