self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  self.clients.claim();
});

// Background sync to notify clients to process offline queue
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-queue') {
    event.waitUntil(
      self.clients.matchAll({ includeUncontrolled: true, type: 'window' }).then((clients) => {
        clients.forEach((c) => c.postMessage({ type: 'SYNC_QUEUE' }));
      })
    );
  }
});

// Basic push handler (requires a push subscription and server sending messages)
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : { title: 'New Job', body: 'You have a new assignment' };
  event.waitUntil(
    self.registration.showNotification(data.title || 'Notification', {
      body: data.body || '',
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-72.png',
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientsArr) => {
      const client = clientsArr.find((c) => c.url.includes('/tech/mobile')) || clientsArr[0];
      if (client) {
        client.focus();
      } else {
        self.clients.openWindow('/');
      }
    })
  );
});
