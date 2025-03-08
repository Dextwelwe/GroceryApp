import React, { useEffect, useState } from 'react'
import {getList} from "./productHandling"
import './main.css'
import iconAdd from '../add.png';
import iconClose from '../cross.png';
import Item from './item/item';
import Add from './add/add';

export default function Main() {
  const [isEdit, setIsEdit] = useState(false);
  const [isEditVisible, setIsEditVisible] = useState("visible");
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
    if (isEdit){
    setIsEditVisible("hidden")
    } else {
      setIsEditVisible("visible")
    }
  }

  const updateState = () => {
    setUpdate(!update)
  }


  return (
    <div className='groceryListWrapper'>
      <div className='mainWrapper'>
      <div className='headerWrapper'>
      <div className='header'>
        <div className='headerButtonsWrapper'>
          {!isEdit ?
          (<button type='button' className='buttonHeader'>Все продукты</button>)
          : 
          (<h2 className='add-items-title'> Добавление продуктов </h2>)
}
          <div className='addWrapper'>
            {!isEdit ?
            (<img src={iconAdd} className='iconAdd' onClick={toggleEdit} alt='icon add'></img>)
            : 
            (<img src={iconClose} className='iconAdd' onClick={toggleEdit} alt='icon close'></img>)
            }
            </div>
        </div>
      </div>
      </div>
      <div className='itemsWrapper'>
      <div className='itemListWrapper'>
       { isEdit ? (<Add setisEdit={toggleEdit}></Add>)
       : (items.map((item, index) => (<div className='itemWrapper' key={item.id}><Item update={updateState} data={item}></Item></div>)))
    } 
        </div>
        </div>
      </div>
    </div>
  )
}
