import React, { useRef, useState, useEffect} from 'react'
import './category.css'
import {getAssignedCategories,getAllCategories, addNewCategory, deleteCategoryByDesc} from '../productHandling'
import iconAdd from '../../images/add.png'
import iconUndo from '../../images/undo.png'
import iconEdit from '../../images/pencil.png'
import iconCheck from '../../images/check.png'

export default function Category({isEdit, setCategory, update}) {

  const [isAddNewCategory, setIsAddNewCategory] = useState(false);
  const [categories, setCategories] = useState([]);
  const [assignedCategories, setAssignedCategories] = useState([]);
  const [categoriesToDisplay, setCategoriesToDisplay] = useState([])
  const [displayEditCategory, setDisplayEditCategory] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [deleteCategoryStyle, setDeleteCategoryStyle] = useState({})
  const buttonRefs = useRef({});
  let newCategory = useRef();
  const [defaultCategory, setDefaultCategory] = useState({borderColor : 'var(--primaryColor)'})

  useEffect(()=>{
  getCategories();
    },[isEdit, update])

        function setNewCategory() {
          setIsAddNewCategory(true);
        }
        
        function addCategory(){
          if (newCategory.current && newCategory.current.value.trim() !== '') {
            const alreadyExists = categoriesToDisplay.some(
              category => category.desc.toLowerCase() === newCategory.current.value.trim().toLowerCase()
            );
            if (!alreadyExists){
              setCategoriesToDisplay(prev => [...prev, {desc :newCategory.current.value.trim()}]);
              addNewCategory({desc : newCategory.current.value.trim()})
              setIsAddNewCategory(false)
            } else {
              alert("Уже существует")
            }
          }
        }

 async function getCategories() {
   let categories = await getAllCategories();
   let assignedCategories = await getAssignedCategories();
  
   if (!isAddNewCategory && !isEdit){
    setCategory('Все')
    updateButtonStyles({desc:'Все'})

   }
  setCategories((prevCategories) => [...prevCategories, ...categories.filter(category => !prevCategories.some(prev => prev.desc === category.desc))]);
  setAssignedCategories((prevAssignedCategories) => [ ...prevAssignedCategories,  ...assignedCategories.filter(assigned => !prevAssignedCategories.some(prev => prev.desc === assigned.desc))]);
  toggleCategories(categories, assignedCategories);
}


  function editCategory(){
    setDisplayEditCategory(true)
    setDeleteCategoryStyle({
      borderColor : 'red'
    })
  }

  function exitEditMenu(){
    setDisplayEditCategory(false)
    setDeleteCategoryStyle({})
  }

  function removeCategory(category){
    setCategoriesToDisplay(prev =>
      prev.filter(cat => cat.desc !== category)
    );
    deleteCategoryByDesc(category);
  }

  function toggleCategories(categories,assignCategories){
    if (isEdit){
      setCategoriesToDisplay(categories) 
     } else {
      setCategoriesToDisplay(assignCategories)
     }
  }
  function handleCategory(category, index) {
    if (displayEditCategory) {
      removeCategory(category.desc);
    } else {
      setCategory(category.desc);
      updateButtonStyles(category);
    }
  }
  
  function updateButtonStyles(category) {
    Object.entries(buttonRefs.current).forEach(([desc, el]) => {
      if (!el) return;
      if (desc === category.desc) {
        toggleButtonStyle(el);
      } else {
        resetButtonStyle(el);
      }
    });
  }
  
  function toggleButtonStyle(el) {
    if (el.style.borderColor === 'var(--primaryColor)') {
      if (el.innerText !== 'Все'){
        el.style.borderColor = 'darkslategray';
        setCategory('Все')
        updateButtonStyles({desc:'Все'})
      }
    } else {
      el.style.borderColor = 'var(--primaryColor)';
    }
  }
  
  function resetButtonStyle(el) {

    el.style.borderColor = 'darkslategray';
  }
  

  return (

    <div className='headerWrapper categoryWrapper'>
      <div className='itemsCategory'>
        {!isAddNewCategory ? (
          <>
          { !isEdit &&
            <button type='button'  ref={(el) => (buttonRefs.current['Все'] = el)} style={defaultCategory} onClick={()=> handleCategory({desc : 'Все'})} className='mainHeaderButton'>Все</button> 
          }
          {categoriesToDisplay.length > 0 && !isLoading  &&
          <>
         {categoriesToDisplay.map((category, index) => (
             <button ref={(el) => (buttonRefs.current[category.desc] = el)} key={index} type='button' style={deleteCategoryStyle} onClick={()=> handleCategory(category,index)} className='mainHeaderButton'>
             {category.desc}
           </button>
           ) 
         )}</>}</>
        ) : (
          <>
          <input type='text' ref={newCategory} placeholder='Новая категория' className='newCategoryInput'></input>
          
          </> )
}
        </div>
        {isEdit &&
        <>
        <div className='menuIconWrapper'>
        {isAddNewCategory && !displayEditCategory ?
        (<img  src={iconCheck} className='menuIcon' onClick={()=> addCategory()}  alt='icon check'></img>) :
        (<>
        {!isAddNewCategory && displayEditCategory ?
         (<img  src={iconUndo} className='menuIcon' onClick={()=> exitEditMenu()}  alt='icon undo'></img>)
         :
         ( <img  src={iconAdd} className='menuIcon' onClick={()=> setNewCategory()}  alt='icon add'></img>)
        }  
      </>) 
        }
        </div>
        {isAddNewCategory && 
           <div className='menuIconWrapper'>
        <img  src={iconUndo} className='menuIcon' onClick={()=> setIsAddNewCategory(false)} alt='icon back'></img>
           </div>
        }
          {!isAddNewCategory && !displayEditCategory &&
         <>
           <div className='menuIconWrapper'>
         <img  src={iconEdit} className='menuIcon' onClick={()=> {setIsAddNewCategory(false); editCategory();}} alt='icon edit'></img>
         </div>
         </>
          }
        </>


      }
    
      </div>
    );
}
