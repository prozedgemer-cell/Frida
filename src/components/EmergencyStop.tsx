type Props = {
  active: boolean;
  onToggle: (on: boolean) => void;
};

/** Compact panic control — top-right icon only. */
export function PanicButton({ active, onToggle }: Props) {
  return (
    <button
      type="button"
      className={`panic-btn ${active ? 'is-on' : ''}`}
      onClick={() => onToggle(!active)}
      aria-pressed={active}
      title={active ? 'Nødstop ON — klik for at genoptage' : 'Nødstop'}
      aria-label={active ? 'Nødstop aktiv. Klik for at genoptage.' : 'Aktiver nødstop'}
    >
      <svg viewBox="0 0 24 24" aria-hidden className="panic-btn__icon">
        <path
          fill="currentColor"
          d="M12 2 3 7v5c0 5.2 3.4 10 9 11 5.6-1 9-5.8 9-11V7l-9-5Zm-1 6h2v6h-2V8Zm0 8h2v2h-2v-2Z"
        />
      </svg>
    </button>
  );
}

export function EstopSlimBanner({ active }: { active: boolean }) {
  if (!active) return null;
  return (
    <p className="estop-slim" role="status">
      Nødstop ON — alt pauset
    </p>
  );
}

/** @deprecated use PanicButton */
export function EmergencyStop({ active, onToggle }: Props) {
  return <PanicButton active={active} onToggle={onToggle} />;
}
