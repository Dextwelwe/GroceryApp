import {useEffect, useState, useMemo, useRef, memo } from 'react'
import gr from './grocery.module.css'
import '../../groceryCommon.css'

import HeaderMenu from '../../components/header/header';
import add from '../../assets/images/icons/add.svg'
import check from '../../assets/images/icons/check.svg'
import noteIcon from '../../assets/images/icons/name.svg'

import iconBack from '../../assets/images/icons/back.svg'
import iconMore from '../../assets/images/icons/more.svg'
import {useTranslation} from 'react-i18next';
import { getGroceryById, removeOneCustomStore, updateGroceryStatus, clearItemsList, updateCustomStores, subscribeGroceryItems } from '../../api/grocery';
import { addItems, removeItem , setItemStatus} from '../../api/items';
import { fetchUserRecipes } from '../../api/recipes';
import ItemCard from '../../components/ItemCard/ItemCard';
import Select from '../../components/select/Select';
import GroceryObj from '../../models/Grocery';
import useLocalStorage from '../../hooks/useLocalStorage';
import Popup from '../../components/popup/Popup'
import AddItems from '../../components/add/addItems';
import { useAuth } from '../../providers/AuthProvider';
import Category from '../../components/categories/category';
import SettingsMenu from '../../components/settings/settingsMenu';
import Collapsible from '../../components/collapsible/collapsible';
import filterIcon from '../../assets/images/icons/filter.svg'
import listIcon from '../../assets/images/icons/listItems.svg'
import iconLanguage from '../../assets/images/icons/lang.svg'
import iconErase from '../../assets/images/icons/erase.svg'
import completeGroceryIcon from '../../assets/images/icons/completeGroceryIcon.svg'
import PreviewItemCard from '../../components/previewItemCard/PreviewItemCard';
import rc from '../../components/recipeCard/recipeCard.module.css';
import { useCategorySearch } from '../../hooks/useCategorySearch';



function Grocery({goBack, groceryId}) {
  const { t, i18n } = useTranslation();
  const {userData} = useAuth();
  const [grocery, setGrocery] = useState(null);
  const [defaultCategory,setDefaultCategory] = useLocalStorage('gLabel','all');
  const [defaultStore, setDefaulStore] = useLocalStorage('gStore', 'all');
  const [defaultStatus,setDefaultStatus] = useLocalStorage('gStatus','all');
  const [defaultSortBy,setDefaultSortBy] = useLocalStorage('gSortBy','az');
  const defaultFilterValues = { categories : 'all', sortBy : "az"}
  const [isAddItemsPopup, setIsAddItemsPopup] = useState(false);
  const [isSettingsPopup, setIsSettingsPopup] = useState(false);
  const [isPreviewListPopup, setIsPreviewListPopup] = useState(false);
  const [isAddRecipePopup, setIsAddRecipePopup] = useState(false);
  const [userRecipes, setUserRecipes] = useState([]);
  const [selectedRecipeIds, setSelectedRecipeIds] = useState(new Set());
  const [storesOptionsList, setStoresOptionsList] = useState([])
  const [filters, setFilters] = useState({category: defaultCategory,store: defaultStore,status: defaultStatus, sortBy: defaultSortBy});
  const [nbFilters, setNbFilters] = useState(0);
  const optionsStatus = [ { value: "all", label: t('ALL') },{ value: "active", label: t('STATUS.ACTIVE') },{ value: "completed", label: t('STATUS.COMPLETED')}];
  const optionsSortBy = [ { value: "az", label: t("FILTERS.A-Z") }, { value: "za", label: t("FILTERS.Z-A") }];
  const itemActions = { remove : removeItemCall, changeStatus : changeItemStatus};
  const [itemsList, setItemsList] = useState([])
  const [previewItemsList, setPreviewItemsList] = useState([]);
  let categoryRef = useRef(null);
  let storeRef = useRef(null);
  let recipeStoreRef = useRef(null);
  let settingsPopupRef = useRef(null);
  const { getBestMatch, getAllCategoriesList } = useCategorySearch();
  
  const norm = s => (s ?? "").toString().trim().toLowerCase();
  
 useEffect(() => {
  (async () => {
    await getFullGrocery();
    if (userData) {
      const res = await fetchUserRecipes(userData.uid);
      if (res.success) setUserRecipes(res.data);
    }
  })();

  const unsub = subscribeGroceryItems(
    groceryId,
    (items) => {
      setGrocery((prev) =>
        prev
          ? new GroceryObj(prev.getId(), { ...prev, items })
          : new GroceryObj(groceryId, { items })
      );
    },
    (err) => console.error("Subscription error:", err)
  );
  return () => unsub(); 
  // eslint-disable-next-line
}, [groceryId]);

  useEffect(() => {
 setNumberOfFilters();
 // eslint-disable-next-line
}, [filters]);

  useEffect(() => {
  if (!isSettingsPopup) return;

  const handleClickOutside = (event) => {
    if (settingsPopupRef.current && !settingsPopupRef.current.contains(event.target)) {
      setIsSettingsPopup(false);
    }
  };

  document.addEventListener('mousedown', handleClickOutside);
  return () => document.removeEventListener('mousedown', handleClickOutside);
}, [isSettingsPopup]);

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
    const an = norm(a.name);
    const bn = norm(b.name);

    if (a.status === "completed" && b.status !== "completed") return 1;
    if (a.status !== "completed" && b.status === "completed") return -1;

    switch (filters.sortBy) {
      case "az": return an.localeCompare(bn);
      case "za": return bn.localeCompare(an);
      default:   return 0;
    }
});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grocery, filters, grocery?.items]);

  async function getFullGrocery() {
    let g = await getGroceryById(groceryId);
    if (!g) return;
      setGrocery(g);
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
    if ((result.error.code === "permission-denied")) {
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
    setDefaultSortBy("az");
    setFilters({category: 'all', store: 'all', status : "all", sortBy: 'az'});
 }

 function setNumberOfFilters(){
  let count = 0;
  if (filters.category !== defaultFilterValues.categories) count++;
  if (filters.sortBy !== defaultFilterValues.sortBy) count++;
  if (filters.store !== defaultFilterValues.categories) count++;
  if (filters.status !== 'all') count++;
  setNbFilters(count);
}

   function loadPreviewList(e){
   let isValid = true;
   let errorMessage = '';
    e.preventDefault();

    if (itemsList.length === 0){
      isValid = false;
      errorMessage = t('WARNINGS.NO_ITEMS_TO_ADD');
    }

    if (itemsList.length > 50){
      isValid = false;
      errorMessage = t('WARNINGS.TOO_MANY_ITEMS');
    }
   
      if (!validateInput(storeRef.current.value)){
          storeRef.current.style.backgroundColor = '#ffcdd2';
          isValid = false;
      }
      
if (isValid) {
  let previewItemsArray = itemsList.map(item => {
    const matchedCategory = getBestMatch(item);

    return {
      name: item,
      category: matchedCategory || "",
      store: storeRef.current.value,
      status: "active",
      addedBy: userData.firstName
    };
  });

  setPreviewItemsList(previewItemsArray);
  setIsPreviewListPopup(true);
} else {
      alert(errorMessage);
    }
 }

 async function saveItems(){
      const result = await addItems(
        previewItemsList.map((item) => ({
          ...item,
          category: resolveCategoryId(item.category)
        })),
        grocery.getId()
      );
      if (result.success){
        await getFullGrocery();
        if (categoryRef.current) categoryRef.current.value = '';
        if (storeRef.current) storeRef.current.value = '';
      } else {
        if ((result.error.code === "permission-denied")) {
          alert(t('WARNINGS.NOT_PERMITTED_FOR_GUESTS'))
        } else {
          alert(t('WARNINGS.SERVER_ERROR'));
        } 
      }
      setIsAddItemsPopup(false);
      setItemsList([]);
      setPreviewItemsList([]);
      setIsPreviewListPopup(false);
 }

function getStoresList(grocery){
 let list =  [...grocery.getCustomStores()];
 if (list){list.sort((a,b) => a.desc.localeCompare(b.desc))};
 return list;
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

 const clearList = async() => {
  let doClear = window.confirm(t('WARNINGS.CLEAR_LIST_WARN'));
  if (doClear){
    const groceryId = grocery.getId();
    await clearItemsList(groceryId);
    setIsSettingsPopup(false);
  }
 }

 const completeGrocery = async() => {
  let doComplete = window.confirm(t('WARNINGS.COMPLETE_GROCERY_WARN'));
  if (doComplete){
    const groceryId = grocery.getId();
    let res = await updateGroceryStatus(userData.uid, groceryId, "completed");
    if (res.success === true){
      goBack(true);
    }
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

function resolveCategoryId(categoryValue){
  const raw = (categoryValue || '').toString().trim();
  if (!raw) return '';

  const allCategories = getAllCategoriesList();
  const match = allCategories.find((cat) => {
    if (cat.id === raw) return true;
    const names = Object.values(cat.names || {}).map((name) => (name || '').toString().trim().toLowerCase());
    return names.includes(raw);
  });

  return match ? match.id : raw;
}

function removePreviewItem(itemName){
  setPreviewItemsList(prev => prev.filter(item => item.name !== itemName));
}

function toggleRecipeSelection(recipeId) {
  setSelectedRecipeIds(prev => {
    const next = new Set(prev);
    if (next.has(recipeId)) next.delete(recipeId);
    else next.add(recipeId);
    return next;
  });
}

async function addRecipeItems() {
  if (selectedRecipeIds.size === 0) return;
  const existingNames = new Set((grocery?.items ?? []).map(i => norm(i.name)));
  const itemsToAdd = [];
  const seen = new Set();

  for (const recipeId of selectedRecipeIds) {
    const recipe = userRecipes.find(r => r.id === recipeId);
    if (!recipe) continue;
    for (const item of (recipe.items || [])) {
      const key = norm(item.name);
      if (existingNames.has(key) || seen.has(key)) continue;
      seen.add(key);
      itemsToAdd.push({
        name: item.name,
        category: resolveCategoryId(item.category),
        store: recipeStoreRef.current?.value || '',
        status: 'active',
        addedBy: userData.firstName
      });
    }
  }

  if (itemsToAdd.length === 0) {
    setIsAddRecipePopup(false);
    setSelectedRecipeIds(new Set());
    return;
  }

  const result = await addItems(itemsToAdd, grocery.getId());
  if (result.success) {
    await getFullGrocery();
  } else {
    if (result.error?.code === 'permission-denied') {
      alert(t('WARNINGS.NOT_PERMITTED_FOR_GUESTS'));
    } else {
      alert(t('WARNINGS.SERVER_ERROR'));
    }
  }
  setIsAddRecipePopup(false);
  setSelectedRecipeIds(new Set());
}

function editPreviewItemCategory(itemName, newCategoryId){
  setPreviewItemsList(prev => prev.map(item => {
    if (item.name === itemName){
      return {
        ...item,
        category: newCategoryId || item.category
      };
    }
    return item;
  }));
}

 const changeLanguage = (e) => i18n.changeLanguage(e.target.value);
 
 if (!grocery) return null; 

  const headerGroceryTitle = grocery.getTitle();
  const headerGroceryNav = [{src : iconBack , alt : "Back", clickaction : goBack}]
  const headerItems = [{src : iconMore, alt : "Options", clickaction : ()=> setIsSettingsPopup(!isSettingsPopup), buttonLabel :t('OPTIONS')} ]

  return (
    <div className='mainContentWrapper'>
        <HeaderMenu title={headerGroceryTitle} headerNav={headerGroceryNav} headerItems={headerItems} />
        <div className="subHeaderWrapper">
          <Collapsible title={`${t('FILTERS_LABEL')}${nbFilters > 0 ? ` (${nbFilters})` : ""}`} icon={filterIcon}>
         <div className="filtersWrapper">
               <Select label={t('FILTERS.CATEGORY')} options={optionsCategories} name="category" value={filters.category} onChange={handleFilterChange} doHighLight={filters.category !== defaultFilterValues.categories && true} />
               <Select label={t('STORE')} options={optionsStore} name="store"  value={filters.store} onChange={handleFilterChange} doHighLight={filters.store !== defaultFilterValues.categories && true} />
               <Select label={t('STATUS_LBL')} options={optionsStatus} name="status" value={filters.status} onChange={handleFilterChange} doHighLight={filters.status !== defaultFilterValues.categories && true}/>
               <Select label={t("SORT_BY")} options={optionsSortBy} name="sortBy" value={filters.sortBy} onChange={handleFilterChange} doHighLight={filters.sortBy !== defaultFilterValues.sortBy && true}/>
             </div>
              <button className={`actionButton resetFilterBgColor resetFiltersButton`} onClick={resetFilters}>{t('RESET_FILTERS')}</button>
             </Collapsible>
              <div className='MenuTitle'>
                <div className={gr.listTitleWrapper}>
                  <div className={gr.listTitle}>
                  <img src={listIcon} alt="list icon" className={gr.listIcon}/>
                  <h1 className="contentListLabel">{t('GROCERY_ITEMS')}</h1>
                  </div>
                <button className={gr.addRecipeButton} onClick={() => { setSelectedRecipeIds(new Set()); setIsAddRecipePopup(true); }}>{t("ADD_RECIPE")}</button>
                </div>
                <div className={gr.completedInfoWrapper}>
                  <p className='completedInfo'>{t('STATUS.COMPLETED')} : {grocery?.getCompletedItemsCount()}/{grocery?.items.length}</p>
                </div>
                  {<p className={gr.lastUpdated}>{t('LAST_UPDATED')} : {grocery.getLastUpdated()}</p> }
              </div>
        </div>      
        <div className={gr.list}>
            {(view.length ? view : []).map(item => (
            <ItemCard key={item.id} data={item} actions={itemActions} />
             ))}
            {view.length === 0 && grocery?.items.length > 0 && <div className={gr.empty}>{t('WARNINGS.NO_ITEMS')}</div>}
          </div>

          {isAddRecipePopup &&
            <Popup title={t('ADD_RECIPE')} close={() => { setIsAddRecipePopup(false); setSelectedRecipeIds(new Set()); }}>
              <div className={gr.form}>
                <label>{t('STORE')} :</label>
                <Category list={storesOptionsList} ref={recipeStoreRef} onUpdate={(store) => handleStoreUpdate(store)} onDelete={(store) => handleStoreRemove(store)} />
                <div className={gr.previewList} style={{ marginTop: 14 }}>
                  {userRecipes.length === 0 && <div className={gr.empty}>{t('NO_RECIPES_YET')}</div>}
                  {userRecipes.map((recipe) => {
                    const isSelected = selectedRecipeIds.has(recipe.id);
                    return (
                      <div
                        key={recipe.id}
                        className={`${rc.recipeCardWrapper} ${isSelected ? gr.recipeSelected : ''}`}
                        onClick={() => toggleRecipeSelection(recipe.id)}
                      >
                        <div className={rc.dataWrapper}>
                          <div className={rc.title}>
                            <img src={noteIcon} alt="Recipe" className={rc.titleIcon} />
                            {recipe.name}
                          </div>
                          <div className={rc.countText}>
                            {(recipe.items || []).length} {t('ITEMS')}
                          </div>
                        </div>
                        <button type="button" className={rc.deleteButton} onClick={(e) => { e.stopPropagation(); toggleRecipeSelection(recipe.id); }}>
                          <span className={isSelected ? gr.recipeSelectIconSelected : gr.recipeSelectIcon}>
                            {isSelected ? '' : '+'}
                          </span>
                        </button>
                      </div>
                    );
                  })}
                </div>
                {userRecipes.length > 0 && (
                  <button
                    type="button"
                    className="saveButton"
                    onClick={addRecipeItems}
                    disabled={selectedRecipeIds.size === 0}
                  >
                    {t('CONFIRM')}
                  </button>
                )}
              </div>
            </Popup>
          }

          { isAddItemsPopup && 
            <Popup title={t('ADD_ITEMS')} close={()=>{if (!isPreviewListPopup) setIsAddItemsPopup(false)}}>
            <form className={gr.form}>
              { /* <label htmlFor="itemName">{t('FILTERS.CATEGORY')}  :</label>
              <Category list={categoriesOptionsList} ref={categoryRef}  onUpdate={(cat)=>handleCategoryUpdate(cat)} onDelete={(cat)=>handleCategoryDelete(cat)} setCategory={()=>{return null}}/>
              */ }
              <label htmlFor="itemStore" >{t("STORE")} :</label>
              <Category list={storesOptionsList} ref={storeRef} onUpdate={(store)=>handleStoreUpdate(store)} onDelete={(store)=>handleStoreRemove(store)}/>
              <label htmlFor="items" >{t('ITEMS')} :</label>
              <AddItems id="items" setItemsList={(val)=>setItemsList(val)}/>
              <button type='button' onClick={(e)=>{ e.preventDefault(); loadPreviewList(e)}} className={"saveButton"}>{t('SAVE')}</button>
            </form>  
            </Popup>
          }

        {isPreviewListPopup &&
         <Popup title={t('PREVIEW_LIST')} close={()=>setTimeout(() => setIsPreviewListPopup(false),50)} hideCloseButton={true}>
          <div>
            <div className={gr.previewList}>
              {previewItemsList.map((item,index) => (
                <div key={index} className={gr.previewItem}>
                  <PreviewItemCard
                    data={item}
                    actions={{
                      remove: (itemName) => removePreviewItem(itemName),
                      editCategory: (itemName, newCategoryId) => editPreviewItemCategory(itemName, newCategoryId)
                    }}
                    categoriesList={getAllCategoriesList()}
                  />
                </div>
              ))}
            </div>
            <div style={{display : 'flex', gap : 10}}>
            <button type='button' onClick={(e)=>{ e.preventDefault(); setIsPreviewListPopup(false)}} className={"backButton"}>{t('BACK')}</button>
            <button type='button' onClick={(e)=>{ e.preventDefault(); saveItems(e)}} className={"saveButton"}>{t('CONFIRM')}</button>
            </div>
          </div>
          </Popup>
        }
          
          {
            isSettingsPopup &&
              <SettingsMenu ref={settingsPopupRef} close={()=>setIsSettingsPopup(false)}>
                <div className='SettingItemWrapper settingsBtBorder' onClick={completeGrocery}>
                  <img src={completeGroceryIcon} alt="Erase Icon" className="settingsIcon" />
                  <div className="settingsItem ">{t('COMPLETE_GROCERY')}</div>
                </div>
                <div className='SettingItemWrapper settingsBtBorder' onClick={clearList}>
                  <img src={iconErase} alt="Erase Icon" className="settingsIcon" />
                  <div className="settingsItem" >{t("CLEAR_LIST")} </div>
                </div>
                <div className='settingsLanguageWrapper'>
                  <div className='SettingItemWrapper'>
                    <img src={iconLanguage} alt="Language Icon" className="settingsIcon" />
                    <span className="settingsItem">{t('LANGUAGE')}</span>
                  </div>
                  <select className='settingsSelect' defaultValue={i18n.language} onChange={changeLanguage}>
                    <option value="en">English</option>
                    <option value="fr">Français</option>
                    <option value="ru">Руccкий</option>
                  </select>
                </div>
              </SettingsMenu>
          }
          
          <img alt='Add' src={add} className={gr.addGrocery}onClick={()=>setIsAddItemsPopup(true)} />
        </div>
  )
}

export default memo(Grocery);