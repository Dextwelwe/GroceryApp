import sc from './segmentedControl.module.css'

export default function SegmentedControl({ items, value, onChange }) {
  const activeIndex = Math.max(0, items.findIndex((item) => item.key === value));

  return (
    <div className={sc.track} role='group'>
      <span
        className={sc.thumb}
        aria-hidden='true'
        style={{
          width: `calc((100% - 6px) / ${items.length})`,
          transform: `translateX(${activeIndex * 100}%)`,
        }}
      />
      {items.map((item) => {
        const isActive = item.key === value;
        return (
          <button
            key={item.key}
            type='button'
            className={`${sc.segment} ${isActive ? sc.segmentActive : ''}`}
            aria-pressed={isActive}
            onClick={() => onChange(item.key)}
          >
            {item.icon && <img src={item.icon} alt='' className={sc.icon} />}
            {item.label}
          </button>
        );
      })}
    </div>
  )
}
