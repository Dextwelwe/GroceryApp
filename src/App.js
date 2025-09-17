import Groceries from './pages/groceries/Groceries';
import { useState } from 'react';
import Grocery from './pages/grocery/Grocery';
import Login from './pages/login/Login';
import { useAuth } from './providers/AuthProvider';

function App() {
  const {user} = useAuth();
  const [page, setPage] = useState("groceries");
  const [groceryId, setGroceryId] = useState(null);

  if (!user?.email) return <Login />;

  const goToGrocery = (id) => {
    if (id != null){
      setPage("grocery")
      setGroceryId(id)
    }
  }

  return(
    <Groceries goToGrocery={goToGrocery} />
  )

}

export default App;
