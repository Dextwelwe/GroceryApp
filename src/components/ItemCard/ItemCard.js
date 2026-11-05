import { useRef, useState } from 'react'
import ic from './itemCard.module.css'
import ActionMenu from '../actionMenu/ActionMenu'
import deleteIcon from '../../assets/images/icons/delete.svg'
import { formatQuantity } from '../../utils/quantity'
import { useTranslation } from 'react-i18next'

const DELETE_WIDTH = 88;

export default function ItemCard({ data, actions, showCategory = true }) {
  const { t } = useTranslation();
  const [offset, setOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const dragStart = useRef(null);
  const dragged = useRef(false);
  const menuButtonRef = useRef(null);

  if (!data) return null;

  const isBought = data.status === 'completed';
  const categoryLabel = data.category
    ? t(`CATEGORIES.${data.category.toUpperCase()}`, { defaultValue: data.category })
    : '';
  // grouped lists already show the category as a section header
  const meta = [
    showCategory ? categoryLabel : '',
    data.store,
    data.recipe,
  ].filter(Boolean).join(' · ');
  const quantity = formatQuantity(data.amount, data.uom);
  // recipe ingredients are read-only (delete only)
  const canEdit = !data.recipe && Boolean(actions?.edit);

  const menuItems = [
    ...(canEdit
      ? [{
          key: 'edit',
          label: t('EDIT_ITEM'),
          icon: (
            <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.8' strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'>
              <path d='M4 20h4L19 9a2.12 2.12 0 0 0-3-3L5 17v3Z' />
              <path d='M14.5 6.5l3 3' />
            </svg>
          ),
          onSelect: () => actions.edit(data),
        }]
      : []),
    {
      key: 'delete',
      label: t('DELETE'),
      tone: 'danger',
      icon: <img src={deleteIcon} alt='' />,
      onSelect: removeWithConfirm,
    },
  ];

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
    // mouse users get the always-visible trash button instead of swiping
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
        <button type='button' className={ic.deleteAction} onClick={removeWithoutConfirm} tabIndex={isRevealed ? 0 : -1} aria-hidden={!isRevealed} aria-label={t('DELETE')} title={t('DELETE')}>
          <img src={deleteIcon} alt='' className={ic.deleteIcon} />
        </button>

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
          <span className={ic.titleRow}>
            <span className={`${ic.name} ${isBought ? ic.nameBought : ''}`}>{data.name}</span>
            {quantity &&
              <span className={`${ic.quantity} ${isBought ? ic.quantityBought : ''}`}>{quantity}</span>
            }
          </span>
          {meta && <span className={ic.meta}>{meta}</span>}
        </button>

        <button
          type='button'
          ref={menuButtonRef}
          className={`${ic.menu} ${isMenuOpen ? ic.menuActive : ''}`}
          onClick={() => setIsMenuOpen(prev => !prev)}
          aria-haspopup='menu'
          aria-expanded={isMenuOpen}
          aria-label={t('OPTIONS')}
          title={t('OPTIONS')}
        >
          <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.4' strokeLinecap='round' aria-hidden='true'>
            <path d='M6 12h.01' />
            <path d='M12 12h.01' />
            <path d='M18 12h.01' />
          </svg>
        </button>
      </div>

      <ActionMenu
        open={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        anchorRef={menuButtonRef}
        width={168}
        label={t('OPTIONS')}
        items={menuItems}
      />
    </div>
  )
}
