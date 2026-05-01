// Push notification handler for Random Coffee HK
// This file is imported by the Workbox-generated service worker via vite-plugin-pwa

self.addEventListener('push', (event) => {
    if (!event.data) return

    let data = {}
    try {
        data = event.data.json()
    } catch {
        data = { title: 'Random Coffee HK', body: event.data.text() }
    }

    const { title = 'Random Coffee HK', body = '', url = '/', icon = '/icon-192.png', badge = '/icon-192.png' } = data

    event.waitUntil(
        self.registration.showNotification(title, {
            body,
            icon,
            badge,
            data: { url },
            vibrate: [200, 100, 200],
            requireInteraction: false,
        })
    )
})

self.addEventListener('notificationclick', (event) => {
    event.notification.close()
    const url = event.notification.data?.url || '/'

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            // Focus existing window if open
            for (const client of clientList) {
                if (client.url.includes(self.location.origin) && 'focus' in client) {
                    client.navigate(url)
                    return client.focus()
                }
            }
            // Open new window
            if (clients.openWindow) return clients.openWindow(url)
        })
    )
})
