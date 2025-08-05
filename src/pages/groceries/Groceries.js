import { useAuth } from '../../providers/AuthProvider';
import '../grocery/grocery.css'
import HeaderMenu from '../../components/header/header';
import { useTranslation } from 'react-i18next';
import gr from './Groceries.module.css'

import iconLogout from '../../images/icons/logout.svg'
import Select from '../../components/select/Select';
import GroceryCard from '../../components/groceryCard/GroceryCard';
import Popup from '../../components/popup/Popup';
import add from '../../images/icons/addBig.svg'

import { useState } from 'react';

export default function Groceries() {
  const {userData} = useAuth();
  const { t } = useTranslation();
  const { logout } = useAuth();
  const [isAddNewGroceryVisible, setIsAddNewGroceryVisible] = useState(false);

   if (!userData) return null;

  let groceries = userData.getGroceries();
  const options = ['All', "Personal", "Shared"]
  const optionsStatus = ['All', "Active", "Completed"]
  const optionsSortBy = ['Newest First', "Oldest First", "A-Z", "Z-A"];
  const headerTitle = t('HI') + ", " + userData.firstName + " !";
  const headerItems =  [{src : iconLogout , alt : "Logout", clickaction : logout}]

  const toggleNewGrocery = () => {
    setIsAddNewGroceryVisible(!isAddNewGroceryVisible);
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
            <GroceryCard key={index} data={grocery} />
          ))}
        </div>
         <img alt='Add' src={add} className={gr.addGrocery}onClick={toggleNewGrocery} />
        { isAddNewGroceryVisible &&
          <Popup title={"Add new grocery"} close={toggleNewGrocery}>
          <form style={{display: 'grid', gap: '10px', width : '150px', placeSelf : 'center'}}>
            <label>Name :</label>
            <input></input>

             <label>Date :</label>
            <input></input>
            <div>
             <label>Add users : </label>
            <input></input> <button>+</button>
            </div>
          <button>Save</button>
            </form>  
          </Popup>
        }
      </div> 
  )
}
