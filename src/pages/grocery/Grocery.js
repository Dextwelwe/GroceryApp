import {useEffect, useState, useMemo, useRef } from 'react'
import gr from './grocery.module.css'

import HeaderMenu from '../../components/header/header';
import add from '../../assets/images/icons/addBig.svg'

import iconBack from '../../assets/images/icons/back.svg'
import { getGroceryById } from '../../api/grocery';
import { addItems, removeItem , setItemStatus} from '../../api/items';
import ItemCard from '../../components/ItemCard/ItemCard';
import Select from '../../components/select/Select';
import GroceryObj from '../../models/Grocery';
import useLocalStorage from '../../hooks/useLocalStorage';
import Popup from '../../components/popup/Popup'
import AddItems from '../../components/add/addItems';
import { useAuth } from '../../providers/AuthProvider';

export default function Grocery({goBack, groceryId}) {
  const {userData} = useAuth();
  const [grocery, setGrocery] = useState(null);
  const [defaultCategory,setDefaultCategory] = useLocalStorage('gLabel','all');
  const [defaultStore, setDefaulStore] = useLocalStorage('gStore', 'all');
  const [defaultStatus,setDefaultStatus] = useLocalStorage('gStatus','all');
  const [defaultSortBy,setDefaultSortBy] = useLocalStorage('gSortBy','az');
  const [isAddItemsPopup, setIsAddItemsPopup] = useState(false);
  const [filters, setFilters] = useState({category: defaultCategory,store: defaultStore,status: defaultStatus, sortBy: defaultSortBy,});
  const optionsStatus = [ { value: "all", label: "All" },{ value: "active", label: "active" },{ value: "completed", label: "completed" }];
  const optionsSortBy = [ { value: "az", label: "A-Z" }, { value: "za", label: "Z-A" }];
  const itemActions = { remove : removeItemCall, changeStatus : changeItemStatus};
  const [itemsList, setItemsList] = useState([])
  let categoryRef = useRef(null);
  let storeRef = useRef(null);
  
  const norm = s => (s ?? "").toString().trim().toLowerCase();
  
  useEffect(()=>{
    getFullGrocery();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[groceryId])

  const optionsCategories = useMemo(
    () => (grocery?.getCategories() ?? []),
    [grocery]
  );
  const optionsStore = useMemo(
    () => (grocery?.getStores() ?? []),
    [grocery]
  );

  const view = useMemo(() => {
    const filtered = (grocery?.items ?? []).filter(g => {
      const gCategory = norm(g.category);
      const gStore    = norm(g.store);
      const gStatus   = norm(g.status);

      const passCategory = filters.category === "all" || gCategory === norm(filters.category);
      const passStore    = filters.store    === "all" || gStore    === norm(filters.store);
      const passStatus   = filters.status   === "all" || gStatus   === norm(filters.status);

      return passCategory && passStore && passStatus;
    });

    return [...filtered].sort((a, b) => {
      const an = norm(a.name), bn = norm(b.name);
      switch (filters.sortBy) {
        case "az":     return an.localeCompare(bn);
        case "za":     return bn.localeCompare(an);
        default:       return 0;
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grocery, filters, grocery?.items]);

  async function getFullGrocery() {
    let g = await getGroceryById(groceryId);
    if (!g) return;
      setGrocery(g);
  }

   async function removeItemCall(id) {
   const groceryId = grocery.getId();
   setGrocery(prev => {
     const nextItems = (prev.items ?? []).filter(it => it.id !== id);
     return new GroceryObj(groceryId, { ...prev, items: nextItems});
   });
    await removeItem(groceryId, id).catch(err => {
      console.error("Failed to remove item:", err); 
    });
  }

  async function changeItemStatus(id, status){
    setGrocery(prev => {
    if (!prev) return prev;
    const nextItems = prev.items.map(it =>  it.id === id ? { ...it, status: status} : it);
    return new GroceryObj(prev.getId(), { ...prev, items: nextItems });
  });
   await setItemStatus(grocery.getId(),id, status);
  }

  function handleFilterChange(e) {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    if (name === 'category') setDefaultCategory(value);
    if (name === 'store') setDefaulStore(value);
    if (name === 'status') setDefaultStatus(value);
    if (name === 'sortBy') setDefaultSortBy(value);
  }

  function resetFilters(){
    setDefaultCategory("all");
    setDefaultStatus("all");
    setDefaulStore('all');
    setDefaultSortBy("all");
    setFilters({category: 'all', store: 'all', status : "all", sortBy: 'all'});
 }

 async function saveItems(e){
   let isValid = true;
   let errorMessage = '';
    e.preventDefault();

    if (itemsList.length === 0){
      isValid = false;
      errorMessage = "No items to add";
    }

    if (itemsList.length > 15){
      isValid = false;
      errorMessage = 'Too many items. Max 15';
    }

    let inputsRef = [categoryRef,storeRef];
    inputsRef.forEach(element => {
      if (!validateInput(element.current.value)){
          element.current.style.backgroundColor = '#ffcdd2';
          isValid = false;
      }
    });
    if (isValid){
      let itemsListArr = itemsList.map((item)=>({
        category : categoryRef.current.value,
        name : item,
        store : storeRef.current.value,
        status : 'active',
        addedBy : userData.firstName
      }))
      await addItems(itemsListArr,grocery.getId());
      await getFullGrocery();
      setItemsList([]);
      if (categoryRef.current) categoryRef.current.value = '';
      if (storeRef.current) storeRef.current.value = '';
      setIsAddItemsPopup(false);
    } else {
      alert(errorMessage);
    }
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

 
  if (!grocery) return null; 

  const headerGroceryTitle = grocery.getTitle();
  const headerGroceryNav = [{src : iconBack , alt : "Back", clickaction : goBack}]

  return (
    <div className='mainContentWrapper'>
        <HeaderMenu title={headerGroceryTitle} headerNav={headerGroceryNav} />
        <div className={gr.selectWrapper}>
         <div className={gr.sortBy}>
               <Select label="Category" options={optionsCategories} name="category" value={filters.category} onChange={handleFilterChange} />
               <Select label="Store" options={optionsStore} name="store"  value={filters.store} onChange={handleFilterChange} />
               <Select label="Status" options={optionsStatus} name="status" value={filters.status} onChange={handleFilterChange}/>
               <Select label="Sort By" options={optionsSortBy} name="sortBy" value={filters.sortBy} onChange={handleFilterChange}/>
             </div>
            <button className={gr.resetFiltersBtn} onClick={resetFilters}>Reset Filters</button>
        </div>      
        <div className={gr.list}>
            {(view.length ? view : []).map(item => (
            <ItemCard key={item.id} data={item} actions={itemActions} />
             ))}
          </div>
          {
            isAddItemsPopup && 
            <Popup title="Add Items" close={()=>setIsAddItemsPopup(false)} >
            <form className={gr.form}>
              <label htmlFor="itemName" >Category :</label>
              <input id="itemName" ref={categoryRef} className='input'></input>  
              <label htmlFor="itemStore" >Store :</label>
              <input id="itemStore" ref={storeRef} className='input'></input>  
              <label htmlFor="items" >Items :</label>
              <AddItems id="items" setItemsList={(val)=>setItemsList(val)}/>
              <button type='button' onClick={(e)=>{ e.preventDefault(); saveItems(e)}} className={gr.saveButton}>Save</button>
            </form>  
            </Popup>
          }
          <img alt='Add' src={add} className={gr.addGrocery}onClick={()=>setIsAddItemsPopup(true)} />
        </div>
  )
}
