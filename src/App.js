import './App.css';
import Login from '../src/login/Login'
import Main from '../src/main/main'
import { useState, useEffect } from 'react';
import { auth} from '../src/login/initFirebase'; 
import { onAuthStateChanged } from 'firebase/auth';

function App() {

  const [isConnected, setIsConnected] = useState(true);
  const [loading, setLoading] = useState(true);

  const  toggleIsConnected = () => {
    setIsConnected(!isConnected);
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsConnected(true); 
      } else {
        setIsConnected(false); 
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);


  return (
    !loading && (
      isConnected === false 
        ? <Login connect={toggleIsConnected} /> 
        : <Main disconnect={toggleIsConnected} />
    )
  );
}

export default App;
