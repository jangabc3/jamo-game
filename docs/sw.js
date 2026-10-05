// 오프라인 실행용 서비스 워커. 빌드할 때마다 CACHE 이름이 자동으로 바뀌어요.
const CACHE = 'jamo-03b0f8e3';
const FILES = ['./', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png', 'vendor/matter.min.js', 'css/00-fonts.css', 'css/01-base.css', 'css/02-polish.css', 'css/03-motion.css', 'css/04-dex.css', 'js/00-env.js', 'js/01-hangul.js', 'js/02-dict-data.js', 'js/03-dictionary.js', 'js/04-config.js', 'js/05-rules.js', 'js/06-physics.js', 'js/07-scoring.js', 'js/08-spawn.js', 'js/09-fx.js', 'js/10-audio.js', 'js/11-hud.js', 'js/12-input.js', 'js/13-settings.js', 'js/14-dex-ui.js', 'js/15-modes.js', 'js/16-guide.js', 'js/17-game.js', 'js/18-tutorial-menu.js', 'js/19-share.js', 'js/20-render-sprites.js', 'js/21-render-scene.js', 'js/22-loop.js', 'js/23-main.js', 'fonts/GowunBatang-400.woff2', 'fonts/GowunBatang-700.woff2', 'fonts/GowunDodum-400.woff2', 'fonts/Hahmlet-600.woff2', 'fonts/Hahmlet-800.woff2', 'fonts/NanumBrush-400.woff2'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES))); self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))); self.clients.claim(); });
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(fetch(e.request).then(r => { const c = r.clone(); caches.open(CACHE).then(x => x.put(e.request, c)); return r; }).catch(() => caches.match(e.request, { ignoreSearch: true })));
});
