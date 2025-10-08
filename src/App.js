import Groceries from './pages/groceries/Groceries';
import { useState, useCallback} from 'react';
import Grocery from './pages/grocery/Grocery';
import Login from './pages/login/Login';
import { useAuth } from './providers/AuthProvider';

function App() {
  const {user} = useAuth();
  const [page, setPage] = useState("groceries");
  const [groceryId, setGroceryId] = useState(null);
  const [refresh, setRefresh] = useState(false);

  const goToGrocery = useCallback((id) => {
    if (id == null) return;
    setGroceryId(prev => (prev === id ? prev : id));
    setPage(prev => (prev === 'grocery' ? prev : 'grocery'));
  }, []);

  const goBack = useCallback((refreshPage=false) => {
    refreshPage && setRefresh(!refresh);
    setPage(prev => (prev === 'groceries' ? prev : 'groceries'));
    // eslint-disable-next-line
  }, []);
  
  if (!user?.email) return <Login />;

  return (
     <>
     <div style={{ display: page === "groceries" ? "block" : "none" }}>
      <Groceries goToGrocery={goToGrocery} refresh={refresh} />
     </div>
     
      <div style={{ display: page === 'grocery' ? 'block' : 'none' }}>
        { groceryId &&
          <Grocery key={groceryId ?? 'none'} groceryId={groceryId} goBack={goBack}  />
        }
      </div>
     </>
  )
}

export default App;
