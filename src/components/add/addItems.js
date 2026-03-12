import { useRef, forwardRef } from 'react'
import './addItems.css'
import { useTranslation} from 'react-i18next';

const AddItems = forwardRef(function AddItems({setItemsList}, ref) {
  const { t } = useTranslation();
  let inputText = useRef(null);

  const combinedRef = (node) => {
    inputText.current = node;
    if (ref) {
      if (typeof ref === 'function') ref(node);
      else ref.current = node;
    }
  };

  let refactorInput = (event) => {
    let lines = inputText.current.value.split(/\r?\n/);
    let finalStr = '';
    if (event.key === 'Enter'){
      event.preventDefault();
      // prevent going to next line if current line is empty
      if (lines[lines.length-1].trim() !== "-" && lines[lines.length-1].trim() !== ""){
        // add the "- " at the begining of the line if it's deleted
        if (!lines[lines.length-1].trim().startsWith("- ")){
          let lineLength = lines[lines.length-1].length;
          let tmpText = lines[lines.length-1]
          finalStr = inputText.current.value.slice(0,-parseInt(lineLength))
          finalStr += "- " + tmpText.trim() + "\n- "
          inputText.current.value =  finalStr;
        } else {
          finalStr =  inputText.current.value += "\n- "
          inputText.current.value = finalStr
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

const handleBlur = () => {
 let itemsArr = inputText.current.value.split('\n').map(el => el.replace(/^- /, "").trim()).filter(el => el.length > 0);  
 setItemsList(itemsArr);
}

  return (
      <textarea className='add-item-input' id='items' type='text' ref={combinedRef} onKeyDown={refactorInput} onBlur={handleBlur} onClick={InitInput}
        placeholder={t('ADD_ITEM_DESC')}>      
      </textarea>
  )
})

export default AddItems;
