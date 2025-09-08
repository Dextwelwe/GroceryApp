import {useEffect, useState, useMemo, useRef } from 'react'
import gr from './grocery.module.css'

import HeaderMenu from '../../components/header/header';
import add from '../../assets/images/icons/addBig.svg'

import iconBack from '../../assets/images/icons/back.svg'
import { useTranslation} from 'react-i18next';
import { getGroceryById, removeOneCustomCategories, removeOneCustomStore, updateCustomCategories, updateCustomStores } from '../../api/grocery';
import { addItems, removeItem , setItemStatus} from '../../api/items';
import ItemCard from '../../components/ItemCard/ItemCard';
import Select from '../../components/select/Select';
import GroceryObj from '../../models/Grocery';
import useLocalStorage from '../../hooks/useLocalStorage';
import Popup from '../../components/popup/Popup'
import AddItems from '../../components/add/addItems';
import { useAuth } from '../../providers/AuthProvider';
import Category from '../../components/categories/category';

export default function Grocery({goBack, groceryId}) {
  const { t } = useTranslation();
  const {userData} = useAuth();
  const [grocery, setGrocery] = useState(null);
  const [defaultCategory,setDefaultCategory] = useLocalStorage('gLabel','all');
  const [defaultStore, setDefaulStore] = useLocalStorage('gStore', 'all');
  const [defaultStatus,setDefaultStatus] = useLocalStorage('gStatus','all');
  const [defaultSortBy,setDefaultSortBy] = useLocalStorage('gSortBy','status');
  const [isAddItemsPopup, setIsAddItemsPopup] = useState(false);
  const [categoriesOptionsList, setCategoriesOptionsList] = useState([])
  const [storesOptionsList, setStoresOptionsList] = useState([])
  const [filters, setFilters] = useState({category: defaultCategory,store: defaultStore,status: defaultStatus, sortBy: defaultSortBy,});
  const optionsStatus = [ { value: "all", label: t('ALL') },{ value: "active", label: t('STATUS.ACTIVE') },{ value: "completed", label: t('STATUS.COMPLETED')}];
  const optionsSortBy = [ { value: "az", label: t("FILTERS.A-Z") }, { value: "za", label: t("FILTERS.Z-A") }, {value :'status', label : t("STATUS_LBL")}];
  const itemActions = { remove : removeItemCall, changeStatus : changeItemStatus};
  const [itemsList, setItemsList] = useState([])
  let categoryRef = useRef(null);
  let storeRef = useRef(null);
  
  const norm = s => (s ?? "").toString().trim().toLowerCase();
  
  useEffect(()=>{
    getFullGrocery();
    console.log('get Full Grocery')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[groceryId])

  const optionsCategories = useMemo(
    () => [grocery?.getCategoryOptionAll(), ...(grocery?.getCategoriesFromAddedItems() ?? [])], [grocery]
  );

  const optionsStore = useMemo(
    () => (grocery?.getStores() ?? []), [grocery]
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
        case "status" :       
        if (a.status === "completed" && b.status !== "completed") return 1;
        if (a.status !== "completed" && b.status === "completed") return -1;
        return 0;
        default : return 0;
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grocery, filters, grocery?.items]);

  async function getFullGrocery() {
    let g = await getGroceryById(groceryId);
    if (!g) return;
      setGrocery(g);
      setCategoriesOptionsList(getCategoriesList(g))
      setStoresOptionsList(getStoresList(g))
  }

   async function removeItemCall(id) {
   const groceryId = grocery.getId();
   let result = await removeItem(groceryId, id);
   if (result.success){
     setGrocery(prev => {
       const nextItems = (prev.items ?? []).filter(it => it.id !== id);
       return new GroceryObj(groceryId, { ...prev, items: nextItems});
     });
   } else {
    if ((result.error.code = "permission-denied")) {
        alert(t('WARNINGS.NOT_PERMITTED_FOR_GUESTS'))

      } else {
          alert(t('WARNINGS.SERVER_ERROR'));

      }
    }
  }

  async function changeItemStatus(id, status){
    let result = await setItemStatus(grocery.getId(),id, status);
    if (result.success){
    setGrocery(prev => {
      if (!prev) return prev;
      const nextItems = prev.items.map(it =>  it.id === id ? { ...it, status: status} : it);
      return new GroceryObj(prev.getId(), { ...prev, items: nextItems });
    });
  }
    else {
      if ((result.err.code = "permission-denied")) {
        alert(t('WARNINGS.NOT_PERMITTED_FOR_GUESTS'))

      } else {
        alert(t('WARNINGS.SERVER_ERROR'));

      }
    }
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
      errorMessage = t('WARNINGS.NO_ITEMS_TO_ADD');
    }

    if (itemsList.length > 15){
      isValid = false;
      errorMessage = t('WARNINGS.TOO_MANY_ITEMS');
    }

    let inputsRef = [categoryRef,storeRef];
    inputsRef.forEach(element => {
      if (!validateInput(element.current.value)){
          element.current.style.backgroundColor = '#ffcdd2';
          isValid = false;
      }
    })
    if (isValid){
      let itemsListArr = itemsList.map((item)=>({
        category : categoryRef.current.value,
        name : item,
        store : storeRef.current.value,
        status : 'active',
        addedBy : userData.firstName
      }))
      let result = await addItems(itemsListArr,grocery.getId());
      if (result.success){
        await getFullGrocery();
        if (categoryRef.current) categoryRef.current.value = '';
        if (storeRef.current) storeRef.current.value = '';
      } else {
         if ((result.error.code = "permission-denied")) {
        alert(t('WARNINGS.NOT_PERMITTED_FOR_GUESTS'))
          } else {
        alert(t('WARNINGS.SERVER_ERROR'));
      } 
      }
      setIsAddItemsPopup(false);
      setItemsList([]);
    } else {
      alert(errorMessage);
    }
 }



function getCategoriesList(grocery){
 let list =  [...grocery.getCustomCategories()];
 if (list.length > 0){list.sort((a,b) => a.desc.localeCompare(b.desc))};
 return list;
}

function getStoresList(grocery){
 let list =  [...grocery.getCustomStores()];
 if (list){list.sort((a,b) => a.desc.localeCompare(b.desc))};
 return list;
}

async function handleCategoryUpdate(list){
  const groceryId = grocery.getId();
  let res = await updateCustomCategories(groceryId,list);
  setCategoriesOptionsList(list.map(e=>{return {desc : e, type : 'custom'}}));
  return res;
}

async function handleCategoryDelete(category){
  const groceryId = grocery.getId();
  let res = await removeOneCustomCategories(groceryId,category);
  setCategoriesOptionsList(categoriesOptionsList.filter(item => item.desc !== category))
  return res;
}

async function handleStoreUpdate(list){
    const groceryId = grocery.getId();
    let res = await updateCustomStores(groceryId,list);
    setStoresOptionsList(list.map(e=>{return {desc : e, type : 'custom'}}));
    return res;
}

async function handleStoreRemove(store) {
  const groceryId = grocery.getId();
  let res = await removeOneCustomStore(groceryId,store);
  setStoresOptionsList(storesOptionsList.filter(item => item.desc !== store))
  return res;
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
               <Select label={t('FILTERS.CATEGORY')} options={optionsCategories} name="category" value={filters.category} onChange={handleFilterChange} />
               <Select label={t('STORE')} options={optionsStore} name="store"  value={filters.store} onChange={handleFilterChange} />
               <Select label={t('STATUS_LBL')} options={optionsStatus} name="status" value={filters.status} onChange={handleFilterChange}/>
               <Select label={t("SORT_BY")} options={optionsSortBy} name="sortBy" value={filters.sortBy} onChange={handleFilterChange}/>
             </div>
             <div className={gr.myGroceriesLabelWrapper}>
              <button className={gr.resetFiltersBtn} onClick={resetFilters}>{t('RESET_FILTERS')}</button>
            </div>
              <h1 className={gr.myGroceriesLabel}>{t('GROCERY_ITEMS')}</h1>
        </div>      
        <div className={gr.list}>
            {(view.length ? view : []).map(item => (
            <ItemCard key={item.id} data={item} actions={itemActions} />
             ))}
          </div>
          {
            isAddItemsPopup && 
            <Popup title={t('ADD_ITEMS')} close={()=>setIsAddItemsPopup(false)} >
            <form className={gr.form}>
              <label htmlFor="itemName" >{t('FILTERS.CATEGORY')}  :</label>
              <Category list={categoriesOptionsList} ref={categoryRef}  onUpdate={(cat)=>handleCategoryUpdate(cat)} onDelete={(cat)=>handleCategoryDelete(cat)} setCategory={()=>{return null}}/>
              <label htmlFor="itemStore" >{t("STORE")} :</label>
              <Category list={storesOptionsList} ref={storeRef} onUpdate={(store)=>handleStoreUpdate(store)} onDelete={(store)=>handleStoreRemove(store)} setCategory={()=>{return null}}/>
              <label htmlFor="items" >{t('ITEMS')} :</label>
              <AddItems id="items" setItemsList={(val)=>setItemsList(val)}/>
              <button type='button' onClick={(e)=>{ e.preventDefault(); saveItems(e)}} className={gr.saveButton}>{t('SAVE')}</button>
            </form>  
            </Popup>
          }
          <img alt='Add' src={add} className={gr.addGrocery}onClick={()=>setIsAddItemsPopup(true)} />
        </div>
  )
}
