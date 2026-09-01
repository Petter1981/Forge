self.addEventListener('push', event => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch { data = { body: event.data ? event.data.text() : 'FORGE' }; }
  const title = data.title || 'FORGE';
  const options = {
    body: data.body || '',
    icon: data.icon || undefined,
    badge: data.badge || undefined,
    data: { url: data.url || '/' },
    tag: data.eventType || 'forge',
    renotify: true
  };
  event.waitUntil(self.registration.showNotification(title, options));
});
self.addEventListener('notificationclick', event => {
  event.notification.close();
  const url = event.notification?.data?.url || '/';
  event.waitUntil(clients.matchAll({type:'window',includeUncontrolled:true}).then(list => {
    for (const c of list) { if ('focus' in c) { c.navigate(url); return c.focus(); } }
    if (clients.openWindow) return clients.openWindow(url);
  }));
});
