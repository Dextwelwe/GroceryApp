import React, { useEffect, useState } from 'react'
import iconClose from '../../images/close.png';
import iconCheck from '../../images/check.png';
import { updateStatusById, deleteById } from '../productHandling';

export default function Item({data, update}) {

  const [item, setItem] = useState({});
  const [bg, setBg] = useState({});
  const [hideIcon, setHideIcon] = useState({});

  useEffect(()=>{
    setItem(data)
    if (data.status == 'DONE'){
      setBg({backgroundColor : "#79AC78"})
      setHideIcon({backgroundColor : "transparent"})
    } 
  },[])

   const handleCheck = async () => {
      setItem(prevItem => ({...prevItem, status:"DONE"}));
      setBg({backgroundColor : "#79AC78"})
      setHideIcon({backgroundColor : "transparent"})
      await updateStatusById(item.id, "DONE");
      update()
  }

  const handleRemove = async () => {
     await deleteById(item.id)
     update()
  }

  return (
    <div className='item' style={bg}>
      <p className='itemDesc'>{item.desc}</p>
        <div className='itemAction'>
        <div className='menuIconWrapper' style={hideIcon} >
          { item.status != "DONE" &&
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
