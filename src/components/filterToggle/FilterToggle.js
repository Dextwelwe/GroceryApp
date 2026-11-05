import IconToggle from '../iconToggle/IconToggle'

export default function FilterToggle({ open, count = 0, onClick, label }) {
  return (
    <IconToggle active={open} badge={count} onClick={onClick} label={label}>
      <svg
        viewBox='0 0 24 24'
        fill='none'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinecap='round'
        aria-hidden='true'
      >
        <path d='M3 7h18' />
        <path d='M6 12h12' />
        <path d='M9 17h6' />
      </svg>
    </IconToggle>
  )
}
