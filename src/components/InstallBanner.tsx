import { usePwaInstall } from '../hooks/usePwaInstall';

export function InstallBanner() {
  const pwa = usePwaInstall();

  if (!pwa.showBanner) return null;

  return (
    <aside className="install-banner" role="note">
      <div>
        <p className="eyebrow">Phone app</p>
        <h2>Add to Home Screen</h2>
        {pwa.canPrompt ? (
          <p className="tiny">Install Frida as an app — full screen, no browser chrome.</p>
        ) : pwa.ios ? (
          <ol className="install-steps">
            <li>
              Open in <strong>Safari</strong> (not Chrome).
            </li>
            <li>
              Tap <strong>Share</strong> (square with up arrow).
            </li>
            <li>
              Choose <strong>Add to Home Screen</strong> → Add.
            </li>
          </ol>
        ) : (
          <ol className="install-steps">
            <li>
              Open the page in <strong>Chrome</strong> (Android) or Edge.
            </li>
            <li>
              Menu <strong>⋮</strong> → <strong>Install app</strong> / Add to Home screen.
            </li>
            <li>HTTPS host required — see README.</li>
          </ol>
        )}
      </div>
      <div className="install-banner__actions">
        {pwa.canPrompt && (
          <button type="button" className="btn btn--danger" onClick={() => void pwa.promptInstall()}>
            Install Frida
          </button>
        )}
        <button type="button" className="btn btn--ghost" onClick={pwa.dismiss}>
          Dismiss
        </button>
      </div>
    </aside>
  );
}

export function InstallHint() {
  const pwa = usePwaInstall();
  if (pwa.standalone) {
    return <p className="muted tiny">Running as installed app (standalone).</p>;
  }
  return (
    <p className="muted tiny">
      Tip: add Frida to your home screen so it opens like a real app. On iPhone use Safari → Share →
      Add to Home Screen. HTTPS required.
    </p>
  );
}
