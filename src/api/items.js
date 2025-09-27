import { doc, deleteDoc, updateDoc, writeBatch, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../api/initFirebase";


export async function addItems(items,groceryId){
    if (!groceryId || !Array.isArray(items)) {
    throw new Error("Missing groceryId or items array");
  }
 try {
    const batch = writeBatch(db);
    const groceryRef = doc(db, "groceries", groceryId);
    const itemsCol = collection(groceryRef, "items");
    items.forEach((item) => {
      const newItemRef = doc(itemsCol);
      batch.set(newItemRef, {
        ...item,
        createdAt: new Date()
      });
    });
    batch.update(groceryRef, {
      dateLastUpdated: serverTimestamp()
    });
    await batch.commit();
    return { success: true };
  } catch (error) {
    return {success : false, error}
  }
}


export async function removeItem(groceryId, itemId) {
  if (!groceryId || !itemId) throw new Error("Missing groceryId or itemId");
  try {
    const itemRef = doc(db, "groceries", groceryId, "items", itemId);
    const groceryRef = doc(db, "groceries", groceryId);
    await deleteDoc(itemRef);
    await updateDoc(groceryRef,{
       dateLastUpdated: serverTimestamp(),
    })
    return {success : true}
  } catch (error) {
    return {success : false, error}
  }
}

export async function setItemStatus(groceryId, itemId, status) {
  try {
    const ref = doc(db, "groceries", groceryId, "items", itemId);
    const groceryRef = doc(db, "groceries", groceryId);
    await updateDoc(ref, { status });
    await updateDoc(groceryRef, {dateLastUpdated : serverTimestamp()})
    return {success : true}
  } catch(err){
    return {success: false, err}
  }
}

