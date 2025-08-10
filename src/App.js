import Groceries from './pages/groceries/Groceries';
import { useState } from 'react';
import Grocery from './pages/grocery/Grocery';
import Login from './pages/login/Login';
import { useAuth } from './providers/AuthProvider';

function App() {
  const {user} = useAuth();
  const [page, setPage] = useState("groceries");

  if (!user?.email) return <Login />;

   return page === "groceries" 
    ? <Groceries goToGrocery={() => setPage("grocery")} />
    : <Grocery goBack={() => setPage("groceries")} />;
}

export default App;
