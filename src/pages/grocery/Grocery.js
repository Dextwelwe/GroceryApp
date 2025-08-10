import {useEffect, useState } from 'react'
import {getList} from "../../api/productHandling"

import Item from '../../components/item/item';
import AddItems from '../../components/add/addItems';
import Category from '../../components/categories/category';
import HeaderMenu from '../../components/header/header';

import iconAdd from '../../assets/images/icons/add.svg';
import iconBack from '../../assets/images/icons/back.svg'

export default function Grocery({goBack}) {
  const [isEdit, setIsEdit] = useState(false);
  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('Все');
  const [update, setUpdate] = useState(false)
  const [loading, setLoading] = useState(false)

   const toggleEdit = () => {
    setIsEdit(!isEdit);
    setSelectedCategory('')
  }

    const headerGroceryTitle = "grocery name ";
    const headerGroceryIcons =  [{src : iconAdd , alt : "Add", clickaction : toggleEdit}]
    const headerGroceryNav = [{src : iconBack , alt : "Back", clickaction : goBack}]

    const headerEditTitle = "add products"
    const headerEditNav = [{src : iconBack, alt : "Back", clickaction : toggleEdit}]

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



  return (
    <div className='mainContentWrapper'>
       {!isEdit ? (<HeaderMenu title={headerGroceryTitle} headerNav={headerGroceryNav} headerItems={headerGroceryIcons}/>) : (<HeaderMenu title={headerEditTitle} headerItems={null} headerNav={headerEditNav} />)}
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
