import gr from './Groceries.module.css'

import { useAuth } from '../../providers/AuthProvider';
import { useTranslation} from 'react-i18next';
import { useState, useRef, useEffect, useMemo } from 'react';

// Api
import {saveNew} from '../../api/grocery';
import { fetchUserGroceries, getUserId} from '../../api/user';

// Components
import Select from '../../components/select/Select';
import Popup from '../../components/popup/Popup';
import HeaderMenu from '../../components/header/header';
import GroceryCard from '../../components/groceryCard/GroceryCard';

// Icons
import add from '../../assets/images/icons/addBig.svg'
import iconLogout from '../../assets/images/icons/logout.svg'


export default function Groceries({goToGrocery}) {
  const { t } = useTranslation();
  const {userData, logout} = useAuth();

  const [groceries, setGroceries] = useState([]);
  const [usersList, setUsersList] = useState([])
  const [isAddNewGroceryVisible, setIsAddNewGroceryVisible] = useState(false);

  let nameRef = useRef(null);
  let dateRef = useRef(null);
  let usersRef = useRef(null);

  const [filters, setFilters] = useState({label: 'all',status: 'all',sortBy: 'newest'});
  const STATUS_MAP = { "pending": "active", completed: "completed"};
  const headerItems =  [{src : iconLogout , alt : "Logout", clickaction : logout}]

  const optionsLabel = [
   { value: "all", label: "All" },
   { value: "personal", label: "Personal" },
   { value: "shared", label: "Shared"},
  ];
  
  const optionsStatus = [
   { value: "all", label: "All" },
   { value: "active", label: "Active" },
   { value: "completed", label: "Completed" },
  ];
  
  const optionsSortBy = [
   { value: "newest", label: "Newest First" },
   { value: "oldest", label: "Oldest First" },
   { value: "az", label: "A-Z" },
   { value: "za", label: "Z-A" },
  ];
  
  useEffect(() => {
  if (userData) {
    loadGroceries();
  }
   // eslint-disable-next-line react-hooks/exhaustive-deps
}, [userData]);

const norm = (s) => (s || "").toString().trim().toLowerCase();

const view = useMemo(() => {
  // filter out label and status
  const filtered = groceries.filter(g => {
    const gLabel = norm(g.type);
    const gStatus = STATUS_MAP[norm(g.status)] || norm(g.status);

    const passLabel  = filters.label  === "all" || gLabel  === filters.label;
    const passStatus = filters.status === "all" || gStatus === filters.status;
    return passLabel && passStatus;
  });
  // sort the filtered array by current sort value
  return [...filtered].sort((a, b) => {
    const an = norm(a.name), bn = norm(b.name);
    const ta = getDate(a.createdAt)?.getTime() ?? 0;
    const tb = getDate(b.createdAt)?.getTime() ?? 0;

    switch (filters.sortBy) {
      case "oldest": return ta - tb;
      case "newest": return tb - ta;
      case "az":     return an.localeCompare(bn);
      case "za":     return bn.localeCompare(an);
      default:       return 0;
    }
  });
   // eslint-disable-next-line react-hooks/exhaustive-deps
}, [groceries, filters]);
  

  if (!userData) return null;

  const headerTitle = t('HI') + ", " + userData.firstName + " !";
  const toggleNewGrocery = () => {
    setIsAddNewGroceryVisible(!isAddNewGroceryVisible);
  }

  async function loadGroceries() {
  const personal = await fetchUserGroceries(userData.uid);
  const shared = await fetchUserGroceries(userData.uid, 'shared');
  setGroceries([...personal, ...shared]);
}

  const saveNewGrocery = async (e) => {
    let isValid = true;
    e.preventDefault();
    let inputsRef = [nameRef,dateRef];

    inputsRef.forEach(element => {
      if (!validateInput(element.current.value)){
          element.current.style.backgroundColor = '#ffcdd2';
          isValid = false;
      }
    });
    if (isValid){
      let result = await saveNew(
        {
          owner : userData.uid ,
          name : nameRef.current.value,
          date : dateRef.current.value,
          sharedWith : usersList,
          type : usersList.length > 0 ? 'shared' : 'personal'
        }
      );  
       if (result.success) {
         await loadGroceries();
         toggleNewGrocery();
         setUsersList([])
    } else {
      alert("Server Error");
    }
    }
  }
  
  const addUser = async() => {
  let userInput = usersRef.current.value;

  if (!userInput) return;
  if (usersList.includes(userInput)) return;
  if (userInput === userData.email) return;
   
  let userId = await getUserId(userInput);
  if (userId){
      setUsersList(prev => ([...prev, {email : userInput,id :userId}]));
  } else {
    alert ("user '" + userInput + "' doesn't exist");
  }
  }

 function handleFilterChange(e) {
  const { name, value } = e.target;
  setFilters(prev => ({ ...prev, [name]: value }));
}

  function validateInput(value) {
  if (value == null) return false;

  if (value instanceof Date) {
    return !isNaN(value.getTime());
  }

  if (typeof value === 'number') {
    return !isNaN(value);
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 && trimmed.length <= 50;
  }
  return false;
}

function  getDate(d)  {
  if (!d) return null;
  try { return typeof d?.toDate === "function" ? d.toDate() : new Date(d); }
  catch { return null; }
};

const openGrocery = () => {
  goToGrocery();
}

  return (
    <div className='mainContentWrapper'>
     <HeaderMenu title={headerTitle} headerItems={headerItems} headerNav={null}/>
     {/* Filters */}
     <div className={gr.sortBy}>
       <Select label="Groceries" options={optionsLabel} name="label" value={filters.label} onChange={handleFilterChange} />
       <Select label="Status" options={optionsStatus} name="status"  value={filters.status} onChange={handleFilterChange} />
       <Select label="Sort By" options={optionsSortBy} name="sortBy" value={filters.sortBy} onChange={handleFilterChange}/>
     </div>
     {/* Grocery Cards */}
     <div className={gr.list}>
       {(view.length ? view : []).map((grocery) => (
       <GroceryCard key={grocery.id} data={grocery} onClick={openGrocery} onDelete={loadGroceries} />
       ))}
       {view.length === 0 && groceries.length > 0 && <div className={gr.empty}>No groceries match your filters.</div>}
     </div>
     {/* New Grocery Popup */}
     { isAddNewGroceryVisible &&
       <Popup title={"Add new grocery"} close={toggleNewGrocery}>
         <form className={gr.form}>
           <label htmlFor="groceryName" >Name :</label>
           <input id="groceryName" ref={nameRef} className='input'></input>
           <label htmlFor='groceryDate'>Date :</label>
           <input id="groceryDate" className={`${gr.dateInput} input`} type='date' onKeyDown={(e) => e.preventDefault()}  onClick={(e) => e.target.showPicker && e.target.showPicker()} placeholder='' ref={dateRef}></input>
           <label for="userList">Add a user : </label>
           <div className={gr.userListWrapper}>
             <input id="userList" ref={usersRef} className={`input ${gr.userList}`} placeholder='ex. user1234'></input> 
             <button onClick={addUser} className={gr.addUserButton}>+</button>
           </div>
           {usersList !== '' && <><span className={gr.addedUsersTitle}>Added Users : </span><span className={gr.formMessage}>{usersList.map(e => e.email).join(", ")}</span></>}
           <button type='button' onClick={(e)=>{ e.preventDefault();saveNewGrocery(e)}} className={gr.saveButton}>Save</button>
         </form>  
       </Popup>
     }
    {/* Add Grocery Button */}
     <img alt='Add' src={add} className={gr.addGrocery}onClick={toggleNewGrocery} />
    </div> 
  )
}
