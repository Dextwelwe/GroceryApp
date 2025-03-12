import React, { useEffect, useState } from 'react'
import {getList} from "./productHandling"

import Item from './item/item';
import Add from './add/add';

import iconClose from '../images/close.png';
import iconAdd from '../images/add.png';

import './main.css'

export default function Main() {
  const [isEdit, setIsEdit] = useState(false);
  const [items, setItems] = useState([]);
  const [update, setUpdate] = useState(false)


  useEffect(()=>{
    getItemsList();
  },[isEdit, update])

  async function getItemsList() {
  const list = await getList()
  setItems(list)
  }

  const toggleEdit = () => {
    setIsEdit(!isEdit);
  }

  const updateState = () => {
    setUpdate(!update)
  }


  return (
    <div className='mainContentWrapper'>
          <div className='headerWrapper'>
            <div className='headerButtonsWrapper'>
              {!isEdit ?
                (<button type='button' className='mainHeaderButton'>Все продукты</button>)
                : 
                (<h2 className='mainHeaderTitle'> Добавление продуктов </h2>)
              }
              <div className='menuIconWrapper'>
              {!isEdit ?
                (<img src={iconAdd} className='menuIcon' onClick={toggleEdit} alt='icon add'></img>)
                : 
                (<img src={iconClose} className='menuIcon' onClick={toggleEdit} alt='icon close'></img>)
              }
              </div>
            </div>
          
        </div>
        <div className='itemsWrapper'>
          <div className='itemListWrapper'>
            { isEdit ? 
              (<Add setisEdit={toggleEdit}></Add>)  
              : 
             (items.map((item) => (
              <div className='itemWrapper' key={item.id}>
                <Item update={updateState} data={item}></Item>
              </div>)
              ))
            } 
          </div>
        </div>
      </div>
  )
}
