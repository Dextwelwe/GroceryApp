import {useEffect, useState, useMemo, useRef, useCallback, memo } from 'react'
import gr from './grocery.module.css'
import '../../groceryCommon.css'
import { norm, resolveCategoryId } from '../../utils/itemUtils';
import { appBackgroundVars } from '../../utils/appBackground';

import HeaderMenu from '../../components/header/header';
import shoppingBasketIcon from '../../assets/images/icons/shopping-cart.svg'
import recipeIcon from '../../assets/images/icons/recipe.svg'
import storeIcon from '../../assets/images/icons/store.svg'
import noteIcon from '../../assets/images/icons/name.svg'

import iconBack from '../../assets/images/icons/back.svg'
import iconMore from '../../assets/images/icons/more.svg'
import {useTranslation} from 'react-i18next';
import { getGroceryById, removeOneCustomStore, updateGroceryStatus, clearItemsList, updateCustomStores, subscribeGroceryItems } from '../../api/grocery';
import { addItems, removeItem , setItemStatus, applyItemMerge, updateItem } from '../../api/items';
import { fetchUserRecipes } from '../../api/recipes';
import ItemCard from '../../components/ItemCard/ItemCard';
import EditItemPopup from '../../components/editItem/EditItemPopup';
import Select from '../../components/select/Select';
import GroceryObj from '../../models/Grocery';
import useLocalStorage from '../../hooks/useLocalStorage';
import Popup from '../../components/popup/Popup'
import AddItems from '../../components/add/addItems';
import { useAuth } from '../../providers/AuthProvider';
import Category from '../../components/categories/category';
import ActionMenu from '../../components/actionMenu/ActionMenu';
import SettingsLanguageSelect from '../../components/settings/SettingsLanguageSelect';
import FilterChips from '../../components/filterChips/FilterChips';
import FilterToggle from '../../components/filterToggle/FilterToggle';
import IconToggle from '../../components/iconToggle/IconToggle';
import SearchField from '../../components/searchField/SearchField';
import PreviewItemsPopup from '../../components/previewItemsPopup/PreviewItemsPopup';
import iconErase from '../../assets/images/icons/erase.svg'
import completeGroceryIcon from '../../assets/images/icons/completeGroceryIcon.svg'
import rc from '../../components/recipeCard/recipeCard.module.css';
import { useCategorySearch } from '../../hooks/useCategorySearch';
import { planRecipeMerge } from '../../utils/recipeMerge';

const defaultFilterValues = { categories: 'all', sortBy: 'az' };

function Grocery({goBack, groceryId}) {
  const { t } = useTranslation();
  const {userData} = useAuth();
  const [grocery, setGrocery] = useState(null);
  const [defaultStore, setDefaulStore] = useLocalStorage('gStore', 'all');
  const [defaultSortBy,setDefaultSortBy] = useLocalStorage('gSortBy','az');
  const [defaultRecipe,setDefaultRecipe] = useLocalStorage('gRecipe','all');
  const [isAddItemsPopup, setIsAddItemsPopup] = useState(false);
  const [isSettingsPopup, setIsSettingsPopup] = useState(false);
  const [isAddRecipePopup, setIsAddRecipePopup] = useState(false);
  const [isRecipePreviewPopup, setIsRecipePreviewPopup] = useState(false);
  const [recipePreviewItems, setRecipePreviewItems] = useState([]);
  const [userRecipes, setUserRecipes] = useState([]);
  const [selectedRecipeIds, setSelectedRecipeIds] = useState(new Set());
  const [storesOptionsList, setStoresOptionsList] = useState([])
  const [filters, setFilters] = useState({store: defaultStore, sortBy: defaultSortBy, recipe: defaultRecipe});
  const [nbFilters, setNbFilters] = useState(0);
  const optionsSortBy = [ { value: "az", label: t("FILTERS.A-Z") }, { value: "za", label: t("FILTERS.Z-A") }];
  const [needRefresh, setNeedRefresh] = useState(false);
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isBoughtOpen, setIsBoughtOpen] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [isEditStoresPopup, setIsEditStoresPopup] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const fabMenuRef = useRef(null);
  const optionsButtonRef = useRef(null);
  const { getAllCategoriesList, getOneCategory } = useCategorySearch();

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
    if (filters.sortBy !== defaultFilterValues.sortBy) count++;
    if (filters.store !== defaultFilterValues.categories) count++;
    if (filters.recipe !== 'all') count++;
    setNbFilters(count);
    // eslint-disable-next-line
  }, [filters]);

  useEffect(() => {
    if (!isAddMenuOpen) return;
    const handleClickOutside = (event) => {
      if (fabMenuRef.current && !fabMenuRef.current.contains(event.target)) {
        setIsAddMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isAddMenuOpen]);

  const optionsStore = useMemo(
    () => (grocery?.getStores() ?? []), [grocery]
  );

  const optionsRecipe = useMemo(
    () => (grocery?.getRecipes() ?? []), [grocery]
  );

  const view = useMemo(() => {
    const query = norm(searchTerm);

    const filtered = (grocery?.items ?? []).filter(g => {
      const gStore    = norm(g.store);
      const gRecipe   = norm(g.recipe);

      const passStore    = filters.store    === "all" || gStore    === norm(filters.store);
      const passRecipe   = filters.recipe   === "all" || gRecipe   === norm(filters.recipe);

      const categoryLabel = g.category
        ? t(`CATEGORIES.${g.category.toUpperCase()}`, { defaultValue: g.category })
        : '';
      const passSearch = !query || [g.name, g.store, g.recipe, g.category, categoryLabel]
        .some(value => norm(value).includes(query));

      return passStore && passRecipe && passSearch;
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
  }, [grocery, filters, searchTerm, grocery?.items]);

  const activeItems = useMemo(() => view.filter(item => item.status !== 'completed'), [view]);
  const boughtItems = useMemo(() => view.filter(item => item.status === 'completed'), [view]);

  // group the to-buy list by category, added items keep their own bucket at the end
  const groupedActiveItems = useMemo(() => {
    const groups = new Map();
    activeItems.forEach((item) => {
      const key = (item.category || '').toString().trim().toLowerCase();
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(item);
    });

    return [...groups.entries()]
      .map(([key, items]) => ({
        key: key || 'none',
        label: key ? getOneCategory(key) : t('NO_CATEGORY'),
        items,
      }))
      .sort((a, b) => {
        if (a.key === 'none') return 1;
        if (b.key === 'none') return -1;
        return a.label.localeCompare(b.label);
      });
  }, [activeItems, getOneCategory, t]);

  const completedCount = useMemo(
    () => (grocery?.items ?? []).filter(item => item.status === 'completed').length,
    [grocery]
  );
  const totalCount = grocery?.items?.length ?? 0;

  const boughtExpanded = isBoughtOpen || activeItems.length === 0;

  function toggleSearch() {
    if (isSearchOpen) {
      setSearchTerm('');
      setIsSearchOpen(false);
      return;
    }

    setIsFiltersOpen(false);
    setIsSearchOpen(true);
  }

  function toggleFilters() {
    if (isFiltersOpen) {
      setIsFiltersOpen(false);
      return;
    }
    setIsSearchOpen(false);
    setSearchTerm('');
    setIsFiltersOpen(true);
  }

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
      setNeedRefresh(true);
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
      setNeedRefresh(true);
      setGrocery(prev => {
        if (!prev) return prev;
        const nextItems = prev.items.map(it =>  it.id === id ? { ...it, status: status} : it);
        return new GroceryObj(prev.getId(), { ...prev, items: nextItems });
      });
    }
    else {
      if (result.err?.code === 'permission-denied') {
        alert(t('WARNINGS.NOT_PERMITTED_FOR_GUESTS'))

      } else {
        alert(t('WARNINGS.SERVER_ERROR'));

      }
    }
  }, [grocery, t]);

  const itemActions = useMemo(
    () => ({ remove: removeItemCall, changeStatus: changeItemStatus, edit: setEditingItem }),
    [removeItemCall, changeItemStatus]
  );

  async function saveItemEdit(fields) {
    if (!editingItem) return;
    // recipe ingredients are read-only
    if (editingItem.recipe) { setEditingItem(null); return; }

    const result = await updateItem(grocery.getId(), editingItem.id, fields);
    if (result.success) {
      setGrocery(prev => {
        if (!prev) return prev;
        const nextItems = prev.items.map(item =>
          item.id === editingItem.id ? { ...item, ...result.data } : item
        );
        return new GroceryObj(prev.getId(), { ...prev, items: nextItems });
      });
      setNeedRefresh(true);
      setEditingItem(null);
      return;
    }

    if (result.error?.code === 'permission-denied') {
      alert(t('WARNINGS.NOT_PERMITTED_FOR_GUESTS'));
    } else {
      alert(t('WARNINGS.SERVER_ERROR'));
    }
  }

  function handleFilterChange(e) {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    if (name === 'store') setDefaulStore(value);
    if (name === 'sortBy') setDefaultSortBy(value);
    if (name === 'recipe') setDefaultRecipe(value);
  }

  function resetFilters(){
    setDefaulStore('all');
    setDefaultSortBy("az");
    setDefaultRecipe("all");
    setFilters({ store: 'all', sortBy: 'az', recipe: 'all' });
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
        setNeedRefresh(true);
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
    if (res.success){
    setStoresOptionsList(list.map(e=>{return {desc : e, type : 'custom'}}));
    } else {
      if (res.error?.code === 'permission-denied') {
        alert(t('WARNINGS.NOT_PERMITTED_FOR_GUESTS'))
      } else {
        alert(t('WARNINGS.SERVER_ERROR'));
      }
      return false;
    }
    return true;
}

async function handleStoreRemove(store) {
  const groceryId = grocery.getId();
  let res = await removeOneCustomStore(groceryId,store);
  if (res.success) {
  setStoresOptionsList(storesOptionsList.filter(item => item.desc !== store))
  } else {
    if (res.error?.code === 'permission-denied') {
      alert(t('WARNINGS.NOT_PERMITTED_FOR_GUESTS'))
    } else {
      alert(t('WARNINGS.SERVER_ERROR'));
    }
    return false;
  }
  return true;
}

 const clearList = async() => {
  let doClear = window.confirm(t('WARNINGS.CLEAR_LIST_WARN'));
  if (doClear){
    const groceryId = grocery.getId();
    let res = await clearItemsList(groceryId);
    if (res.success) {
      setIsSettingsPopup(false);
    } else {
      if (res.error?.code === 'permission-denied') {
        alert(t('WARNINGS.NOT_PERMITTED_FOR_GUESTS'))
      } else {
        alert(t('WARNINGS.SERVER_ERROR'));
      }
    }
  }
 }

 const completeGrocery = async() => {
  let doComplete = window.confirm(t('WARNINGS.COMPLETE_GROCERY_WARN'));
  if (doComplete){
    const groceryId = grocery.getId();
    let res = await updateGroceryStatus( groceryId, "completed");
    if (res.success === true){
      setGrocery(prev => {
        const updated = Object.assign(Object.create(Object.getPrototypeOf(prev)), prev);
        updated.status = "completed";
        return updated;
      });
      setNeedRefresh(true);
      goBack(true);
    } else {
      if (res.error?.code === 'permission-denied') {
        alert(t('WARNINGS.NOT_PERMITTED_FOR_GUESTS'))
      } else {
        alert(t('WARNINGS.SERVER_ERROR'));
      }
    }
  }
 }

 const restartGrocery = async() => {
  let doRestart = window.confirm(t('WARNINGS.RESTART_GROCERY_WARN'));
  if (doRestart){
    const groceryId = grocery.getId();
    let res = await updateGroceryStatus(groceryId, "active");
    if (res.success === true){
      setGrocery(prev => {
        const updated = Object.assign(Object.create(Object.getPrototypeOf(prev)), prev);
        updated.status = "active";
        return updated;
      });
      setNeedRefresh(true);
      setIsSettingsPopup(false);
    } else {
      if (res.error?.code === 'permission-denied') {
        alert(t('WARNINGS.NOT_PERMITTED_FOR_GUESTS'))
      } else {
        alert(t('WARNINGS.SERVER_ERROR'));
      }
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

function prepareRecipePreview() {
  if (selectedRecipeIds.size === 0) return;

  // thread the working list through each recipe so quantities aggregate across them
  let workingItems = (grocery?.items ?? []).map(item => ({ ...item }));
  const updatesById = new Map();
  const creates = [];

  for (const recipeId of selectedRecipeIds) {
    const recipe = userRecipes.find(r => r.id === recipeId);
    if (!recipe) continue;

    const plan = planRecipeMerge(workingItems, recipe.items || [], {
      recipeName: recipe.name,
      addedBy: userData.firstName,
    });

    plan.updates.forEach(update => updatesById.set(update.id, update));
    creates.push(...plan.creates);

    const touched = new Map(plan.updates.map(u => [u.id, u]));
    workingItems = [
      ...workingItems.map(item =>
        touched.has(item.id)
          ? { ...item, amount: touched.get(item.id).amount, uom: touched.get(item.id).uom }
          : item
      ),
      ...plan.creates.map(item => ({ ...item })),
    ];
  }

  const previewItems = [
    ...[...updatesById.values()].map(update => {
      const existing = (grocery?.items ?? []).find(item => item.id === update.id) || {};
      return {
        name: update.name,
        category: existing.category || '',
        store: existing.store || '',
        amount: update.amount,
        uom: update.uom,
        status: 'active',
        mergeId: update.id,
      };
    }),
    ...creates,
  ];

  if (previewItems.length === 0) {
    setIsAddRecipePopup(false);
    setSelectedRecipeIds(new Set());
    return;
  }

  setRecipePreviewItems(previewItems);
  setIsRecipePreviewPopup(true);
}

async function confirmRecipeItems() {
  const updates = recipePreviewItems
    .filter(item => item.mergeId)
    .map(item => ({ id: item.mergeId, amount: item.amount, uom: item.uom }));

  const creates = recipePreviewItems
    .filter(item => !item.mergeId)
    .map(({ mergeId, ...item }) => item); // eslint-disable-line no-unused-vars

  const result = await applyItemMerge(grocery.getId(), { updates, creates });
  if (result.success) {
    await getFullGrocery();
    setNeedRefresh(true);
  } else {
    if (result.error?.code === 'permission-denied') {
      alert(t('WARNINGS.NOT_PERMITTED_FOR_GUESTS'));
    } else {
      alert(t('WARNINGS.SERVER_ERROR'));
    }
  }
  setIsRecipePreviewPopup(false);
  setRecipePreviewItems([]);
  setIsAddRecipePopup(false);
  setSelectedRecipeIds(new Set());
}

function removeRecipePreviewItem(itemName) {
  setRecipePreviewItems(prev => prev.filter(item => item.name !== itemName));
}

function editRecipePreviewItemCategory(itemName, newCategoryId) {
  setRecipePreviewItems(prev => prev.map(item => {
    if (item.name === itemName) {
      return { ...item, category: newCategoryId || item.category };
    }
    return item;
  }));
}

function editRecipePreviewItemStore(itemName, newStore) {
  setRecipePreviewItems(prev => prev.map(item => {
    if (item.name === itemName) {
      return { ...item, store: newStore };
    }
    return item;
  }));
}

 if (!grocery) return null;

  const headerGroceryTitle = grocery.getTitle();
  const headerGroceryNav = [{src : iconBack , alt : "Back", clickaction : () => { goBack(needRefresh); setNeedRefresh(false); }}]
  const headerItems = [{
    src: iconMore,
    alt: 'Options',
    buttonLabel: t('OPTIONS'),
    buttonRef: optionsButtonRef,
    isExpanded: isSettingsPopup,
    clickaction: () => setIsSettingsPopup(prev => !prev),
  }]
  const addedRecipeNames = new Set((grocery?.items ?? []).map(i => norm(i.recipe)).filter(Boolean));

  return (
    <div className='mainContentWrapper' style={appBackgroundVars}>
        <HeaderMenu title={headerGroceryTitle} headerNav={headerGroceryNav} headerItems={headerItems} />
        <div className="subHeaderWrapper">
              <div className={gr.listHeaderWrapper}>
                <div className={gr.listHeaderTop}>
                  <h2 className={gr.listTitle}>{t('GROCERY_ITEMS')}</h2>
                  {totalCount > 0 &&
                    <span className={gr.progressCount} title={t('STATUS.COMPLETED')}>
                      {completedCount}/{totalCount}
                    </span>
                  }
                  <div className={gr.listToolbar}>
                    <IconToggle active={isSearchOpen} onClick={toggleSearch} label={t('SEARCH')}>
                      <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.9' strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'>
                        <circle cx='11' cy='11' r='6.4' />
                        <path d='M15.8 15.8 20.5 20.5' />
                      </svg>
                    </IconToggle>
                    <FilterToggle
                      open={isFiltersOpen}
                      count={nbFilters}
                      onClick={toggleFilters}
                      label={t('FILTERS_LABEL')}
                    />
                  </div>
                </div>
              </div>

          {isSearchOpen
            ? <SearchField
                value={searchTerm}
                onChange={setSearchTerm}
                onClear={() => setSearchTerm('')}
                placeholder={t('SEARCH_ITEMS')}
                label={t('SEARCH')}
                clearLabel={t('CLEAR')}
              />
            : <FilterChips open={isFiltersOpen} resetLabel={t('RESET_FILTERS')} count={nbFilters} onReset={resetFilters}>
                <Select label={t('STORE')} options={optionsStore} name="store" value={filters.store} onChange={handleFilterChange} isActive={filters.store !== defaultFilterValues.categories} />
                <Select label={t('RECIPE')} options={optionsRecipe} name="recipe" value={filters.recipe} onChange={handleFilterChange} isActive={filters.recipe !== 'all'} />
                <Select label={t("SORT_BY")} options={optionsSortBy} name="sortBy" value={filters.sortBy} onChange={handleFilterChange} isActive={filters.sortBy !== defaultFilterValues.sortBy} />
              </FilterChips>
          }
        </div>
        <div className={gr.list}>
          {groupedActiveItems.map((group) => (
            <div key={group.key} className={gr.categoryGroup}>
              <h3 className={gr.categoryHeader}>
                <span className={gr.categoryLabel}>{group.label}</span>
                <span className={gr.categoryRule} aria-hidden='true' />
              </h3>
              {group.items.map(item => (
                <ItemCard key={item.id} data={item} actions={itemActions} showCategory={false} />
              ))}
            </div>
          ))}

          {boughtItems.length > 0 &&
            <button
              type='button'
              className={gr.boughtHeader}
              onClick={() => setIsBoughtOpen(prev => !prev)}
              aria-expanded={boughtExpanded}
            >
              <span>{t('BOUGHT')} · {boughtItems.length}</span>
              <svg className={`${gr.boughtChevron} ${boughtExpanded ? gr.boughtChevronOpen : ''}`} viewBox='0 0 10 6' fill='none' aria-hidden='true'>
                <path d='M1 1L5 5L9 1' stroke='currentColor' strokeWidth='1.6' strokeLinecap='round' strokeLinejoin='round' />
              </svg>
            </button>
          }

          {boughtExpanded && boughtItems.map(item => (
            <ItemCard key={item.id} data={item} actions={itemActions} />
          ))}

          {view.length === 0 && grocery?.items.length > 0 &&
            <div className={gr.empty}>{searchTerm ? t('NO_SEARCH_RESULTS') : t('WARNINGS.NO_ITEMS')}</div>
          }
        </div>

        {isAddRecipePopup &&
          <Popup title={t('ADD_RECIPE')} close={() => { if (!isRecipePreviewPopup) { setIsAddRecipePopup(false); setSelectedRecipeIds(new Set()); } }}>
            <div className='uiForm'>
              <div className={gr.previewList} style={{ marginTop: 14 }}>
                {userRecipes.length === 0 && <div className={gr.empty}>{t('NO_RECIPES_YET')}</div>}
                {userRecipes.map((recipe) => {
                  const isSelected = selectedRecipeIds.has(recipe.id);
                  const isAlreadyAdded = addedRecipeNames.has(norm(recipe.name));
                  return (
                    <div
                      key={recipe.id}
                      className={`uiCard ${gr.recipePicker} ${isSelected ? gr.recipeSelected : ''} ${isAlreadyAdded ? gr.recipeDisabled : ''}`}
                      onClick={() => !isAlreadyAdded && toggleRecipeSelection(recipe.id)}
                      style={isAlreadyAdded ? { opacity: 0.55, cursor: 'default' } : {}}
                    >
                      <span className='uiTile'>
                        <img src={noteIcon} alt='' />
                      </span>
                      <div className={rc.content}>
                        <div className={rc.name}>{recipe.name}</div>
                        <div className={rc.count}>
                          {isAlreadyAdded ? t('RECIPE_ALREADY_ADDED') : `${(recipe.items || []).length} ${t('ITEMS')}`}
                        </div>
                      </div>
                      <button type="button" className={rc.menuButton} onClick={(e) => { e.stopPropagation(); if (!isAlreadyAdded) toggleRecipeSelection(recipe.id); }} disabled={isAlreadyAdded}>
                        <span className={isSelected ? gr.recipeSelectIconSelected : gr.recipeSelectIcon}>
                          {isAlreadyAdded ? '' : isSelected ? '' : '+'}
                        </span>
                      </button>
                    </div>
                  );
                })}
              </div>
              {userRecipes.length > 0 && (
                <button type="button" className='uiBtn uiBtnPrimary' onClick={prepareRecipePreview} disabled={selectedRecipeIds.size === 0}> {t('CONFIRM')} </button>
              )}
            </div>
          </Popup>
        }

          {isRecipePreviewPopup && recipePreviewItems.length > 0 &&
            <PreviewItemsPopup
              items={recipePreviewItems}
              categoriesList={getAllCategoriesList()}
              storesList={storesOptionsList}
              listClassName={gr.recipePreviewList}
              itemClassName={gr.recipePreviewItem}
              onRemove={removeRecipePreviewItem}
              onEditCategory={editRecipePreviewItemCategory}
              onEditStore={editRecipePreviewItemStore}
              onBack={() => setIsRecipePreviewPopup(false)}
              onConfirm={confirmRecipeItems}
              showRemove={false}
              showRecipe={false}
            />
          }

          {isEditStoresPopup &&
            <Popup title={t('EDIT_STORES')} close={() => setIsEditStoresPopup(false)}>
              <div className='uiForm'>
                <Category list={storesOptionsList} onUpdate={(store) => handleStoreUpdate(store)} onDelete={(store) => handleStoreRemove(store)} />
              </div>
            </Popup>
          }

          {editingItem &&
            <EditItemPopup
              item={editingItem}
              storesList={storesOptionsList}
              onClose={() => setEditingItem(null)}
              onSave={saveItemEdit}
            />
          }

          { isAddItemsPopup &&
            <Popup title={t('ADD_ITEMS')} close={()=> setIsAddItemsPopup(false)}>
              <div className='uiForm'>
                <AddItems onSave={saveItems} storesList={storesOptionsList} onStoreAdd={(store)=>handleStoreUpdate(store)} userName={userData.firstName} />
              </div>
            </Popup>
          }

          <ActionMenu
            open={isSettingsPopup}
            onClose={() => setIsSettingsPopup(false)}
            anchorRef={optionsButtonRef}
            width={236}
            label={t('ACTIONS')}
            items={[
              {
                key: 'complete',
                label: grocery?.status === 'completed' ? t('RESTART_GROCERY') : t('COMPLETE_GROCERY'),
                icon: <img src={completeGroceryIcon} alt='' />,
                onSelect: grocery?.status === 'completed' ? restartGrocery : completeGrocery,
              },
              {
                key: 'clear',
                label: t('CLEAR_LIST'),
                icon: <img src={iconErase} alt='' />,
                tone: 'danger',
                onSelect: clearList,
              },
              { key: 'language', node: <SettingsLanguageSelect compact /> },
            ]}
          />

          <div className={gr.fabWrapper} ref={fabMenuRef}>
            {isAddMenuOpen && (
              <div className={gr.fabMenu}>
                <div className={gr.fabMenuItem} onClick={() => { setIsAddMenuOpen(false); setIsAddItemsPopup(true); }}>
                  <img src={shoppingBasketIcon} alt="Add items" className={gr.fabMenuItemIcon} />
                  {t('ADD_ITEMS')}
                </div>
                <div className={gr.fabMenuItem} onClick={() => { setIsAddMenuOpen(false); setSelectedRecipeIds(new Set()); setIsAddRecipePopup(true); }}>
                  <img src={recipeIcon} alt="Add recipe" className={gr.fabMenuItemIcon} />
                  {t('ADD_RECIPE')}
                </div>
                <div className={gr.fabMenuItem} onClick={() => { setIsAddMenuOpen(false); setIsEditStoresPopup(true); }}>
                  <img src={storeIcon} alt="Edit stores" className={gr.fabMenuItemIcon} />
                  {t('EDIT_STORES')}
                </div>
              </div>
            )}
            <button
              type='button'
              className={gr.addGrocery}
              onClick={() => setIsAddMenuOpen(prev => !prev)}
              aria-label={t('ADD_ITEMS')}
              aria-expanded={isAddMenuOpen}
            >
              <svg viewBox='0 0 24 24' className={gr.addIcon} aria-hidden='true'>
                <path d='M12 5v14M5 12h14' stroke='currentColor' strokeWidth='2.2' strokeLinecap='round' />
              </svg>
            </button>
          </div>
          {isAddMenuOpen && (
            <div className={gr.fabOverlay} onClick={() => setIsAddMenuOpen(false)} />
          )}
        </div>
  )
}

export default memo(Grocery);
