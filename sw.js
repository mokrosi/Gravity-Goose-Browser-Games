// Bump CACHE_NAME on every release so returning players pick up new files
// (the activate handler deletes any cache whose name doesn't match).
const CACHE_NAME = 'gravity-goose-v2';
const ASSETS = [
    './',
    './index.html',
    './manifest.json',
    './css/style.css',
    './js/SpriteGenerator.js',
    './js/SoundManager.js',
    './js/SaveManager.js',
    './js/ParticleSystem.js',
    './js/entities/Entity.js',
    './js/entities/Item.js',
    './js/entities/Crumb.js',
    './js/entities/Enemy.js',
    './js/entities/Laser.js',
    './js/entities/Boss.js',
    './js/entities/Ghost.js',
    './js/Player.js',
    './js/Physics.js',
    './js/AssetManager.js',
    './js/InputHandler.js',
    './js/TouchControls.js',
    './js/LevelManager.js',
    './js/Camera.js',
    './js/MechanicToasts.js',
    './js/HintSystem.js',
    './js/Achievements.js',
    './js/Game.js',
    './js/VictoryCinematic.js',
    './js/main.js',
    './assets/images/banner.jpg',
    './assets/images/banner.png',
    './assets/images/favicon.svg',
    './assets/images/logo.svg',
    './assets/images/apple-touch-icon.png',
    './assets/cursor.png',
    './assets/cursor-pointer.png'
];

self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
    );
    self.skipWaiting();
});

self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.map((key) => {
                    if (key !== CACHE_NAME) return caches.delete(key);
                })
            );
        })
    );
    self.clients.claim();
});

self.addEventListener('fetch', (e) => {
    if (e.request.method !== 'GET') return;
    const url = new URL(e.request.url);
    if (url.origin !== location.origin) return;

    e.respondWith(
        caches.match(e.request).then((cached) => {
            if (cached) return cached;
            // Strip cache-busting query strings (?v=2) so precached files
            // still match; fall back to the network and cache the response
            // for offline use on the next load.
            const clean = url.origin + url.pathname;
            return caches.match(clean).then((cachedClean) => {
                if (cachedClean) return cachedClean;
                return fetch(e.request).then((res) => {
                    if (res.ok) {
                        const clone = res.clone();
                        caches.open(CACHE_NAME).then((cache) => cache.put(clean, clone));
                    }
                    return res;
                });
            });
        })
    );
});
