export type AppTab = 'gaming' | 'hverdag' | 'udfordringer' | 'profil';

type Props = {
  tab: AppTab;
  onChange: (tab: AppTab) => void;
};

const TABS: { id: AppTab; label: string; icon: string }[] = [
  { id: 'gaming', label: 'Gaming', icon: '▶' },
  { id: 'hverdag', label: 'Hverdag', icon: '⌂' },
  { id: 'udfordringer', label: 'Udfordringer', icon: '✦' },
  { id: 'profil', label: 'Profil', icon: '●' },
];

export function BottomNav({ tab, onChange }: Props) {
  return (
    <nav className="bottom-nav" aria-label="Hovedmenu">
      {TABS.map((t) => (
        <button
          key={t.id}
          type="button"
          className={`bottom-nav__btn ${tab === t.id ? 'is-active' : ''}`}
          aria-current={tab === t.id ? 'page' : undefined}
          onClick={() => onChange(t.id)}
        >
          <span className="bottom-nav__icon" aria-hidden>
            {t.icon}
          </span>
          <span>{t.label}</span>
        </button>
      ))}
    </nav>
  );
}
