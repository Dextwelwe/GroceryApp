import hm from './header.module.css'
import groceriesIcon from '../../assets/images/icons/groceries.svg'
import { useTranslation } from 'react-i18next';

export default function Header({title, headerNav, headerItems, isPopup = false}) {
  const { t } = useTranslation();

  return (
    <div className={`${hm.headerWrapper} ${isPopup ? hm.headerPopup : ''}`}>
      <div className={hm.headerButtonsWrapper}>
        <div className={hm.headerNavTitleWrapper}>
          {headerNav &&
            headerNav.map((item, index) => (
              <button
                key={index}
                type='button'
                className='uiIconBtn'
                onClick={item.clickaction}
                aria-label={item.alt}
                title={item.alt}
              >
                <img src={item.src} alt='' />
              </button>
            ))
          }
          {isPopup
            ? <h2 className={hm.headerTitlePopup}>{title}</h2>
            : (
              <div className={hm.headerTitleWrapper}>
                <img src={groceriesIcon} alt='' className={hm.headerIcon} />
                <div className={hm.headerTextWrapper}>
                  <h1 className={hm.headerTitle}>{title}</h1>
                  <p className={hm.headerSubtitle}>{t('MY_GROCERIES')}</p>
                </div>
              </div>
            )
          }
        </div>
        <div className={hm.itemsWrapper}>
          {headerItems &&
            headerItems.map((item, index) => (
              <button
                key={index}
                ref={item.buttonRef}
                type='button'
                className='uiIconBtn'
                onClick={item.clickaction}
                aria-label={item.buttonLabel || item.alt}
                aria-haspopup={item.buttonRef ? 'menu' : undefined}
                aria-expanded={item.buttonRef ? Boolean(item.isExpanded) : undefined}
                title={item.buttonLabel || item.alt}
              >
                <img src={item.src} alt='' />
              </button>
            ))
          }
        </div>
      </div>
    </div>
  )
}
