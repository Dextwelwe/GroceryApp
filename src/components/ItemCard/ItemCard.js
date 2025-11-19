import ic from './itemCard.module.css'
import remove from '../../assets/images/icons/delete.svg'
import check from '../../assets/images/icons/check.svg'
import redo from '../../assets/images/icons/redo.svg'
import { useTranslation} from 'react-i18next';
import categoryIcon from '../../assets/images/icons/category.svg';
import storeIcon from '../../assets/images/icons/store.svg';
import noteIcon from '../../assets/images/icons/name.svg'

export default function ItemCard({data,actions}) {
    const { t } = useTranslation();
    const rightItemsIcons = [{src : data.status === "active" ? check : redo, alt : "Check", clickaction : changeStatusCall},{src : remove, alt : "Remove", clickaction : removeCall}];
      
     function removeCall(){
        let res = window.confirm(t("REMOVE_ITEM"))
        if (res){
          actions.remove && actions.remove(data.id);
        }
    }

    function changeStatusCall(){
      actions.changeStatus && actions.changeStatus(data.id, data.status === "active" ? "completed" : "active");
    }
    
  return (
     <div className={ic.groceryCardWrapper} style={{backgroundColor : data.status === "active" ? '#F4F4EF' : '#C8E6C9'}}>
            <div className={ic.dataWrapper}>
                 <div className={ic.nameWrapper}>
                  <img alt="Name Icon" src={noteIcon} className={ic.nameIcon} />
                  <span className={ic.name}>{data.name}</span>
                 </div>
                 <div className={ic.labelsWrapper}>
                <div className={ic.category}>
                  <img alt="Category Icon" src={categoryIcon} className={ic.icon} />
                  <span className={ic.dataLabel}>{data.category}</span>
                  </div> 
                <div className={ic.store}>
                  <img alt="Store Icon" src={storeIcon} className={ic.icon} />
                  <span className={ic.dataLabel}>{data.store}</span>
                  </div>
                </div>
           </div>
            <div className={ic.rightItems}>
             {rightItemsIcons && 
                rightItemsIcons.map((item, index) => (
               <img  key={index} src={item.src} className={ic.menuIcon} onClick={item.clickaction} alt={item.alt} />
                 ))
             }
            </div>
        </div>
  )
}
