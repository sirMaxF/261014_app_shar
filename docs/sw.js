const IMYA_KE_SHA = 'magic-ball-v1';

const FAYLY = [
    './',
    './index.html',
    './style.css',
    './app.js',
    './shake.js',
    './const.js',
    './manifest.webmanifest',
    './logo96.png',
    './logo192.png',
    './logo512.png',
    './404.html',
    './offline.html',
    'https://fonts.googleapis.com/css2?family=Montserrat+Alternates:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap',
];

// ── сообщение от страницы: пропустить ожидание ──
self.addEventListener('message', (sobytie) => {
    if (sobytie.data && sobytie.data.action === 'skipWaiting') {
        self.skipWaiting();
    }
});

// ── установка: кэшируем статические файлы ──
self.addEventListener('install', (sobytie) => {
    sobytie.waitUntil(
        caches.open(IMYA_KE_SHA).then((kesh) => kesh.addAll(FAYLY))
    );
    self.skipWaiting();
});

// ── активация: удаляем старые кэши ──
self.addEventListener('activate', (sobytie) => {
    sobytie.waitUntil(
        caches.keys().then((klyuchi) =>
            Promise.all(
                klyuchi
                    .filter((k) => k !== IMYA_KE_SHA)
                    .map((k) => caches.delete(k))
            )
        )
    );
    self.clients.claim();
});

// ── запросы: сначала кэш, потом сеть ──
self.addEventListener('fetch', (sobytie) => {
    sobytie.respondWith(
        caches.match(sobytie.request).then((izKESha) => {
            if (izKESha) return izKESha;
            return fetch(sobytie.request).then((otvet) => {
                if (!otvet || otvet.status !== 200) {
                    // Сервер вернул 404 → отдаём кэшированную 404-страницу
                    if (otvet && otvet.status === 404 && sobytie.request.destination === 'document') {
                        return caches.match('./404.html');
                    }
                    return otvet;
                }
                // Кэшируем обычные запросы + файлы шрифтов (CORS)
                const etoShrift = (otvet.headers && otvet.headers.get('content-type') || '').includes('font');
                if (otvet.type === 'basic' || etoShrift) {
                    const kopiyA = otvet.clone();
                    caches.open(IMYA_KE_SHA).then((kesh) => kesh.put(sobytie.request, kopiyA));
                }
                return otvet;
            }).catch(() => {
                // Ошибка сети (офлайн) → отдаём offline-страницу
                if (sobytie.request.destination === 'document') {
                    return caches.match('./offline.html');
                }
            });
        })
    );
});

