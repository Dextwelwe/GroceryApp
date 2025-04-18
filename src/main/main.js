import React, { useEffect, useState } from 'react'
import {getList} from "./productHandling"

import Item from './item/item';
import Add from './add/add';

import iconClose from '../images/close.png';
import iconAdd from '../images/add.png';

import './main.css'
import Category from './categories/category';

export default function Main() {
  const [isEdit, setIsEdit] = useState(false);

  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);

  const [selectedCategory, setSelectedCategory] = useState('Все');

  const [update, setUpdate] = useState(false)
  const [loading, setLoading] = useState(false)


  useEffect(()=>{
   getItemsList();
  },[isEdit])

  useEffect(()=>{
    setFilteredItems(filterItems(items))
  },[isEdit,update])

  useEffect(()=>{
    filterByCategory();
  },[selectedCategory])


  async function getItemsList() {
    const list = await getList();
  setLoading(true)
  setItems(list)
  setFilteredItems(filterItems(list))
  setLoading(false)
  }

  const toggleEdit = () => {
    setIsEdit(!isEdit);
    setSelectedCategory('')
  }

  const updateState = () => {
    setUpdate(!update)
  }

  function setCategory(category){
    setSelectedCategory(category);
  }

  function filterItems(items){
    const sortedItems =
    items.sort((a, b) => {
      if (a.status === b.status){
        return a.desc.localeCompare(b.desc);
      }
      return a.status === 'NEW' ? -1 : 1;
    });
    return sortedItems;
  }

   function filterByCategory() {
    var category;
    if (selectedCategory === 'Все'){
      return setFilteredItems(items)
    }else {
      category = selectedCategory;
      let filteredItems = items.filter(x => x.category.desc === category)
      setFilteredItems(filteredItems)
    }
  }

  function getItem(id) {
    return items.find(x => x.id == id);
  }

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


  return (
    <div className='mainContentWrapper'>
          <div className='headerWrapper'>
            <div className='headerButtonsWrapper'>
              {!isEdit ?
                (
                  <>
                <button type='button' className='mainHeaderButton'>Продукты</button>
                </>
              )
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
            <Category isEdit={isEdit} setCategory={setCategory} update={update}></Category>
        <div className='itemsWrapper'>
          <div className='itemListWrapper'>
            { isEdit ? 
              (<Add setisEdit={toggleEdit} category={selectedCategory}></Add>)  
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
