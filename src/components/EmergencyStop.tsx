type Props = {
  active: boolean;
  onToggle: (on: boolean) => void;
};

export function EmergencyStop({ active, onToggle }: Props) {
  return (
    <div className={`e-stop ${active ? 'e-stop--on' : ''}`}>
      <div>
        <p className="eyebrow">Sikkerhed</p>
        <h2>NØDSTOP</h2>
        <p className="muted">
          {active
            ? 'Alle ordrer er sat på pause. Ingen nye challenges. Undertøj-beording er frosset.'
            : 'Tryk for at pause alle ordrer med det samme.'}
        </p>
      </div>
      <button
        type="button"
        className={`btn btn--estop ${active ? 'btn--estop-active' : ''}`}
        onClick={() => onToggle(!active)}
        aria-pressed={active}
      >
        {active ? 'NØDSTOP AKTIV — klik for at genoptage' : 'AKTIVER NØDSTOP'}
      </button>
    </div>
  );
}
