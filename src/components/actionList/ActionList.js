import al from './actionList.module.css'

export function ActionList({ children }) {
  return <div className={al.list}>{children}</div>;
}

export default function ActionRow({ icon, label, onClick, tone = 'accent', type = 'button' }) {
  const tileTone =
    tone === 'danger' ? al.tileDanger
      : tone === 'sage' ? al.tileSage
        : tone === 'neutral' ? al.tileNeutral
          : al.tileAccent;

  return (
    <button
      type={type}
      className={`${al.row} ${tone === 'danger' ? al.rowDanger : ''}`}
      onClick={onClick}
    >
      <span className={`uiTile ${tileTone}`} aria-hidden='true'>{icon}</span>
      <span className={al.label}>{label}</span>
    </button>
  );
}
