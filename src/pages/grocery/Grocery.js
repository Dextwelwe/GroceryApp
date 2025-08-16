import {useEffect, useState, useMemo } from 'react'
import gr from './grocery.module.css'

import HeaderMenu from '../../components/header/header';
import add from '../../assets/images/icons/addBig.svg'

import iconBack from '../../assets/images/icons/back.svg'
import { getGroceryById } from '../../api/grocery';
import { removeItem , setItemStatus} from '../../api/items';
import ItemCard from '../../components/ItemCard/ItemCard';
import Select from '../../components/select/Select';
import GroceryObj from '../../models/Grocery';
import useLocalStorage from '../../hooks/useLocalStorage';

export default function Grocery({goBack, groceryId}) {
  const [grocery, setGrocery] = useState(null);
  const [defaultCategory,setDefaultCategory] = useLocalStorage('gLabel','all');
  const [defaultStore, setDefaulStore] = useLocalStorage('gStore', 'all');
  const [defaultStatus,setDefaultStatus] = useLocalStorage('gStatus','all');
  const [defaultSortBy,setDefaultSortBy] = useLocalStorage('gSortBy','az');
  const [filters, setFilters] = useState({category: defaultCategory,store: defaultStore,status: defaultStatus, sortBy: defaultSortBy,});
  const optionsStatus = [ { value: "all", label: "All" },{ value: "active", label: "active" },{ value: "completed", label: "completed" }];
  const optionsSortBy = [ { value: "az", label: "A-Z" }, { value: "za", label: "Z-A" }];
  const itemActions = { remove : removeItemCall, changeStatus : changeItemStatus};
  
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

  if (!grocery) return null; 

  const headerGroceryTitle = grocery.getTitle();
  const headerGroceryNav = [{src : iconBack , alt : "Back", clickaction : goBack}]

  return (
    <div className='mainContentWrapper'>
        <HeaderMenu title={headerGroceryTitle} headerNav={headerGroceryNav} />
         <div className={gr.sortBy}>
               <Select label="Category" options={optionsCategories} name="category" value={filters.category} onChange={handleFilterChange} />
               <Select label="Store" options={optionsStore} name="store"  value={filters.store} onChange={handleFilterChange} />
               <Select label="Status" options={optionsStatus} name="status" value={filters.status} onChange={handleFilterChange}/>
               <Select label="Sort By" options={optionsSortBy} name="sortBy" value={filters.sortBy} onChange={handleFilterChange}/>
                <button className={gr.resetFiltersBtn} onClick={resetFilters}>Reset Filters</button>
             </div>
        <div className={gr.list}>
            {(view.length ? view : []).map(item => (
            <ItemCard key={item.id} data={item} actions={itemActions} />
             ))}
          </div>
          <img alt='Add' src={add} className={gr.addGrocery}onClick={"toggleNewGrocery"} />
        </div>
  )
}
