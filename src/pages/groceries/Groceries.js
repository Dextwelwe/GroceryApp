import gr from './Groceries.module.css'
import '../../groceryCommon.css'
import { norm, validateInput, getDate, resolveCategoryId } from '../../utils/itemUtils';

import { useAuth } from '../../providers/AuthProvider';
import { useTranslation } from 'react-i18next';
import { useState, useRef, useEffect, useMemo } from 'react';
import useLocalStorage from '../../hooks/useLocalStorage'
import { useCategorySearch } from '../../hooks/useCategorySearch';

// Api
import { saveNew, fetchAllGroceries } from '../../api/grocery';
import { getUserIdFromEmail } from '../../api/user';
import { fetchUserRecipes, saveNewRecipe as saveNewRecipeApi, updateRecipe as updateRecipeApi, deleteRecipe as deleteRecipeApi } from '../../api/recipes';

// Components
import Select from '../../components/select/Select';
import Popup from '../../components/popup/Popup';
import HeaderMenu from '../../components/header/header';
import GroceryCard from '../../components/groceryCard/GroceryCard';
import RecipeCard from '../../components/recipeCard/RecipeCard';
import FilterPanel from '../../components/filterPanel/FilterPanel';
import SettingsMenu from '../../components/settings/settingsMenu';
import SettingsLanguageSelect from '../../components/settings/SettingsLanguageSelect';
import AddItems from '../../components/add/addItems';
import PreviewItemCard from '../../components/previewItemCard/PreviewItemCard';
import PreviewItemsPopup from '../../components/previewItemsPopup/PreviewItemsPopup';

// Icons
import add from '../../assets/images/icons/add.svg'
import iconLogout from '../../assets/images/icons/exit.svg'
import animLoading from '../../assets/images/animations/loading.gif'
import filterIcon from '../../assets/images/icons/filter.svg'
import listIcon from '../../assets/images/icons/list.svg'
import iconMore from '../../assets/images/icons/more.svg'
import iconRecipe from '../../assets/images/icons/recipe.svg'

const STATUS_MAP = { active: 'active', completed: 'completed' };
const defaultFilterValues = { categories: 'all', sortBy: 'newest' };

export default function Groceries({ goToGrocery, refresh }) {
  const { t } = useTranslation();
  const { userData, logout } = useAuth();

  const [activeTab, setActiveTab] = useState('groceries');
  const [isLoading, setIsLoading] = useState(false);
  const [groceries, setGroceries] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [previewRecipeList, setPreviewRecipeList] = useState([]);
  const [usersEmailList, setUsersEmailList] = useState([]);
  const [isAddNewGroceryVisible, setIsAddNewGroceryVisible] = useState(false);
  const [isAddNewRecipeVisible, setIsAddNewRecipeVisible] = useState(false);
  const [isSettingsPopup, setIsSettingsPopup] = useState(false);
  const [isPreviewListPopup, setIsPreviewListPopup] = useState(false);
  const [isEditRecipePopup, setIsEditRecipePopup] = useState(false);
  const [isAddItemsToRecipePopup, setIsAddItemsToRecipePopup] = useState(false);
  const [hasAddItemsPending, setHasAddItemsPending] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState(null);

  const [defaultLabel, setDefaultLabel] = useLocalStorage('FLabel', 'all');
  const [defaultStatus, setDefaultStatus] = useLocalStorage('FStatus', 'all');
  const [defaultSortBy, setDefaultSortBy] = useLocalStorage('FSortBy', 'newest');
  const [filters, setFilters] = useState({ label: defaultLabel, status: defaultStatus, sortBy: defaultSortBy });
  const [nbFilters, setNbFilters] = useState(0);

  let settingsPopupRef = useRef(null);
  let nameRef = useRef(null);
  let dateRef = useRef(null);
  let usersRef = useRef(null);
  const touchStartRef = useRef({ x: 0, y: 0 });
  const { getAllCategoriesList } = useCategorySearch();

  const headerItems = [{ src: iconMore, alt: 'Icon More', clickaction: () => setIsSettingsPopup(!isSettingsPopup), buttonLabel: t('OPTIONS') }];

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

  const toggleNewGrocery = () => {
    setIsAddNewGroceryVisible(!isAddNewGroceryVisible);
  }

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

  const saveNewGrocery = async (e) => {
    let isValid = true;
    e.preventDefault();
    let inputsRef = [nameRef];

    inputsRef.forEach(element => {
      if (!validateInput(element.current.value)) {
        element.current.style.backgroundColor = '#ffcdd2';
        isValid = false;
      }
    });

    let dateVal = dateRef.current.value;
    let parsedDate = null;

    if (dateVal) {
      let dateArr = dateVal.split('-');
      let year = dateArr[0];
      let month = parseInt(dateArr[1], 10) - 1;
      let day = dateArr[2];
      parsedDate = new Date(year, month, day);
    }

    if (isValid) {
      let result = await saveNew(
        {
          owner: userData.uid,
          name: nameRef.current.value,
          date: parsedDate,
          sharedWith: usersList,
          type: usersList.length > 0 ? 'shared' : 'personal'
        }
      );
      if (result.success) {
        await loadGroceries();
        toggleNewGrocery();
        setUsersList([])
      } else {
        if (result.error?.code === 'permission-denied') {
          alert(t('WARNINGS.NOT_PERMITTED_FOR_GUESTS'))
        } else {
          alert(t('WARNINGS.SERVER_ERROR'));
        }
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
        addedBy: item.addedBy
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
        addedBy: item.addedBy || userData.firstName
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

  const addUser = async () => {
    let userInput = usersRef.current.value;
    if (userData.isTestUser) { return alert(t('WARNINGS.NOT_PERMITTED_FOR_GUESTS')) }
    if (!userInput) return;
    if (usersEmailList.includes(userInput)) return;
    if (userInput === userData.email) return;

    let userId = await getUserIdFromEmail(userInput);
    if (userId) {
      setUsersEmailList(prev => ([...prev, userInput]));
      setUsersList(prev => ([...prev, userId]));
    } else {
      alert(t('USER') + " : '" + userInput + " ' " + t('WARNINGS.NOT_FOUND'));
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

    if (isAddNewGroceryVisible || isAddNewRecipeVisible || isPreviewListPopup || isEditRecipePopup || isAddItemsToRecipePopup) {
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
      setActiveTab('recipes');
    }

    if (deltaX > 0 && activeTab === 'recipes') {
      setActiveTab('groceries');
    }
  }

  return (
    <div className='mainContentWrapper' onTouchStart={handleTabTouchStart} onTouchEnd={handleTabTouchEnd}>
      <HeaderMenu title={headerTitle} headerItems={headerItems} headerNav={null} />

      <div className='subHeaderWrapper'>
        <FilterPanel title={t('FILTERS_LABEL')} icon={filterIcon} onReset={resetFilters} resetLabel={t('RESET_FILTERS')} badge={nbFilters}>
          {activeTab === 'groceries' && <>
            <Select label={t('TYPE')} options={optionsLabel} name='label' value={filters.label} onChange={handleFilterChange} doHighLight={filters.label !== defaultFilterValues.categories && true} />
            <Select label={t('STATUS_LBL')} options={optionsStatus} name='status' value={filters.status} onChange={handleFilterChange} doHighLight={filters.status !== defaultFilterValues.categories && true} />
          </>}
          <Select label={t('SORT_BY')} options={optionsSortBy} name='sortBy' value={filters.sortBy} onChange={handleFilterChange} doHighLight={filters.sortBy !== defaultFilterValues.sortBy && true} />
        </FilterPanel>

        <div className='subFiltersContentWrapper'>
          <div className={gr.tabMenu}>
            <button
              className={`${gr.tabButton} ${activeTab === 'groceries' ? gr.tabButtonActive : ''}`}
              onClick={() => setActiveTab('groceries')}
            >
              <img src={listIcon} alt='list icon' className={gr.tabButtonIcon} />
              {t('MY_GROCERIES')}
            </button>
            <button
              className={`${gr.tabButton} ${activeTab === 'recipes' ? gr.tabButtonActive : ''}`}
              onClick={() => setActiveTab('recipes')}
            >
              <img src={iconRecipe} alt='recipe icon' className={gr.tabButtonIcon} />
              {t('MY_RECIPES')}
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'groceries' && <div className={gr.list}>
        {
          isLoading &&
          <img className={gr.loadingAnimation} alt='loading' src={animLoading} />
        }
        {!isLoading && <>
          {view.map((grocery) => (
            <GroceryCard key={grocery.id} data={grocery} onClick={goToGrocery} onDelete={loadGroceries} />
          ))}
          {view.length === 0 && groceries.length > 0 && <div className={gr.empty}>{t('WARNINGS.NO_GROCERIES')}</div>}
        </>
        }
      </div>}

      {activeTab === 'recipes' && <div className={gr.list}>
        {recipeView.length > 0 ? (
          recipeView.map((recipe) => (
            <RecipeCard key={recipe.id} data={recipe} onClick={openRecipeEditor} onDelete={deleteRecipe} />
          ))
        ) : (
          <div className={gr.empty}>{t('NO_RECIPES_YET')}</div>
        )}
      </div>}

      {isAddNewGroceryVisible &&
        <Popup title={t('ADD_NEW_GROCERY')} close={toggleNewGrocery} closeOnOutsideClick={false}>
          <form className={gr.form} onSubmit={(e) => e.preventDefault()}>
            <label htmlFor='groceryName' >{t('NAME')} :</label>
            <input id='groceryName' ref={nameRef} className='input'></input>
            <label htmlFor='groceryDate'>{t('DATE')} :</label>
            <div className={gr.dateWrapper}>
              <input id='groceryDate' className={`${gr.dateInput} `} type='date' onKeyDown={(e) => e.preventDefault()} onClick={(e) => e.target.showPicker && e.target.showPicker()} ref={dateRef}></input>
            </div>
            <label htmlFor='userList'>{t('ADD_USERS')}</label>
            <div className={gr.userListWrapper}>
              <input id='userList' ref={usersRef} className={`input ${gr.userList}`} placeholder='user1234@mail.com'></input>
              <button type='button' onClick={addUser} className={gr.addUserButton}>+</button>
            </div>
            {usersEmailList.length > 0 && <><span className={gr.addedUsersTitle}>{t('ADDED_USERS')}</span><span className={gr.formMessage}>{usersEmailList.join(', ')}</span></>}
            <button type='button' onClick={(e) => { e.preventDefault(); saveNewGrocery(e) }} className='saveButton'>{t('SAVE')}</button>
          </form>
        </Popup>
      }

      {isAddNewRecipeVisible &&
        <Popup title={t('ADD_NEW_RECIPE')} close={() => { if (!isPreviewListPopup) toggleNewRecipe() }} closeOnOutsideClick={!hasAddItemsPending}>
          <form className={gr.form} onSubmit={(e) => e.preventDefault()}>
            <label htmlFor='recipeName' >{t('RECIPE_NAME')} :</label>
            <input id='recipeName' ref={nameRef} className='input'></input>
            <label htmlFor='items' >{t('ITEMS')} :</label>
            <AddItems onSave={handleRecipeItemsReady} onItemsChange={setHasAddItemsPending} storesList={[]} userName={userData.firstName} />
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
            <button type='button' onMouseDown={(e) => e.stopPropagation()} onClick={(e) => { e.preventDefault(); setIsAddItemsToRecipePopup(true) }} className={`${gr.recipeAddItemsButton}`}><span>+</span></button>
            {previewRecipeList.length === 0 && <div className={gr.empty}></div>}
            <div className={gr.recipeBottomActions}>
              <button style={{marginTop : '15px'}} type='button' onClick={(e) => { e.preventDefault(); saveEditedRecipe() }} className={`saveButton ${gr.recipeSaveButton}`}>{t('SAVE')}</button>
            </div>
        </Popup>
      }

      {isAddItemsToRecipePopup &&
        <Popup title={t('ADD_ITEMS')} close={() => setIsAddItemsToRecipePopup(false)} closeOnOutsideClick={!hasAddItemsPending}>
          <div className={gr.form}>
            <AddItems onSave={addItemsToEditedRecipe} onItemsChange={setHasAddItemsPending} storesList={[]} userName={userData.firstName} />
          </div>
        </Popup>
      }

      {
        isSettingsPopup &&
        <SettingsMenu ref={settingsPopupRef} close={() => setIsSettingsPopup(false)}>
          <div className='SettingItemWrapper settingsBtBorder'>
            <img src={iconLogout} alt='Logout Icon' className='settingsIcon' />
            <button className='settingsItem' onClick={logout}>{t('LOGOUT')}</button>
          </div>
          <SettingsLanguageSelect />
        </SettingsMenu>
      }

      <img alt='Add' src={add} className={gr.addGrocery} onClick={activeTab === 'groceries' ? toggleNewGrocery : toggleNewRecipe} />
    </div>
  )
}
