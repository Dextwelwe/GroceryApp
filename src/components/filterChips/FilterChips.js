import fc from './filterChips.module.css'

export default function FilterChips({ children, count = 0, onReset, resetLabel, open = false }) {
  return (
    <div className={`${fc.panel} ${open ? fc.panelOpen : ''}`}>
      <div className={fc.row}>
        {children}
        {count > 0 && onReset &&
          <button type='button' className={fc.reset} onClick={onReset}>
            {resetLabel} ({count})
          </button>
        }
      </div>
    </div>
  )
}
