import { useRef, useState, forwardRef, useEffect} from 'react';

import iconAdd from '../../assets/images/icons/add.png';
import iconUndo from '../../assets/images/icons/undo.png';
import iconEdit from '../../assets/images//icons/pencil.png';
import iconCheck from '../../assets/images//icons/check.png';
import iconDelete from '../../assets/images//icons/close.png';

import './category.css';

import { useTranslation} from 'react-i18next';

const Category = forwardRef(({list, setCategory, onUpdate, onDelete}, ref) => {
  const [isAddNewCategory, setIsAddNewCategory] = useState(false);
  const [isEditCategory, setIsEditCategory] = useState(false);
  const [displayEditCategory, setDisplayEditCategory] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(list[0]?.desc || "");
  const newCategoryRef = useRef(null);
  const [optionsToDisplay, setOptionsToDisplay] = useState([])
  const { t } = useTranslation();

  useEffect(() => {
    setOptionsToDisplay(list);
  },[list])

  const setNewCategory = () => {
    setIsAddNewCategory(true);
  };
  
  const removeCategory = async() => {
    let val = newCategoryRef.current.value;
    if(onDelete){
     let res = await onDelete(val);
     if (res.success){
       setOptionsToDisplay(optionsToDisplay.filter(item => item.desc !== val))
       exitEditMenu();
     } else {
      alert(res.error)
     }
    } 
  };

  const handleUpdateOption = async (type) => {
    if (type === 'edit'){
      return alert('not implemented yet');
    }
    let val = newCategoryRef.current.value;
    let isUnique = true;
    for (let x=0;x< list.length; x++){
      let el = list[x];
      if (el.desc.toLowerCase().trim() === val.toLowerCase().trim()){
        isUnique = false; 
        alert(t('WARNINGS.ALREADY_EXISTS'))
      }
    } 
    if (isUnique){
      if (type === "new"){
        setIsAddNewCategory(false);
      } else {
        exitEditMenu();
      }
      if (onUpdate) {
      let res = await onUpdate(val)
      if (res.success === true){
        setSelectedCategory(val)
        setOptionsToDisplay(prev => [{desc : val, label : val, type : 'custom'}, ...prev])
      } else {
        alert(res.error)
      }
    }
    }
  }

  const handleSelect = (e) => {
    let value = e.target.value;
    setCategory(value)
    setSelectedCategory(value)
  }

  const toggleEditMode = () => {
    setDisplayEditCategory(true);
    setIsEditCategory(true);
  };

  const exitEditMenu = () => {
    setDisplayEditCategory(false);
    setIsEditCategory(!isEditCategory)
  };

  return (
    <div className="headerWrapper categoryWrapper">
     <div className="itemsCategory">
       {displayEditCategory && isEditCategory && <img src={iconDelete} className="menuIcon" onClick={removeCategory} alt="icon delete" />}           {/* Remove an Option  */}
       {isAddNewCategory && <input type="text" ref={newCategoryRef} placeholder={t('NEW_CATEGORY')}  className="newCategoryInput" />}
       {isEditCategory && <input type="text" ref={newCategoryRef} placeholder={t('EDIT_CATEGORY')} defaultValue={selectedCategory} className="newCategoryInput" />} 
       {!isAddNewCategory && !isEditCategory && 
          <select className="oneCategoryItem" ref={ref} value={selectedCategory} onChange={(e) => handleSelect(e)} >
            {optionsToDisplay.map((item, index) => (<option key={index} value={item.desc}>{item.desc}</option>))}
          </select>
        }
      </div>

      <div className="menuIconWrapper">
        {isAddNewCategory && <img src={iconCheck} className="menuIcon" onClick={()=>handleUpdateOption('new')} alt="icon check" />}                                              {/* Confirm add New Option  */}
        {!displayEditCategory && !isAddNewCategory && <img src={iconAdd} className="menuIcon" onClick={() => {setNewCategory();}} alt="icon add" />}  {/* Open New Option Menu  */}
      </div>
       <div className="menuIconWrapper">
        {isAddNewCategory && <img src={iconUndo} className="menuIcon" onClick={() => {setIsAddNewCategory(false);}} alt="icon back" />}                 {/* Back from New Option Menu  */}
         {displayEditCategory && isEditCategory && <img src={iconCheck} className="menuIcon" onClick={()=>handleUpdateOption('edit')} alt="icon check" />}              {/* Confirm Edit Name  */}
        {!isAddNewCategory && !displayEditCategory &&  <img src={iconEdit} className="menuIcon" onClick={() => { setIsAddNewCategory(false); toggleEditMode(); }} alt="icon edit" />}   {/*  Open edit menu  */}
       </div>
        {displayEditCategory &&
        <div className="menuIconWrapper">
         <img src={iconUndo} className="menuIcon" onClick={exitEditMenu} alt="icon undo" />  {/* Back from Edit Menu */}
        </div>
        }
    </div>
  );
})

export default Category;
