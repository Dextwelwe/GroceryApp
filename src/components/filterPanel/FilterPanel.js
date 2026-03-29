import Collapsible from '../collapsible/collapsible';

export default function FilterPanel({ title, icon, onReset, resetLabel, children }) {
  return (
    <Collapsible title={title} icon={icon}>
      <div className='filtersWrapper'>
        {children}
      </div>
      <button className='actionButton resetFilterBgColor resetFiltersButton' onClick={onReset}>{resetLabel}</button>
    </Collapsible>
  );
}