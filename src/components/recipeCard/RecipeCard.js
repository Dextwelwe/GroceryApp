import rc from './recipeCard.module.css';
import moreIcon from '../../assets/images/icons/more.svg';
import { useTranslation } from 'react-i18next';

function RecipeIcon() {
  return (
    <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.8' strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'>
      <path d='M7 4h7.5L18 7.5V19a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z' />
      <path d='M14.2 4.2v3.4h3.4' />
      <path d='M9.2 11.4h5.6' />
      <path d='M9.2 14.6h5.6' />
      <path d='M9.2 17.8h3.2' />
    </svg>
  );
}

export default function RecipeCard({ data, onClick, onMenu }) {
  const { t } = useTranslation();
  if (!data) return null;

  const ingredientsCount = Array.isArray(data.items) ? data.items.length : 0;
  const itemsLabel = `${ingredientsCount} ${t('RECIPE_ITEMS')}`;

  function openCard() {
    if (onClick) onClick(data.id);
  }

  return (
    <div className='uiCard'>
      <button type='button' className={rc.openButton} onClick={openCard}>
        <span className='uiTile'>
          <RecipeIcon />
        </span>
        <span className={rc.content}>
          <span className={rc.name}>{data.name || t('RECIPE_NAME')}</span>
          <span className={rc.metaRow}>
            <span className={rc.count}>{itemsLabel}</span>
          </span>
        </span>
      </button>
      <button
        type='button'
        className={rc.menuButton}
        onClick={() => onMenu && onMenu(data)}
        aria-label={t('OPTIONS')}
      >
        <img src={moreIcon} alt='' className={rc.menuIcon} />
      </button>
    </div>
  );
}
