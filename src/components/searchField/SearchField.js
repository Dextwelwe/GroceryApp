import { useEffect, useRef } from 'react'
import sf from './searchField.module.css'

export default function SearchField({ value, onChange, onClear, placeholder, label, clearLabel }) {
  const inputRef = useRef(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  return (
    <div className={sf.wrapper}>
      <svg className={sf.icon} viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.9' strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'>
        <circle cx='11' cy='11' r='6.4' />
        <path d='M15.8 15.8 20.5 20.5' />
      </svg>
      <input
        ref={inputRef}
        type='text'
        className={`uiField ${sf.input}`}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={label}
        autoComplete='off'
        autoCorrect='off'
        autoCapitalize='none'
        enterKeyHint='search'
      />
      {value !== '' &&
        <button type='button' className={sf.clear} onClick={onClear} aria-label={clearLabel} title={clearLabel}>
          ×
        </button>
      }
    </div>
  )
}
