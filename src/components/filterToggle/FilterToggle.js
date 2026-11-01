import IconToggle from '../iconToggle/IconToggle'
import filterIcon from '../../assets/images/icons/filter.svg'

export default function FilterToggle({ open, count = 0, onClick, label }) {
  return (
    <IconToggle active={open} badge={count} onClick={onClick} label={label}>
      <img src={filterIcon} alt='' />
    </IconToggle>
  )
}
