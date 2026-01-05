export async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return null;
  try {
    const reg = await navigator.serviceWorker.register('/sw.js');
    return reg;
  } catch {
    return null;
  }
}

export async function subscribePush(reg?: ServiceWorkerRegistration) {
  try {
    const registration = reg || (await navigator.serviceWorker.ready);
    const perm = await Notification.requestPermission();
    if (perm !== 'granted') return null;
    // Placeholder VAPID public key; replace with real one when backend is ready
    const vapidPublicKey = 'BPlaceholderVapidKeyForDemo__________';
    const convertedKey = urlBase64ToUint8Array(vapidPublicKey);
    const sub = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: convertedKey });
    localStorage.setItem('push-subscription', JSON.stringify(sub));
    return sub;
  } catch {
    return null;
  }
}

export function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

export async function showLocalNotification(title: string, body: string) {
  try {
    const reg = await navigator.serviceWorker.getRegistration();
    if (reg) await reg.showNotification(title, { body });
    else if ('Notification' in window && Notification.permission === 'granted') new Notification(title, { body });
  } catch {}
}
