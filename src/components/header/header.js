
import hm from './header.module.css'

export default function Header({title, headerNav, headerItems, isPopup = false}) {
  return (
     <div className={hm.headerWrapper} style={isPopup ? {height : '50px'} : {}}>
         <div className={hm.headerButtonsWrapper}>
            <div className={hm.headerNavTitleWrapper}>
               {headerNav && 
                  headerNav.map((item, index) => (
                 <img  key={index} src={item.src} className={hm.menuIcon} onClick={item.clickaction} alt={item.alt} />
                ))
               }
            <h2 className={hm.headerTitle}>{title}</h2>
            </div>
            <div className={hm.itemsWrapper}>
            {headerItems && 
               headerItems.map((item, index) => (
             <img key={index} src={item.src} className={hm.menuIcon} onClick={item.clickaction} alt={item.alt} />
                ))}
            </div>     
         </div>
     </div>
  )
}
