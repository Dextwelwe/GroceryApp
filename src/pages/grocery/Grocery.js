import {useEffect, useState, useMemo, useRef, useCallback, memo } from 'react'
import gr from './grocery.module.css'
import '../../groceryCommon.css'
import { norm, resolveCategoryId } from '../../utils/itemUtils';

import HeaderMenu from '../../components/header/header';
import add from '../../assets/images/icons/add.svg'
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
import SettingsLanguageSelect from '../../components/settings/SettingsLanguageSelect';
import FilterPanel from '../../components/filterPanel/FilterPanel';
import filterIcon from '../../assets/images/icons/filter.svg'
import listIcon from '../../assets/images/icons/listItems.svg'
import iconErase from '../../assets/images/icons/erase.svg'
import completeGroceryIcon from '../../assets/images/icons/completeGroceryIcon.svg'
import rc from '../../components/recipeCard/recipeCard.module.css';
import { useCategorySearch } from '../../hooks/useCategorySearch';

const defaultFilterValues = { categories: 'all', sortBy: 'az' };

function Grocery({goBack, groceryId}) {
  const { t } = useTranslation();
  const {userData} = useAuth();
  const [grocery, setGrocery] = useState(null);
  const [defaultCategory,setDefaultCategory] = useLocalStorage('gLabel','all');
  const [defaultStore, setDefaulStore] = useLocalStorage('gStore', 'all');
  const [defaultStatus,setDefaultStatus] = useLocalStorage('gStatus','all');
  const [defaultSortBy,setDefaultSortBy] = useLocalStorage('gSortBy','az');
  const [defaultRecipe,setDefaultRecipe] = useLocalStorage('gRecipe','all');
  const [isAddItemsPopup, setIsAddItemsPopup] = useState(false);
  const [isSettingsPopup, setIsSettingsPopup] = useState(false);
  const [isAddRecipePopup, setIsAddRecipePopup] = useState(false);
  const [userRecipes, setUserRecipes] = useState([]);
  const [selectedRecipeIds, setSelectedRecipeIds] = useState(new Set());
  const [storesOptionsList, setStoresOptionsList] = useState([])
  const [filters, setFilters] = useState({category: defaultCategory,store: defaultStore,status: defaultStatus, sortBy: defaultSortBy, recipe: defaultRecipe});
  const [nbFilters, setNbFilters] = useState(0);
  const optionsStatus = [ { value: "all", label: t('ALL') },{ value: "active", label: t('STATUS.ACTIVE') },{ value: "completed", label: t('STATUS.COMPLETED')}];
  const optionsSortBy = [ { value: "az", label: t("FILTERS.A-Z") }, { value: "za", label: t("FILTERS.Z-A") }];
  let recipeStoreRef = useRef(null);
  let settingsPopupRef = useRef(null);
  const { getAllCategoriesList } = useCategorySearch();
  

  async function loadUserRecipes() {
    if (!userData) return;
    const res = await fetchUserRecipes(userData.uid);
    if (res.success) setUserRecipes(res.data);
  }
  
 useEffect(() => {
  (async () => {
    await getFullGrocery();
    await loadUserRecipes();
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
    if (!isAddRecipePopup || !userData) return;
    loadUserRecipes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAddRecipePopup, userData]);

  useEffect(() => {
    let count = 0;
    if (filters.category !== defaultFilterValues.categories) count++;
    if (filters.sortBy !== defaultFilterValues.sortBy) count++;
    if (filters.store !== defaultFilterValues.categories) count++;
    if (filters.status !== 'all') count++;
    if (filters.recipe !== 'all') count++;
    setNbFilters(count);
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

  const optionsRecipe = useMemo(
    () => (grocery?.getRecipes() ?? []), [grocery]
  );

  const view = useMemo(() => {
    const filtered = (grocery?.items ?? []).filter(g => {
      const gCategory = norm(g.category);
      const gStore    = norm(g.store);
      const gStatus   = norm(g.status);
      const gRecipe   = norm(g.recipe);

      const passCategory = filters.category === "all" || gCategory === norm(filters.category);
      const passStore    = filters.store    === "all" || gStore    === norm(filters.store);
      const passStatus   = filters.status   === "all" || gStatus   === norm(filters.status);
      const passRecipe   = filters.recipe   === "all" || gRecipe   === norm(filters.recipe);

      return passCategory && passStore && passStatus && passRecipe;
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
    const storeList = [...g.getCustomStores()];
    storeList.sort((a, b) => a.desc.localeCompare(b.desc));
    setStoresOptionsList(storeList);
  }

  const removeItemCall = useCallback(async (id) => {
    const groceryId = grocery.getId();
    let result = await removeItem(groceryId, id);
    if (result.success){
      setGrocery(prev => {
        const nextItems = (prev.items ?? []).filter(it => it.id !== id);
        return new GroceryObj(groceryId, { ...prev, items: nextItems});
      });
    } else {
      if ((result.error?.code === "permission-denied")) {
          alert(t('WARNINGS.NOT_PERMITTED_FOR_GUESTS'))

        } else {
            alert(t('WARNINGS.SERVER_ERROR'));

        }
      }
  }, [grocery, t]);

  const changeItemStatus = useCallback(async (id, status) => {
    let result = await setItemStatus(grocery.getId(),id, status);
    if (result.success){
      setGrocery(prev => {
        if (!prev) return prev;
        const nextItems = prev.items.map(it =>  it.id === id ? { ...it, status: status} : it);
        return new GroceryObj(prev.getId(), { ...prev, items: nextItems });
      });
    }
    else {
      if (result.error?.code === 'permission-denied') {
        alert(t('WARNINGS.NOT_PERMITTED_FOR_GUESTS'))  

      } else {
        alert(t('WARNINGS.SERVER_ERROR'));

      }
    }
  }, [grocery, t]);

  const itemActions = useMemo(() => ({ remove : removeItemCall, changeStatus : changeItemStatus}), [removeItemCall, changeItemStatus]);

  function handleFilterChange(e) {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    if (name === 'category') setDefaultCategory(value);
    if (name === 'store') setDefaulStore(value);
    if (name === 'status') setDefaultStatus(value);
    if (name === 'sortBy') setDefaultSortBy(value);
    if (name === 'recipe') setDefaultRecipe(value);
  }

  function resetFilters(){
    setDefaultCategory("all");
    setDefaultStatus("all");
    setDefaulStore('all');
    setDefaultSortBy("az");
    setDefaultRecipe("all");
    setFilters({category: 'all', store: 'all', status : "all", sortBy: 'az', recipe: 'all'});
 }

 async function saveItems(itemsToSave){
      const result = await addItems(
        itemsToSave.map((item) => ({
          ...item,
          category: resolveCategoryId(item.category, getAllCategoriesList)
        })),
        grocery.getId()
      );
      if (result.success){
        await getFullGrocery();
      } else {
        if ((result.error?.code === "permission-denied")) {
          alert(t('WARNINGS.NOT_PERMITTED_FOR_GUESTS'))
        } else {
          alert(t('WARNINGS.SERVER_ERROR'));
        } 
      }
      setIsAddItemsPopup(false);
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

 const restartGrocery = async() => {
  let doRestart = window.confirm(t('WARNINGS.RESTART_GROCERY_WARN'));
  if (doRestart){
    const groceryId = grocery.getId();
    let res = await updateGroceryStatus(userData.uid, groceryId, "active");
    if (res.success === true){
      setGrocery(prev => {
        const updated = Object.assign(Object.create(Object.getPrototypeOf(prev)), prev);
        updated.status = "active";
        return updated;
      });
      setIsSettingsPopup(false);
    }
  }
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
        category: resolveCategoryId(item.category, getAllCategoriesList),
        store: recipeStoreRef.current?.value || '',
        status: 'active',
        addedBy: userData.firstName,
        recipe: recipe.name
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

 if (!grocery) return null; 

  const headerGroceryTitle = grocery.getTitle();
  const headerGroceryNav = [{src : iconBack , alt : "Back", clickaction : goBack}]
  const headerItems = [{src : iconMore, alt : "Options", clickaction : ()=> setIsSettingsPopup(!isSettingsPopup), buttonLabel :t('OPTIONS')} ]
  const addedRecipeNames = new Set((grocery?.items ?? []).map(i => norm(i.recipe)).filter(Boolean));

  return (
    <div className='mainContentWrapper'>
        <HeaderMenu title={headerGroceryTitle} headerNav={headerGroceryNav} headerItems={headerItems} />
        <div className="subHeaderWrapper">
          
          <FilterPanel title={`${t('FILTERS_LABEL')}${nbFilters > 0 ? ` (${nbFilters})` : ""}`} icon={filterIcon} onReset={resetFilters} resetLabel={t('RESET_FILTERS')}>
            <Select label={t('FILTERS.CATEGORY')} options={optionsCategories} name="category" value={filters.category} onChange={handleFilterChange} doHighLight={filters.category !== defaultFilterValues.categories && true} />
            <Select label={t('STORE')} options={optionsStore} name="store"  value={filters.store} onChange={handleFilterChange} doHighLight={filters.store !== defaultFilterValues.categories && true} />
            <Select label={t('RECIPE')} options={optionsRecipe} name="recipe" value={filters.recipe} onChange={handleFilterChange} doHighLight={filters.recipe !== 'all' && true} />
            <Select label={t('STATUS_LBL')} options={optionsStatus} name="status" value={filters.status} onChange={handleFilterChange} doHighLight={filters.status !== defaultFilterValues.categories && true}/>
            <Select label={t("SORT_BY")} options={optionsSortBy} name="sortBy" value={filters.sortBy} onChange={handleFilterChange} doHighLight={filters.sortBy !== defaultFilterValues.sortBy && true}/>
          </FilterPanel>

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
          {view.map(item => (
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
                    const isAlreadyAdded = addedRecipeNames.has(norm(recipe.name));
                    return (
                      <div
                        key={recipe.id}
                        className={`${rc.recipeCardWrapper} ${isSelected ? gr.recipeSelected : ''} ${isAlreadyAdded ? gr.recipeDisabled : ''}`}
                        onClick={() => !isAlreadyAdded && toggleRecipeSelection(recipe.id)}
                        style={isAlreadyAdded ? { opacity: 0.55, cursor: 'default' } : {}}
                      >
                        <div className={rc.dataWrapper}>
                          <div className={rc.title}>
                            <img src={noteIcon} alt="Recipe" className={rc.titleIcon} />
                            {recipe.name}
                          </div>
                          <div className={rc.countText}>
                            {isAlreadyAdded ? t('RECIPE_ALREADY_ADDED') : `${(recipe.items || []).length} ${t('ITEMS')}`}
                          </div>
                        </div>
                        <button type="button" className={rc.deleteButton} onClick={(e) => { e.stopPropagation(); if (!isAlreadyAdded) toggleRecipeSelection(recipe.id); }} disabled={isAlreadyAdded}>
                          <span className={isSelected ? gr.recipeSelectIconSelected : gr.recipeSelectIcon}>
                            {isAlreadyAdded ? '' : isSelected ? '' : '+'}
                          </span>
                        </button>
                      </div>
                    );
                  })}
                </div>
                {userRecipes.length > 0 && (
                  <button type="button" className="saveButton"  onClick={addRecipeItems} disabled={selectedRecipeIds.size === 0} > {t('CONFIRM')} </button>
                )}
              </div>
            </Popup>
          }

          { isAddItemsPopup && 
            <Popup title={t('ADD_ITEMS')} close={()=> setIsAddItemsPopup(false)} closeOnOutsideClick={false}>
              <div className={gr.form}>
                <AddItems onSave={saveItems} storesList={storesOptionsList} onStoreAdd={(store)=>handleStoreUpdate(store)} userName={userData.firstName} />
              </div>
            </Popup>
          }
          
          {
            isSettingsPopup &&
              <SettingsMenu ref={settingsPopupRef} close={()=>setIsSettingsPopup(false)}>
                <div className='SettingItemWrapper settingsBtBorder' onClick={grocery?.status === 'completed' ? restartGrocery : completeGrocery}>
                  <img src={completeGroceryIcon} alt="Complete Icon" className="settingsIcon" />
                  <div className="settingsItem ">{grocery?.status === 'completed' ? t('RESTART_GROCERY') : t('COMPLETE_GROCERY')}</div>
                </div>
                <div className='SettingItemWrapper settingsBtBorder' onClick={clearList}>
                  <img src={iconErase} alt="Erase Icon" className="settingsIcon" />
                  <div className="settingsItem" >{t("CLEAR_LIST")} </div>
                </div>
                <SettingsLanguageSelect />
              </SettingsMenu>
          }
          
          <img alt='Add' src={add} className={gr.addGrocery}onClick={()=>setIsAddItemsPopup(true)} />
        </div>
  )
}

export default memo(Grocery);