import React from 'react'
import p from './popup.module.css'
import Header from '../header/header'
import closeIcon from '../../images/icons/close.svg'

export default function Popup({children, title, close}) {
    
  let closeButton = [{src : closeIcon, alt : "close", clickaction : close}]
  return (
    <div className={p.rootWrapper}>
        <div className={p.contentWrapper}>
           <Header title={"New Grocery"} headerItems={closeButton}></Header>
            
            {children}
        </div>
    </div>
  )
}
