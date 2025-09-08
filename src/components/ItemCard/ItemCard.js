import ic from './itemCard.module.css'
import remove from '../../assets/images/icons/delete.svg'
import check from '../../assets/images/icons/check.svg'
import redo from '../../assets/images/icons/redo.svg'
import { useTranslation} from 'react-i18next';

export default function ItemCard({data,actions}) {
    const { t } = useTranslation();
    const rightItemsIcons = [{src : data.status === "active" ? check : redo, alt : "Check", clickaction : changeStatusCall}];
    const leftItemsIcons = [{src : remove, alt : "Remove", clickaction : removeCall}]
      
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
     <div className={ic.groceryCardWrapper} style={{backgroundColor : data.status === "active" ? 'transparent' : '#C8E6C9'}}>
            <div className={ic.leftItems}>
            {leftItemsIcons.length > 0 && 
                leftItemsIcons.map((item, index) => (
               <img  key={index} src={item.src} className={ic.menuIcon} onClick={item.clickaction} alt={item.alt} />
                 ))
             }
             </div>
            <div className={ic.dataWrapper} onClick={()=>""}>
                <div className={ic.name}>{data.name}</div> 
                <div className={ic.category}>Category : {data.category}</div> 
                <div className={ic.store}> Store : {data.store}</div> 
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
