import { useState } from 'react';
import s from './Select.module.css'

export default function Select({label, options, name, onChange, value}) {
  return (
    <div className={s.fieldset}>
     {label&&<span className={s.label}>{label}</span>}
      <select className={s.select} name={name} onChange={onChange} value={value}>
        {
            options.length > 0 &&
            options.map((option, index) => (
                    <option className={s.option} key={index} value={option.value}>{option.label}</option>
            ))}
      </select>
    </div>
  )
}
