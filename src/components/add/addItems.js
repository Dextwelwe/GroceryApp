import { useState, useRef, useEffect } from 'react'
import './addItems.css'
import { useTranslation } from 'react-i18next';
import { useCategorySearch } from '../../hooks/useCategorySearch';
import deleteIcon from '../../assets/images/icons/delete.svg';
import categoryIcon from '../../assets/images/icons/category.svg';
import storeIcon from '../../assets/images/icons/store.svg';
import noteIcon from '../../assets/images/icons/name.svg';
import ic from '../ItemCard/itemCard.module.css';

export default function AddItems({ onSave, storesList, userName }) {
  const { t } = useTranslation();
  const { getItemSuggestions, getBestMatch, getAllCategoriesList, getOneCategory } = useCategorySearch();
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [items, setItems] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);
  const categoriesList = getAllCategoriesList();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target) &&
          inputRef.current && !inputRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleInputChange(e) {
    const val = e.target.value;
    setInputValue(val);
    if (val.trim().length >= 2) {
      const results = getItemSuggestions(val.trim());
      setSuggestions(results);
      setShowSuggestions(results.length > 0);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }

  function addItem(name, category) {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (items.some(i => i.name.toLowerCase() === trimmed.toLowerCase())) return;
    setItems(prev => [...prev, {
      name: trimmed,
      category: category || '',
      store: '',
      status: 'active',
      addedBy: userName || ''
    }]);
    setInputValue('');
    setSuggestions([]);
    setShowSuggestions(false);
    inputRef.current?.focus();
  }

  function handleSuggestionClick(suggestion) {
    addItem(suggestion.label, suggestion.category);
  }

  function handleAddClick() {
    if (!inputValue.trim()) return;
    const matched = getBestMatch(inputValue.trim());
    addItem(inputValue.trim(), matched || '');
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddClick();
    }
  }

  function removeItem(name) {
    setItems(prev => prev.filter(i => i.name !== name));
  }

  function editItemCategory(name, newCategoryId) {
    setItems(prev => prev.map(i => i.name === name ? { ...i, category: newCategoryId } : i));
  }

  function editItemStore(name, newStore) {
    setItems(prev => prev.map(i => i.name === name ? { ...i, store: newStore } : i));
  }

  function handleConfirm() {
    if (items.length === 0) return;
    onSave(items);
  }

  return (
    <div className="add-items-root">
      <div className="add-items-input-row">
        <input
          ref={inputRef}
          type="text"
          className="add-items-input"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
          placeholder={t('ADD_ITEM_PLACEHOLDER')}
          autoComplete="off"
        />
        <button type="button" className="add-items-add-btn" onClick={handleAddClick} aria-label={t('ADD_ITEMS')}>
          <span className="add-items-add-icon">+</span>
        </button>

        {showSuggestions && suggestions.length > 0 && (
          <ul className="add-items-suggestions" ref={suggestionsRef}>
            {suggestions.map((s, i) => (
              <li key={i} className="add-items-suggestion" onClick={() => handleSuggestionClick(s)}>
                <span className="add-items-suggestion-name">{s.label}</span>
                <span className="add-items-suggestion-category">{getOneCategory(s.category)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="add-items-list">
        {items.map((item, index) => (
            <div key={index} className={ic.groceryCardWrapper} style={{ marginTop: '10px' }}>
              <div className={ic.dataWrapper}>
                <div className={ic.nameWrapper}>
                  <img alt="Name" src={noteIcon} className={ic.nameIcon} />
                  <span className={ic.name}>{item.name}</span>
                </div>
                <div className={ic.labelsWrapper}>
                  <div style={{ border: item.category === '' ? '1px solid red' : '' }} className={ic.category}>
                    <img alt="Category" src={categoryIcon} className={ic.icon} />
                    <select
                      className={`${ic.dataLabel} add-items-select`}
                      value={item.category}
                      onChange={(e) => editItemCategory(item.name, e.target.value)}
                    >
                      <option value="">{t('NO_CATEGORY')}</option>
                      {categoriesList.map((cat) => (
                        <option key={cat.id} value={cat.id}>{getOneCategory(cat.id)}</option>
                      ))}
                    </select>
                  </div>
                  <div className={ic.store}>
                    <img alt="Store" src={storeIcon} className={ic.icon} />
                    <select
                      className={`${ic.dataLabel} add-items-select`}
                      value={item.store}
                      onChange={(e) => editItemStore(item.name, e.target.value)}
                    >
                      <option value="">{t('NO_STORE')}</option>
                      {storesList && storesList.map((store, si) => (
                        <option key={si} value={store.desc}>{store.desc}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              <div className={ic.rightItems}>
                <img src={deleteIcon} className={ic.menuIcon} onClick={() => removeItem(item.name)} alt="Remove" />
              </div>
            </div>
          ))}
      </div>

      <button type="button" onClick={handleConfirm} className="saveButton" disabled={items.length === 0} style={{ marginTop: '10px' }}>
        {t('CONFIRM')}
      </button>
    </div>
  );
}
