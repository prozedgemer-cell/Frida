type Props = {
  active: boolean;
  onToggle: (on: boolean) => void;
};

/** Compact panic control — header icon. */
export function PanicButton({ active, onToggle }: Props) {
  return (
    <button
      type="button"
      className={`panic-btn ${active ? 'is-on' : ''}`}
      onClick={() => onToggle(!active)}
      aria-pressed={active}
      title={active ? 'Emergency stop ON — click to resume' : 'Emergency stop'}
      aria-label={active ? 'Emergency stop active. Click to resume.' : 'Activate emergency stop'}
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
      Emergency stop ON — everything paused
    </p>
  );
}

/** Large centered emergency stop for Home — primary, obvious control. */
export function EmergencyStopHero({ active, onToggle }: Props) {
  return (
    <section className={`estop-hero ${active ? 'is-on' : ''}`} aria-label="Emergency stop">
      <button
        type="button"
        className={`estop-hero__btn ${active ? 'is-on' : ''}`}
        onClick={() => onToggle(!active)}
        aria-pressed={active}
      >
        <span className="estop-hero__icon" aria-hidden>
          <svg viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M12 2 3 7v5c0 5.2 3.4 10 9 11 5.6-1 9-5.8 9-11V7l-9-5Zm-1 6h2v6h-2V8Zm0 8h2v2h-2v-2Z"
            />
          </svg>
        </span>
        <span className="estop-hero__label">
          {active ? 'EMERGENCY STOP ON' : 'EMERGENCY STOP'}
        </span>
        <span className="estop-hero__hint">
          {active ? 'Tap to resume Frida' : 'Tap to pause all orders & punishments'}
        </span>
      </button>
    </section>
  );
}

/** @deprecated use PanicButton */
export function EmergencyStop({ active, onToggle }: Props) {
  return <PanicButton active={active} onToggle={onToggle} />;
}
