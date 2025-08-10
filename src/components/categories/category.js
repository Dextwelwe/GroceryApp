import { useRef, useState, useEffect } from 'react';
import { getAssignedCategories, getAllCategories, addNewCategory, deleteCategoryByDesc } from '../../api/productHandling';

import iconAdd from '../../assets/images/icons/add.png';
import iconUndo from '../../assets/images/icons/undo.png';
import iconEdit from '../../assets/images//icons/pencil.png';
import iconCheck from '../../assets/images//icons/check.png';

import './category.css';

export default function Category({ isEdit, setCategory, update }) {
  const [isAddNewCategory, setIsAddNewCategory] = useState(false);
  const [displayEditCategory, setDisplayEditCategory] = useState(false);
  const [categoriesToDisplay, setCategoriesToDisplay] = useState([]);
  const [deleteCategoryStyle, setDeleteCategoryStyle] = useState({});

  const newCategoryRef = useRef();
  const buttonRefs = useRef({});

  useEffect(() => {
    const fetchCategories = async () => {
      const all = await getAllCategories();
      const assigned = await getAssignedCategories();

      if (!isAddNewCategory && !isEdit) {
        setCategory('Все');
        updateButtonStyles({ desc: 'Все' });
      }

      setCategoriesToDisplay(isEdit ? all : assigned);
    };

    fetchCategories();
  }, [isEdit, update, isAddNewCategory, setCategory]);

  const handleCategory = (category) => {
    if (displayEditCategory) {
      removeCategory(category.desc);
    } else {
      setCategory(category.desc);
      updateButtonStyles(category);
    }
  };

  const updateButtonStyles = (selected) => {
    Object.entries(buttonRefs.current).forEach(([desc, el]) => {
      if (!el) return;
      el.style.borderColor = desc === selected.desc ? 'var(--primaryColor)' : 'darkslategray';
    });
  };

  const setNewCategory = () => {
    setIsAddNewCategory(true);
  };

  const addCategory = () => {
    const value = newCategoryRef.current?.value.trim();
    if (!value) return;

    const exists = categoriesToDisplay.some(cat => cat.desc.toLowerCase() === value.toLowerCase());
    if (exists) {
      alert('Уже существует');
      return;
    }

    const newCat = { desc: value };
    setCategoriesToDisplay(prev => [...prev, newCat]);
    addNewCategory(newCat);
    setIsAddNewCategory(false);
  };

  const removeCategory = (desc) => {
    setCategoriesToDisplay(prev => prev.filter(cat => cat.desc !== desc));
    deleteCategoryByDesc(desc);
  };

  const toggleEditMode = () => {
    setDisplayEditCategory(true);
    setDeleteCategoryStyle({ borderColor: 'red' });
  };

  const exitEditMenu = () => {
    setDisplayEditCategory(false);
    setDeleteCategoryStyle({});
  };

  return (
    <div className="headerWrapper categoryWrapper">
      <div className="itemsCategory">
        {!isAddNewCategory ? (
          <>
            {!isEdit && (
              <button type="button" ref={(el) => (buttonRefs.current['Все'] = el)} style={{ borderColor: 'var(--primaryColor)' }} onClick={() => handleCategory({ desc: 'Все' })} className="mainHeaderButton">Все</button>
            )}
            {categoriesToDisplay.map((category, index) => (
              <button key={index} ref={(el) => (buttonRefs.current[category.desc] = el)} type="button" style={deleteCategoryStyle} onClick={() => handleCategory(category)} className="mainHeaderButton">{category.desc}</button>
            ))}
          </>
        ) : (
          <input type="text" ref={newCategoryRef} placeholder="Новая категория" className="newCategoryInput" />
        )}
      </div>

      {isEdit && (
        <>
          <div className="menuIconWrapper">
            {isAddNewCategory && !displayEditCategory ? (
              <img src={iconCheck} className="menuIcon" onClick={addCategory} alt="icon check" />
            ) : displayEditCategory ? (
              <img src={iconUndo} className="menuIcon" onClick={exitEditMenu} alt="icon undo" />
            ) : (
              <img src={iconAdd} className="menuIcon" onClick={setNewCategory} alt="icon add" />
            )}
          </div>

          {isAddNewCategory && (
            <div className="menuIconWrapper">
              <img src={iconUndo} className="menuIcon" onClick={() => setIsAddNewCategory(false)} alt="icon back" />
            </div>
          )}

          {!isAddNewCategory && !displayEditCategory && (
            <div className="menuIconWrapper">
              <img src={iconEdit} className="menuIcon" onClick={() => { setIsAddNewCategory(false); toggleEditMode(); }} alt="icon edit" />
            </div>
          )}
        </>
      )}
    </div>
  );
}
