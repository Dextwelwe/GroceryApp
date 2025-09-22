import { collection, doc, deleteDoc, serverTimestamp, writeBatch,Timestamp, getDoc, getDocs, updateDoc, arrayRemove, query, onSnapshot } from "firebase/firestore";
import { db } from "../api/initFirebase";
import Grocery from "../models/Grocery";

export async function saveNew(grocery) {
  
  const sharedWith = Array.from(new Set(grocery.sharedWith || [])).filter(uid => uid && uid !== grocery.owner);
  const groceryRef = doc(collection(db, "groceries"));
  const groceryId = groceryRef.id;
  const date = grocery.date instanceof Date ? grocery.date : null;

  const root = {
    name: grocery.name,
    date: date !== null ? Timestamp.fromDate(date) : date,
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
  try {
    const groceryRef = doc(db, "groceries", groceryId);
    const itemsCol = collection(groceryRef, "items");

    const batch = writeBatch(db);

    const itemsSnap = await getDocs(itemsCol);
    itemsSnap.forEach(itemDoc => {
      batch.delete(itemDoc.ref);
    });

    batch.delete(groceryRef);

    batch.delete(doc(db, "users", ownerUid, "groceries", groceryId));
    sharedWith.forEach(u => {
      batch.delete(doc(db, "users", u, "sharedGroceries", groceryId));
    });

    await batch.commit();

    return { success: true };
  } catch (error) {
    console.error("Error deleting grocery + items:", error);
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

export async function updateCustomCategories(groceryId,list){
      const groceryRef = doc(db, "groceries", groceryId);
      try {
        await updateDoc(groceryRef, {
        customCategories: list
        });
        return {success : true}
      } catch (e){
        return {success : false, error : e}
      }
}

export async function removeOneCustomCategories(groceryId,category) {
     const groceryRef = doc(db, "groceries", groceryId);
     try {
       await updateDoc(groceryRef, {
         customCategories: arrayRemove(category)
       });
       return {success : true}
     } catch (e){
       return {success : false, error : e}
     }
}

export async function updateCustomStores(groceryId, stores) {
   const groceryRef = doc(db, "groceries", groceryId);
      try {
        await updateDoc(groceryRef, {
        customStores: stores
        });
        return {success : true}
      } catch (e){
        return {success : false, error : e}
      }
}

export async function removeOneCustomStore(groceryId, store) {
  const groceryRef = doc(db, "groceries", groceryId);
     try {
       await updateDoc(groceryRef, {
         customStores: arrayRemove(store)
       });
       return {success : true}
     } catch (e){
       return {success : false, error : e}
     }
}

export function subscribeGroceryItems(groceryId, onNext, onError) {
  const q = query(collection(db, 'groceries', groceryId, 'items'));

  return onSnapshot(q, (snap) => {
      const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      onNext(items);
    }, onError );
}





