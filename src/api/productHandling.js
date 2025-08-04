import { collection, getDocs, deleteDoc, addDoc, query, where } from "firebase/firestore";
import { db } from "./initFirebase";
import { doc, updateDoc } from "firebase/firestore";

let table = "list"

export async function getList(){
      const querySnapshot = await getDocs(collection(db, table));
      const items = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      return items;
    };

    export async function getAllCategories(){
      const querySnapshot = await getDocs(collection(db, 'categories'));
      const categories = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      return categories;
    };

    export async function addNewCategory(item){
      addDoc(collection(db,'categories'), item)
    }

    export async function getAssignedCategories() {
      const querySnapshot = await getDocs(collection(db, table));
    
      const categories = [
        ...new Set(
          querySnapshot.docs
            .map((doc) => doc.data().category.desc) 
            .filter((category) => category !== undefined)
        ),
      ];
      
      const categoriesWithDesc = categories.map((category) => ({
        desc: category,
      }));
      return categoriesWithDesc; 
    } 

    export async function updateStatusById(id, newValue) {
      const docRef = doc(db, table, id); 
      await updateDoc(docRef, {
        status : newValue, 
      });
    }

    export async function deleteById(id) {
      const docRef = doc(db, table, id); 
      await deleteDoc(docRef); 
    }

    export async function deleteCategoryByDesc(descToDelete) {
      const q = query(collection(db, "categories"), where("desc", "==", descToDelete));
      const snapshot = await getDocs(q);
    
      snapshot.forEach(async (docSnap) => {
        await deleteDoc(doc(db, "categories", docSnap.id));
        console.log(`Deleted: ${docSnap.id}`);
      });
    }

    async function addItem(item){
     await addDoc(collection(db, table), item);
    }

    export async function addItems(arr){
      for (let x=0; x< arr.length; x++){
        await addItem(arr[x])
      }
    }



