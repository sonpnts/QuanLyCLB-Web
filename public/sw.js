// CMIS - Tấn Đạt Taekwondo Service Worker for Web Push Notification

self.addEventListener('install', event => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});

// Handle incoming Web Push notification
self.addEventListener('push', event => {
  let data = {};

  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = {
        title: 'Thông báo CMIS',
        body: event.data.text()
      };
    }
  }

  const title = data.title || 'Thông báo từ CMIS - Tấn Đạt Taekwondo';
  const options = {
    body: data.body || 'Bạn có thông báo mới từ câu lạc bộ.',
    icon: data.icon || '/images/logos/IMG_2911.png',
    badge: data.badge || '/images/logos/IMG_2911.png',
    image: data.image || undefined,
    data: {
      url: data.data?.url || data.url || '/dashboards/home',
      notificationId: data.data?.notificationId
    },
    vibrate: [200, 100, 200],
    requireInteraction: false
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Handle notification click event
self.addEventListener('notificationclick', event => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || '/dashboards/home';

  event.waitUntil(
    self.clients
      .matchAll({
        type: 'window',
        includeUncontrolled: true
      })
      .then(clientList => {
        // Try to find a client tab already open
        for (const client of clientList) {
          if ('focus' in client) {
            // If target URL or origin matches, navigate and focus
            if (client.url && client.url.includes(self.location.origin)) {
              if (client.url === targetUrl || client.url.endsWith(targetUrl)) {
                return client.focus();
              }
              if ('navigate' in client) {
                return client.navigate(targetUrl).then(c => c ? c.focus() : null);
              }
            }
          }
        }

        // Otherwise open a new window
        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl);
        }
      })
  );
});
