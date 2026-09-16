import type { ContextState, IrlStatus } from '../types';

const IRL_OPTIONS: { value: IrlStatus; label: string }[] = [
  { value: 'home', label: 'Hjemme' },
  { value: 'alone', label: 'Alene' },
  { value: 'out', label: 'Ude' },
  { value: 'work', label: 'Arbejde' },
  { value: 'public', label: 'Offentligt' },
];

type Props = {
  context: ContextState;
  onChange: (patch: Partial<ContextState>) => void;
  disabled?: boolean;
};

export function ContextControls({ context, onChange, disabled }: Props) {
  return (
    <section className="panel">
      <p className="eyebrow">Kontekst</p>
      <h2>Tid / IRL / Gaming</h2>
      <label className="field">
        <span>IRL-status</span>
        <select
          value={context.irlStatus}
          disabled={disabled}
          onChange={(e) => onChange({ irlStatus: e.target.value as IrlStatus })}
        >
          {IRL_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        <span>Jeg spiller lige nu</span>
        <input
          type="text"
          placeholder="fx Elden Ring, Valorant…"
          value={context.playingGame}
          disabled={disabled}
          onChange={(e) => onChange({ playingGame: e.target.value })}
        />
      </label>
      <label className="field">
        <span>Noter</span>
        <textarea
          rows={2}
          placeholder="Valgfri kontekst til dig selv"
          value={context.notes}
          disabled={disabled}
          onChange={(e) => onChange({ notes: e.target.value })}
        />
      </label>
      <p className="muted tiny">
        Klokkeslæt og hverdag/weekend bruges automatisk af undertøjs-motoren.
      </p>
    </section>
  );
}
