// Service Worker para Push Notifications
//
// Estratégia de cache: REDE PRIMEIRO. O cache é só reserva para quando a rede falha.
// (Antes era "cache primeiro" com nome de cache fixo: quem tinha este SW instalado continuava
// recebendo para sempre as cópias antigas de /dashboard-tutor.html, /login.html, /auth.js e
// /config.js, e nenhuma correção publicada chegava a esses usuários.)
// Ao publicar uma mudança que precise invalidar caches antigos, aumente o número de CACHE_NAME.
const CACHE_NAME = 'inoutchi-cache-v2';
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
    // Assume o controle sem esperar as abas antigas fecharem.
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[SW] Cache aberto');
                // Um arquivo indisponível não pode impedir a instalação (e, com ela, o push).
                // 'reload' ignora o cache HTTP: a reserva nasce com a versão publicada.
                return Promise.allSettled(
                    urlsToCache.map((url) => cache.add(new Request(url, { cache: 'reload' })))
                );
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
            ).then(() => self.clients.claim());
        })
    );
});

// Interceptação de requisições: rede primeiro, cache como reserva.
self.addEventListener('fetch', (event) => {
    const request = event.request;
    const url = new URL(request.url);

    // Só GET do mesmo domínio. API, POST e outros domínios seguem direto, sem interceptação.
    if (request.method !== 'GET' || url.origin !== self.location.origin) {
        return;
    }

    event.respondWith(
        fetch(request)
            .then((response) => {
                // Mantém a reserva offline sempre com a última versão publicada.
                if (response.ok && urlsToCache.includes(url.pathname)) {
                    const copia = response.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(request, copia));
                }
                return response;
            })
            .catch(() => caches.match(request))
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