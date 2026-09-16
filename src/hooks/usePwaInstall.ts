import { useCallback, useEffect, useState } from 'react';

const DISMISS_KEY = 'frida.installBanner.dismissed';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

let capturedPrompt: BeforeInstallPromptEvent | null = null;
const promptListeners = new Set<() => void>();

function readStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return (
    nav.standalone === true ||
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: fullscreen)').matches ||
    window.matchMedia('(display-mode: minimal-ui)').matches
  );
}

function readIos(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  const iOSDevice = /iPad|iPhone|iPod/.test(ua);
  const iPadOs = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
  return iOSDevice || iPadOs;
}

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    capturedPrompt = e as BeforeInstallPromptEvent;
    promptListeners.forEach((fn) => fn());
  });
  window.addEventListener('appinstalled', () => {
    capturedPrompt = null;
    promptListeners.forEach((fn) => fn());
  });
}

export function usePwaInstall() {
  const [standalone, setStandalone] = useState(readStandalone);
  const [ios] = useState(readIos);
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem(DISMISS_KEY) === '1';
    } catch {
      return false;
    }
  });
  const [canPrompt, setCanPrompt] = useState(() => Boolean(capturedPrompt));

  useEffect(() => {
    const sync = () => {
      setStandalone(readStandalone());
      setCanPrompt(Boolean(capturedPrompt));
      document.documentElement.classList.toggle('is-standalone', readStandalone());
    };
    const mq = window.matchMedia('(display-mode: standalone)');
    mq.addEventListener?.('change', sync);
    promptListeners.add(sync);
    sync();
    return () => {
      mq.removeEventListener?.('change', sync);
      promptListeners.delete(sync);
    };
  }, []);

  const dismiss = useCallback(() => {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISS_KEY, '1');
    } catch {
      /* ignore quota */
    }
  }, []);

  const promptInstall = useCallback(async () => {
    if (!capturedPrompt) return false;
    const event = capturedPrompt;
    await event.prompt();
    const choice = await event.userChoice;
    capturedPrompt = null;
    setCanPrompt(false);
    if (choice.outcome === 'accepted') {
      setStandalone(true);
      document.documentElement.classList.add('is-standalone');
      return true;
    }
    return false;
  }, []);

  return {
    standalone,
    ios,
    dismissed,
    canPrompt,
    showBanner: !standalone && !dismissed,
    dismiss,
    promptInstall,
  };
}
