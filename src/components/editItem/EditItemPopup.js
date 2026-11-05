import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Popup from '../popup/Popup';
import { useCategorySearch } from '../../hooks/useCategorySearch';
import { UOM_OPTIONS, normalizeUom, parseAmount } from '../../utils/quantity';
import ef from './editItem.module.css';

/**
 * Edits store / category / quantity of a grocery item.
 * Recipe ingredients are not editable (they can only be deleted).
 */
export default function EditItemPopup({ item, storesList = [], onClose, onSave }) {
  const { t } = useTranslation();
  const { getAllCategoriesList, getOneCategory } = useCategorySearch();
  const categories = getAllCategoriesList();

  const [category, setCategory] = useState(item.category || '');
  const [store, setStore] = useState(item.store || '');
  const [amount, setAmount] = useState(item.amount ?? '');
  const [uom, setUom] = useState(item.uom || '');

  function handleSubmit(event) {
    event.preventDefault();
    onSave({
      category: category || '',
      store: store || '',
      amount: parseAmount(amount),
      uom: normalizeUom(uom),
    });
  }

  return (
    <Popup title={t('EDIT_ITEM')} close={onClose}>
      <form className='uiForm' onSubmit={handleSubmit} noValidate>
        <p className={ef.itemName}>{item.name}</p>

        <label className='uiFieldLabel' htmlFor='editItemCategory'>{t('FILTERS.CATEGORY')}</label>
        <select
          id='editItemCategory'
          className={ef.select}
          value={category}
          onChange={(event) => setCategory(event.target.value)}
        >
          <option value=''>{t('NO_CATEGORY')}</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>{getOneCategory(cat.id)}</option>
          ))}
        </select>

        <label className='uiFieldLabel' htmlFor='editItemStore'>{t('STORE')}</label>
        <select
          id='editItemStore'
          className={ef.select}
          value={store}
          onChange={(event) => setStore(event.target.value)}
        >
          <option value=''>{t('NO_STORE')}</option>
          {storesList.map((option) => (
            <option key={option.desc} value={option.desc}>{option.desc}</option>
          ))}
        </select>

        <label className='uiFieldLabel' htmlFor='editItemAmount'>{t('AMOUNT')}</label>
        <div className={ef.qtyRow}>
          <input
            id='editItemAmount'
            className={`uiField ${ef.amount}`}
            type='number'
            inputMode='decimal'
            min='0'
            step='any'
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            placeholder={t('AMOUNT')}
          />
          <select
            className={`${ef.select} ${ef.uom}`}
            value={uom}
            onChange={(event) => setUom(event.target.value)}
            aria-label={t('UNIT')}
          >
            <option value=''>{t('UNIT')}</option>
            {UOM_OPTIONS.map((unit) => (
              <option key={unit} value={unit}>{unit}</option>
            ))}
          </select>
        </div>

        <button type='submit' className='uiBtn uiBtnPrimary uiBtnSubmit'>{t('SAVE')}</button>
      </form>
    </Popup>
  );
}
