type UpdateListener = (available: boolean) => void;

let waitingWorker: ServiceWorker | null = null;
let reloadRequested = false;
const listeners = new Set<UpdateListener>();

export async function registerAppServiceWorker(version: string): Promise<void> {
  if (!('serviceWorker' in navigator)) return;
  const registration = await navigator.serviceWorker.register(`/sw.js?v=${encodeURIComponent(version)}`);
  if (registration.waiting && navigator.serviceWorker.controller) setWaitingWorker(registration.waiting);

  registration.addEventListener('updatefound', () => {
    const worker = registration.installing;
    if (!worker) return;
    worker.addEventListener('statechange', () => {
      if (worker.state === 'installed' && navigator.serviceWorker.controller) setWaitingWorker(worker);
    });
  });

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (reloadRequested) window.location.reload();
  });

  const checkForUpdate = () => registration.update().catch(() => undefined);
  window.setInterval(checkForUpdate, 60 * 60 * 1_000);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') checkForUpdate();
  });
}

export function subscribeToAppUpdate(listener: UpdateListener): () => void {
  listeners.add(listener);
  listener(waitingWorker !== null);
  return () => listeners.delete(listener);
}

export function applyAppUpdate(): boolean {
  if (!waitingWorker) return false;
  reloadRequested = true;
  waitingWorker.postMessage({ type: 'SKIP_WAITING' });
  return true;
}

function setWaitingWorker(worker: ServiceWorker): void {
  waitingWorker = worker;
  for (const listener of listeners) listener(true);
}
