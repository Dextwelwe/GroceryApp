import React from 'react'
import p from './popup.module.css'
import Header from '../header/header'
import closeIcon from '../../assets/images/icons/close.svg'
import { useEffect,useRef } from 'react'

export default function Popup({children, title, close, hideCloseButton, closeOnOutsideClick = true}) {
  const contentRef = useRef(null);

  useEffect(() => {
    if (!closeOnOutsideClick) return;

    const handleClickOutside = (event) => {
      if (contentRef.current && !contentRef.current.contains(event.target)) {
        close();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchend', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchend', handleClickOutside);
    };
  }, [close, closeOnOutsideClick]);  
  
  let closeButton = [{src : closeIcon, alt : "close", clickaction : close}]
  return (
    <div className={p.rootWrapper}>
        <div className={p.contentWrapper} ref={contentRef}>
           <Header title={title} isPopup={true} headerItems={!hideCloseButton ? closeButton : ""}></Header>
            {children}
        </div>
    </div>
  )
}
