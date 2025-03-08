import './App.css';
import Login from '../src/login/Login'
import Main from '../src/main/main'
import { useState } from 'react';

function App() {

  const [isConnected, setIsConnected] = useState(false)

  const  toggleIsConnected = () => {
    setIsConnected(!isConnected);
  }

  return (
    isConnected === false ? (
    <Login isConnected={toggleIsConnected}></Login>):(<Main></Main>)
    
  );
}

export default App;
