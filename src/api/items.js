import { doc, deleteDoc, updateDoc, writeBatch, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../api/initFirebase";
import { normalizeUom, parseAmount } from "../utils/quantity";

/**
 * Applies a recipe-merge plan in one batch:
 * `updates` patch the amount/uom of existing rows, `creates` insert new ones.
 * @param {string} groceryId
 * @param {{ updates?: Array<{id: string, amount: number|null, uom: string|null}>, creates?: Array<object> }} plan
 */
export async function applyItemMerge(groceryId, plan = {}) {
  if (!groceryId) throw new Error("Missing groceryId");
  const updates = plan.updates || [];
  const creates = plan.creates || [];
  if (updates.length === 0 && creates.length === 0) return { success: true, updated: 0, created: 0 };

  try {
    const batch = writeBatch(db);
    const groceryRef = doc(db, "groceries", groceryId);
    const itemsCol = collection(groceryRef, "items");

    updates.forEach((update) => {
      batch.update(doc(itemsCol, update.id), {
        amount: parseAmount(update.amount),
        uom: normalizeUom(update.uom),
      });
    });

    creates.forEach((item) => {
      batch.set(doc(itemsCol), {
        ...item,
        amount: parseAmount(item.amount),
        uom: normalizeUom(item.uom),
        createdAt: new Date(),
      });
    });

    batch.update(groceryRef, { dateLastUpdated: serverTimestamp() });
    await batch.commit();
    return { success: true, updated: updates.length, created: creates.length };
  } catch (error) {
    return { success: false, error };
  }
}

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
        amount: parseAmount(item.amount),
        uom: normalizeUom(item.uom),
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

export async function updateItem(groceryId, itemId, fields = {}) {
  if (!groceryId || !itemId) throw new Error("Missing groceryId or itemId");
  try {
    const payload = {
      category: fields.category ?? "",
      store: fields.store ?? "",
      amount: parseAmount(fields.amount),
      uom: normalizeUom(fields.uom),
    };
    await updateDoc(doc(db, "groceries", groceryId, "items", itemId), payload);
    await updateDoc(doc(db, "groceries", groceryId), { dateLastUpdated: serverTimestamp() });
    return { success: true, data: payload };
  } catch (error) {
    return { success: false, error };
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
