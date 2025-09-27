import React from 'react'
import p from './popup.module.css'
import Header from '../header/header'
import closeIcon from '../../assets/images/icons/close.svg'

export default function Popup({children, title, close, hideCloseButton}) {
    
  let closeButton = [{src : closeIcon, alt : "close", clickaction : close}]
  return (
    <div className={p.rootWrapper}>
        <div className={p.contentWrapper}>
           <Header title={title} isPopup={true} headerItems={!hideCloseButton ? closeButton : ""}></Header>
            {children}
        </div>
    </div>
  )
}
