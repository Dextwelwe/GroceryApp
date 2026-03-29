import { useTranslation } from 'react-i18next';
import Popup from '../popup/Popup';
import PreviewItemCard from '../previewItemCard/PreviewItemCard';

export default function PreviewItemsPopup({items, categoriesList, listClassName, itemClassName, onRemove, onEditCategory, onBack, onConfirm }) {
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
              <PreviewItemCard data={item}  actions={{ remove: onRemove, editCategory: onEditCategory}} categoriesList={categoriesList} />
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