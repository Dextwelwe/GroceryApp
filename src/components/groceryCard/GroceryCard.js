import gc from './groceryCard.module.css'
import remove from '../../assets/images/icons/delete.svg'
import removeGrocery from '../../api/grocery';

export default function GroceryCard({data,onDelete,onClick}) {

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
  let res = window.confirm("Delete Grocery ?")
  if (res){
    await removeGrocery(data.owner,data.id,data.sharedWith);
    onDelete && onDelete();
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
            <div className={`${gc.label} ${data.type === "shared" ? gc.colorShared : gc.colorPersonal}`}>{data.type} </div>
            <div className={gc.name}>{data.name}</div> 
            <div className={gc.date}>{parseDate(data.date)}</div> 
            <div className={`${gc.status}`}><span className={data.status==="completed" ? gc.colorCompleted : gc.colorPending}>{data.status}</span></div> 
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
