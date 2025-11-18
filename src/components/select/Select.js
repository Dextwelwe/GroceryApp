import s from './Select.module.css'

export default function Select({label, options, name, onChange, value, doHighLight=false}) {
  
  const hightlitedStyle = {
    backgroundColor : '#E3F2FD',
    border : '1px solid  #64B5F6',
    color : '#0D47A1',
    fontWeight: '500'
  }

  return (
    <div className={s.fieldset}>
     {label&&<span className={s.label}>{label}</span>}
      <select className={s.select} name={name} onChange={onChange} value={value} style={doHighLight ? hightlitedStyle : {}}>
        {
            options.length > 0 &&
            options.map((option, index) => (
                    <option className={s.option} key={index} value={option.value}>{option.label}</option>
            ))}
      </select>
    </div>
  )
}
