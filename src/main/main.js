import React, { useEffect, useState } from 'react'
import {getList} from "./productHandling"
import { signOut } from 'firebase/auth';
import { auth } from '../login/initFirebase';

import Item from './item/item';
import AddItems from './add/addItems';
import Category from './categories/category';

import iconClose from '../images/close.png';
import iconAdd from '../images/add.png';
import iconExit from '../images/exit.png';

import './main.css'

export default function Main({disconnect}) {
  const [isEdit, setIsEdit] = useState(false);
  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('Все');
  const [update, setUpdate] = useState(false)
  const [loading, setLoading] = useState(false)


  useEffect(()=>{
   fetchItems();
  },[isEdit])

  useEffect(() => {
    const filtered = applyFilter(items, selectedCategory);
    setFilteredItems(filtered);
  }, [items, selectedCategory]);


  async function fetchItems() {
  setLoading(true)
  const list = await getList();
  setItems(list)
  setLoading(false)
  }

  const toggleEdit = () => {
    setIsEdit(!isEdit);
    setSelectedCategory('')
  }

  const updateState = () => {
    setUpdate(!update)
  }

  const applyFilter = (items, category) => {
    const sortedItems = [...items].sort((a, b) => {
      if (a.status === b.status) return a.desc.localeCompare(b.desc);
      return a.status === 'NEW' ? -1 : 1;
    });

    if (category === 'Все') return sortedItems;

    return sortedItems.filter(item => item.category.desc === category);
  };

  function updateItem(id){
    setItems(prevItems => 
      prevItems.map(item => 
        item.id === id ? { ...item, status: 'DONE' } : item
      )
    );
  }

  function removeItem(id) {
    setItems(prevItems => prevItems.filter(item => item.id !== id));
  }

  function logOut(){
    signOut(auth)
      .then(() => {
        disconnect();
      })
      .catch((error) => {
        console.error('Error during logout:', error);
    });
  }


  return (
    <div className='mainContentWrapper'>
          <div className='headerWrapper'>
            <div className='headerButtonsWrapper'>
              {!isEdit ?
                (<button type='button' className='mainHeaderButton'>Продукты</button>)
                : 
                (<h2 className='mainHeaderTitle'> Добавление продуктов </h2>)
              }
              <>
              {!isEdit ?
                (
                  <div className='iconsTop'>
                  <div className='menuIconWrapper'><img src={iconAdd} className='menuIcon' onClick={toggleEdit} alt='icon add'></img></div>
                  <div className='menuIconWrapper'><img src={iconExit} className='menuIcon' onClick={logOut} alt='icon exit'></img></div>
                 </div>
                )
                : 
                (<div className='menuIconWrapper'><img src={iconClose} className='menuIcon' alt='icon close'></img></div>)
              }
              </>
            </div>
        </div>
            <Category isEdit={isEdit} setCategory={setSelectedCategory} update={update}></Category>
        <div className='itemsWrapper'>
          <div className='itemListWrapper'>
            { isEdit ? 
              (<AddItems setisEdit={toggleEdit} category={selectedCategory}></AddItems>)  
              : 
             (!loading && ( filteredItems.map((item) => (
              <div className='itemWrapper' key={item.id}>
                <Item updateState={updateState} data={item} updateItem={updateItem} removeItem={removeItem}></Item>
              </div>)
              )))
            } 
          </div>
        </div>
      </div>
  )
}
