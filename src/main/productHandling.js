import { collection, getDocs, deleteDoc, addDoc } from "firebase/firestore";
import { db } from "../login/initFirebase";
import { doc, updateDoc } from "firebase/firestore";

export async function getList(){
      const querySnapshot = await getDocs(collection(db, "list1"));
      const items = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      const sortedItems = [
        ...items.filter(item => item.status !== "DONE"), 
        ...items.filter(item => item.status === "DONE")
      ];
      return sortedItems;
    };

    export async function updateStatusById(id, newValue) {
      const docRef = doc(db, "list1", id); 
      await updateDoc(docRef, {
        ["status"]: newValue, 
      });
    }

    export async function deleteById(id) {
      const docRef = doc(db, "list1", id); 
      await deleteDoc(docRef); 
    }

    async function addItem(item){
     await addDoc(collection(db, "list1"), item);
    }

    export async function addItems(arr){
      console.log(arr)
      for (let x=0; x< arr.length; x++){
        await addItem(arr[x])
      }
    }

