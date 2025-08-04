import React, {useRef} from 'react'
import { addItems } from '../../api/productHandling';
import './addItems.css'

export default function AddItems({setisEdit, category}) {

  let inputText = useRef(null);

  let refactorInput = (event) => {
    let lines = inputText.current.value.split(/\r?\n/);
    if (event.key === 'Enter'){
      event.preventDefault();
      // prevent going to next line if current line is empty
      if (lines[lines.length-1].trim() !== "-" && lines[lines.length-1].trim() !== ""){
        // add the "- " at the begining of the line if it's deleted
        if (!lines[lines.length-1].trim().startsWith("- ")){
          let lineLength = lines[lines.length-1].length;
          let tmpText = lines[lines.length-1]
          inputText.current.value =  inputText.current.value.slice(0,-parseInt(lineLength))
          inputText.current.value += "- " + tmpText.trim() + "\n- "
        } else {
        inputText.current.value = inputText.current.value += "\n- "
        }
      }
    }
  }

  let InitInput = (event) => {
    event.preventDefault()
    if (inputText.current.value.trim() === "") {
      inputText.current.value = inputText.current.value += "- "
    }
  }

const handleAdd = async() => {
  if (category === ''){
    return alert('Выбери категорию')
  }
  let items = inputText.current.value.split(/\r?\n/);
  let addedItems = [];
  
  if (items.length > 0 && items[0].trim() !== "" && items[0].trim() !== "-"){
    for (let x=0; x < items.length; x++){
      let obj = {
        desc : "",
        status : "NEW",
        category : {
          desc : ""
        }
      }
      if (items[x].trim()!== ""){
        obj.desc = items[x].replace("- ", "")
        obj.category.desc = category
        addedItems.push(obj)
      }
    }
    await addItems(addedItems)
    setisEdit();
  }
}

  return (
    <div className='add-content-wrapper'>
      <textarea className='add-item-input' type='text' ref={inputText} onKeyDown={refactorInput} onClick={InitInput}
placeholder="Список продуктов.
Один продукт на каждую линию.">      
      </textarea>
      <div className="add-list-button-wrapper">
      <button className='add-list-button' onClick={handleAdd}>+</button>
      </div>
      </div>
  )
}
