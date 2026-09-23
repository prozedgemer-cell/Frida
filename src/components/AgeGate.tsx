type Props = {
  onConfirm: () => void;
};

export function AgeGate({ onConfirm }: Props) {
  return (
    <div className="age-gate">
      <div className="age-gate__card">
        <p className="eyebrow">18+ · Adult content</p>
        <h1>Frida Control Panel</h1>
        <p>
          This is a private BDSM / feminization control panel with sexual content.
          You must be at least <strong>18 years old</strong> to continue.
        </p>
        <p className="muted">
          Content is fictional roleplay. Emergency stop, hard limits, and your own consent always apply.
        </p>
        <p className="muted tiny">
          After opening, you can add Frida to your home screen (Safari on iPhone: Share → Add to Home
          Screen). HTTPS required.
        </p>
        <div className="age-gate__actions">
          <button type="button" className="btn btn--danger" onClick={onConfirm}>
            I am 18+ — open Frida&apos;s panel
          </button>
          <a className="btn btn--ghost" href="https://www.google.com">
            No, leave
          </a>
        </div>
      </div>
    </div>
  );
}
