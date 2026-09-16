import type {
  BreastSize,
  ContextState,
  DayMode,
  Intensity,
  IrlStatus,
  Profile,
  ThemePack,
} from '../types';
import { ALL_THEMES } from '../types';
import { ImageGallery } from './ImageGallery';

const BREASTS: BreastSize[] = ['A', 'B', 'C', 'D', 'DD', 'E', 'F', 'G'];

const THEME_LABELS: Record<ThemePack, string> = {
  bdsm: 'BDSM',
  clothing: 'Tøj/undertøj',
  sex: 'Sex',
  irl: 'IRL',
  porn: 'Porn',
  anime: 'Anime',
  hentai: 'Hentai',
  fantasy: 'Fantasy roleplay',
};

const IRL_OPTIONS: { value: IrlStatus; label: string }[] = [
  { value: 'home', label: 'Hjemme' },
  { value: 'alone', label: 'Alene' },
  { value: 'out', label: 'Ude' },
  { value: 'work', label: 'Arbejde' },
  { value: 'public', label: 'Offentligt' },
];

type Props = {
  profile: Profile;
  context?: ContextState;
  onChange: (patch: Partial<Profile>) => void;
  onContext?: (patch: Partial<ContextState>) => void;
  disabled?: boolean;
};

export function ProfilePanel({ profile, context, onChange, onContext, disabled }: Props) {
  const toggleTheme = (t: ThemePack) => {
    const has = profile.enabledThemes.includes(t);
    const enabledThemes = has
      ? profile.enabledThemes.filter((x) => x !== t)
      : [...profile.enabledThemes, t];
    onChange({ enabledThemes: enabledThemes.length ? enabledThemes : ['clothing'] });
  };

  const toggleLimit = (limit: string) => {
    const has = profile.hardLimits.includes(limit);
    onChange({
      hardLimits: has
        ? profile.hardLimits.filter((l) => l !== limit)
        : [...profile.hardLimits, limit],
    });
  };

  const addLimit = (raw: string) => {
    const v = raw.trim().toLowerCase();
    if (!v || profile.hardLimits.includes(v)) return;
    onChange({ hardLimits: [...profile.hardLimits, v] });
  };

  return (
    <section className="panel panel--mode panel--profil">
      <p className="eyebrow">Mode · Profil</p>
      <h2>Frida</h2>
      <label className="field">
        <span>Navn (låst)</span>
        <input type="text" value="Frida" readOnly disabled />
      </label>
      <label className="field">
        <span>Fake breast størrelse (cup)</span>
        <select
          value={profile.breastSize}
          disabled={disabled}
          onChange={(e) => onChange({ breastSize: e.target.value as BreastSize })}
        >
          {BREASTS.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
      </label>
      <div className="row">
        <label className="field">
          <span>Intensitet</span>
          <select
            value={profile.intensity}
            disabled={disabled}
            onChange={(e) => onChange({ intensity: e.target.value as Intensity })}
          >
            <option value="soft">Soft</option>
            <option value="hard">Hard</option>
          </select>
        </label>
        <label className="field">
          <span>Dag-tilstand</span>
          <select
            value={profile.dayMode}
            disabled={disabled}
            onChange={(e) => onChange({ dayMode: e.target.value as DayMode })}
          >
            <option value="soft">Soft-dag</option>
            <option value="hard">Hard-dag</option>
          </select>
        </label>
      </div>
      {context && onContext && (
        <label className="field">
          <span>IRL-status</span>
          <select
            value={context.irlStatus}
            disabled={disabled}
            onChange={(e) => onContext({ irlStatus: e.target.value as IrlStatus })}
          >
            {IRL_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      )}
      <p className="muted tiny">
        IRL, soft/hard-dag og themes styrer outfit (~70%) sammen med gaming-præstation (~30%).
      </p>
      <fieldset className="fieldset" disabled={disabled}>
        <legend>Theme packs</legend>
        <div className="chip-grid">
          {ALL_THEMES.map((t) => (
            <label key={t} className="chip">
              <input
                type="checkbox"
                checked={profile.enabledThemes.includes(t)}
                onChange={() => toggleTheme(t)}
              />
              {THEME_LABELS[t]}
            </label>
          ))}
        </div>
      </fieldset>
      <fieldset className="fieldset" disabled={disabled}>
        <legend>Hard limits</legend>
        <div className="chip-grid">
          {profile.hardLimits.map((l) => (
            <label key={l} className="chip chip--limit">
              <input type="checkbox" checked onChange={() => toggleLimit(l)} />
              {l}
            </label>
          ))}
        </div>
        <form
          className="inline-add"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            addLimit(String(fd.get('limit') || ''));
            e.currentTarget.reset();
          }}
        >
          <input name="limit" placeholder="Tilføj hard limit…" />
          <button type="submit" className="btn btn--secondary">
            Tilføj
          </button>
        </form>
      </fieldset>
      <ImageGallery
        slot="profile"
        titleDa="Profil-fotos"
        hintDa="Egne billeder af Frida. Kun på denne enhed (IndexedDB)."
      />
    </section>
  );
}
