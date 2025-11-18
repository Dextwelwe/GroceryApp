import gc from './groceryCard.module.css'
import remove from '../../assets/images/icons/delete.svg'
import removeGrocery from '../../api/grocery';
import { useTranslation} from 'react-i18next';
import userIcon from '../../assets/images/icons/user.svg'
import usersIcon from '../../assets/images/icons/users.svg'
import calendarIcon from '../../assets/images/icons/calendar.svg'
import checkIcon from '../../assets/images/icons/checkStatus.svg'
import pendingIcon from '../../assets/images/icons/time.svg'
import noteIcon from '../../assets/images/icons/name.svg'

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
            <div className={gc.name}> <img src={noteIcon} alt="Icon Name" className={gc.userIcon}  /> {data.name}</div> 
              
            <div className={gc.dateWrapper}><img src={calendarIcon} alt="Icon Calendar" className={gc.userIcon}/> <span className={gc.date}>{data.date!==null ?parseDate(data.date) : t('NO_DATE')}</span></div> 
            <div className={gc.labelsWrapper}>
              <div className={`${gc.label} ${data.type === "shared" ? gc.colorShared : gc.colorPersonal}`}>
                <img src={data.type === "shared" ? usersIcon : userIcon} alt="Icon User" className={gc.userIcon}  />
                {data.type=== 'shared' ? t('FILTERS.SHARED') : t('FILTERS.PERSONAL')}
                </div>
              <div className={`${gc.label} ${data.status==="active" ? gc.colorCompleted : gc.colorActive}`}>
                <img src={data.status === "active" ? pendingIcon : checkIcon} alt="Icon User" className={gc.userIcon}  />
                {data.status === 'active' ? t('STATUS.ACTIVE') : t('STATUS.COMPLETED')}
                </div> 
            </div>
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
