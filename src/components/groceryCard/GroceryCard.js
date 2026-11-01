import gc from './groceryCard.module.css'
import moreIcon from '../../assets/images/icons/more.svg'
import { useTranslation} from 'react-i18next';

function PeopleIcon({ shared }) {
  return shared ? (
    <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.8' strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'>
      <circle cx='9.5' cy='8' r='3.2' />
      <path d='M3.5 20c0-3.1 2.7-5.2 6-5.2s6 2.1 6 5.2' />
      <path d='M16.2 5.3a3 3 0 0 1 0 5.7' />
      <path d='M18.1 14.7c1.4.7 2.4 1.9 2.4 3.4' />
    </svg>
  ) : (
    <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.8' strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'>
      <circle cx='12' cy='8' r='3.4' />
      <path d='M5.5 20c0-3.2 2.9-5.4 6.5-5.4s6.5 2.2 6.5 5.4' />
    </svg>
  );
}

export default function GroceryCard({data,onClick,onMenu}) {
  const { t } = useTranslation();
  if (!data) return null;

  const isCompleted = data.status === 'completed';
  const isShared = data.type === 'shared';
  const typeLabel = isShared ? t('FILTERS.SHARED') : t('FILTERS.PERSONAL');

  function parseDate(date) {
    try {
      return date.toDate().toLocaleDateString('en-CA', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch (e) {
      console.log('user obj time error', e);
      return '';
    }
  }

  const countLabel = typeof data.itemsCount === 'number'
    ? t('ITEMS_COUNT', { count: data.itemsCount })
    : '';
  const dateLabel = data.date ? parseDate(data.date) : '';

  function openCard() {
    if (onClick) onClick(data.id);
  }

  return (
    <div className={`uiCard ${isCompleted ? gc.rowCompleted : ''}`}>
      <button type='button' className={gc.openButton} onClick={openCard}>
        <span className='uiTile'>
          <PeopleIcon shared={isShared} />
        </span>
        <span className={gc.content}>
          <span className={gc.name}>{data.name}</span>
          <span className={gc.metaRow}>
            <span className={`${gc.status} ${isCompleted ? gc.statusDone : gc.statusActive}`}>
              <span className={gc.statusDot} aria-hidden='true' />
              {isCompleted ? t('STATUS.COMPLETED') : t('STATUS.ACTIVE')}
            </span>
            {countLabel &&
              <>
                <span className={gc.sep} aria-hidden='true'>·</span>
                <span className={gc.count}>{countLabel}</span>
              </>
            }
            {dateLabel &&
              <>
                <span className={gc.sep} aria-hidden='true'>·</span>
                <span className={gc.date}>{dateLabel}</span>
              </>
            }
          </span>
          <span className='uiSrOnly'>{typeLabel}</span>
        </span>
      </button>
      <button
        type='button'
        className={gc.menuButton}
        onClick={() => onMenu && onMenu(data)}
        aria-label={t('OPTIONS')}
      >
        <img src={moreIcon} alt='' className={gc.menuIcon} />
      </button>
    </div>
  )
}
