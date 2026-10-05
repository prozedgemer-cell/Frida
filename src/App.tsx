import { useCallback, useEffect, useMemo, useState } from 'react';
import { CUPS } from './content';
import { STYLE_DEFS, styleLabel } from './looks';
import {
  GAMES, MAX_CHALLENGES, effectivePlan, ensureDay, regenerateChallenges, scoreGame, starShort, todayKey,
  type Mood,
} from './engine';
import { freshData, loadData, saveData } from './storage';
import { BUILTIN_TAGS, TAG_GROUPS, tagLabel } from './tags';
import type { AppData, ChallengeStatus, DayRecord, Game, GameLog, KnownFor, Star, Tone } from './types';

type Tab = 'today' | 'history' | 'settings';

export default function App() {
  const [today, setToday] = useState(todayKey());
  const [data, setData] = useState<AppData>(() => ensureDay(loadData(), todayKey()));
  const [tab, setTab] = useState<Tab>('today');

  useEffect(() => { saveData(data); }, [data]);
  useEffect(() => {
    const check = () => {
      const k = todayKey();
      if (k !== today) { setToday(k); setData((d) => ensureDay(d, k)); }
    };
    document.addEventListener('visibilitychange', check);
    const t = window.setInterval(check, 60_000);
    return () => { document.removeEventListener('visibilitychange', check); window.clearInterval(t); };
  }, [today]);

  const updateDay = useCallback((date: string, fn: (r: DayRecord) => DayRecord) => {
    setData((d) => (d.days[date] ? { ...d, days: { ...d.days, [date]: fn(d.days[date]) } } : d));
  }, []);

  return (
    <div className="app">
      <header className="top">
        <div className="brand">Frida <span>Diary</span></div>
        <div className="date">{new Date().toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}</div>
      </header>
      <main>
        {tab === 'today' && data.days[today] && (
          <TodayView rec={data.days[today]} star={data.stars.find((s) => s.id === data.days[today].plan.starId)}
            customTags={data.customTags ?? []}
            update={(fn) => updateDay(today, fn)} />
        )}
        {tab === 'history' && <HistoryView data={data} today={today} />}
        {tab === 'settings' && <SettingsView data={data} setData={setData} today={today} />}
      </main>
      <nav className="tabs">
        {(['today', 'history', 'settings'] as Tab[]).map((t) => (
          <button key={t} className={tab === t ? 'on' : ''} onClick={() => setTab(t)}>
            <span className="ico">{t === 'today' ? '\u2661' : t === 'history' ? '\u2630' : '\u2699'}</span>
            {t[0].toUpperCase() + t.slice(1)}
          </button>
        ))}
      </nav>
    </div>
  );
}

const MOOD_TEXT: Record<Mood, string> = {
  none: '',
  stricter: 'Terrible games. She is much stricter today.',
  strict: 'Weak games. She is stricter today.',
  neutral: 'Decent games. Plan unchanged.',
  reward: 'Great games! You earned a reward.',
};

function TodayView({ rec, star, customTags, update }: {
  rec: DayRecord; star?: Star; customTags: string[];
  update: (fn: (r: DayRecord) => DayRecord) => void;
}) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => { const t = window.setInterval(() => setNow(new Date()), 60_000); return () => window.clearInterval(t); }, []);
  const { plan, fx, missedIds } = useMemo(() => effectivePlan(rec, now), [rec, now]);
  const o = plan.outfit;
  const tags = plan.tags ?? [];
  const short = starShort({ name: star?.name ?? plan.starName });
  const setStatus = (id: string, st: ChallengeStatus) =>
    update((r) => {
      const status = { ...(r.status ?? {}) };
      if (status[id] === st) delete status[id]; else status[id] = st;
      return { ...r, status };
    });
  const toggleTag = (id: string) => {
    if (!star) return;
    const next = tags.includes(id) ? tags.filter((t) => t !== id) : [...tags, id];
    update((r) => {
      const plan2 = regenerateChallenges(r.plan, star, next);
      return { ...r, plan: plan2, status: {} };
    });
  };
  const softer = fx.chalDelta < 0, harder = fx.chalDelta > 0;
  return (
    <>
      <section className="card star">
        <div className="kicker">Today you belong to</div>
        <h1>{star?.name ?? plan.starName}</h1>
        {star && (
          <>
            <p className="todaystyle">Today: {plan.styleLabel}</p>
            <p className="look">{star.hair} · {star.body} · {star.cup}-cup</p>
            <p className="muted small">Wears: {star.wardrobe}</p>
            <p className="muted">{star.personality}</p>
            <div className="chips">{star.knownFor.map((k) => <span key={k} className={`chip ${k === plan.styleId ? 'on' : ''}`}>{styleLabel(k)}</span>)}</div>
          </>
        )}
      </section>

      <section className="card">
        <h2>Day tags</h2>
        <p className="muted small">Tick what you do today. Outfit layers + 3 challenges follow her {plan.styleLabel} clothes.</p>
        {TAG_GROUPS.map((g) => (
          <div key={g.id} className="taggroup">
            <div className="kicker">{g.label}</div>
            <div className="chips pick">
              {BUILTIN_TAGS.filter((t) => t.group === g.id).map((t) => (
                <button key={t.id} type="button" className={`chip ${tags.includes(t.id) ? 'on' : ''}`} onClick={() => toggleTag(t.id)} title={t.hint}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        ))}
        {customTags.length > 0 && (
          <div className="taggroup">
            <div className="kicker">Custom</div>
            <div className="chips pick">
              {customTags.map((c) => {
                const id = c.toLowerCase();
                return (
                  <button key={id} type="button" className={`chip ${tags.includes(id) ? 'on' : ''}`} onClick={() => toggleTag(id)}>
                    {c}
                  </button>
                );
              })}
            </div>
          </div>
        )}
        {tags.length === 0 && (
          <p className="banner strict" style={{ marginTop: 10, marginBottom: 0 }}>Pick at least one tag so she can set today&rsquo;s 3 challenges.</p>
        )}
      </section>

      {fx.mood !== 'none' && (
        <section className={`banner ${fx.mood}`}>Game score {fx.score}/100 · {MOOD_TEXT[fx.mood]}</section>
      )}

      <section className="card">
        <h2>Outfit</h2>
        <p className="summary">{o.summary}</p>
        <p className="kicker">Base all day · {o.baseName}</p>
        <dl className="list">
          <dt>Panties</dt><dd>{o.panties}</dd>
          <dt>Bra</dt><dd>{o.bra} · {o.cup}-cup forms</dd>
          <dt>Top</dt><dd>{o.top}</dd>
          <dt>Bottom</dt><dd>{o.bottom}</dd>
          <dt>Legs</dt><dd>{o.legwear}</dd>
          <dt>Shoes</dt><dd>{o.shoes}</dd>
          <dt>Makeup</dt><dd>{o.makeup}</dd>
          <dt>Wig</dt><dd>{o.wig}</dd>
          <dt>Extras</dt><dd>{o.extras.join(', ')}</dd>
        </dl>
        {o.swaps?.length > 0 && (
          <>
            <p className="kicker" style={{ marginTop: 12 }}>Activity swaps (same base)</p>
            <ul className="swaps">
              {o.swaps.map((sw) => (
                <li key={sw.tag}><b>{sw.label}</b> — {sw.change}</li>
              ))}
            </ul>
          </>
        )}
        {o.evening && (
          <>
            <p className="kicker" style={{ marginTop: 12 }}>Evening / sex</p>
            <p className="summary">{o.evening.summary}</p>
            <dl className="list">
              <dt>Look</dt><dd>{o.evening.name}</dd>
              <dt>Top</dt><dd>{o.evening.top}</dd>
              <dt>Bottom</dt><dd>{o.evening.bottom}</dd>
              <dt>Legs</dt><dd>{o.evening.legwear}</dd>
              <dt>Extras</dt><dd>{o.evening.extras.join(', ')}</dd>
            </dl>
          </>
        )}
      </section>

      <section className="card">
        <h2>Today&rsquo;s sex</h2>
        <div className="chips">
          <span className="chip">{plan.sex.formLabel}</span>
          <span className={`chip ${softer ? 'soft' : harder ? 'hard' : ''}`}>{plan.sex.minutes} min</span>
          <span className={`chip ${plan.sex.intensity}`}>{plan.sex.intensity}</span>
        </div>
        <p className={`fxline ${softer ? 'soft' : harder ? 'hard' : ''}`}>{fx.line}</p>
        <p className="muted small">
          Base {fx.baseMinutes} min
          {fx.gameDelta !== 0 && ` · games ${fx.gameDelta > 0 ? '+' : '\u2212'}${Math.abs(fx.gameDelta)}`}
          {fx.chalDelta !== 0 && ` · challenges ${fx.chalDelta > 0 ? '+' : '\u2212'}${Math.abs(fx.chalDelta)}`}
          {' '}· Where: {plan.sex.location}
        </p>
        {fx.detail && <p className={`fxline ${fx.done === MAX_CHALLENGES ? 'soft' : 'hard'}`}>{fx.detail}</p>}
        <blockquote>&ldquo;{plan.sex.scene}&rdquo;<cite>— {short}</cite></blockquote>
        <button className={`btn ${rec.sexDone ? 'done' : ''}`} onClick={() => update((r) => ({ ...r, sexDone: !r.sexDone }))}>
          {rec.sexDone ? '\u2713 Done' : 'Mark done'}
        </button>
      </section>

      <section className="card">
        <h2>Challenges {tags.length > 0 && <span className="count">{fx.done}/{MAX_CHALLENGES}</span>}</h2>
        {tags.length === 0 ? (
          <p className="muted">No challenges yet. Pick day tags above. Challenges are concrete things you do in her style clothing — not voice orders.</p>
        ) : (
          <>
            <p className="muted small">Done: {'\u2212'}5 min each, all 3 = soft + bonus. Failed: +10 min each, 2 failed = hard. Unchecked after 21:00 counts as failed. Changing tags re-rolls challenges.</p>
            <ul className="challenges">
              {plan.challenges.slice(0, MAX_CHALLENGES).map((c) => {
                const st: string = rec.status?.[c.id] ?? (missedIds.has(c.id) ? 'missed' : '');
                return (
                  <li key={c.id} className={`${st} ${c.kind}`}>
                    <button className="box" aria-label="Done" onClick={() => setStatus(c.id, 'done')}>
                      {st === 'done' ? '\u2713' : st === 'failed' || st === 'missed' ? '\u2715' : ''}
                    </button>
                    <span className="ctext" onClick={() => setStatus(c.id, 'done')}>
                      <b className="kind">{c.kind}{c.fromTag ? ` · ${tagLabel(c.fromTag, customTags)}` : ''}{st === 'missed' ? ' · missed' : ''}</b>
                      {c.text}
                      <span className="clink">{'\u21b3'} {c.link}</span>
                    </span>
                    <button className={`failbtn ${st === 'failed' ? 'on' : ''}`} onClick={() => setStatus(c.id, 'failed')}>Failed</button>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </section>

      <GameLogCard rec={rec} update={update} />
    </>
  );
}

function GameLogCard({ rec, update }: { rec: DayRecord; update: (fn: (r: DayRecord) => DayRecord) => void }) {
  const [open, setOpen] = useState(false);
  const [game, setGame] = useState<Game>('CS2');
  const [k, setK] = useState('');
  const [dth, setD] = useState('');
  const [a, setA] = useState('');
  const [win, setWin] = useState(true);
  const [cash, setCash] = useState('');
  const save = () => {
    const base = { game, kills: +k || 0, deaths: +dth || 0, assists: +a || 0, win, cash: game === 'WARDOGS' && cash !== '' ? +cash : undefined };
    const log: GameLog = { ...base, id: String(Date.now()), at: Date.now(), score: scoreGame(base) };
    update((r) => ({ ...r, games: [...r.games, log] }));
    setK(''); setD(''); setA(''); setCash(''); setOpen(false);
  };
  return (
    <section className="card">
      <h2>Games <button className="link" onClick={() => setOpen(!open)}>{open ? 'Close' : '+ Log game'}</button></h2>
      {open && (
        <div className="form">
          <select value={game} onChange={(e) => setGame(e.target.value as Game)}>
            {GAMES.map((g) => <option key={g}>{g}</option>)}
          </select>
          <div className="row3">
            <input inputMode="numeric" placeholder="Kills" value={k} onChange={(e) => setK(e.target.value)} />
            <input inputMode="numeric" placeholder="Deaths" value={dth} onChange={(e) => setD(e.target.value)} />
            <input inputMode="numeric" placeholder="Assists" value={a} onChange={(e) => setA(e.target.value)} />
          </div>
          <div className="seg">
            <button className={win ? 'on' : ''} onClick={() => setWin(true)}>Win</button>
            <button className={!win ? 'on' : ''} onClick={() => setWin(false)}>Loss</button>
          </div>
          {game === 'WARDOGS' && (
            <input inputMode="numeric" placeholder="Cash profit / loss (e.g. -500)" value={cash} onChange={(e) => setCash(e.target.value)} />
          )}
          <button className="btn" onClick={save}>Save game</button>
        </div>
      )}
      {rec.games.length === 0 && !open && <p className="muted small">No games today. Bad games make her stricter, good games earn rewards.</p>}
      <ul className="games">
        {rec.games.map((g) => (
          <li key={g.id}>
            <span>{g.game} · {g.kills}/{g.deaths}/{g.assists} · {g.win ? 'W' : 'L'}{g.cash !== undefined ? ` · $${g.cash}` : ''}</span>
            <span className="score">{g.score}</span>
            <button className="x" onClick={() => update((r) => ({ ...r, games: r.games.filter((x) => x.id !== g.id) }))}>×</button>
          </li>
        ))}
      </ul>
    </section>
  );
}

function HistoryView({ data, today }: { data: AppData; today: string }) {
  const keys = Object.keys(data.days).sort().reverse();
  if (keys.length <= 1) return <section className="card"><h2>History</h2><p className="muted">Your past days will show up here.</p></section>;
  return (
    <>
      {keys.map((key) => {
        const rec = data.days[key];
        const { plan, fx } = effectivePlan(rec);
        return (
          <section className="card hist" key={key}>
            <div className="kicker">{key === today ? 'Today' : new Date(key + 'T12:00').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}</div>
            <h3>{data.stars.find((x) => x.id === plan.starId)?.name ?? plan.starName} <span className="muted small">· {plan.styleLabel}</span></h3>
            {!!(plan.tags?.length) && <p className="small muted">{plan.tags.map((t) => tagLabel(t, data.customTags)).join(' · ')}</p>}
            <p className="small">{plan.outfit.summary}</p>
            <p className="small">{rec.sexDone ? '\u2713' : '\u25cb'} {plan.sex.formLabel} · {plan.sex.minutes} min · {plan.sex.intensity}</p>
            <p className="small muted">{fx.line}{fx.score !== null ? ` · Game score ${fx.score}` : ''}</p>
          </section>
        );
      })}
    </>
  );
}

const TONES: Tone[] = ['sweet', 'stern', 'playful', 'cold', 'sultry'];
const STAR_CUPS = ['B', 'C', 'D', 'DD', 'E', 'F', 'G', 'H'];

function blankStar(): Star {
  return {
    id: 'c' + Date.now().toString(36), name: '', hair: '', body: '', cup: 'C', wardrobe: '', personality: '',
    tone: 'sweet', knownFor: ['sweet-tease', 'pinup'], enabled: true, custom: true,
  };
}

function SettingsView({ data, setData, today }: { data: AppData; setData: (fn: (d: AppData) => AppData) => void; today: string }) {
  const [editing, setEditing] = useState<Star | null>(null);
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<'all' | 'on' | 'off'>('all');
  const [limit, setLimit] = useState(40);
  const enabled = data.stars.filter((s) => s.enabled).length;
  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return data.stars.filter((s) =>
      (filter === 'all' || (filter === 'on') === s.enabled)
      && (!needle || s.name.toLowerCase().includes(needle) || s.knownFor.some((k) => styleLabel(k).toLowerCase().includes(needle))));
  }, [data.stars, q, filter]);
  const setEnabled = (ids: Set<string>, on: boolean) =>
    setData((d) => {
      const stars = d.stars.map((x) => (ids.has(x.id) ? { ...x, enabled: on } : x));
      return stars.some((x) => x.enabled) ? { ...d, stars } : d; // keep at least one star on
    });
  const saveStar = (s: Star) => {
    if (!s.name.trim() || s.knownFor.length === 0) return;
    setData((d) => {
      const exists = d.stars.some((x) => x.id === s.id);
      return ensureDay({ ...d, stars: exists ? d.stars.map((x) => (x.id === s.id ? s : x)) : [s, ...d.stars] }, today);
    });
    setEditing(null);
  };
  return (
    <>
      <section className="card">
        <h2>Basics</h2>
        <label className="field">Default cup size (forms)
          <select value={data.defaultCup} onChange={(e) => setData((d) => ({ ...d, defaultCup: e.target.value }))}>
            {CUPS.map((c) => <option key={c}>{c}</option>)}
          </select>
        </label>
        <p className="muted small">Your forms follow the star&rsquo;s own size and today&rsquo;s style, lightly pulled toward this.</p>
      </section>

      <section className="card">
        <h2>Stars <span className="count">{enabled}/{data.stars.length} on</span></h2>
        {editing ? (
          <StarEditor star={editing} onSave={saveStar} onCancel={() => setEditing(null)}
            onDelete={editing.custom ? () => { setData((d) => ({ ...d, stars: d.stars.filter((x) => x.id !== editing.id) })); setEditing(null); } : undefined} />
        ) : (
          <>
            <button className="btn" onClick={() => setEditing(blankStar())}>+ Add star</button>
            <div className="form" style={{ marginTop: 10 }}>
              <input type="search" placeholder="Search name or style…" value={q} onChange={(e) => { setQ(e.target.value); setLimit(40); }} />
              <div className="seg seg3">
                {(['all', 'on', 'off'] as const).map((f) => (
                  <button key={f} className={filter === f ? 'on' : ''} onClick={() => { setFilter(f); setLimit(40); }}>{f === 'all' ? 'All' : f === 'on' ? 'On' : 'Off'}</button>
                ))}
              </div>
              <div className="row2">
                <button className="btn ghost slim" onClick={() => setEnabled(new Set(shown.map((s) => s.id)), true)}>Enable shown ({shown.length})</button>
                <button className="btn ghost slim" onClick={() => setEnabled(new Set(shown.map((s) => s.id)), false)}>Disable shown</button>
              </div>
            </div>
            <ul className="stars">
              {shown.slice(0, limit).map((s) => (
                <li key={s.id} className={s.enabled ? '' : 'off'}>
                  <div onClick={() => setEditing({ ...s })}>
                    <b>{s.name}</b>
                    <span className="muted small">{s.cup}-cup · {s.knownFor.map(styleLabel).join(', ')}</span>
                  </div>
                  <label className="toggle">
                    <input type="checkbox" checked={s.enabled} onChange={() => setEnabled(new Set([s.id]), !s.enabled)} />
                    <span />
                  </label>
                </li>
              ))}
            </ul>
            {shown.length > limit && <button className="btn ghost" onClick={() => setLimit(limit + 60)}>Show more ({shown.length - limit} left)</button>}
            {shown.length === 0 && <p className="muted small">No stars match.</p>}
          </>
        )}
      </section>

      <section className="card">
        <h2>Custom day tags</h2>
        <CustomTagsEditor data={data} setData={setData} />
      </section>

      <section className="card">
        <h2>Data</h2>
        <p className="muted small">Everything is stored only on this device.</p>
        <button className="btn danger" onClick={() => {
          if (!confirm('Delete all Frida data (history, stars, settings)?')) return;
          setData(() => ensureDay(freshData(), today));
        }}>Reset all data</button>
      </section>
    </>
  );
}

function StarEditor({ star, onSave, onCancel, onDelete }: { star: Star; onSave: (s: Star) => void; onCancel: () => void; onDelete?: () => void }) {
  const [s, setS] = useState<Star>(star);
  const txt = (k: 'name' | 'hair' | 'body' | 'wardrobe' | 'personality', label: string) => (
    <label className="field">{label}
      <input value={s[k]} onChange={(e) => setS({ ...s, [k]: e.target.value })} />
    </label>
  );
  const toggle = (k: KnownFor) => {
    if (s.knownFor.includes(k)) setS({ ...s, knownFor: s.knownFor.filter((x) => x !== k) });
    else if (s.knownFor.length < 4) setS({ ...s, knownFor: [...s.knownFor, k] });
  };
  const ok = s.name.trim() !== '' && s.knownFor.length >= 2 && s.knownFor.length <= 4;
  return (
    <div className="form">
      {txt('name', 'Name')}
      <div className="row2">
        <label className="field">Her cup size
          <select value={s.cup} onChange={(e) => setS({ ...s, cup: e.target.value })}>{STAR_CUPS.map((c) => <option key={c}>{c}</option>)}</select>
        </label>
        <label className="field">Voice
          <select value={s.tone} onChange={(e) => setS({ ...s, tone: e.target.value as Tone })}>{TONES.map((x) => <option key={x}>{x}</option>)}</select>
        </label>
      </div>
      {txt('hair', 'Hair')}
      {txt('body', 'Body type')}
      {txt('wardrobe', 'Signature wardrobe')}
      {txt('personality', 'Personality')}
      <div className="field">Known for (pick 2–4) · {s.knownFor.length} chosen
        <div className="chips pick">
          {STYLE_DEFS.map((d) => (
            <button key={d.id} className={`chip ${s.knownFor.includes(d.id) ? 'on' : ''}`} onClick={() => toggle(d.id)}>{d.label}</button>
          ))}
        </div>
      </div>
      <div className="row2">
        <button className="btn" disabled={!ok} onClick={() => onSave(s)}>Save</button>
        <button className="btn ghost" onClick={onCancel}>Cancel</button>
      </div>
      {onDelete && <button className="btn danger" onClick={onDelete}>Delete star</button>}
    </div>
  );
}


function CustomTagsEditor({ data, setData }: { data: AppData; setData: (fn: (d: AppData) => AppData) => void }) {
  const [val, setVal] = useState('');
  const custom = data.customTags ?? [];
  const add = () => {
    const label = val.trim();
    if (!label) return;
    const id = label.toLowerCase();
    if (BUILTIN_TAGS.some((t) => t.id === id) || custom.some((c) => c.toLowerCase() === id)) { setVal(''); return; }
    setData((d) => ({ ...d, customTags: [...(d.customTags ?? []), label] }));
    setVal('');
  };
  return (
    <div className="form">
      <p className="muted small">Extra tags show on Today next to Fisk, Spil, Hus…</p>
      <div className="row2">
        <input value={val} placeholder="e.g. Fitness" onChange={(e) => setVal(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') add(); }} />
        <button className="btn" type="button" onClick={add}>Add</button>
      </div>
      {custom.length > 0 && (
        <div className="chips pick">
          {custom.map((c) => (
            <button key={c} type="button" className="chip on" onClick={() => setData((d) => ({
              ...d, customTags: (d.customTags ?? []).filter((x) => x !== c),
            }))}>{c} ×</button>
          ))}
        </div>
      )}
    </div>
  );
}
