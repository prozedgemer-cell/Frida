import type { BreastSize, DayMode, Intensity, Profile, ThemePack } from '../types';
import { ALL_THEMES } from '../types';

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

type Props = {
  profile: Profile;
  onChange: (patch: Partial<Profile>) => void;
  disabled?: boolean;
};

export function ProfilePanel({ profile, onChange, disabled }: Props) {
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
      <p className="muted tiny">
        Soft/hard-dag styres også under <strong>Hverdag</strong>. Themes og hard limits hører til
        profilen.
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
    </section>
  );
}
