import {signInWithEmailAndPassword } from "firebase/auth";
import {auth} from "./initFirebase"

export default async function handleConnection(email,password){
    try{
   const user = await signInWithEmailAndPassword(auth, email + "@gmail.com", password)
      return user.user.uid;
    } catch(e){
        return null;
    }
}