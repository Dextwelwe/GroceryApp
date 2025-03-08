import {signInWithEmailAndPassword } from "firebase/auth";
import {auth} from "./initFirebase"

export default async function handleConnection(email,password){
    try{
   await signInWithEmailAndPassword(auth, email + "@gmail.com", password)
      return true;
    } catch(e){
        return false;
    }
}