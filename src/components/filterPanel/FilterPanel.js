import Collapsible from '../collapsible/collapsible';
import styles from './filterPanel.module.css';

export default function FilterPanel({ title, icon, onReset, resetLabel, children, badge }) {
  return (
    <Collapsible title={title} icon={icon} badge={badge}>
      <div className={styles.filtersGrid}>
        {children}
      </div>
      <div className={styles.footer}>
        <button className={styles.resetButton} onClick={onReset}>
          {resetLabel}
        </button>
      </div>
    </Collapsible>
  );
}