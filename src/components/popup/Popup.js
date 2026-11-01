import React from 'react'
import p from './popup.module.css'
import Header from '../header/header'
import closeIcon from '../../assets/images/icons/close.svg'
import { useEffect, useRef, useState, useCallback } from 'react'

const EXIT_MS = 220;

const openPopups = [];
let popupSeq = 0;

export default function Popup({children, title, close, hideCloseButton, closeOnOutsideClick = true}) {
  const contentRef = useRef(null);
  const exitTimer = useRef(null);
  const popupId = useRef(0);
  const [isClosing, setIsClosing] = useState(false);

  if (popupId.current === 0) popupId.current = ++popupSeq;

  useEffect(() => {
    const id = popupId.current;
    openPopups.push(id);
    return () => {
      const index = openPopups.indexOf(id);
      if (index !== -1) openPopups.splice(index, 1);
    };
  }, []);

  const requestClose = useCallback(() => {
    if (isClosing) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      close();
      return;
    }
    setIsClosing(true);
    exitTimer.current = setTimeout(() => {
      close();

      setIsClosing(false);
    }, EXIT_MS);
  }, [close, isClosing]);

  useEffect(() => () => clearTimeout(exitTimer.current), []);

  useEffect(() => {
    if (!closeOnOutsideClick || isClosing) return;

    const handleClickOutside = (event) => {

      if (openPopups[openPopups.length - 1] !== popupId.current) return;
      if (contentRef.current && !contentRef.current.contains(event.target)) {
        requestClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [close, closeOnOutsideClick, isClosing, requestClose]);

  let closeButton = [{src : closeIcon, alt : "close", clickaction : requestClose}]
  return (
    <div className={`${p.rootWrapper} ${isClosing ? p.rootClosing : ''}`} role='dialog' aria-modal='true' aria-label={title}>
        <div className={`${p.contentWrapper} ${isClosing ? p.contentClosing : ''}`} ref={contentRef}>
           <Header title={title} isPopup={true} headerItems={!hideCloseButton ? closeButton : ""}></Header>
            {children}
        </div>
    </div>
  )
}
