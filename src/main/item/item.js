import React, { useEffect, useState } from 'react'
import iconClose from '../../images/close.png';
import iconCheck from '../../images/check.png';
import { updateStatusById, deleteById } from '../productHandling';

export default function Item({data, updateState, updateItem, removeItem}) {

  const [item, setItem] = useState({});
  const [bg, setBg] = useState({});
  const [hideIcon, setHideIcon] = useState({});

  useEffect(()=>{
    setItem(data)
    if (data.status === 'DONE'){
      setBg({backgroundColor : "#79AC78"})
      setHideIcon({backgroundColor : "transparent"})
    } 
  },[data])

   const handleCheck = async () => {
      setItem(prevItem => ({...prevItem, status:"DONE"}));
      updateItem(data.id);
      setBg({backgroundColor : "#79AC78"})
      setHideIcon({backgroundColor : "transparent"})
      updateStatusById(item.id, "DONE");
      updateState()
  }

  const handleRemove = async () => {
    removeItem(data.id)
    deleteById(item.id)
    updateState()
  }

  return (
    <div className='item' style={bg}>
      <p className='itemDesc'>{item.desc}</p>
        <div className='itemAction'>
        <div className='menuIconWrapper' style={hideIcon} >
          { item.status !== "DONE" &&
          <img src={iconCheck} className='menuIcon' alt='icon check' onClick={handleCheck}></img>
        }
        </div>
        <div className='menuIconWrapper'>
          <img src={iconClose} className='menuIcon' alt='icon close' onClick={handleRemove}></img>
        </div>
      </div>
      </div>
  )
}
