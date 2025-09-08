import { useRef, useState, useEffect, forwardRef} from 'react';

import { usePreloadImages } from '../../hooks/usePreloadImages';

import iconAdd from '../../assets/images/icons/add.png';
import iconUndo from '../../assets/images/icons/undo.png';
import iconEdit from '../../assets/images//icons/pencil.png';
import iconCheck from '../../assets/images//icons/check.png';
import iconDelete from '../../assets/images//icons/close.png';

import './category.css';

import { useTranslation} from 'react-i18next';

const Category = forwardRef(({list, setCategory, onUpdate, onDelete},ref) => {

  usePreloadImages([iconAdd, iconUndo, iconEdit, iconCheck, iconDelete]);
  const [isAddNewCategory, setIsAddNewCategory] = useState(false);
  const [isEditCategory, setIsEditCategory] = useState(false);
  const [displayEditCategory, setDisplayEditCategory] = useState(false);

  const [selectedCategory, setSelectedCategory] = useState(list[0]?.desc || "");
  const [valueToUpdate, setValueToUpdate] = useState(null);
  const newCategoryRef = useRef(null);

  const { t } = useTranslation();

  useEffect(() => {
  if (!list?.some(i => i.desc === selectedCategory)) {
    setSelectedCategory(list?.[0]?.desc || "");
  }
  // eslint-disable-next-line
}, [list]);

  const setNewCategory = () => {
    setIsAddNewCategory(true);
  };
  
  const removeCategory = async() => {
    let val = newCategoryRef.current.value;
    if(onDelete){
     let res = await onDelete(val);
     if (res.success){
       exitEditMenu();
     } else {
      alert(res.error)
     }
    } 
  };

  const handleSaveNewOption = async() =>{
     let val = newCategoryRef.current.value;
     let isUnique = true;
    for (let x=0;x< list.length; x++){
      let el = list[x];
      if (el.desc.toLowerCase().trim() === val.toLowerCase().trim()){
        isUnique = false; 
        alert(t('WARNINGS.ALREADY_EXISTS'))
      }
    } 
    if (isUnique && onUpdate){
      let finalArr = [val, ...list.map(e => e.desc)]
      setIsAddNewCategory(false);
      let res = await onUpdate(finalArr)
      if (res.success === true){
        setSelectedCategory(val)
      } else {
        alert(res.error)
      }
    }
  }

  const handleUpdateOption = async () => {
    const val = newCategoryRef.current.value.trim();
    let isNeedUpdate = false;

    const updatedList = list.map((el) => {
      if (el.desc.toLowerCase().trim() === valueToUpdate.toLowerCase().trim()) {
        isNeedUpdate = true;
        return { ...el, desc: val };
      }
      return el;
    });

    if (isNeedUpdate) {
      if (onUpdate) {
        const finalArr = updatedList.map((e) => e.desc);
        const res = await onUpdate(finalArr);
        if (res.success === true) {
          setSelectedCategory(val);
          exitEditMenu();
        } else {
          alert(res.error);
        }
      }
    }
  };

const handleEditOptionMenu = () => {
    setValueToUpdate(selectedCategory);
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
       {isEditCategory && <input type="text" ref={newCategoryRef} placeholder={t('EDIT_CATEGORY')} value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="newCategoryInput" />} 
       {!isAddNewCategory && !isEditCategory && 
          <select className="oneCategoryItem" ref={ref} value={selectedCategory} onChange={(e) => handleSelect(e)} >
            {list.map((item, index) => (<option key={index} value={item.desc}>{item.desc}</option>))}
          </select>
        }
      </div>

      <div className="menuIconWrapper">
        {isAddNewCategory && <img src={iconCheck} className="menuIcon" onClick={handleSaveNewOption} alt="icon check" />}                                              {/* Confirm add New Option  */}
        {!displayEditCategory && !isAddNewCategory && <img src={iconAdd} className="menuIcon" onClick={() => {setNewCategory();}} alt="icon add" />}  {/* Open New Option Menu  */}
      </div>
       <div className="menuIconWrapper">
        {isAddNewCategory && <img src={iconUndo} className="menuIcon" onClick={() => {setIsAddNewCategory(false);}} alt="icon back" />}                 {/* Back from New Option Menu  */}
         {displayEditCategory && isEditCategory && <img src={iconCheck} className="menuIcon" onClick={handleUpdateOption} alt="icon check" />}              {/* Confirm Edit Name  */}
        {!isAddNewCategory && !displayEditCategory &&  <img src={iconEdit} className="menuIcon" onClick={() => { setIsAddNewCategory(false); handleEditOptionMenu(); toggleEditMode(); }} alt="icon edit" />}   {/*  Open edit menu  */}
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
