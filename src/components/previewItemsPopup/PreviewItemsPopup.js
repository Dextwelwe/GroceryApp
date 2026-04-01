import { useTranslation } from 'react-i18next';
import Popup from '../popup/Popup';
import PreviewItemCard from '../previewItemCard/PreviewItemCard';

export default function PreviewItemsPopup({items, categoriesList, storesList, listClassName, itemClassName, onRemove, onEditCategory, onEditStore, onBack, onConfirm, showRemove, showRecipe }) {
  const { t } = useTranslation();
  const title = t('PREVIEW_LIST');

  const handleClose = () => {
    setTimeout(() => {
      if (onBack) onBack();
    }, 50);
  };

  return (
    <Popup title={title} close={handleClose} hideCloseButton={true}>
      <div>
        <div className={listClassName}>
          {items.map((item, index) => (
            <div key={index} className={itemClassName}>
              <PreviewItemCard data={item}  actions={{ remove: onRemove, editCategory: onEditCategory, editStore: onEditStore}} categoriesList={categoriesList} storesList={storesList} showRemove={showRemove} showRecipe={showRecipe} />
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button type='button' onClick={onBack} className='backButton'>{t('BACK')}</button>
          <button type='button' onClick={onConfirm} className='saveButton'>{t('CONFIRM')}</button>
        </div>
      </div>
    </Popup>
  );
}