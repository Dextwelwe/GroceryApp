import { useState } from "react";
import cl from  './collapsible.module.css'

function Collapsible({ title, icon, children }) {
  const [isOpen, setIsOpen] = useState(false);

  const toggle = () => setIsOpen((prev) => !prev);

  return (
    <div className={cl.container}>
      <button className={cl.header} onClick={toggle}>
        <div className={cl.titleWrapper}>
        {icon && <img src={icon} alt="icon" className={cl.icon} /> }
        <h1 className={cl.title}>{title}</h1>
        </div>
        <span className={cl.openFilter}>{isOpen ? "−" : "+"}</span>
        
      </button>

      {isOpen && (
        <div className={cl.content}>
          {children}
        </div>
      )}
    </div>
  );
}

export default Collapsible;
