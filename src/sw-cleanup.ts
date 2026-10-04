import { STORAGE_KEY } from './storage';

const CLEAN_FLAG = 'frida-v3-clean';

/**
 * One-time clean start on each device: unregister every stale service worker,
 * delete every Cache Storage cache and remove old app keys from localStorage.
 * Resolves when the fresh service worker may be registered.
 */
export async function cleanStart(): Promise<void> {
  try {
    if (localStorage.getItem(CLEAN_FLAG)) return;
    if ('serviceWorker' in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((r) => r.unregister()));
    }
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    }
    for (const k of Object.keys(localStorage)) {
      if (k !== STORAGE_KEY && k !== CLEAN_FLAG) localStorage.removeItem(k);
    }
    localStorage.setItem(CLEAN_FLAG, String(Date.now()));
  } catch {
    /* best effort */
  }
}
