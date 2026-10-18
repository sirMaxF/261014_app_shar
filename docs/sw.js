const IMYA_KE_SHA = 'magic-ball-v1';

const FAYLY = [
    './',
    './index.html',
    './style.css',
    './app.js',
    './shake.js',
    './const.js',
    './manifest.json',
    './logo96.webp',
    './logo192.webp',
    './logo512.webp',
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

// ── запросы: stale-while-revalidate ──
self.addEventListener('fetch', (sobytie) => {
    const zaklop = sobytie.request.clone();
    sobytie.respondWith(
        caches.open(IMYA_KE_SHA).then(async (kesh) => {
            // 1) Сразу отдаём из кэша (stale)
            const izKESha = await caches.match(sobytie.request);
            // 2) Фоновое обновление (revalidate)
            const setVSet = async () => {
                try {
                    const otvet = await fetch(sobytie.request);
                    if (otvet && otvet.status === 200) {
                        const kopiyA = otvet.clone();
                        await kesh.put(sobytie.request, kopiyA);
                    }
                } catch {
                    // Ошибка сети — оставляем старое
                }
            };
            setVSet();
            // 3) Возвращаем кэш; если нет — пробуем сеть
            if (izKESha) return izKESha;
            const izSeti = await fetch(sobytie.request).catch(() => null);
            if (izSeti && izSeti.status === 200) {
                const kopiyA = izSeti.clone();
                await kesh.put(sobytie.request, kopiyA);
                return izSeti;
            }
            // 4) Офлайн: fallback-страницы
            if (sobytie.request.destination === 'document') {
                const izKESha404 = await caches.match('./404.html');
                if (izKESha404) return izKESha404;
                const izKEShaOffline = await caches.match('./offline.html');
                if (izKEShaOffline) return izKEShaOffline;
            }
            return new Response('', { status: 404 });
        })
    );
});

