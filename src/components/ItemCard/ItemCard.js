import { useRef, useState } from 'react'
import ic from './itemCard.module.css'
import deleteIcon from '../../assets/images/icons/delete.svg'
import { useTranslation } from 'react-i18next'

const DELETE_WIDTH = 88;

export default function ItemCard({ data, actions }) {
  const { t } = useTranslation();
  const [offset, setOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef(null);
  const dragged = useRef(false);

  if (!data) return null;

  const isBought = data.status === 'completed';
  const categoryLabel = data.category
    ? t(`CATEGORIES.${data.category.toUpperCase()}`, { defaultValue: data.category })
    : '';
  const meta = [categoryLabel, data.store, data.recipe].filter(Boolean).join(' · ');

  function toggleStatus() {
    actions?.changeStatus && actions.changeStatus(data.id, isBought ? 'active' : 'completed');
  }

  function removeWithoutConfirm() {
    actions?.remove && actions.remove(data.id);
  }

  function removeWithConfirm() {
    if (window.confirm(t('REMOVE_ITEM'))) {
      removeWithoutConfirm();
    }
  }

  function handleBodyClick() {
    if (dragged.current) return;
    if (offset !== 0) { setOffset(0); return; }
    toggleStatus();
  }

  function handlePointerDown(event) {
    dragged.current = false;
    if (event.pointerType === 'mouse') return;
    dragStart.current = { x: event.clientX, y: event.clientY, base: offset, active: false };
  }

  function handlePointerMove(event) {
    const start = dragStart.current;
    if (!start) return;

    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;

    if (!start.active) {

      if (Math.abs(dx) < 8 || Math.abs(dx) < Math.abs(dy)) return;
      start.active = true;
      dragged.current = true;
      setIsDragging(true);
      event.currentTarget.setPointerCapture?.(event.pointerId);
    }

    setOffset(Math.min(0, Math.max(-DELETE_WIDTH, start.base + dx)));
  }

  function endDrag() {
    if (!dragStart.current) return;
    dragStart.current = null;
    setIsDragging(false);
    setOffset((current) => (current <= -DELETE_WIDTH / 2 ? -DELETE_WIDTH : 0));
  }

  const isRevealed = offset !== 0;

  return (
    <div className={ic.swipeWrapper}>
      {isRevealed &&
        <button type='button' className={ic.deleteAction} onClick={removeWithoutConfirm}>
          {t('DELETE')}
        </button>
      }

      <div
        className={`${ic.row} ${isBought ? ic.rowBought : ''} ${isDragging ? ic.rowDragging : ''}`}
        style={{ transform: `translateX(${offset}px)` }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        <button
          type='button'
          className={`uiCheckbox ${isBought ? 'uiCheckboxChecked' : ''}`}
          onClick={toggleStatus}
          aria-pressed={isBought}
          aria-label={t('STATUS.COMPLETED')}
        >
          {isBought &&
            <svg viewBox='0 0 24 24' fill='none' aria-hidden='true'>
              <path d='M5 12.5 9.5 17 19 7.5' stroke='currentColor' strokeWidth='2.4' strokeLinecap='round' strokeLinejoin='round' />
            </svg>
          }
        </button>

        <button type='button' className={ic.body} onClick={handleBodyClick}>
          <span className={`${ic.name} ${isBought ? ic.nameBought : ''}`}>{data.name}</span>
          {meta && <span className={ic.meta}>{meta}</span>}
        </button>

        <button type='button' className={ic.trash} onClick={removeWithConfirm} aria-label={t('DELETE')} title={t('DELETE')}>
          <img src={deleteIcon} alt='' />
        </button>
      </div>
    </div>
  )
}
