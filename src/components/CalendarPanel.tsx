import { useMemo, useState } from 'react';
import {
  addDaysKey,
  formatDateKeyDa,
  localDateKey,
  monthGrid,
} from '../engines/calendarEngine';
import type { CalendarEntry, CalendarSignal } from '../types';
import { CALENDAR_SIGNAL_LABELS_DA } from '../types';

const SIGNALS: CalendarSignal[] = [
  'none',
  'straf',
  'reward',
  'soft',
  'hard',
  'clothing',
  'gaming',
  'rest',
  'date',
];

const WEEKDAYS = ['Man', 'Tir', 'Ons', 'Tor', 'Fre', 'Lør', 'Søn'];

type Props = {
  entries: CalendarEntry[];
  paused: boolean;
  onUpsert: (entry: {
    id?: string;
    dateKey: string;
    titleDa: string;
    noteDa: string;
    signal: CalendarSignal;
  }) => void;
  onDelete: (id: string) => void;
};

export function CalendarPanel({ entries, paused, onUpsert, onDelete }: Props) {
  const today = localDateKey();
  const [cursor, setCursor] = useState(() => {
    const n = new Date();
    return { y: n.getFullYear(), m: n.getMonth() };
  });
  const [selected, setSelected] = useState(today);
  const [titleDa, setTitleDa] = useState('');
  const [noteDa, setNoteDa] = useState('');
  const [signal, setSignal] = useState<CalendarSignal>('none');
  const [editingId, setEditingId] = useState<string | null>(null);

  const cells = useMemo(() => monthGrid(cursor.y, cursor.m), [cursor.y, cursor.m]);
  const byDay = useMemo(() => {
    const map = new Map<string, CalendarEntry[]>();
    for (const e of entries) {
      const list = map.get(e.dateKey) ?? [];
      list.push(e);
      map.set(e.dateKey, list);
    }
    return map;
  }, [entries]);

  const dayEntries = (byDay.get(selected) ?? []).slice().sort((a, b) =>
    b.updatedAt.localeCompare(a.updatedAt),
  );

  const monthLabel = new Date(cursor.y, cursor.m, 1).toLocaleDateString('da-DK', {
    month: 'long',
    year: 'numeric',
  });

  const resetForm = () => {
    setTitleDa('');
    setNoteDa('');
    setSignal('none');
    setEditingId(null);
  };

  const submit = () => {
    const title = titleDa.trim();
    if (!title && !noteDa.trim()) return;
    onUpsert({
      id: editingId ?? undefined,
      dateKey: selected,
      titleDa: title || 'Note',
      noteDa: noteDa.trim(),
      signal,
    });
    resetForm();
  };

  const startEdit = (e: CalendarEntry) => {
    setSelected(e.dateKey);
    setTitleDa(e.titleDa);
    setNoteDa(e.noteDa);
    setSignal(e.signal);
    setEditingId(e.id);
  };

  const upcoming = useMemo(() => {
    const keys = Array.from({ length: 8 }, (_, i) => addDaysKey(today, i));
    return keys.flatMap((k) => (byDay.get(k) ?? []).map((e) => ({ ...e, _k: k })));
  }, [byDay, today]);

  return (
    <div className="mode-stack">
      <section className="panel panel--mode panel--cal">
        <div className="panel__head">
          <div>
            <p className="eyebrow">Mode · Kalender</p>
            <h2>Noter & signaler</h2>
          </div>
          <div className="cal-month-nav">
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() =>
                setCursor((c) =>
                  c.m === 0 ? { y: c.y - 1, m: 11 } : { y: c.y, m: c.m - 1 },
                )
              }
            >
              ‹
            </button>
            <strong>{monthLabel}</strong>
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() =>
                setCursor((c) =>
                  c.m === 11 ? { y: c.y + 1, m: 0 } : { y: c.y, m: c.m + 1 },
                )
              }
            >
              ›
            </button>
          </div>
        </div>
        <p className="muted tiny">
          Skriv aftaler og noter. Signal-tags påvirker undertøj, udfordringer og om sex-straf er due
          (straf/hård øger, hvile blokerer ny sex-straf).
        </p>

        <div className="cal-grid" role="grid" aria-label="Måned">
          {WEEKDAYS.map((d) => (
            <span key={d} className="cal-grid__wd">
              {d}
            </span>
          ))}
          {cells.map((key, i) => {
            if (!key) return <span key={`e-${i}`} className="cal-cell cal-cell--empty" />;
            const n = Number(key.slice(-2));
            const has = byDay.has(key);
            const sigs = (byDay.get(key) ?? []).map((e) => e.signal).filter((s) => s !== 'none');
            return (
              <button
                key={key}
                type="button"
                className={`cal-cell ${key === selected ? 'is-selected' : ''} ${key === today ? 'is-today' : ''} ${has ? 'has-note' : ''}`}
                onClick={() => {
                  setSelected(key);
                  resetForm();
                }}
              >
                <span>{n}</span>
                {has && (
                  <i
                    className={`cal-dot ${sigs.includes('straf') || sigs.includes('hard') ? 'is-hot' : ''}`}
                  />
                )}
              </button>
            );
          })}
        </div>
        <p className="cal-selected">{formatDateKeyDa(selected)}</p>
      </section>

      <section className="panel">
        <p className="eyebrow">{editingId ? 'Rediger note' : 'Ny note'}</p>
        <label className="field">
          <span>Titel</span>
          <input
            value={titleDa}
            onChange={(e) => setTitleDa(e.target.value)}
            placeholder="fx Date, ranked-aften, hviledag"
            disabled={paused}
          />
        </label>
        <label className="field">
          <span>Note</span>
          <textarea
            rows={3}
            value={noteDa}
            onChange={(e) => setNoteDa(e.target.value)}
            placeholder="Hvad skal panelet vide?"
            disabled={paused}
          />
        </label>
        <label className="field">
          <span>Signal</span>
          <select
            value={signal}
            onChange={(e) => setSignal(e.target.value as CalendarSignal)}
            disabled={paused}
          >
            {SIGNALS.map((s) => (
              <option key={s} value={s}>
                {CALENDAR_SIGNAL_LABELS_DA[s]}
              </option>
            ))}
          </select>
        </label>
        <div className="challenge__actions">
          <button type="button" className="btn" disabled={paused} onClick={submit}>
            {editingId ? 'Gem' : 'Tilføj'}
          </button>
          {editingId && (
            <button type="button" className="btn btn--ghost" onClick={resetForm}>
              Annuller
            </button>
          )}
        </div>
      </section>

      <section className="panel">
        <p className="eyebrow">Denne dag</p>
        <h2>{dayEntries.length ? `${dayEntries.length} note(r)` : 'Tom'}</h2>
        {!dayEntries.length && <p className="muted tiny">Ingen noter på den valgte dag.</p>}
        <ul className="cal-notes">
          {dayEntries.map((e) => (
            <li key={e.id}>
              <div>
                <strong>{e.titleDa}</strong>
                {e.signal !== 'none' && (
                  <span className={`tag tag--${e.signal === 'straf' || e.signal === 'hard' ? 'straf' : 'reward'}`}>
                    {CALENDAR_SIGNAL_LABELS_DA[e.signal]}
                  </span>
                )}
                {e.noteDa && <p className="tiny">{e.noteDa}</p>}
              </div>
              <div className="cal-notes__act">
                <button type="button" className="linkish" disabled={paused} onClick={() => startEdit(e)}>
                  Rediger
                </button>
                <button type="button" className="linkish" disabled={paused} onClick={() => onDelete(e.id)}>
                  Slet
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {upcoming.length > 0 && (
        <section className="panel panel--muted">
          <p className="eyebrow">Nærmeste dage</p>
          <ul className="log">
            {upcoming.slice(0, 8).map((e) => (
              <li key={e.id}>
                <span className="pill pill--skip">{e.dateKey === today ? 'i dag' : e.dateKey.slice(5)}</span>
                <span>{e.titleDa}</span>
                {e.signal !== 'none' && (
                  <span className="tag">{CALENDAR_SIGNAL_LABELS_DA[e.signal]}</span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
