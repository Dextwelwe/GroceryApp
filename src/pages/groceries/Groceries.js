import gr from './Groceries.module.css'
import '../../groceryCommon.css'
import { norm, validateInput, getDate, resolveCategoryId } from '../../utils/itemUtils';
import { appBackgroundVars } from '../../utils/appBackground';

import { useAuth } from '../../providers/AuthProvider';
import { useTranslation } from 'react-i18next';
import { useState, useRef, useEffect, useMemo } from 'react';
import useLocalStorage from '../../hooks/useLocalStorage'
import { useCategorySearch } from '../../hooks/useCategorySearch';
import { hasQuantity } from '../../utils/quantity';

import removeGrocery, { fetchAllGroceries } from '../../api/grocery';
import { fetchUserRecipes, saveNewRecipe as saveNewRecipeApi, updateRecipe as updateRecipeApi, deleteRecipe as deleteRecipeApi } from '../../api/recipes';

import Select from '../../components/select/Select';
import Popup from '../../components/popup/Popup';
import HeaderMenu from '../../components/header/header';
import GroceryCard from '../../components/groceryCard/GroceryCard';
import GroceryForm from '../../components/groceryForm/GroceryForm';
import RecipeCard from '../../components/recipeCard/RecipeCard';
import ActionMenu from '../../components/actionMenu/ActionMenu';
import SettingsLanguageSelect from '../../components/settings/SettingsLanguageSelect';
import FilterChips from '../../components/filterChips/FilterChips';
import FilterToggle from '../../components/filterToggle/FilterToggle';
import SegmentedControl from '../../components/segmentedControl/SegmentedControl';
import AddItems from '../../components/add/addItems';
import PreviewItemCard from '../../components/previewItemCard/PreviewItemCard';
import PreviewItemsPopup from '../../components/previewItemsPopup/PreviewItemsPopup';

import animLoading from '../../assets/images/animations/loading.gif'
import listIcon from '../../assets/images/icons/list.svg'
import iconMore from '../../assets/images/icons/more.svg'
import iconRecipe from '../../assets/images/icons/recipe.svg'

const STATUS_MAP = { active: 'active', completed: 'completed' };
const defaultFilterValues = { categories: 'all', sortBy: 'newest' };

export default function Groceries({ goToGrocery, refresh }) {
  const { t } = useTranslation();
  const { userData, logout } = useAuth();

  const [activeTab, setActiveTab] = useState('groceries');
  const [listTab, setListTab] = useState('groceries');
  const [listPhase, setListPhase] = useState('idle');
  const [listDir, setListDir] = useState(1);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [groceries, setGroceries] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [previewRecipeList, setPreviewRecipeList] = useState([]);
  const [isGroceryFormOpen, setIsGroceryFormOpen] = useState(false);
  const [editingGrocery, setEditingGrocery] = useState(null);
  const [groceryMenu, setGroceryMenu] = useState(null);   // { item, rect }
  const [isAddNewRecipeVisible, setIsAddNewRecipeVisible] = useState(false);
  const [isSettingsPopup, setIsSettingsPopup] = useState(false);
  const [isPreviewListPopup, setIsPreviewListPopup] = useState(false);
  const [isEditRecipePopup, setIsEditRecipePopup] = useState(false);
  const [isAddItemsToRecipePopup, setIsAddItemsToRecipePopup] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [recipeMenu, setRecipeMenu] = useState(null);     // { item, rect }
  const optionsButtonRef = useRef(null);

  const [defaultLabel, setDefaultLabel] = useLocalStorage('FLabel', 'all');
  const [defaultStatus, setDefaultStatus] = useLocalStorage('FStatus', 'all');
  const [defaultSortBy, setDefaultSortBy] = useLocalStorage('FSortBy', 'newest');
  const [filters, setFilters] = useState({ label: defaultLabel, status: defaultStatus, sortBy: defaultSortBy });
  const [nbFilters, setNbFilters] = useState(0);

  let nameRef = useRef(null);
  const touchStartRef = useRef({ x: 0, y: 0 });
  const slideTimer = useRef(null);

  useEffect(() => () => clearTimeout(slideTimer.current), []);
  const { getAllCategoriesList } = useCategorySearch();

  const headerItems = [{
    src: iconMore,
    alt: 'Icon More',
    buttonLabel: t('OPTIONS'),
    buttonRef: optionsButtonRef,
    isExpanded: isSettingsPopup,
    clickaction: () => setIsSettingsPopup(prev => !prev),
  }];

  const optionsLabel = [
    { value: 'all', label: t('FILTERS.ALL') },
    { value: 'personal', label: t('FILTERS.PERSONAL') },
    { value: 'shared', label: t('FILTERS.SHARED') },
  ];

  const optionsStatus = [
    { value: 'all', label: t('FILTERS.ALL') },
    { value: 'active', label: t('STATUS.ACTIVE') },
    { value: 'completed', label: t('STATUS.COMPLETED') },
  ];

  const optionsSortBy = [
    { value: 'newest', label: t('FILTERS.NEWEST_FIRST') },
    { value: 'oldest', label: t('FILTERS.OLDEST_FIRST') },
    { value: 'az', label: t('FILTERS.A-Z') },
    { value: 'za', label: t('FILTERS.Z-A') },
  ];

  useEffect(() => {
    if (userData) {
      loadGroceries();
      loadRecipes();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userData, refresh]);

  useEffect(() => {
    let count = 0;
    if (activeTab === 'groceries') {
      if (filters.label !== defaultFilterValues.categories) count++;
      if (filters.status !== defaultFilterValues.categories) count++;
    }
    if (filters.sortBy !== defaultFilterValues.sortBy) count++;
    setNbFilters(count);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, activeTab]);

  const view = useMemo(() => {
    const filtered = groceries.filter(g => {
      const gLabel = norm(g.type);
      const gStatus = STATUS_MAP[norm(g.status)] || norm(g.status);

      const passLabel = filters.label === 'all' || gLabel === filters.label;
      const passStatus = filters.status === 'all' || gStatus === filters.status;
      return passLabel && passStatus;
    });

    return [...filtered].sort((a, b) => {
      const an = norm(a.name), bn = norm(b.name);
      const ta = getDate(a.createdAt)?.getTime() ?? 0;
      const tb = getDate(b.createdAt)?.getTime() ?? 0;

      switch (filters.sortBy) {
        case 'oldest': return ta - tb;
        case 'newest': return tb - ta;
        case 'az': return an.localeCompare(bn);
        case 'za': return bn.localeCompare(an);
        default: return 0;
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groceries, filters]);

  const recipeView = useMemo(() => {
    return [...recipes].sort((a, b) => {
      const an = norm(a.name), bn = norm(b.name);
      const ta = getDate(a.createdAt)?.getTime() ?? 0;
      const tb = getDate(b.createdAt)?.getTime() ?? 0;

      switch (filters.sortBy) {
        case 'oldest': return ta - tb;
        case 'newest': return tb - ta;
        case 'az': return an.localeCompare(bn);
        case 'za': return bn.localeCompare(an);
        default: return 0;
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recipes, filters.sortBy]);

  if (!userData) return null;

  const headerTitle = t('HI') + ', ' + userData.firstName + '!';

  const toggleNewRecipe = () => {
    setIsAddNewRecipeVisible(!isAddNewRecipeVisible);
  }

  async function loadGroceries() {
    let timer;
    try {
      timer = setTimeout(() => setIsLoading(true), 500);
      setGroceries(await fetchAllGroceries(userData.uid));
    } catch (err) {
      console.error('Failed to fetch groceries:', err);
    } finally {
      clearTimeout(timer);
      setIsLoading(false);
    }
  }

  async function loadRecipes() {
    let res = await fetchUserRecipes(userData.uid);
    if (res.success) {
      setRecipes(res.data);
    } else {
      console.error('Failed to fetch recipes:', res.error);
    }
  }

  async function deleteRecipe(recipeId) {
    if (!window.confirm(t('WARNINGS.REMOVE_RECIPE'))) return;
    const res = await deleteRecipeApi(userData.uid, recipeId);
    if (res.success) {
      setRecipes(prev => prev.filter(r => r.id !== recipeId));
    } else {
      console.log(res.error);
      if (res.error?.code === 'permission-denied') {
        alert(t('WARNINGS.NOT_PERMITTED_FOR_GUESTS'));
      } else {
        alert(t('WARNINGS.SERVER_ERROR'));
      }
    }
  }

  function removeRecipeItem(itemName) {
    setPreviewRecipeList(prev => prev.filter(item => item.name !== itemName));
  }

  function closeRecipeEditor() {
    setIsAddItemsToRecipePopup(false);
    setIsEditRecipePopup(false);
    setSelectedRecipe(null);
    setPreviewRecipeList([]);
  }

  function openRecipeEditor(recipeId) {
    const recipe = recipes.find((entry) => entry.id === recipeId);
    if (!recipe) return;

    setSelectedRecipe(recipe);
    setPreviewRecipeList(recipe.items || []);
    setIsEditRecipePopup(true);
  }

  function editRecipeFromMenu() {
    const target = recipeMenu?.item;
    if (!target) return;
    setRecipeMenu(null);
    openRecipeEditor(target.id);
  }

  async function deleteRecipeFromMenu() {
    const target = recipeMenu?.item;
    if (!target) return;
    setRecipeMenu(null);
    await deleteRecipe(target.id);
  }

  function addItemsToEditedRecipe(newItems) {
    if (!newItems || newItems.length === 0) {
      return alert(t('WARNINGS.NO_ITEMS_TO_ADD'));
    }

    const existingNames = new Set(
      previewRecipeList.map((item) => (item.name || '').trim().toLowerCase())
    );

    const itemsToAdd = newItems.filter((item) => {
      const key = item.name.trim().toLowerCase();
      return !existingNames.has(key);
    });

    if (itemsToAdd.length === 0) {
      return alert(t('WARNINGS.ALREADY_EXISTS'));
    }

    setPreviewRecipeList((prev) => [...prev, ...itemsToAdd]);
    setIsAddItemsToRecipePopup(false);
  }

  function editPreviewRecipeItem(itemName, newCategoryId) {
    setPreviewRecipeList(prev => prev.map(item => {
      if (item.name === itemName) {
        return {
          ...item,
          category: newCategoryId || item.category
        };
      }
      return item;
    }));
  }

  const saveNewRecipe = async () => {
    if (previewRecipeList.some(item => !hasQuantity(item))) {
      return alert(t('WARNINGS.QUANTITY_REQUIRED'));
    }
    if (previewRecipeList.some(item => !item.category || item.category.trim() === '')) {
      return alert(t('WARNINGS.FILL_ALL_CATEGORIES'));
    }

    let result = await saveNewRecipeApi({
      name: nameRef.current.value,
      owner: userData.uid,
      items: previewRecipeList.map(item => ({
        name: item.name,
        category: resolveCategoryId(item.category, getAllCategoriesList),
        store: item.store,
        status: item.status,
        addedBy: item.addedBy,
        amount: item.amount ?? null,
        uom: item.uom ?? null,
      }))
    });

    if (result.success) {
      setIsPreviewListPopup(false);
      setPreviewRecipeList([]);
      toggleNewRecipe();
      await loadRecipes();
    } else {
      if (result.error?.code === 'permission-denied') {
        alert(t('WARNINGS.NOT_PERMITTED_FOR_GUESTS'))
      } else {
        alert(t('WARNINGS.SERVER_ERROR'));
      }
    }
  }

  const saveEditedRecipe = async () => {
    if (!selectedRecipe?.id) return;

    if (previewRecipeList.some(item => !hasQuantity(item))) {
      return alert(t('WARNINGS.QUANTITY_REQUIRED'));
    }
    if (previewRecipeList.some(item => !item.category || item.category.trim() === '')) {
      return alert(t('WARNINGS.FILL_ALL_CATEGORIES'));
    }

    const result = await updateRecipeApi({
      recipeId: selectedRecipe.id,
      items: previewRecipeList.map(item => ({
        name: item.name,
        category: resolveCategoryId(item.category, getAllCategoriesList),
        store: item.store || '',
        status: item.status || 'active',
        addedBy: item.addedBy || userData.firstName,
        amount: item.amount ?? null,
        uom: item.uom ?? null,
      }))
    });

    if (result.success) {
      await loadRecipes();
      closeRecipeEditor();
    } else {
      if (result.error?.code === 'permission-denied') {
        alert(t('WARNINGS.NOT_PERMITTED_FOR_GUESTS'));
      } else {
        alert(t('WARNINGS.SERVER_ERROR'));
      }
    }
  }

  function handleRecipeItemsReady(items) {
    if (!validateInput(nameRef.current.value)) {
      nameRef.current.style.borderColor = 'red';
      return;
    }
    nameRef.current.style.borderColor = '';
    setPreviewRecipeList(items);
    setIsPreviewListPopup(true);
  }

  const openNewGrocery = () => {
    setEditingGrocery(null);
    setIsGroceryFormOpen(true);
  }

  const closeGroceryForm = () => {
    setIsGroceryFormOpen(false);
    setEditingGrocery(null);
  }

  const openEditGrocery = (grocery) => {
    setGroceryMenu(null);
    setEditingGrocery(grocery);
    setIsGroceryFormOpen(true);
  }

  async function deleteGroceryFromMenu() {
    const target = groceryMenu?.item;
    if (!target) return;
    setGroceryMenu(null);
    if (!window.confirm(t('DELETE_GROCERY'))) return;

    const result = await removeGrocery(target.owner, target.id, target.sharedWith);
    if (result.success) {
      await loadGroceries();
    } else {
      alert(result.error?.code === 'permission-denied'
        ? t('WARNINGS.NOT_PERMITTED_FOR_GUESTS')
        : t('WARNINGS.SERVER_ERROR'));
    }
  }

  function handleFilterChange(e) {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    if (name === 'label') setDefaultLabel(value);
    if (name === 'status') setDefaultStatus(value);
    if (name === 'sortBy') setDefaultSortBy(value);
  }

  function resetFilters() {
    setDefaultLabel('all');
    setDefaultStatus('all');
    setDefaultSortBy('newest');
    setFilters({ label: 'all', status: 'all', sortBy: 'newest' });
    setNbFilters(0);
  }

  function handleTabTouchStart(e) {
    const touch = e.touches?.[0];
    if (!touch) return;
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  }

  function handleTabTouchEnd(e) {
    const isMobileViewport = window.matchMedia('(max-width: 800px)').matches;
    const isTouchDevice = window.matchMedia('(pointer: coarse)').matches;
    if (!isMobileViewport && !isTouchDevice) return;

    if (isGroceryFormOpen || isAddNewRecipeVisible || isPreviewListPopup || isEditRecipePopup || isAddItemsToRecipePopup) {
      return;
    }

    const touch = e.changedTouches?.[0];
    if (!touch) return;

    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;
    const minSwipeDistance = 40;

    if (Math.abs(deltaX) < minSwipeDistance || Math.abs(deltaY) > Math.abs(deltaX)) {
      return;
    }

    if (deltaX < 0 && activeTab === 'groceries') {
      changeTab('recipes');
    }

    if (deltaX > 0 && activeTab === 'recipes') {
      changeTab('groceries');
    }
  }

  const changeTab = (next) => {
    if (next === activeTab) return;

    setActiveTab(next);
    setListDir(next === 'recipes' ? 1 : -1);
    clearTimeout(slideTimer.current);

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setListTab(next);
      setListPhase('idle');
      return;
    }

    setListPhase('out');
    slideTimer.current = setTimeout(() => {
      setListTab(next);
      setListPhase('in');
      slideTimer.current = setTimeout(() => setListPhase('idle'), 220);
    }, 160);
  };

  const slideClass = listPhase === 'out'
    ? (listDir === 1 ? gr.slideOutLeft : gr.slideOutRight)
    : listPhase === 'in'
      ? (listDir === 1 ? gr.slideInRight : gr.slideInLeft)
      : '';

  return (
    <div className='mainContentWrapper' style={appBackgroundVars} onTouchStart={handleTabTouchStart} onTouchEnd={handleTabTouchEnd}>
      <HeaderMenu title={headerTitle} headerItems={headerItems} headerNav={null} />

      <div className='subHeaderWrapper'>
        <div className={gr.toolbar}>
          <div className={gr.segmentedControl}>
            <SegmentedControl
              items={[
                { key: 'groceries', label: t('MY_GROCERIES'), icon: listIcon },
                { key: 'recipes', label: t('MY_RECIPES'), icon: iconRecipe },
              ]}
              value={activeTab}
              onChange={changeTab}
            />
          </div>
          <FilterToggle
            open={isFiltersOpen}
            count={nbFilters}
            onClick={() => setIsFiltersOpen((prev) => !prev)}
            label={t('FILTERS_LABEL')}
          />
        </div>

        <FilterChips open={isFiltersOpen} resetLabel={t('RESET_FILTERS')} count={nbFilters} onReset={resetFilters}>
          {activeTab === 'groceries' && <>
            <Select label={t('TYPE')} options={optionsLabel} name='label' value={filters.label} onChange={handleFilterChange} isActive={filters.label !== defaultFilterValues.categories} />
            <Select label={t('STATUS_LBL')} options={optionsStatus} name='status' value={filters.status} onChange={handleFilterChange} isActive={filters.status !== defaultFilterValues.categories} />
          </>}
          <Select label={t('SORT_BY')} options={optionsSortBy} name='sortBy' value={filters.sortBy} onChange={handleFilterChange} isActive={filters.sortBy !== defaultFilterValues.sortBy} />
        </FilterChips>
      </div>

      {listTab === 'groceries' && <div className={`${gr.list} ${slideClass}`}>
        {
          isLoading &&
          <img className={gr.loadingAnimation} alt='loading' src={animLoading} />
        }
        {!isLoading && <>
          {view.map((grocery) => (
            <GroceryCard key={grocery.id} data={grocery} onClick={goToGrocery} onMenu={(item, rect) => setGroceryMenu({ item, rect })} />
          ))}
          {view.length === 0 && groceries.length > 0 && <div className={gr.empty}>{t('WARNINGS.NO_GROCERIES')}</div>}
        </>
        }
      </div>}

      {listTab === 'recipes' && <div className={`${gr.list} ${slideClass}`}>
        {recipeView.length > 0 ? (
          recipeView.map((recipe) => (
            <RecipeCard key={recipe.id} data={recipe} onClick={openRecipeEditor} onMenu={(item, rect) => setRecipeMenu({ item, rect })} />
          ))
        ) : (
          <div className={gr.empty}>{t('NO_RECIPES_YET')}</div>
        )}
      </div>}

      {isGroceryFormOpen &&
        <GroceryForm
          grocery={editingGrocery}
          ownerUid={userData.uid}
          currentUserEmail={userData.email}
          isGuest={userData.isTestUser}
          onClose={closeGroceryForm}
          onSaved={loadGroceries}
        />
      }

      {groceryMenu &&
        <ActionMenu
          open={Boolean(groceryMenu)}
          onClose={() => setGroceryMenu(null)}
          anchorRect={groceryMenu.rect}
          label={t('OPTIONS')}
          items={[
            {
              key: 'edit',
              label: t('EDIT_GROCERY'),
              icon: (
                <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.8' strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'>
                  <path d='M4 20h4L19 9a2.83 2.83 0 0 0-4-4L4 16v4z' />
                </svg>
              ),
              onSelect: () => openEditGrocery(groceryMenu.item),
            },
            {
              key: 'delete',
              label: t('REMOVE_GROCERY'),
              tone: 'danger',
              icon: (
                <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.8' strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'>
                  <path d='M4 7h16M10 4h4M9 7v13M15 7v13M6 7l1 13h10l1-13' />
                </svg>
              ),
              onSelect: deleteGroceryFromMenu,
            },
          ]}
        />
      }

      {recipeMenu &&
        <ActionMenu
          open={Boolean(recipeMenu)}
          onClose={() => setRecipeMenu(null)}
          anchorRect={recipeMenu.rect}
          label={t('OPTIONS')}
          items={[
            {
              key: 'edit',
              label: t('EDIT_RECIPE'),
              icon: (
                <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.8' strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'>
                  <path d='M4 20h4L19 9a2.83 2.83 0 0 0-4-4L4 16v4z' />
                </svg>
              ),
              onSelect: editRecipeFromMenu,
            },
            {
              key: 'delete',
              label: t('REMOVE_RECIPE'),
              tone: 'danger',
              icon: (
                <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.8' strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'>
                  <path d='M4 7h16M10 4h4M9 7v13M15 7v13M6 7l1 13h10l1-13' />
                </svg>
              ),
              onSelect: deleteRecipeFromMenu,
            },
          ]}
        />
      }

      {isAddNewRecipeVisible &&
        <Popup title={t('ADD_NEW_RECIPE')} close={() => { if (!isPreviewListPopup) toggleNewRecipe() }}>
          <form className='uiForm' onSubmit={(e) => e.preventDefault()}>
            <label className='uiFieldLabel' htmlFor='recipeName'>{t('RECIPE_NAME')}</label>
            <input
              id='recipeName'
              ref={nameRef}
              className='uiField'
              placeholder={t('RECIPE_NAME')}
              autoComplete='off'
              autoCapitalize='none'
            />
            <span className='uiSectionTitle'>{t('ITEMS')}</span>
            <AddItems onSave={handleRecipeItemsReady} storesList={[]} userName={userData.firstName} requireQuantity />
          </form>
        </Popup>
      }

      {isPreviewListPopup && previewRecipeList.length > 0 &&
        <PreviewItemsPopup
        items={previewRecipeList}
        categoriesList={getAllCategoriesList()}
        listClassName={gr.previewList}
        itemClassName={gr.previewItem}
        onRemove={removeRecipeItem}
        onEditCategory={editPreviewRecipeItem}
        onBack={() => setIsPreviewListPopup(false)}
        onConfirm={saveNewRecipe}
        />
      }

      {isEditRecipePopup &&
        <Popup title={selectedRecipe?.name || t('PREVIEW_LIST')} close={() => { if (!isAddItemsToRecipePopup) closeRecipeEditor(); }}>

            <div className={gr.previewList}>
              {previewRecipeList.map((item, index) => (
                <div key={index} className={gr.previewItem}>
                  <PreviewItemCard data={item} actions={{ remove: (item) => removeRecipeItem(item), editCategory: (itemName, newCategoryId) => editPreviewRecipeItem(itemName, newCategoryId) }} categoriesList={getAllCategoriesList()} />
                </div>
              ))}
            </div>
            <div className={gr.recipeBottomActions}>
              <button
                type='button'
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => { e.preventDefault(); setIsAddItemsToRecipePopup(true) }}
                className={gr.recipeAddItemsButton}
                aria-label={t('ADD_ITEMS')}
              >
                <svg viewBox='0 0 24 24' className={gr.recipeAddIcon} aria-hidden='true'>
                  <path d='M12 5v14M5 12h14' stroke='currentColor' strokeWidth='2.2' strokeLinecap='round' />
                </svg>
              </button>
              <button type='button' onClick={(e) => { e.preventDefault(); saveEditedRecipe() }} className='uiBtn uiBtnPrimary'>{t('SAVE')}</button>
            </div>
        </Popup>
      }

      {isAddItemsToRecipePopup &&
        <Popup title={t('ADD_ITEMS')} close={() => setIsAddItemsToRecipePopup(false)}>
          <div className='uiForm'>
            <AddItems onSave={addItemsToEditedRecipe} storesList={[]} userName={userData.firstName} requireQuantity />
          </div>
        </Popup>
      }

      {isSettingsPopup &&
        <ActionMenu
          open={isSettingsPopup}
          onClose={() => setIsSettingsPopup(false)}
          anchorRef={optionsButtonRef}
          width={236}
          label={t('ACTIONS')}
          items={[
            {
              key: 'logout',
              label: t('LOGOUT'),
              tone: 'danger',
              icon: (
                <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'>
                  <path d='M21 12L13 12' />
                  <path d='M18 15l3-3-3-3' />
                  <path d='M16 5v-.5A2.5 2.5 0 0 0 13.5 2H5a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h8.5A2.5 2.5 0 0 0 16 19.5V19' />
                </svg>
              ),
              onSelect: logout,
            },
            { key: 'language', node: <SettingsLanguageSelect compact /> },
          ]}
        />
      }

      <button
        type='button'
        className={gr.addGrocery}
        onClick={activeTab === 'groceries' ? openNewGrocery : toggleNewRecipe}
        aria-label={activeTab === 'groceries' ? t('ADD_NEW_GROCERY') : t('ADD_NEW_RECIPE')}
      >
        <svg viewBox='0 0 24 24' className={gr.addIcon} aria-hidden='true'>
          <path d='M12 5v14M5 12h14' stroke='currentColor' strokeWidth='2.2' strokeLinecap='round' />
        </svg>
      </button>
    </div>
  )
}
