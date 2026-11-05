import remove from '../../assets/images/icons/delete.svg'
import { useTranslation } from 'react-i18next';
import categoryIcon from '../../assets/images/icons/category.svg';
import storeIcon from '../../assets/images/icons/store.svg';
import recipeIcon from '../../assets/images/icons/recipe.svg';
import pic from './previewItemCard.module.css'
import { formatQuantity } from '../../utils/quantity';
import { useCategorySearch } from '../../hooks/useCategorySearch';

export default function PreviewItemCard({data, actions, categoriesList, storesList, showRemove = true, showRecipe = true}) {

  const { t } = useTranslation();
  const { getOneCategory } = useCategorySearch();
  const categoryLabel = data.category ? getOneCategory(data.category) : t('NO_CATEGORY');
  const quantity = formatQuantity(data.amount, data.uom);

  function removeCall(){
    actions.remove && actions.remove(data.name);
  }

  function categoryChangeCall(e){
    actions.editCategory && actions.editCategory(data.name, e.target.value);
  }

  function storeChangeCall(e){
    actions.editStore && actions.editStore(data.name, e.target.value);
  }

  return (
    <div className={pic.row}>
      <div className={pic.main}>
        <span className={pic.titleRow}>
          <span className={pic.name}>{data.name}</span>
          {quantity && <span className={pic.quantity}>{quantity}</span>}
        </span>
        <div className={pic.chips}>
          <span className={`${pic.chip} ${data.category === '' ? pic.chipMissing : ''}`}>
            <img alt="" src={categoryIcon} />
            <span className={pic.chipText}>{categoryLabel}</span>
            <select
              name='category'
              className={pic.select}
              value={data.category || ''}
              onChange={categoryChangeCall}
              aria-label={t('FILTERS.CATEGORY')}
            >
              <option value={data.category || ''}>{categoryLabel}</option>
              {categoriesList && categoriesList.filter(category => category.id !== data.category).map((category, index) => (
                <option key={index} value={category.id}>{getOneCategory(category.id)}</option>
              ))}
            </select>
          </span>

          {storesList
            ? <span className={pic.chip}>
                <img alt="" src={storeIcon} />
                <span className={pic.chipText}>{data.store || t('NO_STORE')}</span>
                <select
                  name='store'
                  className={pic.select}
                  value={data.store || ''}
                  onChange={storeChangeCall}
                  aria-label={t('STORE')}
                >
                  <option value=''>{t('NO_STORE')}</option>
                  {storesList.map((store, index) => (
                    <option key={index} value={store.desc}>{store.desc}</option>
                  ))}
                </select>
              </span>
            : data.store &&
              <span className={pic.chip}>
                <img alt="" src={storeIcon} />
                <span className={pic.chipText}>{data.store}</span>
              </span>
          }

          {showRecipe && data.recipe &&
            <span className={pic.chip}>
              <img alt="" src={recipeIcon} />
              <span className={pic.chipText}>{data.recipe}</span>
            </span>
          }
        </div>
      </div>

      {showRemove &&
        <button type='button' className={pic.remove} onClick={removeCall} aria-label={t('DELETE')} title={t('DELETE')}>
          <img src={remove} alt='' />
        </button>
      }
    </div>
  )
}
