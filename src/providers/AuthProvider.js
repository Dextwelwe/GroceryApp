import { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged,signOut} from 'firebase/auth';
import { auth } from '../api/initFirebase';
import { fetchUser } from '../api/user';
import User from '../models/User';
import AppSplash from '../components/appSplash/AppSplash';

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

/* How long the splash may block the UI while we wait for Firebase. */
const BOOT_TIMEOUT_MS = 8000;
const PROFILE_RETRIES = 2;
const PROFILE_RETRY_DELAY_MS = 600;

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Reads the user profile, retrying a couple of times because a cold PWA start
 * can fire the request before the network/Firestore client is ready.
 * Never rejects: falls back to the auth user so the app can still render.
 * @param {import('firebase/auth').User} authUser
 * @returns {Promise<User>}
 */
async function loadUserProfile(authUser) {
  for (let attempt = 0; attempt <= PROFILE_RETRIES; attempt += 1) {
    try {
      const profile = await fetchUser(authUser.uid);
      if (profile) return profile;
      break;
    } catch (error) {
      if (attempt === PROFILE_RETRIES) {
        console.error('Could not load user profile:', error);
        break;
      }
      await wait(PROFILE_RETRY_DELAY_MS);
    }
  }

  return new User(authUser.uid, { email: authUser.email, firstName: authUser.displayName || '' });
}

export function AuthProvider({ children }) {
  const [user, setUser]   = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const logout = () => signOut(auth);

  useEffect(() => {
    let active = true;

    // safety net: a stuck auth listener must never leave the splash spinning
    const bootTimeout = setTimeout(() => {
      if (active) setLoading(false);
    }, BOOT_TIMEOUT_MS);

    const unsub = onAuthStateChanged(auth, async (nextUser) => {
      if (!active) return;

      if (nextUser) {
        const profile = await loadUserProfile(nextUser);
        if (!active) return;
        // user + profile are published together so no render sees one without the other
        setUser(nextUser);
        setUserData(profile);
      } else {
        setUser(null);
        setUserData(null);
      }

      if (!active) return;
      setLoading(false);
    }, (error) => {
      console.error('Auth state error:', error);
      if (active) setLoading(false);
    });

    return () => {
      active = false;
      clearTimeout(bootTimeout);
      unsub();
    };
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
