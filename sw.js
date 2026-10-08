const CACHE_NAME = 'anitime-v99-force-update';
const ASSETS = [
    './',
    './index.html',
    './manifest.json',
    './css/main.css',
    './css/components.css',
    './css/schedule.css',
    './css/detail.css',
    './css/themes.css',
    './js/timezone.js',
    './js/storage.js',
    './js/api.js',
    './js/countdown.js',
    './js/notify.js',
    './js/ui.js',
    './js/schedule.js',
    './js/seasonal.js',
    './js/library.js',
    './js/detail.js',
    './js/search.js',
    './js/news.js',
    './js/settings.js',
    './js/app.js',
    './icons/icon-192.png'
];

self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME)
            .then(c => c.addAll(ASSETS))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
        ).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (e) => {
    if (e.request.method !== 'GET') return;
    if (e.request.url.includes('graphql.anilist.co')) return;
    if (e.request.url.includes('rss2json.com')) return;
    e.respondWith(
        caches.match(e.request).then(cached => {
            if (cached) return cached;
            return fetch(e.request).then(res => {
                if (!res || res.status !== 200 || res.type === 'opaque') return res;
                const clone = res.clone();
                caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
                return res;
            }).catch(() => caches.match('./index.html'));
        })
    );
});
