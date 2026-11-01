import s from './Select.module.css'

export default function Select({ label, options, name, onChange, value, isActive = false }) {
  const list = options || [];
  const current = list.find((option) => option.value === value) || list[0];

  if (list.length === 0) return null;

  return (
    <div className={`${s.chip} ${isActive ? s.chipActive : ''}`}>
      {label &&
        <span className={s.label} aria-hidden='true'>{label}</span>
      }
      <span className={s.value} aria-hidden='true'>{current ? current.label : ''}</span>
      <svg className={s.chevron} viewBox='0 0 10 6' fill='none' aria-hidden='true'>
        <path
          d='M1 1L5 5L9 1'
          stroke='currentColor'
          strokeWidth='1.6'
          strokeLinecap='round'
          strokeLinejoin='round'
        />
      </svg>
      <select
        className={s.native}
        name={name}
        value={value}
        onChange={onChange}
        aria-label={label}
      >
        {list.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </div>
  )
}
