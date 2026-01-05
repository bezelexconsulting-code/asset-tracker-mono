type Action = { type: 'updateAsset' | 'addActivity' | 'addJob' | 'updateJob'; payload: any };

const KEY = 'offline-queue';

export function enqueue(action: Action) {
  const arr = getQueue();
  arr.push({ ...action, ts: Date.now() });
  localStorage.setItem(KEY, JSON.stringify(arr));
  if ('serviceWorker' in navigator) navigator.serviceWorker.ready.then((reg) => reg.sync?.register('sync-queue').catch(() => {}));
}

export function getQueue(): any[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function clearQueue() {
  localStorage.setItem(KEY, JSON.stringify([]));
}
