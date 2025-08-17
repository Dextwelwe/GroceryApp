import { doc, deleteDoc, updateDoc, writeBatch, collection } from "firebase/firestore";
import { db } from "../api/initFirebase";


export async function addItems(items,groceryId){
    if (!groceryId || !Array.isArray(items)) {
    throw new Error("Missing groceryId or items array");
  }
 try {
    const batch = writeBatch(db);
    const itemsCol = collection(db, "groceries", groceryId, "items");
    debugger;
    items.forEach((item) => {
      const newItemRef = doc(itemsCol);
      batch.set(newItemRef, {
        ...item,
        createdAt: new Date()
      });
    });
    await batch.commit();
    return { success: true };
  } catch (err) {
    console.error("Failed to add items:", err);
    throw err;
  }
}


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

