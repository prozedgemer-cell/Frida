import { useEffect, useMemo, useState } from 'react';
import {
  addDaysKey,
  formatDateKeyDa,
  localDateKey,
  monthGrid,
  normalizeTimeHm,
  summarizeCalendar,
  timeHmMinutes,
} from '../engines/calendarEngine';
import { CalendarInfluenceNote } from './CalendarInfluenceNote';
import { addImage, getImageBlob } from '../storage/imageStore';
import type { CalendarEntry, CalendarSignal } from '../types';
import { CALENDAR_SIGNAL_LABELS_DA, CALENDAR_TAG_PRESETS } from '../types';
import { ImageGallery } from './ImageGallery';

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

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

type Props = {
  entries: CalendarEntry[];
  paused: boolean;
  onUpsert: (entry: {
    id?: string;
    dateKey: string;
    titleDa: string;
    noteDa: string;
    signal: CalendarSignal;
    imageId?: string;
    imageUrl?: string;
    timeHm?: string;
    tags?: string[];
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
  const [timeHm, setTimeHm] = useState('');
  const [signal, setSignal] = useState<CalendarSignal>('none');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [imageId, setImageId] = useState<string | undefined>();
  const [imageUrl, setImageUrl] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [thumbUrls, setThumbUrls] = useState<Record<string, string>>({});
  const [uploadErr, setUploadErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

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

  const dayEntries = (byDay.get(selected) ?? []).slice().sort((a, b) => {
    const am = timeHmMinutes(a.timeHm);
    const bm = timeHmMinutes(b.timeHm);
    if (am != null && bm != null && am !== bm) return am - bm;
    if (am != null && bm == null) return -1;
    if (am == null && bm != null) return 1;
    return b.updatedAt.localeCompare(a.updatedAt);
  });

  const monthLabel = new Date(cursor.y, cursor.m, 1).toLocaleDateString('en-GB', {
    month: 'long',
    year: 'numeric',
  });

  useEffect(() => {
    let cancelled = false;
    const ids = [
      ...dayEntries.map((e) => e.imageId).filter(Boolean),
      imageId,
    ].filter((x): x is string => !!x);
    const unique = [...new Set(ids)];
    void (async () => {
      const next: Record<string, string> = {};
      for (const id of unique) {
        if (thumbUrls[id]) {
          next[id] = thumbUrls[id];
          continue;
        }
        const blob = await getImageBlob(id);
        if (blob) next[id] = URL.createObjectURL(blob);
      }
      if (!cancelled) {
        setThumbUrls((prev) => {
          const merged = { ...prev, ...next };
          return merged;
        });
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dayEntries, imageId]);

  const resetForm = () => {
    setTitleDa('');
    setNoteDa('');
    setTimeHm('');
    setSignal('none');
    setEditingId(null);
    setImageId(undefined);
    setImageUrl('');
    setTags([]);
    setUploadErr(null);
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
      imageId,
      imageUrl: imageUrl.trim() || undefined,
      timeHm: normalizeTimeHm(timeHm),
      tags,
    });
    resetForm();
  };

  const startEdit = (e: CalendarEntry) => {
    setSelected(e.dateKey);
    setTitleDa(e.titleDa);
    setNoteDa(e.noteDa);
    setTimeHm(e.timeHm ?? '');
    setSignal(e.signal);
    setEditingId(e.id);
    setImageId(e.imageId);
    setImageUrl(e.imageUrl ?? '');
    setTags(e.tags ?? []);
  };

  const onPickImage = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    setUploadErr(null);
    try {
      const meta = await addImage('calendar', file);
      setImageId(meta.id);
    } catch (err) {
      setUploadErr(err instanceof Error ? err.message : 'Upload fejlede');
    } finally {
      setBusy(false);
    }
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
            <p className="eyebrow">Mode · Calendar</p>
            <h2>Notes & signals</h2>
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
          Write notes/plans. Today + upcoming tags (milf, bdsm, g-string, date, outing) steer clothes and challenges (~70%).
          Punishment/hard increases, rest softens. Attach images to notes (local).
        </p>
        <CalendarInfluenceNote calendar={summarizeCalendar(entries, today)} />

        <div className="cal-grid" role="grid" aria-label="Month">
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
        <p className="eyebrow">{editingId ? 'Edit note' : 'New note'}</p>
        <label className="field">
          <span>Title</span>
          <input
            value={titleDa}
            onChange={(e) => setTitleDa(e.target.value)}
            placeholder="fx Date, ranked-aften, milf-look, domme-session"
            disabled={paused}
          />
        </label>
        <label className="field">
          <span>Time (optional)</span>
          <input
            type="time"
            value={timeHm}
            onChange={(e) => setTimeHm(e.target.value)}
            disabled={paused}
          />
        </label>
        <label className="field">
          <span>Note / plan</span>
          <textarea
            rows={3}
            value={noteDa}
            onChange={(e) => setNoteDa(e.target.value)}
            placeholder="Skriv planen — milf, brazilian, domme, date, ranked…"
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
        <div className="field">
          <span>Tags</span>
          <div className="chip-grid cal-tag-grid">
            {CALENDAR_TAG_PRESETS.map((tag) => {
              const on = tags.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  className={`chip ${on ? 'chip--on' : ''}`}
                  disabled={paused}
                  onClick={() =>
                    setTags((cur) => (cur.includes(tag) ? cur.filter((x) => x !== tag) : [...cur, tag]))
                  }
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </div>
        <label className="field">
          <span>Billede-URL eller data: (valgfri, hold den lille)</span>
          <input
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://… eller data:image/…"
            disabled={paused}
          />
        </label>
        <p className="tiny muted">
          Local uploads stay on this device. You can also send photos to Chief of Staff for the seed gallery.
        </p>
        <div className="field">
          <span>Billede til note</span>
          <div className="cal-attach-row">
            <label className={`btn btn--secondary ${busy || paused ? 'is-disabled' : ''}`}>
              Choose file
              <input
                type="file"
                accept="image/*"
                hidden
                disabled={busy || paused}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  e.target.value = '';
                  void onPickImage(f);
                }}
              />
            </label>
            {imageId && (
              <button
                type="button"
                className="linkish"
                disabled={paused}
                onClick={() => setImageId(undefined)}
              >
                Remove image
              </button>
            )}
          </div>
          {imageId && thumbUrls[imageId] && (
            <img src={thumbUrls[imageId]} alt="Note" className="cal-note-thumb" />
          )}
          {uploadErr && <p className="banner banner--warn">{uploadErr}</p>}
        </div>
        <div className="challenge__actions">
          <button type="button" className="btn" disabled={paused} onClick={submit}>
            {editingId ? 'Save' : 'Add'}
          </button>
          {editingId && (
            <button type="button" className="btn btn--ghost" onClick={resetForm}>
              Cancel
            </button>
          )}
        </div>
      </section>

      <section className="panel">
        <p className="eyebrow">Denne dag</p>
        <h2>{dayEntries.length ? `${dayEntries.length} note(r)` : 'Tom'}</h2>
        {!dayEntries.length && <p className="muted tiny">No notes on the selected day.</p>}
        <ul className="cal-notes sched-notes">
          {dayEntries.map((e) => (
            <li key={e.id} className={`sched-item ${e.signal === 'straf' || e.signal === 'hard' ? 'is-hot' : e.signal === 'reward' || e.signal === 'soft' ? 'is-ok' : ''}`}>
              <div>
                <strong>{e.titleDa}</strong>
                {e.timeHm && <span className="tag">{e.timeHm}</span>}
                {e.signal !== 'none' && (
                  <span className={`tag tag--${e.signal === 'straf' || e.signal === 'hard' ? 'straf' : 'reward'}`}>
                    {CALENDAR_SIGNAL_LABELS_DA[e.signal]}
                  </span>
                )}
                {e.noteDa && <p className="tiny">{e.noteDa}</p>}
                {!!e.tags?.length && (
                  <p className="tiny">
                    {e.tags.map((tg) => (
                      <span key={tg} className="tag">
                        {tg}
                      </span>
                    ))}
                  </p>
                )}
                {e.imageId && thumbUrls[e.imageId] && (
                  <img src={thumbUrls[e.imageId]} alt="" className="cal-note-thumb" />
                )}
                {e.imageUrl && (
                  <img src={e.imageUrl} alt="" className="cal-note-thumb" />
                )}
              </div>
              <div className="cal-notes__act">
                <button type="button" className="linkish" disabled={paused} onClick={() => startEdit(e)}>
                  Edit
                </button>
                <button type="button" className="linkish" disabled={paused} onClick={() => onDelete(e.id)}>
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <ImageGallery
        slot="calendar"
        titleDa="Calendar images"
        hintDa="Upload reference photos for notes/plans. Local on this device only. Outfit and sex-punishment galleries are under Profile / Sex."
        onSelect={(id) => setImageId(id)}
        selectedId={imageId}
        selectLabelDa="Set on note"
      />

      {upcoming.length > 0 && (
        <section className="panel panel--muted">
          <p className="eyebrow">Upcoming days</p>
          <ul className="log">
            {upcoming.slice(0, 8).map((e) => (
              <li key={e.id}>
                <span className="pill pill--skip">{e.dateKey === today ? 'i dag' : e.dateKey.slice(5)}</span>
                <span>{e.timeHm ? `${e.timeHm} · ${e.titleDa}` : e.titleDa}</span>
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
