import gc from './groceryCard.module.css'
import remove from '../../assets/images/icons/delete.svg'
import removeGrocery from '../../api/grocery';
import { useTranslation} from 'react-i18next';

export default function GroceryCard({data,onDelete,onClick}) {
  const { t } = useTranslation();
  const leftItemsIcons = {};
  const rightItemsIcons = [{src : remove, alt : "Remove", clickaction : removeGroceryCall}]
  if (!data) return null;
 function parseDate(date) {
    try {
    return date.toDate().toLocaleDateString('en-CA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
    } catch (e) {
    console.log('user obj time error', e);
    return 'Invalid Date';
  }
}

async function removeGroceryCall() {
  let res = window.confirm(t('DELETE_GROCERY'));
  if (res) {
    let result = await removeGrocery(data.owner, data.id, data.sharedWith);
    if (result.success) {
      onDelete && onDelete();
    } else {
      if ((result.error.code = "permission-denied")) {
        alert(t('WARNINGS.NOT_PERMITTED_FOR_GUESTS'));
      } else {
        alert(t("WARNINGS.SERVER_ERROR"));
      }
    }
  }
}

  return (
    <div className={gc.groceryCardWrapper}>
        <div className={gc.leftItems}>
        {leftItemsIcons.length > 0 && 
            leftItemsIcons.map((item, index) => (
           <img  key={index} src={item.src} className={gc.menuIcon} onClick={item.clickaction} alt={item.alt} />
             ))
         }
         </div>
        <div className={gc.dataWrapper} onClick={()=>onClick(data.id)}>
            <div className={`${gc.label} ${data.type === "shared" ? gc.colorShared : gc.colorPersonal}`}>{data.type=== 'shared' ? t('FILTERS.SHARED') : t('FILTERS.PERSONAL')}</div>
            <div className={gc.name}>{data.name}</div> 
              <div className={gc.date}>{data.date!==null ?parseDate(data.date) : t('NO_DATE')}</div> 
            <div className={`${gc.status}`}><span className={data.status==="active" ? gc.colorCompleted : gc.colorPending}>{data.status === 'active' ? t('STATUS.ACTIVE') : t('STATUS.COMPLETED')}</span></div> 
       </div>
        <div className={gc.rightItems}>
         {rightItemsIcons && 
            rightItemsIcons.map((item, index) => (
           <img  key={index} src={item.src} className={gc.menuIcon} onClick={item.clickaction} alt={item.alt} />
             ))
         }
        </div>
    </div>
  )
}
