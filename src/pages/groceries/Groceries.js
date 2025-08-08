import { useAuth } from '../../providers/AuthProvider';
import '../grocery/grocery.css'
import HeaderMenu from '../../components/header/header';
import { useTranslation} from 'react-i18next';
import {saveNew} from '../../api/grocery';
import { fetchUserGroceries } from '../../api/user';
import gr from './Groceries.module.css'

import iconLogout from '../../images/icons/logout.svg'
import Select from '../../components/select/Select';
import GroceryCard from '../../components/groceryCard/GroceryCard';
import Popup from '../../components/popup/Popup';
import add from '../../images/icons/addBig.svg'

import { useState, useRef, useEffect } from 'react';

export default function Groceries() {
  const {userData, logout} = useAuth();
  const { t } = useTranslation();
  const [isAddNewGroceryVisible, setIsAddNewGroceryVisible] = useState(false);
  const [groceries, setGroceries] = useState([]);
  const [usersList, setUsersList] = useState([])
  let nameRef = useRef(null);
  let dateRef = useRef(null);
  let usersRef = useRef(null);
  
  useEffect(() => {
  if (userData) {
    loadGroceries();
  }
}, [userData]);
  
  if (!userData) return null;
  console.log("r")

  const options = ['All', "Personal", "Shared"]
  const optionsStatus = ['All', "Active", "Completed"]
  const optionsSortBy = ['Newest First', "Oldest First", "A-Z", "Z-A"];

  const headerTitle = t('HI') + ", " + userData.firstName + " !";
  const headerItems =  [{src : iconLogout , alt : "Logout", clickaction : logout}]


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
          sharedWith : usersList.current
        }
      );  
       if (result.success) {
         await loadGroceries();
         toggleNewGrocery();
    } else {
      alert("Server Error");
    }
    }
  }
  
  const addUser = () => {

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


  return (
       <div className='mainContentWrapper'>
        <HeaderMenu title={headerTitle} headerItems={headerItems} headerNav={null}/>
        <div className={gr.sortBy}>
          <Select label="Groceries" options={options} />
          <Select label="Status" options={optionsStatus} />
          <Select label="Sort By" options={optionsSortBy} />
        </div>
        <div className={gr.list}>
          {groceries.length > 0 && groceries.map((grocery, index) => (
            <GroceryCard key={index} data={grocery} onDelete={loadGroceries} />
          ))}
        </div>
         <img alt='Add' src={add} className={gr.addGrocery}onClick={toggleNewGrocery} />
        { isAddNewGroceryVisible &&
          <Popup title={"Add new grocery"} close={toggleNewGrocery}>
          <form className={gr.form}>
            <label htmlFor="groceryName" >Name :</label>
            <input id="groceryName" ref={nameRef} className='input'></input>
             <label htmlFor='groceryDate'>Date :</label>
            <input id="groceryDate" className={`${gr.dateInput} input`} type='date' onKeyDown={(e) => e.preventDefault()}  onClick={(e) => e.target.showPicker && e.target.showPicker()} placeholder='' ref={dateRef}></input>
            <div>
             <label for="userList">Add a user : </label>
             <div className={gr.userListWrapper}>
            <input id="userList" ref={usersRef} className={`input ${gr.userList}`} placeholder='ex. user1234'></input> 
            <button onClick={addUser} className={gr.addUserButton}>+</button>
             </div>
            </div>
            <button onClick={(e)=>saveNewGrocery(e)} className={gr.saveButton}>Save</button>
            </form>  
          </Popup>
        }
      </div> 
  )
}
