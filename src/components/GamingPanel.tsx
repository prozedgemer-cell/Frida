import { useEffect, useMemo, useState } from 'react';
import {
  ACTIVE_GAME_PICKER_IDS,
  getPreset,
  matchPresetFromGameName,
  type GamePresetId,
  type MetricFieldDef,
} from '../data/gameProfiles';
import {
  computeGameScore,
  formatNetCashDa,
  maybeInferResult,
  metricsSummaryDa,
  ratingFromScore,
  type MetricMap,
} from '../engines/gameScoreEngine';
import { getUnderwearById } from '../engines/underwearEngine';
import { OutfitLayers } from './OutfitLayers';
import type {
  ContextState,
  GameResult,
  GameSessionLog,
  PerformanceRating,
  PerformanceSnapshot,
  UnderwearPick,
} from '../types';
import { RATING_LABELS_DA, RESULT_LABELS_DA } from '../types';
import { parseTrackerPaste } from '../utils/trackerPaste';

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
const SHOOTER_RESULTS: GameResult[] = ['win', 'loss', 'draw', 'quit', 'other'];
const RATINGS: PerformanceRating[] = [1, 2, 3, 4, 5];
const MOODS = ['', 'frustreret', 'ok', 'glad', 'kåt', 'underdanig', 'træt'];

type FormState = {
  gameId: GamePresetId;
  gameName: string;
  result: GameResult;
  performanceNote: string;
  rating: PerformanceRating;
  durationMin: string;
  mood: string;
  metrics: MetricMap;
  pasteText: string;
  showHelp: boolean;
  showPaste: boolean;
  showAdvanced: boolean;
};

function emptyMetrics(fields: MetricFieldDef[]): MetricMap {
  const m: MetricMap = {};
  for (const f of fields) {
    if (f.type === 'select' && f.options?.[0]) {
      m[f.key] = f.options[0].value;
    } else {
      m[f.key] = '';
    }
  }
  return m;
}

function emptyForm(gameName: string, gameId?: GamePresetId): FormState {
  const id = gameId ?? matchPresetFromGameName(gameName);
  const preset = getPreset(id);
  return {
    gameId: id,
    gameName: gameName || (id !== 'custom' ? preset.shortDa : ''),
    result: 'other',
    performanceNote: '',
    rating: 3,
    durationMin: '',
    mood: '',
    metrics: emptyMetrics(preset.fields),
    pasteText: '',
    showHelp: false,
    showPaste: false,
    showAdvanced: false,
  };
}

function livePreviewScore(form: FormState): number | null {
  const result = maybeInferResult(form.gameId, form.metrics, form.result);
  return computeGameScore(form.gameId, form.metrics, result);
}

function renderMetricField(
  field: MetricFieldDef,
  value: string,
  paused: boolean,
  onChange: (key: string, value: string) => void,
  extraClass?: string,
) {
  const isNetCash = field.key === 'cash';
  const numVal = Number(String(value).replace(',', '.'));
  const cashHint =
    isNetCash && value !== '' && Number.isFinite(numVal)
      ? formatNetCashDa(numVal)
      : null;

  return (
    <label
      key={field.key}
      className={`field ${isNetCash ? 'field--net-cash' : ''} ${extraClass ?? ''}`}
    >
      <span>
        {field.labelDa}
        {field.optional && !isNetCash ? ' (valgfri)' : ''}
        {isNetCash ? ' ★' : ''}
      </span>
      {field.type === 'select' ? (
        <select
          value={value}
          disabled={paused}
          onChange={(e) => onChange(field.key, e.target.value)}
        >
          {(field.options ?? []).map((o) => (
            <option key={o.value || 'empty'} value={o.value}>
              {o.labelDa}
            </option>
          ))}
        </select>
      ) : field.type === 'text' ? (
        <input
          type="text"
          value={value}
          disabled={paused}
          placeholder={field.hint}
          onChange={(e) => onChange(field.key, e.target.value)}
        />
      ) : (
        <input
          type="number"
          inputMode="decimal"
          min={field.min}
          max={field.max}
          step={field.step ?? 'any'}
          value={value}
          disabled={paused}
          placeholder={field.hint}
          onChange={(e) => onChange(field.key, e.target.value)}
        />
      )}
      {isNetCash && (
        <span
          className={`net-cash-hint ${
            cashHint?.startsWith('Profit')
              ? 'net-cash-hint--profit'
              : cashHint?.startsWith('Tab')
                ? 'net-cash-hint--tab'
                : ''
          }`}
        >
          {cashHint ?? 'Spilvaluta/cash · positiv = profit · negativ = tab'}
        </span>
      )}
    </label>
  );
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
  const [form, setForm] = useState<FormState>(() =>
    emptyForm(context.playingGame, context.activeGameId),
  );
  const [editingId, setEditingId] = useState<string | null>(null);

  // Sync preset when context active game changes from In-game tab
  useEffect(() => {
    if (editingId) return;
    if (context.activeGameId && context.activeGameId !== form.gameId) {
      const preset = getPreset(context.activeGameId);
      setForm((f) => ({
        ...f,
        gameId: context.activeGameId!,
        gameName: context.playingGame || preset.shortDa,
        metrics: emptyMetrics(preset.fields),
        showAdvanced: false,
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only react to context preset switches
  }, [context.activeGameId, context.playingGame, editingId]);

  const recent = useMemo(
    () => [...sessions].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 12),
    [sessions],
  );
  const last = recent[0] ?? null;
  const preset = getPreset(form.gameId);
  const preview = livePreviewScore(form);
  const isShooter = Boolean(preset.isShooter);
  const primaryFields = preset.fields.filter((f) => !f.advanced);
  const advancedFields = preset.fields.filter((f) => f.advanced);

  const selectGame = (id: GamePresetId) => {
    const p = getPreset(id);
    const name = id === 'custom' ? form.gameName : p.shortDa;
    setForm((f) => ({
      ...f,
      gameId: id,
      gameName: name,
      metrics: emptyMetrics(p.fields),
      pasteText: '',
      showAdvanced: false,
      // Default shooters toward a clear win/loss choice
      result: p.isShooter && f.result === 'other' ? f.result : f.result,
    }));
    onChange({
      playingGame: name,
      activeGameId: id === 'custom' ? undefined : id,
    });
  };

  const setMetric = (key: string, value: string) => {
    setForm((f) => ({ ...f, metrics: { ...f.metrics, [key]: value } }));
  };

  const startEditLast = () => {
    if (!last) return;
    setEditingId(last.id);
    const id = last.gameId ?? matchPresetFromGameName(last.gameName);
    const p = getPreset(id);
    const metrics = { ...emptyMetrics(p.fields), ...(last.metrics ?? {}) };
    setForm({
      gameId: id,
      gameName: last.gameName,
      result: last.result,
      performanceNote: last.performanceNote,
      rating: last.rating,
      durationMin: last.durationMin != null ? String(last.durationMin) : '',
      mood: last.mood,
      metrics,
      pasteText: '',
      showHelp: false,
      showPaste: false,
      showAdvanced: false,
    });
  };

  const applyPaste = () => {
    const parsed = parseTrackerPaste(form.pasteText, form.gameId);
    setForm((f) => ({
      ...f,
      metrics: { ...f.metrics, ...parsed.metrics },
      result: parsed.result ?? f.result,
      performanceNote: parsed.note ?? f.performanceNote,
      showPaste: false,
    }));
  };

  const submit = () => {
    if (paused) return;
    const durationMin = form.durationMin.trim()
      ? Number(form.durationMin)
      : undefined;

    // Normalize metric values: numbers where fields are number-typed
    const cleanMetrics: Record<string, number | string> = {};
    for (const field of preset.fields) {
      const raw = form.metrics[field.key];
      if (raw === undefined || raw === '') continue;
      if (field.type === 'number') {
        const n = Number(String(raw).replace(',', '.'));
        if (Number.isFinite(n)) cleanMetrics[field.key] = n;
      } else {
        cleanMetrics[field.key] = String(raw);
      }
    }

    const result = maybeInferResult(form.gameId, cleanMetrics, form.result);
    const computed =
      form.gameId !== 'custom'
        ? computeGameScore(form.gameId, cleanMetrics, result)
        : null;
    const rating: PerformanceRating =
      computed != null ? ratingFromScore(computed) : form.rating;
    const autoNote = metricsSummaryDa(form.gameId, cleanMetrics);
    const performanceNote =
      form.performanceNote.trim() ||
      autoNote ||
      (computed != null ? `KPI ${computed}/100` : '');

    const payload: Omit<GameSessionLog, 'id' | 'at'> = {
      gameName: form.gameName.trim() || context.playingGame.trim() || 'Ukendt spil',
      result,
      performanceNote,
      rating,
      durationMin:
        durationMin != null && Number.isFinite(durationMin) && durationMin >= 0
          ? durationMin
          : undefined,
      mood: form.mood,
      gameId: form.gameId,
      metrics: Object.keys(cleanMetrics).length ? cleanMetrics : undefined,
      computedScore: computed ?? undefined,
    };

    if (editingId) {
      onUpdateSession(editingId, payload);
      setEditingId(null);
    } else {
      onAddSession(payload);
      onChange({
        playingGame: payload.gameName,
        activeGameId: form.gameId === 'custom' ? undefined : form.gameId,
      });
    }
    setForm(emptyForm(payload.gameName, form.gameId));
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(emptyForm(context.playingGame, context.activeGameId));
  };

  const resultChoices = isShooter ? SHOOTER_RESULTS : RESULTS;

  return (
    <div className="mode-stack">
      <section className="panel panel--mode panel--gaming">
        <div className="panel__head">
          <div>
            <p className="eyebrow">Mode · Gaming / Under spil</p>
            <h2>KPI-session & præstation</h2>
          </div>
          <div className="points-chip" title="Bonus-/strafpoint">
            <strong>{pointsBalance}</strong>
            <span>point</span>
          </div>
        </div>
        <p className="muted tiny">
          Vælg aktivt spil → log KDA + sejr/nederlag (shooters) → Frida scorer 0–100. Avancerede
          stats er valgfrie. Ingen passwords — kun manuel / paste.
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

        <div className="active-game-picker">
          <div className="active-game-picker__head">
            <p className="eyebrow" style={{ margin: 0 }}>
              Aktivt spil
            </p>
            <h3 className="active-game-picker__title">Hvilket spil spiller du?</h3>
            <p className="tiny muted" style={{ margin: 0 }}>
              Sætter spil for logging, in-game-udfordringer og præstation. Valget gemmes.
            </p>
          </div>
          <div className="game-preset-grid game-preset-grid--prominent" role="list">
            {ACTIVE_GAME_PICKER_IDS.map((id) => {
              const p = getPreset(id);
              const active =
                form.gameId === id ||
                context.activeGameId === id ||
                (!context.activeGameId &&
                  matchPresetFromGameName(context.playingGame) === id &&
                  form.gameId === id);
              return (
                <button
                  key={id}
                  type="button"
                  role="listitem"
                  className={`game-chip game-chip--lg ${active ? 'game-chip--active' : ''}`}
                  disabled={paused}
                  onClick={() => selectGame(id)}
                >
                  {p.shortDa}
                </button>
              );
            })}
            <button
              type="button"
              role="listitem"
              className={`game-chip ${form.gameId === 'custom' ? 'game-chip--active' : ''}`}
              disabled={paused}
              onClick={() => selectGame('custom')}
            >
              Andet
            </button>
          </div>
          {(context.activeGameId || form.gameId !== 'custom') && (
            <p className="active-game-picker__current">
              Nu aktivt:{' '}
              <strong>{getPreset(context.activeGameId ?? form.gameId).shortDa}</strong>
              {context.playingGame.trim() && context.playingGame.trim() !== getPreset(context.activeGameId ?? form.gameId).shortDa
                ? ` · ${context.playingGame.trim()}`
                : ''}
            </p>
          )}
        </div>

        {form.gameId === 'wardogs' && (
          <p className="assumption-note">
            Antagelse: <strong>WARDOGS</strong> (BULKHEAD 2026 warfare-FPS) — ikke Watch Dogs /
            Warzone. Log <strong>netto penge</strong> (profit eller tab i spilvaluta).
          </p>
        )}
        {form.gameId === 'diablo4' && (
          <p className="assumption-note">
            Antagelse: <strong>Diablo IV</strong> (sæson / The Pit).
          </p>
        )}

        <label className="field">
          <span>Jeg spiller lige nu (fritekst)</span>
          <input
            type="text"
            placeholder="fx CS2, WARDOGS, LoL…"
            value={context.playingGame}
            disabled={paused}
            onChange={(e) => {
              const v = e.target.value;
              onChange({
                playingGame: v,
                activeGameId: matchPresetFromGameName(v),
              });
              if (!editingId) {
                const id = matchPresetFromGameName(v);
                setForm((f) =>
                  id !== f.gameId
                    ? {
                        ...f,
                        gameName: v,
                        gameId: id,
                        metrics: emptyMetrics(getPreset(id).fields),
                        showAdvanced: false,
                      }
                    : { ...f, gameName: v },
                );
              }
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
              ? `Frida er i "${context.playingGame.trim()}" — log KDA + resultat efter match.`
              : 'Vælg aktivt spil ovenfor og log session for at aktivere præstations-styring.'}
          </span>
        </div>
      </section>

      <section className="panel panel--command">
        <p className="eyebrow">{editingId ? 'Rediger sidste session' : 'Log session'}</p>
        <h2>
          {editingId ? 'Opdater entry' : 'Ny session'} · {preset.shortDa}
        </h2>
        <p className="tiny muted">{preset.fetchNoteDa}</p>

        <label className="field">
          <span>Spilnavn</span>
          <input
            type="text"
            value={form.gameName}
            disabled={paused}
            onChange={(e) => setForm((f) => ({ ...f, gameName: e.target.value }))}
            placeholder="Spilnavn"
          />
        </label>

        {/* Win / loss — prominent for shooters */}
        <div className="result-block">
          <span className="result-block__label">
            {isShooter ? 'Sejr eller nederlag' : 'Resultat'}
          </span>
          <div className="result-toggle" role="group" aria-label="Resultat">
            {(['win', 'loss'] as GameResult[]).map((r) => (
              <button
                key={r}
                type="button"
                className={`result-btn result-btn--${r} ${form.result === r ? 'result-btn--active' : ''}`}
                disabled={paused}
                onClick={() => setForm((f) => ({ ...f, result: r }))}
              >
                {RESULT_LABELS_DA[r]}
              </button>
            ))}
          </div>
          <div className="result-extra">
            <select
              value={form.result}
              disabled={paused}
              aria-label="Andet resultat"
              onChange={(e) =>
                setForm((f) => ({ ...f, result: e.target.value as GameResult }))
              }
            >
              {resultChoices.map((r) => (
                <option key={r} value={r}>
                  {RESULT_LABELS_DA[r]}
                </option>
              ))}
            </select>
          </div>
        </div>

        {primaryFields.length > 0 && (
          <>
            <p className="metrics-section-label">
              {isShooter ? 'KDA (primært)' : 'KPI-felter'}
            </p>
            <div className="metrics-grid">
              {primaryFields.map((field) =>
                renderMetricField(
                  field,
                  String(form.metrics[field.key] ?? ''),
                  paused,
                  setMetric,
                ),
              )}
            </div>
          </>
        )}

        {advancedFields.length > 0 && (
          <div className="advanced-metrics">
            <button
              type="button"
              className="btn btn--ghost btn--tiny"
              onClick={() => setForm((f) => ({ ...f, showAdvanced: !f.showAdvanced }))}
            >
              {form.showAdvanced
                ? 'Skjul avancerede stats'
                : `Avancerede stats (${advancedFields.length}) — valgfrit`}
            </button>
            {form.showAdvanced && (
              <div className="metrics-grid metrics-grid--advanced">
                {advancedFields.map((field) =>
                  renderMetricField(
                    field,
                    String(form.metrics[field.key] ?? ''),
                    paused,
                    setMetric,
                  ),
                )}
              </div>
            )}
          </div>
        )}

        {preview != null && (
          <div className="kpi-preview">
            <span className="eyebrow" style={{ display: 'inline' }}>
              Live KPI
            </span>
            <strong>{preview}/100</strong>
            <span className="muted tiny">
              → rating {ratingFromScore(preview)} ({RATING_LABELS_DA[ratingFromScore(preview)]})
            </span>
          </div>
        )}

        <div className="row">
          {form.gameId === 'custom' && (
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
          )}
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
        </div>

        <label className="field">
          <span>Ekstra note (valgfri — KPI udfylder automatisk)</span>
          <input
            type="text"
            value={form.performanceNote}
            disabled={paused}
            onChange={(e) => setForm((f) => ({ ...f, performanceNote: e.target.value }))}
            placeholder="fx clutch, throw, carry…"
          />
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
          <button
            type="button"
            className="btn btn--ghost btn--tiny"
            onClick={() => setForm((f) => ({ ...f, showHelp: !f.showHelp }))}
          >
            {form.showHelp ? 'Skjul formel' : 'Formel / hjælp'}
          </button>
          {form.gameId !== 'custom' && (
            <button
              type="button"
              className="btn btn--ghost btn--tiny"
              disabled={paused}
              onClick={() => setForm((f) => ({ ...f, showPaste: !f.showPaste }))}
            >
              Paste tracker
            </button>
          )}
        </div>

        {form.showHelp && (
          <div className="help-box">
            <p className="tiny">{preset.helpDa}</p>
            <p className="tiny muted">Trackers: {preset.trackerHintDa}</p>
          </div>
        )}

        {form.showPaste && (
          <div className="paste-box">
            <label className="field">
              <span>Paste fra Leetify / OP.GG / Tracker.gg (kun tekst — ingen login)</span>
              <textarea
                rows={4}
                value={form.pasteText}
                disabled={paused}
                placeholder="fx 18/12/4 · ADR 92 · HS 48%  Victory"
                onChange={(e) => setForm((f) => ({ ...f, pasteText: e.target.value }))}
              />
            </label>
            <button type="button" className="btn btn--secondary" disabled={paused} onClick={applyPaste}>
              Udfyld felter fra paste
            </button>
          </div>
        )}
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
                <span
                  className={`pill pill--${
                    s.result === 'win'
                      ? 'complete'
                      : s.result === 'loss' || s.result === 'quit'
                        ? 'fail'
                        : 'skip'
                  }`}
                >
                  {RESULT_LABELS_DA[s.result]}
                </span>
                <strong>{s.gameName}</strong>
                {s.computedScore != null && (
                  <span className="pill pill--kpi">{s.computedScore}/100</span>
                )}
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
        <p className="eyebrow">Gaming · outfit-signal</p>
        <h2>Session-uniform</h2>
        {paused && <p className="banner banner--warn">Pauset af nødstop</p>}
        {!underwear && <p className="muted">Ingen beording endnu…</p>}
        {underwear && (
          <>
            <p className="command-line">{underwear.orderTextDa}</p>
            <OutfitLayers layers={underwear.layers} />
            {item && !underwear.layers?.length && (
              <dl className="meta-grid">
                <div>
                  <dt>Undertøj</dt>
                  <dd>{item.nameDa}</dd>
                </div>
              </dl>
            )}
            <p className="tiny muted">{underwear.reasonDa}</p>
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
          Træk en udfordring der skal gøres <strong>mens du spiller</strong> — bonuspoint ved
          fuldførelse. Kom tilbage her og log KPI efter match.
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
