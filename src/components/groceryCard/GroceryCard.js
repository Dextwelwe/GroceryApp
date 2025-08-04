import gc from './groceryCard.module.css'
import remove from '../../images/icons/delete.svg'
import add from '../../images/icons/addBig.svg'

export default function GroceryCard({data}) {
 if (!data) return null;

 const leftItemsIcons = {};
 const rightItemsIcons = [{src : remove, alt : "Remove", clickaction : null}]

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

  return (
    <div className={gc.groceryCardWrapper}>
        <div className={gc.leftItems}>
        {leftItemsIcons.length > 0 && 
            leftItemsIcons.map((item, index) => (
           <img  key={index} src={item.src} className={gc.menuIcon} onClick={item.clickaction} alt={item.alt} />
             ))
         }
        <div className={gc.dataWrapper}>
            <div className={`${gc.label} ${data.type === "shared" ? gc.colorShared : gc.colorPersonal}`}>{data.type} </div>
            <div className={gc.name}>{data.name}</div> 
            <div className={gc.date}>{parseDate(data.date)}</div> 
            <div className={`${gc.status}`}><span className={data.status==="completed" ? gc.colorCompleted : gc.colorPending}>{data.status}</span></div> 
       </div>
        </div>
        <div className={gc.rightItems}>
         {rightItemsIcons && 
            rightItemsIcons.map((item, index) => (
           <img  key={index} src={item.src} className={gc.menuIcon} onClick={item.clickaction} alt={item.alt} />
             ))
         }
        </div>
         <img alt='Add' src={add} className={gc.addGrocery}onClick={""} />
    </div>
  )
}
