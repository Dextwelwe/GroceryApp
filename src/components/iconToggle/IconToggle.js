import it from './iconToggle.module.css'

export default function IconToggle({ active = false, badge = 0, onClick, label, children }) {
  return (
    <button
      type='button'
      className={`uiIconBtn ${it.toggle} ${active ? it.toggleActive : ''}`}
      onClick={onClick}
      aria-label={label}
      aria-expanded={active}
      title={label}
    >
      {children}
      {badge > 0 && <span className={it.badge}>{badge}</span>}
    </button>
  )
}
