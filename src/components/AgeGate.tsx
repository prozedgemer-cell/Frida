type Props = {
  onConfirm: () => void;
};

export function AgeGate({ onConfirm }: Props) {
  return (
    <div className="age-gate">
      <div className="age-gate__card">
        <p className="eyebrow">18+ · Voksenindhold</p>
        <h1>Frida Kontrolpanel</h1>
        <p>
          Dette er et privat BDSM-/feminiserings-kontrolpanel med seksuelt indhold.
          Du skal være mindst <strong>18 år</strong> for at fortsætte.
        </p>
        <p className="muted">
          Indholdet er fiktivt rollespil. Nødstop, hard limits og samtykke til dig selv gælder altid.
        </p>
        <p className="muted tiny">
          Efter åbning kan du føje Frida til hjemmeskærmen (Safari på iPhone: Del → Føj til
          hjemmeskærm). Kræver HTTPS.
        </p>
        <div className="age-gate__actions">
          <button type="button" className="btn btn--danger" onClick={onConfirm}>
            Jeg er 18+ — åbn panelet for Frida
          </button>
          <a className="btn btn--ghost" href="https://www.google.com">
            Nej, forlad
          </a>
        </div>
      </div>
    </div>
  );
}
