import { useState } from 'react';
import s from './Select.module.css'

export default function Select({label, options, onChange, defaultValue}) {
  return (
    <div className={s.fieldset}>
     {label&&<span className={s.label}>{label}</span>}
      <select className={s.select} onChange={onChange} defaultValue={defaultValue}>
        {
            options.length > 0 &&
            options.map((option, index) => (
                    <option key={index}>{option}</option>
            ))}
      </select>
    </div>
  )
}
