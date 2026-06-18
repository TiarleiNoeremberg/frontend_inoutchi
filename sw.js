// Service Worker para Push Notifications
const CACHE_NAME = 'inoutchi-cache-v1';
const urlsToCache = [
    '/',
    '/login.html',
    '/dashboard-tutor.html',
    '/auth.js',
    '/config.js',
    '/assets/images/Logo_iOs.png'
];

// Instalação do Service Worker
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[SW] Cache aberto');
                return cache.addAll(urlsToCache);
            })
    );
});

// Ativação do Service Worker
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('[SW] Removendo cache antigo:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// Interceptação de requisições
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                if (response) {
                    return response;
                }
                return fetch(event.request);
            })
    );
});

// ============================================================
// PUSH NOTIFICATIONS
// ============================================================

self.addEventListener('push', (event) => {
    console.log('[SW] Push recebido:', event);

    let data = {
        title: 'Inoutchi',
        body: 'Você tem uma nova notificação',
        icon: '/assets/images/Logo_iOs.png',
        badge: '/assets/images/favicon.png',
        data: {}
    };

    if (event.data) {
        try {
            const parsed = event.data.json();
            data = { ...data, ...parsed };
        } catch (e) {
            data.body = event.data.text();
        }
    }

    const options = {
        body: data.body,
        icon: data.icon,
        badge: data.badge,
        vibrate: [200, 100, 200],
        data: data.data,
        actions: data.actions || [],
        requireInteraction: true,
        tag: data.tag || 'inoutchi-notification'
    };

    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

// Clique na notificação
self.addEventListener('notificationclick', (event) => {
    console.log('[SW] Notificação clicada:', event);

    event.notification.close();

    const urlToOpen = event.notification.data?.url || '/dashboard-tutor.html';

    event.waitUntil(
        clients.matchAll({ type: 'window' }).then((windowClients) => {
            for (const client of windowClients) {
                if (client.url === urlToOpen && 'focus' in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
        })
    );
});