import { useCallback, useEffect, useMemo, useState } from 'react';
import { CUPS, FORMS, STYLES } from './content';
import {
  GAMES, MAX_CHALLENGES, effectivePlan, generateDay, pickStarId, scoreGame, starShort, todayKey,
  type Mood,
} from './engine';
import { freshData, loadData, saveData } from './storage';
import type { AppData, ChallengeStatus, DayRecord, FormId, Game, GameLog, Leaning, Star, Style, Tone } from './types';

type Tab = 'today' | 'history' | 'settings';

function ensureDay(d: AppData, date: string): AppData {
  if (d.days[date]) return d;
  const id = pickStarId(date, d.stars, d.days);
  const star = d.stars.find((s) => s.id === id) ?? d.stars[0];
  const rec: DayRecord = { plan: generateDay(date, star, d.defaultCup), games: [], status: {}, sexDone: false };
  return { ...d, days: { ...d.days, [date]: rec } };
}

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

function TodayView({ rec, star, update }: { rec: DayRecord; star?: Star; update: (fn: (r: DayRecord) => DayRecord) => void }) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => { const t = window.setInterval(() => setNow(new Date()), 60_000); return () => window.clearInterval(t); }, []);
  const { plan, fx, missedIds } = useMemo(() => effectivePlan(rec, now), [rec, now]);
  const o = plan.outfit;
  const short = starShort({ name: plan.starName });
  const setStatus = (id: string, st: ChallengeStatus) =>
    update((r) => {
      const status = { ...(r.status ?? {}) };
      if (status[id] === st) delete status[id]; else status[id] = st;
      return { ...r, status };
    });
  const softer = fx.chalDelta < 0, harder = fx.chalDelta > 0;
  return (
    <>
      <section className="card star">
        <div className="kicker">Today you belong to</div>
        <h1>{plan.starName}</h1>
        {star && (
          <>
            <div className="chips"><span className="chip">{star.archetype}</span><span className={`chip ${star.leaning}`}>{star.leaning}</span></div>
            <p className="look">{star.hair} · {star.body} · {star.outfit}</p>
            <p className="muted">{star.personality}</p>
            <p className="muted small">Loves: {star.likes}</p>
          </>
        )}
      </section>

      {fx.mood !== 'none' && (
        <section className={`banner ${fx.mood}`}>Game score {fx.score}/100 · {MOOD_TEXT[fx.mood]}</section>
      )}

      <section className="card">
        <h2>Outfit</h2>
        <p className="summary">{o.summary}</p>
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
        <h2>Challenges <span className="count">{fx.done}/{MAX_CHALLENGES}</span></h2>
        <p className="muted small">Done: {'\u2212'}5 min each, all 3 = soft + bonus. Failed: +10 min each, 2 failed = hard. Unchecked after 21:00 counts as failed.</p>
        <ul className="challenges">
          {plan.challenges.slice(0, MAX_CHALLENGES).map((c) => {
            const st: string = rec.status?.[c.id] ?? (missedIds.has(c.id) ? 'missed' : '');
            return (
              <li key={c.id} className={`${st} ${c.kind}`}>
                <button className="box" aria-label="Done" onClick={() => setStatus(c.id, 'done')}>
                  {st === 'done' ? '\u2713' : st === 'failed' || st === 'missed' ? '\u2715' : ''}
                </button>
                <span className="ctext" onClick={() => setStatus(c.id, 'done')}>
                  <b className="kind">{c.kind}{st === 'missed' ? ' · missed' : ''}</b>
                  {c.text}
                  <span className="clink">{'\u21b3'} {c.link}</span>
                </span>
                <button className={`failbtn ${st === 'failed' ? 'on' : ''}`} onClick={() => setStatus(c.id, 'failed')}>Failed</button>
              </li>
            );
          })}
        </ul>
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
            <h3>{plan.starName}</h3>
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
const LEANS: Leaning[] = ['soft', 'mixed', 'hard'];

function blankStar(): Star {
  return {
    id: 'c' + Date.now().toString(36), name: '', archetype: '', style: 'sweet', tone: 'sweet', leaning: 'mixed', cupBias: 0,
    hair: '', body: '', outfit: '', personality: '', likes: '', favForms: ['striptease'], enabled: true, custom: true,
  };
}

function SettingsView({ data, setData, today }: { data: AppData; setData: (fn: (d: AppData) => AppData) => void; today: string }) {
  const [editing, setEditing] = useState<Star | null>(null);
  const enabled = data.stars.filter((s) => s.enabled).length;
  const saveStar = (s: Star) => {
    if (!s.name.trim()) return;
    setData((d) => {
      const exists = d.stars.some((x) => x.id === s.id);
      const stars = exists ? d.stars.map((x) => (x.id === s.id ? s : x)) : [...d.stars, s];
      return { ...d, stars };
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
        <p className="muted small">Each star nudges the cup up or down from this.</p>
      </section>

      <section className="card">
        <h2>Stars <span className="count">{enabled}/{data.stars.length} on</span></h2>
        {editing ? (
          <StarEditor star={editing} onSave={saveStar} onCancel={() => setEditing(null)}
            onDelete={editing.custom ? () => { setData((d) => ({ ...d, stars: d.stars.filter((x) => x.id !== editing.id) })); setEditing(null); } : undefined} />
        ) : (
          <>
            <button className="btn" onClick={() => setEditing(blankStar())}>+ Add star</button>
            <ul className="stars">
              {data.stars.map((s) => (
                <li key={s.id} className={s.enabled ? '' : 'off'}>
                  <div onClick={() => setEditing({ ...s })}>
                    <b>{s.name}</b>
                    <span className="muted small">{s.archetype} · {s.leaning}</span>
                  </div>
                  <label className="toggle">
                    <input type="checkbox" checked={s.enabled}
                      onChange={() => setData((d) => ({ ...d, stars: d.stars.map((x) => (x.id === s.id ? { ...x, enabled: !x.enabled } : x)) }))} />
                    <span />
                  </label>
                </li>
              ))}
            </ul>
          </>
        )}
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
  const txt = (k: keyof Star, label: string) => (
    <label className="field">{label}
      <input value={String(s[k] ?? '')} onChange={(e) => setS({ ...s, [k]: e.target.value })} />
    </label>
  );
  const toggleForm = (f: FormId) => setS({ ...s, favForms: s.favForms.includes(f) ? s.favForms.filter((x) => x !== f) : [...s.favForms, f] });
  return (
    <div className="form">
      {txt('name', 'Name')}
      {txt('archetype', 'Archetype / style')}
      <div className="row3">
        <label className="field">Outfit style
          <select value={s.style} onChange={(e) => setS({ ...s, style: e.target.value as Style })}>{STYLES.map((x) => <option key={x}>{x}</option>)}</select>
        </label>
        <label className="field">Voice
          <select value={s.tone} onChange={(e) => setS({ ...s, tone: e.target.value as Tone })}>{TONES.map((x) => <option key={x}>{x}</option>)}</select>
        </label>
        <label className="field">Leaning
          <select value={s.leaning} onChange={(e) => setS({ ...s, leaning: e.target.value as Leaning })}>{LEANS.map((x) => <option key={x}>{x}</option>)}</select>
        </label>
      </div>
      <label className="field">Cup nudge
        <select value={s.cupBias} onChange={(e) => setS({ ...s, cupBias: +e.target.value })}>
          {[-2, -1, 0, 1, 2, 3].map((n) => <option key={n} value={n}>{n > 0 ? `+${n}` : n}</option>)}
        </select>
      </label>
      {txt('hair', 'Hair')}
      {txt('body', 'Body')}
      {txt('outfit', 'Signature outfit')}
      {txt('personality', 'Personality')}
      {txt('likes', 'Favorite things')}
      <div className="field">Favorite sex forms
        <div className="chips pick">
          {FORMS.map((f) => (
            <button key={f.id} className={`chip ${s.favForms.includes(f.id) ? 'on' : ''}`} onClick={() => toggleForm(f.id)}>{f.label}</button>
          ))}
        </div>
      </div>
      <div className="row2">
        <button className="btn" onClick={() => onSave(s)}>Save</button>
        <button className="btn ghost" onClick={onCancel}>Cancel</button>
      </div>
      {onDelete && <button className="btn danger" onClick={onDelete}>Delete star</button>}
    </div>
  );
}
