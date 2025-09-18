import s from './Select.module.css'

export default function Select({label, options, name, onChange, value, doHighLight=false}) {
  
  const hightlitedStyle = {
    backgroundColor : '#F5F5F5',
    border : '1px solid grey',
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
