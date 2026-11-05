import { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import './addItems.css'
import { useTranslation } from 'react-i18next';
import { useCategorySearch } from '../../hooks/useCategorySearch';
import { UOM_OPTIONS, hasQuantity, normalizeUom, parseAmount } from '../../utils/quantity';
import deleteIcon from '../../assets/images/icons/delete.svg';
import categoryIcon from '../../assets/images/icons/category.svg';
import storeIcon from '../../assets/images/icons/store.svg';

const SUGGESTION_GAP = 6;
const SUGGESTION_MAX_HEIGHT = 220;
const SUGGESTION_MIN_HEIGHT = 132;
const VIEWPORT_MARGIN = 8;

/**
 * @param {Object} props
 * @param {(items: Array<import('../../utils/quantity').GroceryItem>) => void} props.onSave
 * @param {boolean} [props.requireQuantity] - recipe ingredients need amount + uom
 */
export default function AddItems({ onSave, storesList, userName, requireQuantity = false }) {
  const { t } = useTranslation();
  const { getItemSuggestions, getBestMatch, getAllCategoriesList, getOneCategory } = useCategorySearch();
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [items, setItems] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionStyle, setSuggestionStyle] = useState(null);
  const [showQuantityErrors, setShowQuantityErrors] = useState(false);
  const inputRef = useRef(null);
  const inputRowRef = useRef(null);
  const suggestionsRef = useRef(null);
  const categoriesList = getAllCategoriesList();
  const missingQuantity = requireQuantity && items.some((item) => !hasQuantity(item));

  // The suggestion list is rendered in a portal with fixed positioning so it can
  // never be clipped by a short popup (e.g. when no item has been added yet) and
  // always gets as much room as the viewport allows (flipping above the field when
  // there is not enough space below).
  const updateSuggestionPosition = useCallback(() => {
    const row = inputRowRef.current;
    if (!row) return;

    const rect = row.getBoundingClientRect();
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
    const spaceBelow = viewportHeight - rect.bottom - SUGGESTION_GAP - VIEWPORT_MARGIN;
    const spaceAbove = rect.top - SUGGESTION_GAP - VIEWPORT_MARGIN;
    const openUp = spaceBelow < SUGGESTION_MIN_HEIGHT && spaceAbove > spaceBelow;
    const availableSpace = Math.max(openUp ? spaceAbove : spaceBelow, SUGGESTION_MIN_HEIGHT);

    const next = {
      position: 'fixed',
      left: `${Math.round(rect.left)}px`,
      width: `${Math.round(rect.width)}px`,
      maxHeight: `${Math.round(Math.min(SUGGESTION_MAX_HEIGHT, availableSpace))}px`,
      top: openUp ? 'auto' : `${Math.round(rect.bottom + SUGGESTION_GAP)}px`,
      bottom: openUp ? `${Math.round(viewportHeight - rect.top + SUGGESTION_GAP)}px` : 'auto',
    };

    setSuggestionStyle((prev) =>
      prev && Object.keys(next).every((key) => prev[key] === next[key]) ? prev : next
    );
  }, []);

  useLayoutEffect(() => {
    if (!showSuggestions || suggestions.length === 0) {
      setSuggestionStyle(null);
      return;
    }

    updateSuggestionPosition();

    window.addEventListener('resize', updateSuggestionPosition);
    window.addEventListener('scroll', updateSuggestionPosition, true);
    return () => {
      window.removeEventListener('resize', updateSuggestionPosition);
      window.removeEventListener('scroll', updateSuggestionPosition, true);
    };
  }, [showSuggestions, suggestions, updateSuggestionPosition]);

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
      amount: null,
      uom: null,
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

  function editItemAmount(name, rawAmount) {
    setItems(prev => prev.map(i => i.name === name ? { ...i, amount: parseAmount(rawAmount) } : i));
  }

  function editItemUom(name, rawUom) {
    setItems(prev => prev.map(i => i.name === name ? { ...i, uom: normalizeUom(rawUom) } : i));
  }

  function handleConfirm() {
    if (items.length === 0) return;
    if (requireQuantity && missingQuantity) {
      setShowQuantityErrors(true);
      return;
    }
    onSave(items);
  }

  return (
    <div className="add-items-root">
      <div className="add-items-input-row" ref={inputRowRef}>
        <input
          ref={inputRef}
          type="text"
          className="uiField"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
          placeholder={t('ADD_ITEM_PLACEHOLDER')}
          autoComplete="off"
        />
        <button type="button" className="uiBtnAdd" onClick={handleAddClick} aria-label={t('ADD_ITEMS')}>
          +
        </button>
      </div>

      {showSuggestions && suggestions.length > 0 && suggestionStyle &&
        createPortal(
          <ul
            className="add-items-suggestions"
            ref={suggestionsRef}
            style={suggestionStyle}
            data-popup-keep-open="true"
          >
            {suggestions.map((s, i) => (
              <li key={i} className="add-items-suggestion" onClick={() => handleSuggestionClick(s)}>
                <span className="add-items-suggestion-name">{s.label}</span>
                <span className="add-items-suggestion-category">{getOneCategory(s.category)}</span>
              </li>
            ))}
          </ul>,
          document.body
        )}

      <div className="add-items-list">
        {items.map((item, index) => (
            <div key={index} className="add-items-row">
              <div className="add-items-row-main">
                <span className="add-items-row-name">{item.name}</span>
                <div className="add-items-row-selects">
                  <span
                    className={`add-items-qty ${
                      showQuantityErrors && !hasQuantity(item) ? 'add-items-qtyMissing' : ''
                    }`}
                  >
                    <input
                      type="number"
                      inputMode="decimal"
                      min="0"
                      step="any"
                      className="add-items-amount"
                      value={item.amount ?? ''}
                      onChange={(e) => editItemAmount(item.name, e.target.value)}
                      placeholder={t('AMOUNT')}
                      aria-label={t('AMOUNT')}
                      aria-invalid={showQuantityErrors && !hasQuantity(item) ? 'true' : 'false'}
                    />
                    <select
                      className="add-items-uom"
                      value={item.uom ?? ''}
                      onChange={(e) => editItemUom(item.name, e.target.value)}
                      aria-label={t('UNIT')}
                    >
                      <option value="">{t('UNIT')}</option>
                      {UOM_OPTIONS.map((uom) => (
                        <option key={uom} value={uom}>{uom}</option>
                      ))}
                    </select>
                  </span>
                  <span className={`add-items-select-chip ${item.category === '' ? 'add-items-select-chipMissing' : ''}`}>
                    <img alt="" src={categoryIcon} />
                    <span className="add-items-select-value">
                      {item.category === '' ? t('NO_CATEGORY') : getOneCategory(item.category)}
                    </span>
                    <select
                      className="add-items-select"
                      value={item.category}
                      aria-label={t('FILTERS.CATEGORY')}
                      onChange={(e) => editItemCategory(item.name, e.target.value)}
                    >
                      <option value="">{t('NO_CATEGORY')}</option>
                      {categoriesList.map((cat) => (
                        <option key={cat.id} value={cat.id}>{getOneCategory(cat.id)}</option>
                      ))}
                    </select>
                  </span>
                  <span className="add-items-select-chip">
                    <img alt="" src={storeIcon} />
                    <span className="add-items-select-value">
                      {item.store === '' ? t('NO_STORE') : item.store}
                    </span>
                    <select
                      className="add-items-select"
                      value={item.store}
                      aria-label={t('STORE')}
                      onChange={(e) => editItemStore(item.name, e.target.value)}
                    >
                      <option value="">{t('NO_STORE')}</option>
                      {storesList && storesList.map((store, si) => (
                        <option key={si} value={store.desc}>{store.desc}</option>
                      ))}
                    </select>
                  </span>
                </div>
              </div>
              <button
                type="button"
                className="add-items-row-remove"
                onClick={() => removeItem(item.name)}
                aria-label={t('DELETE')}
                title={t('DELETE')}
              >
                <img src={deleteIcon} alt="" />
              </button>
            </div>
          ))}
      </div>

      {requireQuantity && showQuantityErrors && missingQuantity &&
        <p className="add-items-error" role="alert">{t('WARNINGS.QUANTITY_REQUIRED')}</p>
      }

      <div className="uiBtnRow">
        <button type="button" onClick={handleConfirm} className="uiBtn uiBtnPrimary" disabled={items.length === 0}>
          {t('CONFIRM')}
        </button>
      </div>
    </div>
  );
}
