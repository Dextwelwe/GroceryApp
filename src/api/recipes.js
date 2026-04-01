import { doc, getDoc, updateDoc, writeBatch, collection, serverTimestamp, arrayUnion, arrayRemove } from "firebase/firestore";
import { db } from "../api/initFirebase";

export async function deleteRecipe(userId, recipeId) {
  if (!userId || !recipeId) throw new Error("Missing userId or recipeId");
  try {
    const batch = writeBatch(db);
    batch.delete(doc(db, "recipes", recipeId));
    batch.update(doc(db, "users", userId), { recipes: arrayRemove(recipeId) });
    await batch.commit();
    return { success: true };
  } catch (error) {
    return { success: false, error };
  }
}

export async function fetchUserRecipes(userId) {
  if (!userId) throw new Error("Missing userId");
  try {
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) return { success: false, error: "User not found" };
    const recipeIds = userSnap.data().recipes || [];
    const recipes = await Promise.all(
      recipeIds.map(async (recipeId) => {
        const recipeSnap = await getDoc(doc(db, "recipes", recipeId));
        if (!recipeSnap.exists()) return null;
        return { id: recipeSnap.id, ...recipeSnap.data() };
      })
    );
    return { success: true, data: recipes.filter(Boolean) };
  } catch (error) {
    return { success: false, error };
  }
}

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

export async function saveNewRecipe(recipe) {
  try {
    const recipeRef = doc(collection(db, "recipes"));
    const recipeId = recipeRef.id;

    const recipeData = {
      name: recipe.name,
      owner: recipe.owner,
      items: recipe.items || [],
      createdAt: serverTimestamp(),
      dateLastUpdated: serverTimestamp()
    };

    const batch = writeBatch(db);
    batch.set(recipeRef, recipeData);

    const userRef = doc(db, "users", recipe.owner);
    batch.update(userRef, {
      recipes: arrayUnion(recipeId),
    });

    await batch.commit();
    return { success: true, recipeId };
  } catch (error) {
    console.error("Error saving recipe:", error);
    return { success: false, error };
  }
}

export async function updateRecipe({ recipeId, items }) {
  if (!recipeId) throw new Error("Missing recipeId");

  try {
    const recipeRef = doc(db, "recipes", recipeId);
    await updateDoc(recipeRef, {
      items: items || [],
      dateLastUpdated: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error("Error updating recipe:", error);
    return { success: false, error };
  }
}