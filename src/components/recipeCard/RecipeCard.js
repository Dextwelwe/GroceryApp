import React from 'react';
import rc from './recipeCard.module.css';
import remove from '../../assets/images/icons/delete.svg';
import noteIcon from '../../assets/images/icons/name.svg';
import { useTranslation } from 'react-i18next';

export default function RecipeCard({ data, onDelete, onClick }) {
  const { t } = useTranslation();
  if (!data) return null;

  const ingredientsCount = Array.isArray(data.items) ? data.items.length : 0;

  function handleDelete(e) {
    e.stopPropagation();
    onDelete && onDelete(data.id);
  }

  function handleCardClick() {
    onClick && onClick(data.id);
  }

  return (
    <div className={rc.recipeCardWrapper} onClick={handleCardClick}>
      <div className={rc.dataWrapper}>
        <div className={rc.title}>
          <img src={noteIcon} alt="Recipe icon" className={rc.titleIcon} />
          {data.name || t('RECIPE_NAME')}
        </div>
        <div className={rc.countText}>
          {ingredientsCount} {t('ITEMS')}
        </div>
      </div>

      <button
        type="button"
        className={rc.deleteButton}
        onClick={handleDelete}
        aria-label="Delete recipe"
      >
        <img src={remove} alt="Delete recipe" className={rc.deleteIcon} />
      </button>
    </div>
  );
}
