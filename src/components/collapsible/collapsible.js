import { useState, useRef, useEffect, useCallback } from "react";
import cl from './collapsible.module.css'

function Collapsible({ title, icon, children, badge }) {
  const [isOpen, setIsOpen] = useState(false);
  const contentRef = useRef(null);
  const [height, setHeight] = useState(0);

  const updateHeight = useCallback(() => {
    if (contentRef.current) {
      setHeight(contentRef.current.scrollHeight);
    }
  }, []);

  useEffect(() => {
    updateHeight();
  }, [children, updateHeight]);

  const toggle = () => setIsOpen((prev) => !prev);

  return (
    <div className={`${cl.container} ${isOpen ? cl.containerOpen : ''}`}>
      <button className={cl.header} onClick={toggle}>
        <div className={cl.titleWrapper}>
          {icon && <img src={icon} alt="icon" className={cl.icon} />}
          <span className={cl.title}>{title}</span>
          {badge != null && badge > 0 && <span className={cl.badge}>{badge}</span>}
        </div>
        <span className={`${cl.chevron} ${isOpen ? cl.chevronOpen : ''}`}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </span>
      </button>

      <div
        className={cl.contentOuter}
        style={{ height: isOpen ? height : 0 }}
      >
        <div ref={contentRef} className={cl.content}>
          {children}
        </div>
      </div>
    </div>
  );
}

export default Collapsible;
