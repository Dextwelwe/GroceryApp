import { collection, doc, deleteDoc, serverTimestamp, writeBatch,Timestamp, getDoc, getDocs, updateDoc, arrayUnion, arrayRemove, query, onSnapshot } from "firebase/firestore";
import { db } from "../api/initFirebase";
import Grocery from "../models/Grocery";


async function fetchGroceries(groceryIds) {
  if (!groceryIds || groceryIds.length === 0) return [];

  const groceriesRef = collection(db, "groceries");
  const promises = groceryIds.map(id => getDoc(doc(groceriesRef, id)));
  const snapshots = await Promise.all(promises);

  return snapshots
    .filter(snap => snap.exists())
    .map(snap => ({ id: snap.id, ...snap.data() }));
}

export async function fetchAllGroceries(userId) {
  if (!userId) throw new Error("Missing userId");

  const userRef = doc(db, "users", userId);
  const userSnap = await getDoc(userRef);
  if (!userSnap.exists()) throw new Error("User not found");

  const userData = userSnap.data();
  const groceryIds = userData.groceries || [];
  const allGroceries = await fetchGroceries(groceryIds);

  return allGroceries;
}

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
    dateLastUpdated : serverTimestamp(),
    sharedWith: sharedWith,
  };

  const batch = writeBatch(db);

  batch.set(groceryRef, root);

  const ownerRef = doc(db, "users", grocery.owner);
  batch.update(ownerRef, { groceries: arrayUnion(groceryId) });

  // Add groceryId to groceries array for each user in sharedWith
  sharedWith.forEach(userId => {
    const userRef = doc(db, "users", userId);
    batch.update(userRef, { groceries: arrayUnion(groceryId) });
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

    const ownerRef = doc(db, "users", ownerUid);
    batch.update(ownerRef, { groceries: arrayRemove(groceryId) });

    sharedWith.forEach(u => {
      const userRef = doc(db, "users", u);
      batch.update(userRef, { groceries: arrayRemove(groceryId) });
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
    const [grocerySnap, itemsSnap ] = await Promise.all([
      getDoc(groceryRef),
      getDocs(itemsRef)
    ]);
    if (!grocerySnap.exists()) return null;
    const groceryData = grocerySnap.data();
    const items = itemsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    return new Grocery(grocerySnap.id, { ...groceryData, items });
  } catch (err) {
    console.error("Failed to fetch grocery:", err);
    throw err;
  }
}

export function subscribeGroceryItems(groceryId, onNext, onError) {
  const q = query(collection(db, 'groceries', groceryId, 'items'));

  return onSnapshot(q, (snap) => {
      const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      onNext(items);
    }, onError );
}

export async function clearItemsList(groceryId){
  try {
    const itemsCol = collection(db, "groceries", groceryId, "items");
    const itemsSnap = await getDocs(itemsCol);

    if (itemsSnap.empty) {
      return { success: true };
    }

    const batch = writeBatch(db);

    itemsSnap.forEach(itemDoc => {
      batch.delete(itemDoc.ref);
    });

    await batch.commit();

    return { success: true };

  } catch (error) {
    console.error("Error clearing items:", error);
    return { success: false, error };
  }
}

export async function updateGroceryStatus(groceryId, status) {
  try {
    const groceryRef = doc(db, "groceries", groceryId);
    await updateDoc(groceryRef, { status: status });
    return { success: true };
  } catch (error) {
    console.error("Error updating grocery status:", error);
    return { success: false, error };
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




