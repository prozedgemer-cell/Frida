import { useMemo, useState } from 'react';
import { getUnderwearById } from '../engines/underwearEngine';
import type {
  ContextState,
  GameResult,
  GameSessionLog,
  PerformanceRating,
  PerformanceSnapshot,
  UnderwearPick,
} from '../types';
import { RATING_LABELS_DA, RESULT_LABELS_DA } from '../types';

type Props = {
  context: ContextState;
  underwear: UnderwearPick | null;
  sessions: GameSessionLog[];
  performance: PerformanceSnapshot;
  pointsBalance: number;
  paused: boolean;
  onChange: (patch: Partial<ContextState>) => void;
  onReroll: () => void;
  onAddSession: (entry: Omit<GameSessionLog, 'id' | 'at'> & { at?: string }) => void;
  onUpdateSession: (id: string, patch: Partial<Omit<GameSessionLog, 'id'>>) => void;
  onDeleteSession: (id: string) => void;
  onGoInGame?: () => void;
};

const RESULTS: GameResult[] = ['win', 'loss', 'quit', 'draw', 'other'];
const RATINGS: PerformanceRating[] = [1, 2, 3, 4, 5];
const MOODS = ['', 'frustreret', 'ok', 'glad', 'kåt', 'underdanig', 'træt'];

type FormState = {
  gameName: string;
  result: GameResult;
  performanceNote: string;
  rating: PerformanceRating;
  durationMin: string;
  mood: string;
};

function emptyForm(game: string): FormState {
  return {
    gameName: game,
    result: 'other',
    performanceNote: '',
    rating: 3,
    durationMin: '',
    mood: '',
  };
}

export function GamingPanel({
  context,
  underwear,
  sessions,
  performance,
  pointsBalance,
  paused,
  onChange,
  onReroll,
  onAddSession,
  onUpdateSession,
  onDeleteSession,
  onGoInGame,
}: Props) {
  const item = underwear ? getUnderwearById(underwear.itemId) : undefined;
  const gaming = Boolean(context.playingGame.trim());
  const [form, setForm] = useState<FormState>(() => emptyForm(context.playingGame));
  const [editingId, setEditingId] = useState<string | null>(null);

  const recent = useMemo(
    () => [...sessions].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 12),
    [sessions],
  );
  const last = recent[0] ?? null;

  const startEditLast = () => {
    if (!last) return;
    setEditingId(last.id);
    setForm({
      gameName: last.gameName,
      result: last.result,
      performanceNote: last.performanceNote,
      rating: last.rating,
      durationMin: last.durationMin != null ? String(last.durationMin) : '',
      mood: last.mood,
    });
  };

  const submit = () => {
    if (paused) return;
    const durationMin = form.durationMin.trim()
      ? Number(form.durationMin)
      : undefined;
    const payload = {
      gameName: form.gameName.trim() || context.playingGame.trim() || 'Ukendt spil',
      result: form.result,
      performanceNote: form.performanceNote.trim(),
      rating: form.rating,
      durationMin:
        durationMin != null && Number.isFinite(durationMin) && durationMin >= 0
          ? durationMin
          : undefined,
      mood: form.mood,
    };
    if (editingId) {
      onUpdateSession(editingId, payload);
      setEditingId(null);
    } else {
      onAddSession(payload);
      if (payload.gameName && payload.gameName !== context.playingGame) {
        onChange({ playingGame: payload.gameName });
      }
    }
    setForm(emptyForm(payload.gameName || context.playingGame));
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(emptyForm(context.playingGame));
  };

  return (
    <div className="mode-stack">
      <section className="panel panel--mode panel--gaming">
        <div className="panel__head">
          <div>
            <p className="eyebrow">Mode · Gaming</p>
            <h2>Session-log & præstation</h2>
          </div>
          <div className="points-chip" title="Bonus-/strafpoint">
            <strong>{pointsBalance}</strong>
            <span>point</span>
          </div>
        </div>
        <p className="muted tiny">
          Log spilresultater her — undertøj, udfordringer og straf/belønning følger din præstation.
        </p>

        <div className="perf-banner">
          <div>
            <span className="eyebrow" style={{ display: 'inline' }}>
              Præstation
            </span>
            <strong className="perf-score">{performance.score}/100</strong>
            <span className={`pill pill--band-${performance.band}`}>{performance.band}</span>
            {performance.streak !== 0 && (
              <span className="pill">
                {performance.streak > 0 ? `W${performance.streak}` : `L${Math.abs(performance.streak)}`}
              </span>
            )}
          </div>
          <p className="tiny muted" style={{ margin: 0 }}>
            {performance.summaryDa}
          </p>
        </div>

        <label className="field">
          <span>Jeg spiller lige nu</span>
          <input
            type="text"
            placeholder="fx Elden Ring, Valorant, Stardew…"
            value={context.playingGame}
            disabled={paused}
            onChange={(e) => {
              onChange({ playingGame: e.target.value });
              if (!editingId) setForm((f) => ({ ...f, gameName: e.target.value }));
            }}
          />
        </label>
        <label className="field">
          <span>Gaming-noter (fri tekst)</span>
          <textarea
            rows={2}
            placeholder="Party, ranked, chill…"
            value={context.notes}
            disabled={paused}
            onChange={(e) => onChange({ notes: e.target.value })}
          />
        </label>
        <div className={`mode-status ${gaming ? 'mode-status--on' : ''}`}>
          <strong>{gaming ? 'Spil aktivt' : 'Intet spil sat'}</strong>
          <span>
            {gaming
              ? `Frida er i "${context.playingGame.trim()}" — log sessionen når du er færdig.`
              : 'Udfyld spilnavn og log en session for at aktivere præstations-styring.'}
          </span>
        </div>
      </section>

      <section className="panel panel--command">
        <p className="eyebrow">{editingId ? 'Rediger sidste session' : 'Log session'}</p>
        <h2>{editingId ? 'Opdater entry' : 'Ny session'}</h2>
        <div className="row">
          <label className="field">
            <span>Spil</span>
            <input
              type="text"
              value={form.gameName}
              disabled={paused}
              onChange={(e) => setForm((f) => ({ ...f, gameName: e.target.value }))}
              placeholder="Spilnavn"
            />
          </label>
          <label className="field">
            <span>Resultat</span>
            <select
              value={form.result}
              disabled={paused}
              onChange={(e) =>
                setForm((f) => ({ ...f, result: e.target.value as GameResult }))
              }
            >
              {RESULTS.map((r) => (
                <option key={r} value={r}>
                  {RESULT_LABELS_DA[r]}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="row">
          <label className="field">
            <span>Selvvurdering</span>
            <select
              value={form.rating}
              disabled={paused}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  rating: Number(e.target.value) as PerformanceRating,
                }))
              }
            >
              {RATINGS.map((r) => (
                <option key={r} value={r}>
                  {r} — {RATING_LABELS_DA[r]}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Varighed (min)</span>
            <input
              type="number"
              min={0}
              inputMode="numeric"
              value={form.durationMin}
              disabled={paused}
              onChange={(e) => setForm((f) => ({ ...f, durationMin: e.target.value }))}
              placeholder="fx 45"
            />
          </label>
        </div>
        <label className="field">
          <span>Score / K/D / rank / note</span>
          <input
            type="text"
            value={form.performanceNote}
            disabled={paused}
            onChange={(e) => setForm((f) => ({ ...f, performanceNote: e.target.value }))}
            placeholder="fx 12/4, Gold 2, boss cleared…"
          />
        </label>
        <label className="field">
          <span>Humør</span>
          <select
            value={form.mood}
            disabled={paused}
            onChange={(e) => setForm((f) => ({ ...f, mood: e.target.value }))}
          >
            {MOODS.map((m) => (
              <option key={m || 'none'} value={m}>
                {m || '—'}
              </option>
            ))}
          </select>
        </label>
        <div className="challenge__actions">
          <button type="button" className="btn btn--ok" disabled={paused} onClick={submit}>
            {editingId ? 'Gem ændring' : 'Log session'}
          </button>
          {editingId && (
            <button type="button" className="btn btn--ghost" onClick={cancelEdit}>
              Annuller
            </button>
          )}
          {!editingId && last && (
            <button
              type="button"
              className="btn btn--secondary"
              disabled={paused}
              onClick={startEditLast}
            >
              Rediger sidste
            </button>
          )}
        </div>
      </section>

      <section className="panel">
        <p className="eyebrow">Historik</p>
        <h2>Seneste sessions</h2>
        {!recent.length && (
          <p className="muted tiny">Ingen sessions endnu — log din første ovenfor.</p>
        )}
        <ul className="log log--sessions">
          {recent.map((s) => (
            <li key={s.id}>
              <div className="session-row">
                <span className={`pill pill--${s.result === 'win' ? 'complete' : s.result === 'loss' || s.result === 'quit' ? 'fail' : 'skip'}`}>
                  {RESULT_LABELS_DA[s.result]}
                </span>
                <strong>{s.gameName}</strong>
                <span className="muted tiny">
                  {RATING_LABELS_DA[s.rating]}
                  {s.performanceNote ? ` · ${s.performanceNote}` : ''}
                  {s.durationMin != null ? ` · ${s.durationMin} min` : ''}
                  {s.mood ? ` · ${s.mood}` : ''}
                </span>
                <time dateTime={s.at}>
                  {new Date(s.at).toLocaleString('da-DK', {
                    hour: '2-digit',
                    minute: '2-digit',
                    day: 'numeric',
                    month: 'short',
                  })}
                </time>
              </div>
              <div className="session-actions">
                {last?.id === s.id && (
                  <button
                    type="button"
                    className="btn btn--ghost btn--tiny"
                    disabled={paused}
                    onClick={startEditLast}
                  >
                    Rediger
                  </button>
                )}
                <button
                  type="button"
                  className="btn btn--ghost btn--tiny"
                  disabled={paused}
                  onClick={() => onDeleteSession(s.id)}
                >
                  Slet
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="panel panel--command">
        <p className="eyebrow">Gaming · undertøjssignal</p>
        <h2>Session-beording</h2>
        {paused && <p className="banner banner--warn">Pauset af nødstop</p>}
        {!underwear && <p className="muted">Ingen beording endnu…</p>}
        {underwear && item && (
          <>
            <p className="command-line">{underwear.orderTextDa}</p>
            <dl className="meta-grid">
              <div>
                <dt>Stykke</dt>
                <dd>{item.nameDa}</dd>
              </div>
              <div>
                <dt>Begrundelse</dt>
                <dd>{underwear.reasonDa}</dd>
              </div>
            </dl>
            {underwear.performanceInfluenceDa && (
              <p className="influence-note">{underwear.performanceInfluenceDa}</p>
            )}
            <button
              type="button"
              className="btn btn--secondary"
              onClick={onReroll}
              disabled={paused}
            >
              Reroll til session
            </button>
          </>
        )}
      </section>

      <section className="panel panel--muted">
        <p className="eyebrow">In-game</p>
        <p className="tiny muted">
          Træk en udfordring der skal gøres <strong>mens du spiller</strong> — bonuspoint ved fuldførelse.
        </p>
        {onGoInGame && (
          <button type="button" className="btn btn--secondary" onClick={onGoInGame}>
            Åbn In-game
          </button>
        )}
      </section>
    </div>
  );
}
