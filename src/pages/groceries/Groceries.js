import gr from './Groceries.module.css'

import { useAuth } from '../../providers/AuthProvider';
import { useTranslation} from 'react-i18next';
import { useState, useRef, useEffect, useMemo } from 'react';
import useLocalStorage from '../../hooks/useLocalStorage'

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
import animLoading from '../../assets/images/animations/loading.gif'


export default function Groceries({goToGrocery}) {
  const { t } = useTranslation();
  const {userData, logout} = useAuth();

  const [isLoading, setIsLoading] = useState(false);
  const [groceries, setGroceries] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [usersEmailList, setUsersEmailList] = useState([]);
  const [isAddNewGroceryVisible, setIsAddNewGroceryVisible] = useState(false);
  const [isDateDisabled, setIsDateDisabled] = useState(false);

  const [defaultLabel,setDefaultLabel] = useLocalStorage('FLabel','all');
  const [defaultStatus,setDefaultStatus] = useLocalStorage('FStatus','all');
  const [defaultSortBy,setDefaultSortBy] = useLocalStorage('FSortBy','newest');
  const [filters, setFilters] = useState({label: defaultLabel, status: defaultStatus, sortBy: defaultSortBy});
  const defaultFilterValues = { categories : 'all', sortBy : "newest"}

  let nameRef = useRef(null);
  let dateRef = useRef(null);
  let usersRef = useRef(null);


  const STATUS_MAP = { active: "active", completed: "completed"};
  const headerItems =  [{src : iconLogout , alt : "Logout", clickaction : logout}]

  const optionsLabel = [
   { value: "all", label: t('FILTERS.ALL') },
   { value: "personal", label: t('FILTERS.PERSONAL') },
   { value: "shared", label: t('FILTERS.SHARED')},
  ];
  
  const optionsStatus = [
   { value: "all", label : t('FILTERS.ALL') },
   { value: "active", label: t('STATUS.ACTIVE') },
   { value: "completed", label: t('STATUS.COMPLETED')},
  ];
  
  const optionsSortBy = [
   { value: "newest", label: t('FILTERS.NEWEST_FIRST') },
   { value: "oldest", label: t('FILTERS.OLDEST_FIRST') },
   { value: "az", label: t("FILTERS.A-Z")},
   { value: "za", label: t("FILTERS.Z-A")},
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
  let timer;
  try {
    timer = setTimeout(() => setIsLoading(true), 500);
    
    const [personal, shared] = await Promise.all([
      fetchUserGroceries(userData.uid),
      fetchUserGroceries(userData.uid, "shared"),
    ]);

    setGroceries([...personal, ...shared]);
  } catch (err) {
    console.error("Failed to fetch groceries:", err);
  } finally {
    clearTimeout(timer);
    setIsLoading(false);
  }
}

  const saveNewGrocery = async (e) => {
    let isValid = true;
    let disabledDateVal = null;
    e.preventDefault();
    let inputsRef = [nameRef, ...(!isDateDisabled ? [dateRef] : [])];

    inputsRef.forEach(element => {
      if (!validateInput(element.current.value)){
          element.current.style.backgroundColor = '#ffcdd2';
          isValid = false;
      }
    });

    let dateVal = dateRef.current.value;
    let parsedDate = null;

    if (dateVal){
      let dateArr =dateVal.split('-');
      let year = dateArr[0];
      let month = parseInt(dateArr[1], 10) - 1;
      let day =  dateArr[2];
      parsedDate = new Date(year,month,day);
    }
 
    if (isValid){
      let result = await saveNew(
        {
          owner : userData.uid ,
          name : nameRef.current.value,
          date : !isDateDisabled ? parsedDate : disabledDateVal,
          sharedWith : usersList,
          type : usersList.length > 0 ? 'shared' : 'personal'
        }
      );  
       if (result.success) {
         await loadGroceries();
         toggleNewGrocery();
         setUsersList([])
    } else {
      if (result.error.code === 'permission-denied'){
        alert(t('WARNINGS.NOT_PERMITTED_FOR_GUESTS'))
      }else{
        alert(t('WARNINGS.SERVER_ERROR'));
      }
    }
    }
  }
  
  const addUser = async() => {
  let userInput = usersRef.current.value;
  if (userData.isTestUser){return alert(t('WARNINGS.NOT_PERMITTED_FOR_GUESTS'))}
  if (!userInput) return;
  if (usersEmailList.includes(userInput)) return;
  if (userInput === userData.email) return;
   
  let userId = await getUserId(userInput);
  if (userId){
      setUsersEmailList(prev => ([...prev, userInput]));
      setUsersList(prev=>([...prev, userId]));
  } else {
    alert (t('USER') + " : '" + userInput + " ' " + t('WARNINGS.NOT_FOUND'));
  }
  }

 function handleFilterChange(e) {
  const { name, value } = e.target;
  setFilters(prev => ({ ...prev, [name]: value }));
  if (name === 'label') setDefaultLabel(value);
  if (name === 'status') setDefaultStatus(value);
  if (name === 'sortBy') setDefaultSortBy(value);
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

const openGrocery = (id) => {
  goToGrocery(id);
}

function resetFilters(){
  setDefaultLabel("all");
  setDefaultStatus("all");
  setDefaultSortBy("newest");
  setFilters({label: 'all', status: 'all', sortBy: 'newest'});
}

  return (
    <div className='mainContentWrapper'>
     <HeaderMenu title={headerTitle} headerItems={headerItems} headerNav={null}/>
     {/* Filters */}
     <div className={gr.selectWrapper}>
      <div className={gr.sortBy}>
        <Select label={t('TYPE')} options={optionsLabel} name="label" value={filters.label} onChange={handleFilterChange} doHighLight={filters.label !== defaultFilterValues.categories && true} />
        <Select label={t('STATUS_LBL')} options={optionsStatus} name="status"  value={filters.status} onChange={handleFilterChange} doHighLight={filters.status !== defaultFilterValues.categories && true} />
        <Select label={t('SORT_BY')} options={optionsSortBy} name="sortBy" value={filters.sortBy} onChange={handleFilterChange}  doHighLight={filters.sortBy !== defaultFilterValues.sortBy && true}/>
      </div>
      <div className={gr.myGroceriesLabelWrapper}>
      <button className={gr.resetFiltersBtn} onClick={resetFilters}>{t("RESET_FILTERS")}</button>
      <h1 className={gr.myGroceriesLabel}>{t('MY_GROCERIES')}</h1>
      </div>
    </div>
     {/* Grocery Cards */}
     <div className={gr.list}>
      {
        isLoading && 
            <img className={gr.loadingAnimation} alt="loading" src={animLoading} />
      }
      { !isLoading && <>
       {(view.length ? view : []).map((grocery) => (
       <GroceryCard key={grocery.id} data={grocery} onClick={(e)=>openGrocery(e)} onDelete={loadGroceries} />
       ))}
       {view.length === 0 && groceries.length > 0 && <div className={gr.empty}>{t('WARNINGS.NO_GROCERIES')}</div>}
       </>
      }
     </div>
     {/* New Grocery Popup */}
     { isAddNewGroceryVisible &&
       <Popup title={t('ADD_NEW_GROCERY')} close={toggleNewGrocery}>
         <form className={gr.form} onSubmit={(e)=>e.preventDefault()}>
           <label htmlFor="groceryName" >{t('NAME')} :</label>
           <input id="groceryName" ref={nameRef} className='input'></input>
           <label htmlFor='groceryDate'>{t('DATE')} :</label>
           <div className={gr.dateWrapper}>
           <input id="groceryDate" disabled={isDateDisabled === true} className={`${gr.dateInput} input`} type='date' onKeyDown={(e) => e.preventDefault()} onClick={(e) => e.target.showPicker && e.target.showPicker()} ref={dateRef}></input>
           <div className={gr.addDateCheckboxWrapper}>
           <label>{t('NO_DATE')} :</label>
           <input className={gr.addDateCheckbox} type='checkbox' checked={isDateDisabled} onChange={()=>setIsDateDisabled(!isDateDisabled)}></input>
           </div>
           </div>
           <label for="userList">{t('ADD_USERS')}</label>
           <div className={gr.userListWrapper}>
             <input id="userList" ref={usersRef} className={`input ${gr.userList}`} placeholder='user1234@mail.com'></input> 
             <button type="button" onClick={addUser} className={gr.addUserButton}>+</button>
           </div>
           {usersEmailList.length > 0  && <><span className={gr.addedUsersTitle}>{t('ADDED_USERS')}</span><span className={gr.formMessage}>{usersEmailList.map(e => e).join(", ")}</span></>}
           <button type="button" onClick={(e)=>{ e.preventDefault();saveNewGrocery(e)}} className={gr.saveButton}>{t('SAVE')}</button>
         </form>  
       </Popup>
     }
    {/* Add Grocery Button */}
     <img alt='Add' src={add} className={gr.addGrocery}onClick={toggleNewGrocery} />
    </div> 
  )
}
