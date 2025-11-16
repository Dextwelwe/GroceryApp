
import hm from './header.module.css'
import cartIcon from '../../assets/images/icons/cart.svg'

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
            <div className={hm.headerTitleWrapper}>
               { !isPopup ? (
               <>
               <img src={cartIcon} className={hm.cartIcon} alt="cart icon" />
               <div>
                  <h2 className={hm.headerTitle}>{title}</h2>
                  <h6 className={hm.headerSubtitle}>My Groceries</h6>
               </div>
               </>
               ) : (
               <h2 className={hm.headerTitle}>{title}</h2>
               )}
               </div>
            </div>
            <div className={hm.itemsWrapper}>
            {headerItems && 
               headerItems.map((item, index) => (
                  <div className={hm.headerNavImageWrapper} key={index} onClick={item.clickaction}>
                  <img key={index} src={item.src} className={hm.menuIcon} alt={item.alt} />
                  <h6 className={hm.buttonLabel}>{item.buttonLabel}</h6>
                  </div>
                ))}
            </div>     
         </div>
     </div>
  )
}
