import { useEffect, useState, type ReactElement } from 'react';

export type AppTab =
  | 'hoved'
  | 'gaming'
  | 'ingame'
  | 'hverdag'
  | 'udfordringer'
  | 'sex'
  | 'kalender'
  | 'profil';

type Props = {
  tab: AppTab;
  onChange: (tab: AppTab) => void;
  sexBadge?: boolean;
};

function IconHome() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="nav-svg">
      <path
        fill="currentColor"
        d="M12 4.2 4 10.5V20h5.2v-6h5.6v6H20v-9.5L12 4.2Z"
      />
    </svg>
  );
}
function IconCal() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="nav-svg">
      <path
        fill="currentColor"
        d="M7 3h2v2h6V3h2v2h3v16H4V5h3V3Zm11 6H6v10h12V9Z"
      />
    </svg>
  );
}
function IconSex() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="nav-svg">
      <path
        fill="currentColor"
        d="M12 3.2c2.4 2.6 6.8 6.4 6.8 10.2A5.6 5.6 0 0 1 12 19.2 5.6 5.6 0 0 1 5.2 13.4C5.2 9.6 9.6 5.8 12 3.2Z"
      />
    </svg>
  );
}
function IconUser() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="nav-svg">
      <path
        fill="currentColor"
        d="M12 4a4 4 0 1 1 0 8 4 4 0 0 1 0-8Zm0 10c3.8 0 8 1.8 8 5v2H4v-2c0-3.2 4.2-5 8-5Z"
      />
    </svg>
  );
}

const PRIMARY: { id: AppTab; label: string; icon: () => ReactElement }[] = [
  { id: 'hoved', label: 'Hoved', icon: IconHome },
  { id: 'kalender', label: 'Kalender', icon: IconCal },
  { id: 'sex', label: 'Sex', icon: IconSex },
  { id: 'profil', label: 'Profil', icon: IconUser },
];

const SHEET: { id: AppTab; label: string; hint: string }[] = [
  { id: 'gaming', label: 'Gaming', hint: 'Session-log & KPI' },
  { id: 'ingame', label: 'In-game', hint: 'Mens du spiller' },
  { id: 'hverdag', label: 'Hverdag', hint: 'IRL & tøj' },
  { id: 'udfordringer', label: 'Udfordringer', hint: 'Ordrer' },
];

export function BottomNav({ tab, onChange, sexBadge }: Props) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [tab]);

  const moreActive = SHEET.some((s) => s.id === tab);

  return (
    <>
      {open && (
        <div className="nav-sheet-wrap">
          <button
            type="button"
            className="nav-sheet-backdrop"
            aria-label="Luk menu"
            onClick={() => setOpen(false)}
          />
          <div className="nav-sheet" role="dialog" aria-label="Flere modes">
            <p className="eyebrow">Mere</p>
            {SHEET.map((s) => (
              <button
                key={s.id}
                type="button"
                className={`nav-sheet__btn ${tab === s.id ? 'is-active' : ''}`}
                onClick={() => onChange(s.id)}
              >
                <strong>{s.label}</strong>
                <span>{s.hint}</span>
              </button>
            ))}
          </div>
        </div>
      )}
      <nav className="bottom-nav bottom-nav--fab" aria-label="Hovedmenu">
        {PRIMARY.slice(0, 2).map((t) => (
          <NavBtn
            key={t.id}
            t={t}
            active={tab === t.id}
            badge={false}
            onClick={() => onChange(t.id)}
          />
        ))}
        <button
          type="button"
          className={`bottom-nav__fab ${open || moreActive ? 'is-active' : ''}`}
          aria-label="Flere"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <span aria-hidden>+</span>
        </button>
        {PRIMARY.slice(2).map((t) => (
          <NavBtn
            key={t.id}
            t={t}
            active={tab === t.id}
            badge={t.id === 'sex' && !!sexBadge}
            onClick={() => onChange(t.id)}
          />
        ))}
      </nav>
    </>
  );
}

function NavBtn({
  t,
  active,
  badge,
  onClick,
}: {
  t: (typeof PRIMARY)[number];
  active: boolean;
  badge: boolean;
  onClick: () => void;
}) {
  const Icon = t.icon;
  return (
    <button
      type="button"
      className={`bottom-nav__btn ${active ? 'is-active' : ''}`}
      aria-current={active ? 'page' : undefined}
      onClick={onClick}
    >
      <span className="bottom-nav__icon">
        <Icon />
        {badge && <i className="nav-badge" aria-label="Aktiv sex-straf" />}
      </span>
      <span>{t.label}</span>
    </button>
  );
}
