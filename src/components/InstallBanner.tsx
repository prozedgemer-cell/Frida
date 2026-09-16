import { usePwaInstall } from '../hooks/usePwaInstall';

export function InstallBanner() {
  const pwa = usePwaInstall();

  if (!pwa.showBanner) return null;

  return (
    <aside className="install-banner" role="note">
      <div>
        <p className="eyebrow">Telefon-app</p>
        <h2>Føj til hjemmeskærm</h2>
        {pwa.canPrompt ? (
          <p className="tiny">
            Installér Frida som app — åbner fuld skærm uden browser-chrome.
          </p>
        ) : pwa.ios ? (
          <ol className="install-steps">
            <li>
              Åbn i <strong>Safari</strong> (ikke Chrome).
            </li>
            <li>
              Tryk <strong>Del</strong> (firkant med pil op).
            </li>
            <li>
              Vælg <strong>Føj til hjemmeskærm</strong> → Tilføj.
            </li>
          </ol>
        ) : (
          <ol className="install-steps">
            <li>
              Åbn siden i <strong>Chrome</strong> (Android) eller Edge.
            </li>
            <li>
              Menu <strong>⋮</strong> → <strong>Installer app</strong> / Føj til
              startskærm.
            </li>
            <li>HTTPS-host er påkrævet — se README.</li>
          </ol>
        )}
      </div>
      <div className="install-banner__actions">
        {pwa.canPrompt && (
          <button type="button" className="btn btn--danger" onClick={() => void pwa.promptInstall()}>
            Installer Frida
          </button>
        )}
        <button type="button" className="btn btn--ghost" onClick={pwa.dismiss}>
          Skjul
        </button>
      </div>
    </aside>
  );
}

export function InstallHint() {
  const pwa = usePwaInstall();
  if (pwa.standalone) {
    return <p className="muted tiny">Kører som installeret app (standalone).</p>;
  }
  return (
    <p className="muted tiny">
      Tip: føj Frida til hjemmeskærmen, så den åbner som en rigtig app. På iPhone
      skal det gøres fra Safari → Del → Føj til hjemmeskærm. Kræver HTTPS.
    </p>
  );
}
