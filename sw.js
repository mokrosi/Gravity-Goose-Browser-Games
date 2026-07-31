const CACHE_NAME = 'gravity-goose-v1';
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
    './js/main.js',
    './assets/images/banner.jpg',
    './assets/images/favicon.svg',
    './assets/images/logo.svg'
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
    e.respondWith(
        caches.match(e.request).then((cached) => cached || fetch(e.request))
    );
});
