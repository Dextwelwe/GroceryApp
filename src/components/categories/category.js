import { useRef, useState, useEffect, forwardRef} from 'react';

import deleteIcon from '../../assets/images/icons/delete.svg';

import './category.css';

import { useTranslation} from 'react-i18next';

const Category = forwardRef(({list, onUpdate, onDelete},ref) => {

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
     if (res){
       exitEditMenu();
     }
    }
  };

  const handleSaveNewOption = async() =>{
     let val = newCategoryRef.current.value;
     if (val.trim() === "") {
      return;
    }
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
      if (res){
        setSelectedCategory(val)
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
        if (res) {
          setSelectedCategory(val);
          exitEditMenu();
        }
      }
    }
  };

const handleEditOptionMenu = () => {
    setValueToUpdate(selectedCategory);
  }

  const handleSelect = (e) => {
    let value = e.target.value;
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
       {displayEditCategory && isEditCategory &&
         <button type="button" className="menuButton" onClick={removeCategory} aria-label="Delete store" title="Delete store">
           <img src={deleteIcon} className="menuIcon" alt="" />
         </button>
       }
       {isAddNewCategory && <input type="text" ref={newCategoryRef}   className="newCategoryInput" />}
       {isEditCategory && <input type="text" ref={newCategoryRef}  value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="newCategoryInput" />}
       {!isAddNewCategory && !isEditCategory &&
          <select className="oneCategoryItem" ref={ref} value={selectedCategory} onChange={(e) => handleSelect(e)} >
            {list.map((item, index) => (<option key={index} value={item.desc}>{item.desc}</option>))}
          </select>
        }
      </div>

      <div className="menuIconWrapper">
        {isAddNewCategory &&
          <button type="button" className="menuButton" onClick={handleSaveNewOption} aria-label="Save store" title="Save store">
            <svg className="menuIcon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 12.5 9.5 17 19 7.5" />
            </svg>
          </button>
        }
        {!displayEditCategory && !isAddNewCategory &&
          <button type="button" className="menuButton" onClick={() => {setNewCategory();}} aria-label="Add store" title="Add store">
            <svg className="menuIcon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 5v14" />
              <path d="M5 12h14" />
            </svg>
          </button>
        }
      </div>
       <div className="menuIconWrapper">
        {isAddNewCategory &&
          <button type="button" className="menuButton" onClick={() => {setIsAddNewCategory(false);}} aria-label="Cancel" title="Cancel">
            <svg className="menuIcon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M19 12H5" />
              <path d="M11 6l-6 6 6 6" />
            </svg>
          </button>
        }
        {displayEditCategory && isEditCategory &&
          <button type="button" className="menuButton" onClick={handleUpdateOption} aria-label="Save store" title="Save store">
            <svg className="menuIcon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 12.5 9.5 17 19 7.5" />
            </svg>
          </button>
        }
        {!isAddNewCategory && !displayEditCategory &&
          <button type="button" className="menuButton" onClick={() => { setIsAddNewCategory(false); handleEditOptionMenu(); toggleEditMode(); }} aria-label="Edit store" title="Edit store">
            <svg className="menuIcon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M4 20h4L19 9a2.12 2.12 0 0 0-3-3L5 17v3Z" />
              <path d="M14.5 6.5l3 3" />
            </svg>
          </button>
        }
       </div>
        {displayEditCategory &&
        <div className="menuIconWrapper">
          <button type="button" className="menuButton" onClick={exitEditMenu} aria-label="Close" title="Close">
            <svg className="menuIcon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M6 6l12 12" />
              <path d="M18 6L6 18" />
            </svg>
          </button>
        </div>
        }
    </div>
  );
})

export default Category;
