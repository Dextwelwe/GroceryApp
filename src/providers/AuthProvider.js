import { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged,signOut} from 'firebase/auth';
import { auth } from '../api/initFirebase';
import { fetchUser } from '../api/user';
import AppSplash from '../components/appSplash/AppSplash';

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser]   = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const logout = () => signOut(auth);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async(user) => {
    setUser(user);
    if (user){
      setUserData(await getUserData(user.uid))
    } else {
      setUserData(null);
    }
    setLoading(false);
    });
    return unsub;
  }, []);

  const getUserData = async (id) => {
    return await fetchUser(id);
  }

  if (loading) return <AppSplash />;

  return (
    <AuthContext.Provider value={{user, userData,setUserData, logout, getUserData}}>
      {children}
    </AuthContext.Provider>
  );
}
