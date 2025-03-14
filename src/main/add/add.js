import React, {useRef} from 'react'
import { addItems } from '../productHandling';
import './add.css'

export default function Add({setisEdit}) {

  let inputText = useRef(null);
  let RefactorInput = (event) => {
    let lines = inputText.current.value.split(/\r?\n/);
    if (event.key === 'Enter'){
      event.preventDefault();
      if (lines[lines.length-1].trim() != "-" && lines[lines.length-1].trim() != ""){ // prevent going to next line if current line is empty
        if (!lines[lines.length-1].trim().startsWith("- ")){ // add the "- " at the begining of the line if it's deleted
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
  let items = inputText.current.value.split(/\r?\n/);
  let addedItems = [];

  if (items.length > 0 && items[0].trim() != "" && items[0].trim() != "- "){
    for (let x=0; x < items.length; x++){
      let obj = {
        desc : "",
        status : "NEW"
      }
      if (items[x].trim()!= ""){
        obj.desc = items[x].replace("- ", "")
        addedItems.push(obj)
      }
    }
    await addItems(addedItems)
    setisEdit()
  }
}

  return (
    <div className='add-content-wrapper'>
      <textarea className='add-item-input' type='text' ref={inputText} onKeyDown={RefactorInput} onClick={InitInput}
placeholder="Список продуктов.
Один продукт на каждую линию.">      
      </textarea>
      <div class="add-list-button-wrapper">
      <button className='add-list-button' onClick={handleAdd}>+</button>
      </div>
      </div>
  )
}
