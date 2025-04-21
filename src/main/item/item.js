import React, { useEffect, useState } from 'react'
import iconClose from '../../images/close.png';
import iconCheck from '../../images/check.png';
import { updateStatusById, deleteById } from '../productHandling';

export default function Item({data, updateState, updateItem, removeItem}) {

  const [item, setItem] = useState(data);

  useEffect(() => {
    setItem(data);
  }, [data]);

  const isDone = item.status === 'DONE';

  const handleCheck = async () => {
    setItem(prev => ({ ...prev, status: 'DONE' }));
    updateItem(item.id);
    await updateStatusById(item.id, 'DONE');
    updateState();
  };

  const handleRemove = async () => {
    removeItem(item.id);
    await deleteById(item.id);
    updateState();
  };

  const itemStyle = isDone ? { backgroundColor: '#79AC78' } : {};
  const iconWrapperStyle = isDone ? { backgroundColor: 'transparent' } : {};

  return (
    <div className='item' style={itemStyle}>
      <p className='itemDesc'>{item.desc}</p>
        <div className='itemAction'>
        <div className='menuIconWrapper' style={iconWrapperStyle} >
          { !isDone  &&
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
