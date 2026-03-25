import remove from '../../assets/images/icons/delete.svg'
import { useTranslation} from 'react-i18next';
import categoryIcon from '../../assets/images/icons/category.svg';
import storeIcon from '../../assets/images/icons/store.svg';
import ic from '../ItemCard/itemCard.module.css'
import pic from './previewItemCard.module.css'
import noteIcon from '../../assets/images/icons/name.svg'
import { useCategorySearch } from '../../hooks/useCategorySearch';


export default function PreviewItemCard({data,actions, categoriesList}) {

  const { t } = useTranslation();
  const { getOneCategory } = useCategorySearch();
  const rightItemsIcons = [{src : remove, alt : "Remove", clickaction : removeCall}];
  const categoryLabel = data.category ? getOneCategory(data.category) : t('NO_CATEGORY');

    function removeCall(){
          actions.remove && actions.remove(data.name);
    }

    function categoryChangeCall(e){
      const newCategoryId = e.target.value;
      actions.editCategory && actions.editCategory(data.name, newCategoryId);
    }

  return (
      <div className={ic.groceryCardWrapper} style={{marginTop : '10px'}}>
                  <div className={ic.dataWrapper}>
                       <div className={ic.nameWrapper}>
                        <img alt="Name Icon" src={noteIcon} className={ic.nameIcon} />
                        <span className={ic.name}>{data.name}</span>
                       </div>
                       <div className={ic.labelsWrapper}>
                      <div style={{border : data.category === "" ? "1px solid red" : ""}} className={ic.category}>
                        <img alt="Category Icon" src={categoryIcon} className={ic.icon} />
                        <select name='category' onChange={categoryChangeCall} value={data.category || ''} className={`${ic.dataLabel} ${ic.category} ${pic.categorySelect}`}>
                        <option  value={data.category || ''}>{categoryLabel}</option>
                        {categoriesList && categoriesList.map((category, index) => (
                          <option key={index} value={category.id}>{getOneCategory(category.id)}</option>
                        ))}
                        </select>
                        </div> 
                        {data.store &&
                      <div className={ic.store}>
                        <img alt="Store Icon" src={storeIcon} className={ic.icon} />
                        <span className={ic.dataLabel}>{data.store}</span>
                        </div>
                        }
                      </div>
                 </div>
                  <div className={ic.rightItems}>
                   {rightItemsIcons && 
                      rightItemsIcons.map((item, index) => (
                     <img  key={index} src={item.src} className={ic.menuIcon} onClick={() => item.clickaction(data)} alt={item.alt} />
                       ))
                   }
                  </div>
              </div>
  )
}
