import type { ReactElement } from 'react';

export type AppTab = 'home' | 'gaming' | 'calendar' | 'sex' | 'profile';

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
function IconGame() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="nav-svg">
      <path
        fill="currentColor"
        d="M7.5 8h9A4.5 4.5 0 0 1 21 12.5c0 1.4-.6 2.6-1.6 3.5l-1.7 1.5H6.3l-1.7-1.5A4.5 4.5 0 0 1 3 12.5 4.5 4.5 0 0 1 7.5 8Zm1 2.2v1.6H7v1.6H5.4v-1.6H3.8v-1.6h1.6V8.6H7v1.6h1.5Zm8.2 1.1a1.1 1.1 0 1 0 0-2.2 1.1 1.1 0 0 0 0 2.2Zm-2 2.2a1.1 1.1 0 1 0 0-2.2 1.1 1.1 0 0 0 0 2.2Z"
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
function IconProfile() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="nav-svg">
      <path
        fill="currentColor"
        d="M12 4a4 4 0 1 1 0 8 4 4 0 0 1 0-8Zm0 10c3.8 0 8 1.8 8 5v2H4v-2c0-3.2 4.2-5 8-5Z"
      />
    </svg>
  );
}

const TABS: { id: AppTab; label: string; icon: () => ReactElement }[] = [
  { id: 'home', label: 'Home', icon: IconHome },
  { id: 'gaming', label: 'Gaming', icon: IconGame },
  { id: 'sex', label: 'Sex', icon: IconSex },
  { id: 'calendar', label: 'Calendar', icon: IconCal },
  { id: 'profile', label: 'Profile', icon: IconProfile },
];

export function BottomNav({ tab, onChange, sexBadge }: Props) {
  return (
    <nav className="bottom-nav" aria-label="Main menu">
      {TABS.map((t) => {
        const Icon = t.icon;
        const active = tab === t.id;
        const badge = (t.id === 'sex' || t.id === 'home') && !!sexBadge;
        return (
          <button
            key={t.id}
            type="button"
            className={`bottom-nav__btn ${active ? 'is-active' : ''}`}
            aria-current={active ? 'page' : undefined}
            onClick={() => onChange(t.id)}
          >
            <span className="bottom-nav__icon">
              <Icon />
              {badge && <i className="nav-badge" aria-label="Pending sex punishment" />}
            </span>
            <span>{t.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
