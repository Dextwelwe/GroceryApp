import gr from './Groceries.module.css'
import '../../groceryCommon.css'

import { useAuth } from '../../providers/AuthProvider';
import { useTranslation } from 'react-i18next';
import { useState, useRef, useEffect, useMemo } from 'react';
import useLocalStorage from '../../hooks/useLocalStorage'
import { useCategorySearch } from '../../hooks/useCategorySearch';

// Api
import { saveNew } from '../../api/grocery';
import { fetchUserGroceries, getUserId } from '../../api/user';
import { fetchUserRecipes, saveNewRecipe as saveNewRecipeApi, updateRecipe as updateRecipeApi } from '../../api/recipes';

// Components
import Select from '../../components/select/Select';
import Popup from '../../components/popup/Popup';
import HeaderMenu from '../../components/header/header';
import GroceryCard from '../../components/groceryCard/GroceryCard';
import RecipeCard from '../../components/recipeCard/RecipeCard';
import Collapsible from '../../components/collapsible/collapsible';
import SettingsMenu from '../../components/settings/settingsMenu';
import AddItems from '../../components/add/addItems';
import PreviewItemCard from '../../components/previewItemCard/PreviewItemCard';

// Icons
import add from '../../assets/images/icons/add.svg'
import iconLogout from '../../assets/images/icons/exit.svg'
import animLoading from '../../assets/images/animations/loading.gif'
import filterIcon from '../../assets/images/icons/filter.svg'
import listIcon from '../../assets/images/icons/list.svg'
import iconMore from '../../assets/images/icons/more.svg'
import iconLanguage from '../../assets/images/icons/lang.svg'
import iconRecipe from '../../assets/images/icons/recipe.svg'

export default function Groceries({ goToGrocery, refresh }) {
  const { t, i18n } = useTranslation();
  const { userData, logout } = useAuth();

  const [activeTab, setActiveTab] = useState('groceries');
  const [isLoading, setIsLoading] = useState(false);
  const [groceries, setGroceries] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [recipeItems, setRecipeItems] = useState([]);
  const [editRecipeItems, setEditRecipeItems] = useState([]);
  const [previewRecipeList, setPreviewRecipeList] = useState([]);
  const [usersEmailList, setUsersEmailList] = useState([]);
  const [isAddNewGroceryVisible, setIsAddNewGroceryVisible] = useState(false);
  const [isAddNewRecipeVisible, setIsAddNewRecipeVisible] = useState(false);
  const [isDateDisabled, setIsDateDisabled] = useState(false);
  const [isSettingsPopup, setIsSettingsPopup] = useState(false);
  const [isPreviewListPopup, setIsPreviewListPopup] = useState(false);
  const [isEditRecipePopup, setIsEditRecipePopup] = useState(false);
  const [isAddItemsToRecipePopup, setIsAddItemsToRecipePopup] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState(null);

  const [defaultLabel, setDefaultLabel] = useLocalStorage('FLabel', 'all');
  const [defaultStatus, setDefaultStatus] = useLocalStorage('FStatus', 'all');
  const [defaultSortBy, setDefaultSortBy] = useLocalStorage('FSortBy', 'newest');
  const [filters, setFilters] = useState({ label: defaultLabel, status: defaultStatus, sortBy: defaultSortBy });
  const [nbFilters, setNbFilters] = useState(0);
  const defaultFilterValues = { categories: 'all', sortBy: 'newest' }

  let settingsPopupRef = useRef(null);
  let nameRef = useRef(null);
  let dateRef = useRef(null);
  let usersRef = useRef(null);
  let refRecipeItemsInput = useRef(null);
  let refEditRecipeItemsInput = useRef(null);
  const { getBestMatch, getAllCategoriesList } = useCategorySearch();

  const STATUS_MAP = { active: 'active', completed: 'completed' };
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
    }

    if (activeTab === 'recipes') {
      loadRecipes();
    }

    setNumberOfFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userData, refresh, filters, activeTab]);

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

  const norm = (s) => (s || '').toString().trim().toLowerCase();

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

      const [personal, shared] = await Promise.all([
        fetchUserGroceries(userData.uid),
        fetchUserGroceries(userData.uid, 'shared'),
      ]);

      setGroceries([...personal, ...shared]);
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

  const saveNewGrocery = async (e) => {
    let isValid = true;
    let disabledDateVal = null;
    e.preventDefault();
    let inputsRef = [nameRef, ...(!isDateDisabled ? [dateRef] : [])];

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
          date: !isDateDisabled ? parsedDate : disabledDateVal,
          sharedWith: usersList,
          type: usersList.length > 0 ? 'shared' : 'personal'
        }
      );
      if (result.success) {
        await loadGroceries();
        toggleNewGrocery();
        setUsersList([])
      } else {
        if (result.error.code === 'permission-denied') {
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
    setEditRecipeItems([]);
    if (refEditRecipeItemsInput.current) {
      refEditRecipeItemsInput.current.value = '';
    }
  }

  function openRecipeEditor(recipeId) {
    const recipe = recipes.find((entry) => entry.id === recipeId);
    if (!recipe) return;

    setSelectedRecipe(recipe);
    setPreviewRecipeList(recipe.items || []);
    setEditRecipeItems([]);
    setIsEditRecipePopup(true);
  }

  function addItemsToEditedRecipe() {
    if (editRecipeItems.length === 0) {
      return alert(t('WARNINGS.NO_ITEMS_TO_ADD'));
    }

    const existingNames = new Set(
      previewRecipeList.map((item) => (item.name || '').trim().toLowerCase())
    );
    const seenNewItems = new Set();

    const normalizedNewItems = editRecipeItems
      .map((item) => item.trim())
      .filter((item) => item.length > 0)
      .filter((item) => {
        const key = item.toLowerCase();
        if (existingNames.has(key) || seenNewItems.has(key)) {
          return false;
        }
        seenNewItems.add(key);
        return true;
      });

    if (normalizedNewItems.length === 0) {
      return alert(t('WARNINGS.ALREADY_EXISTS'));
    }

    const itemsToAdd = normalizedNewItems.map((itemName) => {
      const matchedCategory = getBestMatch(itemName);
      return {
        name: itemName,
        category: matchedCategory || '',
        store: '',
        status: 'active',
        addedBy: userData.firstName
      };
    });

    setPreviewRecipeList((prev) => [...prev, ...itemsToAdd]);
    setIsAddItemsToRecipePopup(false);
    setEditRecipeItems([]);
    if (refEditRecipeItemsInput.current) {
      refEditRecipeItemsInput.current.value = '';
    }
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

  function resolveCategoryId(categoryValue) {
    const raw = (categoryValue || '').toString().trim();
    if (!raw) return '';

    const allCategories = getAllCategoriesList();
    const lowerRaw = raw.toLowerCase();
    const match = allCategories.find((cat) => {
      if (cat.id === raw) return true;
      const names = Object.values(cat.names || {}).map((name) => (name || '').toString().trim().toLowerCase());
      return names.includes(lowerRaw);
    });

    return match ? match.id : raw;
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
        category: resolveCategoryId(item.category),
        store: item.store,
        status: item.status,
        addedBy: item.addedBy
      }))
    });

    if (result.success) {
      setIsPreviewListPopup(false);
      setPreviewRecipeList([]);
      setRecipeItems([]);
      if (refRecipeItemsInput.current) {
        refRecipeItemsInput.current.value = '';
      }
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
        category: resolveCategoryId(item.category),
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

  function loadPreviewList(e) {
    let isValid = true;
    e.preventDefault();
    if (!validateInput(nameRef.current.value)) {
      nameRef.current.style.borderColor = 'red';
      isValid = false;
    } else {
      nameRef.current.style.borderColor = '';
    }

    if (recipeItems.length === 0) {
      isValid = false;
      refRecipeItemsInput.current.style.borderColor = 'red';
    } else {
      refRecipeItemsInput.current.style.borderColor = '';
    }

    if (isValid) {
      let previewItemsArray = recipeItems.map(item => {
        const matchedCategory = getBestMatch(item);

        return {
          name: item,
          category: matchedCategory || '',
          store: '',
          status: 'active',
          addedBy: userData.firstName
        };
      });
      setPreviewRecipeList(previewItemsArray);
      setIsPreviewListPopup(true);
    }
  }

  const addUser = async () => {
    let userInput = usersRef.current.value;
    if (userData.isTestUser) { return alert(t('WARNINGS.NOT_PERMITTED_FOR_GUESTS')) }
    if (!userInput) return;
    if (usersEmailList.includes(userInput)) return;
    if (userInput === userData.email) return;

    let userId = await getUserId(userInput);
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

  function getDate(d) {
    if (!d) return null;
    try { return typeof d?.toDate === 'function' ? d.toDate() : new Date(d); }
    catch { return null; }
  };

  const openGrocery = (id) => {
    goToGrocery(id);
  }

  function setNumberOfFilters() {
    let count = 0;
    if (filters.label !== defaultFilterValues.categories) count++;
    if (filters.status !== defaultFilterValues.categories) count++;
    if (filters.sortBy !== defaultFilterValues.sortBy) count++;
    setNbFilters(count);
  }

  function resetFilters() {
    setDefaultLabel('all');
    setDefaultStatus('all');
    setDefaultSortBy('newest');
    setFilters({ label: 'all', status: 'all', sortBy: 'newest' });
    setNbFilters(0);
  }

  const changeLanguage = (e) => i18n.changeLanguage(e.target.value);

  return (
    <div className='mainContentWrapper'>
      <HeaderMenu title={headerTitle} headerItems={headerItems} headerNav={null} />

      {activeTab === 'groceries' && <div className='subHeaderWrapper'>
        <Collapsible title={`${t('FILTERS_LABEL')}${nbFilters > 0 ? ` (${nbFilters})` : ''}`} icon={filterIcon}>
          <div className='filtersWrapper'>
            <Select label={t('TYPE')} options={optionsLabel} name='label' value={filters.label} onChange={handleFilterChange} doHighLight={filters.label !== defaultFilterValues.categories && true} />
            <Select label={t('STATUS_LBL')} options={optionsStatus} name='status' value={filters.status} onChange={handleFilterChange} doHighLight={filters.status !== defaultFilterValues.categories && true} />
            <Select label={t('SORT_BY')} options={optionsSortBy} name='sortBy' value={filters.sortBy} onChange={handleFilterChange} doHighLight={filters.sortBy !== defaultFilterValues.sortBy && true} />
          </div>
          <button className='actionButton resetFilterBgColor resetFiltersButton' onClick={resetFilters}>{t('RESET_FILTERS')}</button>
        </Collapsible>
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
              <img src={iconRecipe} alt='list icon' className={gr.tabButtonIcon} />
              {t('MY_RECIPES')}
            </button>
          </div>
        </div>
      </div>}

      {activeTab === 'recipes' && <div className='subHeaderWrapper'>
        <Collapsible title={`${t('FILTERS_LABEL')}${nbFilters > 0 ? ` (${nbFilters})` : ''}`} icon={filterIcon}>
          <div className='filtersWrapper'>
            <Select label={t('TYPE')} options={optionsLabel} name='label' value={filters.label} onChange={handleFilterChange} doHighLight={filters.label !== defaultFilterValues.categories && true} />
            <Select label={t('STATUS_LBL')} options={optionsStatus} name='status' value={filters.status} onChange={handleFilterChange} doHighLight={filters.status !== defaultFilterValues.categories && true} />
            <Select label={t('SORT_BY')} options={optionsSortBy} name='sortBy' value={filters.sortBy} onChange={handleFilterChange} doHighLight={filters.sortBy !== defaultFilterValues.sortBy && true} />
          </div>
          <button className='actionButton resetFilterBgColor resetFiltersButton' onClick={resetFilters}>{t('RESET_FILTERS')}</button>
        </Collapsible>
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
      </div>}

      {activeTab === 'groceries' && <div className={gr.list}>
        {
          isLoading &&
          <img className={gr.loadingAnimation} alt='loading' src={animLoading} />
        }
        {!isLoading && <>
          {(view.length ? view : []).map((grocery) => (
            <GroceryCard key={grocery.id} data={grocery} onClick={(e) => openGrocery(e)} onDelete={loadGroceries} />
          ))}
          {view.length === 0 && groceries.length > 0 && <div className={gr.empty}>{t('WARNINGS.NO_GROCERIES')}</div>}
        </>
        }
      </div>}

      {activeTab === 'recipes' && <div className={gr.list}>
        {recipes.length > 0 ? (
          recipes.map((recipe) => (
            <RecipeCard key={recipe.id} data={recipe} onClick={openRecipeEditor} />
          ))
        ) : (
          <div className={gr.empty}>{t('NO_RECIPES_YET')}</div>
        )}
      </div>}

      {isAddNewGroceryVisible &&
        <Popup title={t('ADD_NEW_GROCERY')} close={toggleNewGrocery}>
          <form className={gr.form} onSubmit={(e) => e.preventDefault()}>
            <label htmlFor='groceryName' >{t('NAME')} :</label>
            <input id='groceryName' ref={nameRef} className='input'></input>
            <label htmlFor='groceryDate'>{t('DATE')} :</label>
            <div className={gr.dateWrapper}>
              <input id='groceryDate' disabled={isDateDisabled === true} className={`${gr.dateInput} input`} type='date' onKeyDown={(e) => e.preventDefault()} onClick={(e) => e.target.showPicker && e.target.showPicker()} ref={dateRef}></input>
              <div className={gr.addDateCheckboxWrapper}>
                <label htmlFor='noDateCheckbox'>{t('NO_DATE')} :</label>
                <input id='noDateCheckbox' className={gr.addDateCheckbox} type='checkbox' checked={isDateDisabled} onChange={() => setIsDateDisabled(!isDateDisabled)}></input>
              </div>
            </div>
            <label htmlFor='userList'>{t('ADD_USERS')}</label>
            <div className={gr.userListWrapper}>
              <input id='userList' ref={usersRef} className={`input ${gr.userList}`} placeholder='user1234@mail.com'></input>
              <button type='button' onClick={addUser} className={gr.addUserButton}>+</button>
            </div>
            {usersEmailList.length > 0 && <><span className={gr.addedUsersTitle}>{t('ADDED_USERS')}</span><span className={gr.formMessage}>{usersEmailList.map(e => e).join(', ')}</span></>}
            <button type='button' onClick={(e) => { e.preventDefault(); saveNewGrocery(e) }} className='saveButton'>{t('SAVE')}</button>
          </form>
        </Popup>
      }

      {isAddNewRecipeVisible &&
        <Popup title={t('ADD_NEW_RECIPE')} close={() => { if (!isPreviewListPopup) toggleNewRecipe() }}>
          <form className={gr.form} onSubmit={(e) => e.preventDefault()}>
            <label htmlFor='recipeName' >{t('RECIPE_NAME')} :</label>
            <input id='recipeName' ref={nameRef} className='input'></input>
            <label htmlFor='items' >{t('ITEMS')} :</label>
            <AddItems id='items' ref={refRecipeItemsInput} setItemsList={(val) => setRecipeItems(val)} />
            {usersEmailList.length > 0 && <><span className={gr.addedUsersTitle}>{t('ADDED_USERS')}</span><span className={gr.formMessage}>{usersEmailList.map(e => e).join(', ')}</span></>}
            <button type='button' onClick={(e) => { e.preventDefault(); loadPreviewList(e) }} className='saveButton'>{t('SAVE')}</button>
          </form>
        </Popup>
      }

      {isPreviewListPopup && previewRecipeList.length > 0 &&
        <Popup title={t('PREVIEW_LIST')} close={() => setTimeout(() => setIsPreviewListPopup(false), 50)} hideCloseButton={true}>
          <div>
            <div className={gr.previewList}>
              {previewRecipeList.map((item, index) => (
                <div key={index} className={gr.previewItem}>
                  <PreviewItemCard data={item} actions={{ remove: (item) => removeRecipeItem(item), editCategory: (itemName, newCategoryId) => editPreviewRecipeItem(itemName, newCategoryId) }} categoriesList={getAllCategoriesList()} />
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button type='button' onClick={(e) => { e.preventDefault(); setIsPreviewListPopup(false) }} className='backButton'>{t('BACK')}</button>
              <button type='button' onClick={(e) => { e.preventDefault(); saveNewRecipe() }} className='saveButton'>{t('CONFIRM')}</button>
            </div>
          </div>
        </Popup>
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
            {previewRecipeList.length === 0 && <div className={gr.empty}></div>}
            <div className={gr.recipeBottomActions}>
              <button style={{width : '35%'}} type='button' onMouseDown={(e) => e.stopPropagation()} onClick={(e) => { e.preventDefault(); setIsAddItemsToRecipePopup(true) }} className={`saveButton ${gr.recipeAddItemsButton}`}>{t('ADD_ITEMS')}</button>
              <button style={{width : '65%'}} type='button' onClick={(e) => { e.preventDefault(); saveEditedRecipe() }} className={`saveButton ${gr.recipeSaveButton}`}>{t('SAVE')}</button>
            </div>
        </Popup>
      }

      {isAddItemsToRecipePopup &&
        <Popup title={t('ADD_ITEMS')} close={() => setIsAddItemsToRecipePopup(false)}>
          <div className={gr.form}>
            <label htmlFor='editRecipeItems'>{t('ITEMS')} :</label>
            <AddItems id='editRecipeItems' ref={refEditRecipeItemsInput} setItemsList={(val) => setEditRecipeItems(val)} />
            <div className={gr.popupActions}>
              <button type='button' onClick={(e) => { e.preventDefault(); addItemsToEditedRecipe() }} className='saveButton'>{t('ADD_ITEMS')}</button>
            </div>
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
          <div className='settingsLanguageWrapper'>
            <div className='SettingItemWrapper'>
              <img src={iconLanguage} alt='Logout Icon' className='settingsIcon' />
              <span className='settingsItem'>{t('LANGUAGE')}</span>
            </div>
            <select name='settingsSelect' className='settingsSelect' defaultValue={i18n.language} onChange={changeLanguage}>
              <option value='en'>English</option>
              <option value='fr'>Français</option>
              <option value='ru'>Русский</option>
            </select>
          </div>
        </SettingsMenu>
      }

      <img alt='Add' src={add} className={gr.addGrocery} onClick={activeTab === 'groceries' ? toggleNewGrocery : toggleNewRecipe} />
    </div>
  )
}
