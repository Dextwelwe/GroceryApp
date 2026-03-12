import { doc, getDoc, deleteDoc, updateDoc, writeBatch, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../api/initFirebase";

export async function getRecipeById(recipeId) {
  if (!recipeId) throw new Error("Missing recipeId");
  try {
    const recipeRef = doc(db, "recipes", recipeId);
    const recipeSnap = await getDoc(recipeRef);
    if (!recipeSnap.exists()) return { success: false, error: "Recipe not found" };
    return { success: true, data: { id: recipeSnap.id, ...recipeSnap.data() } };
  } catch (error) {
    return { success: false, error };
  }
}