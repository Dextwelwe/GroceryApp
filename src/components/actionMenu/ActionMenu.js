import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import am from './actionMenu.module.css';

const MENU_ROW_HEIGHT = 42;
const MENU_CHROME = 16;
const MENU_GAP = 6;
const VIEWPORT_MARGIN = 8;

/**
 * Small anchored pop-up menu, same material/feel as the FAB menu.
 * Rendered in a portal with fixed positioning so no scroll container clips it.
 *
 * @param {Object} props
 * @param {boolean} props.open
 * @param {() => void} props.onClose
 * @param {Array<{key?: string|number, label?: string, icon?: React.ReactNode, tone?: 'danger', onSelect?: () => void, node?: React.ReactNode}>} props.items
 * @param {React.RefObject<HTMLElement>} [props.anchorRef] - trigger element
 * @param {{top:number,bottom:number,left:number,right:number,width:number}} [props.anchorRect] - pre-measured trigger rect
 * @param {number} [props.width]
 * @param {string} [props.label]
 */
export default function ActionMenu({ open, onClose, items = [], anchorRef, anchorRect, width = 200, label }) {
  const menuRef = useRef(null);
  const [style, setStyle] = useState(null);
  const [placement, setPlacement] = useState('bottom');
  const isOpen = Boolean(open) && items.length > 0;

  const getAnchorRect = useCallback(() => {
    if (anchorRect) return anchorRect;
    const anchor = anchorRef?.current;
    return anchor ? anchor.getBoundingClientRect() : null;
  }, [anchorRect, anchorRef]);

  const nodeRows = items.filter((item) => item.node).length;
  const itemRows = items.length - nodeRows;
  const totalRows = itemRows + nodeRows;

  useLayoutEffect(() => {
    if (!isOpen) {
      setStyle(null);
      return;
    }

    const rect = getAnchorRect();
    if (!rect) {
      setStyle(null);
      return;
    }

    const menuHeight = totalRows * MENU_ROW_HEIGHT + MENU_CHROME;
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUp = spaceBelow < menuHeight + MENU_GAP && rect.top > menuHeight + MENU_GAP;
    const left = Math.max(
      VIEWPORT_MARGIN,
      Math.min(rect.right - width, window.innerWidth - width - VIEWPORT_MARGIN)
    );

    setStyle({
      position: 'fixed',
      left: `${Math.round(left)}px`,
      width: `${width}px`,
      ...(openUp
        ? { bottom: `${Math.round(window.innerHeight - rect.top + MENU_GAP)}px`, top: 'auto' }
        : { top: `${Math.round(rect.bottom + MENU_GAP)}px`, bottom: 'auto' }),
    });
    setPlacement(openUp ? 'top' : 'bottom');
  }, [isOpen, totalRows, width, getAnchorRect]);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event) => {
      if (menuRef.current && menuRef.current.contains(event.target)) return;
      if (anchorRef?.current && anchorRef.current.contains(event.target)) return;
      onClose?.();
    };
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose?.();
    };
    const close = () => onClose?.();

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', close);
    window.addEventListener('scroll', close, true);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', close);
      window.removeEventListener('scroll', close, true);
    };
  }, [isOpen, onClose, anchorRef]);

  if (!isOpen || !style) return null;

  return createPortal(
    <div className={am.menu} style={style} role='menu' aria-label={label} data-placement={placement} ref={menuRef}>
      {items.map((item, index) => {
        if (item.node) {
          return (
            <div key={item.key ?? index} className={am.customRow}>
              {item.node}
            </div>
          );
        }

        return (
          <button
            key={item.key ?? index}
            type='button'
            role='menuitem'
            className={`${am.item} ${item.tone === 'danger' ? am.danger : ''}`}
            onClick={() => { onClose?.(); item.onSelect?.(); }}
          >
            {item.icon && <span className={am.icon}>{item.icon}</span>}
            <span className={am.label}>{item.label}</span>
          </button>
        );
      })}
    </div>,
    document.body
  );
}
