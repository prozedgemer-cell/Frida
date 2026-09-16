import { useEffect } from 'react';
import { AgeGate } from './components/AgeGate';
import { Dashboard } from './components/Dashboard';
import { useFridaState } from './hooks/useFridaState';

export default function App() {
  const api = useFridaState();

  useEffect(() => {
    const nav = window.navigator as Navigator & { standalone?: boolean };
    const standalone =
      nav.standalone === true ||
      window.matchMedia('(display-mode: standalone)').matches;
    document.documentElement.classList.toggle('is-standalone', standalone);
  }, []);

  if (!api.state.profile.ageVerified) {
    return <AgeGate onConfirm={api.verifyAge} />;
  }

  return <Dashboard api={api} />;
}
