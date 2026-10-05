#!/usr/bin/env python3
"""자모게임 빌드.
  python tools/build.py            -> docs/        (GitHub Pages용, 파일 나뉜 오프라인 앱)
  python tools/build.py --single   -> dist/jamo.html (한 파일, 글꼴·엔진은 CDN)
"""
import hashlib, os, re, shutil, sys
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
P = lambda *a: os.path.join(ROOT, *a)
rd = lambda p: open(p, encoding='utf8').read()
def wr(p, t):
    os.makedirs(os.path.dirname(p), exist_ok=True)
    open(p, 'w', encoding='utf8').write(t)

SRC = P('src')
css_files = sorted(os.listdir(P('src/css')))
js_files = sorted(os.listdir(P('src/js')))
dict_txt = rd(P('data/dict.txt'))
assert '`' not in dict_txt and '${' not in dict_txt, '사전에 백틱이 있으면 안 돼요'
def js_text(f):
    t = rd(P('src/js', f))
    return t.replace('__DICT__', dict_txt) if f.endswith('dict-data.js') else t

FONTS = [('Gowun Batang', 400, 'GowunBatang-400'), ('Gowun Batang', 700, 'GowunBatang-700'), ('Gowun Dodum', 400, 'GowunDodum-400'),
         ('Hahmlet', 600, 'Hahmlet-600'), ('Hahmlet', 700, 'Hahmlet-800'), ('Hahmlet', 800, 'Hahmlet-800'), ('Nanum Brush Script', 400, 'NanumBrush-400')]
def font_css(prefix):
    return ''.join(f"@font-face{{font-family:'{n}';font-weight:{w};font-style:normal;font-display:swap;src:url({prefix}fonts/{f}.woff2) format('woff2')}}\n" for n, w, f in FONTS)

META_PWA = '''<meta name="theme-color" content="#EFE4CC">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="자모게임">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" href="icon-192.png">
<link rel="apple-touch-icon" href="apple-touch-icon.png">'''
GFONT = '''<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Gowun+Batang:wght@400;700&family=Gowun+Dodum&family=Hahmlet:wght@600;800&family=Nanum+Brush+Script&display=swap">'''
MATTER_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/matter-js/0.19.0/matter.min.js'
shell = rd(P('src/index.html'))

def single():
    h = shell.replace('<!--META-->', '').replace('<!--FONTS-->', GFONT)
    h = h.replace('<!--STYLES-->', '<style>\n' + '\n'.join(rd(P('src/css', f)) for f in css_files) + '</style>')
    h = h.replace('<!--SCRIPTS-->', f'<script src="{MATTER_CDN}"></script>\n<script>\n' + '\n'.join(js_text(f) for f in js_files) + '</script>')
    wr(P('dist/jamo.html'), h); print('dist/jamo.html', len(h) // 1024, 'KB')

def pages():
    out = P('docs')
    if os.path.isdir(out): shutil.rmtree(out)
    for f in css_files: shutil.copy(P('src/css', f), os.path.join(out, 'css', f)) if os.makedirs(os.path.join(out, 'css'), exist_ok=True) is None else None
    wr(os.path.join(out, 'css/00-fonts.css'), font_css('../'))
    for f in js_files: wr(os.path.join(out, 'js', f), js_text(f))
    for d in ('fonts', 'vendor'): shutil.copytree(P('public', d), os.path.join(out, d))
    for f in os.listdir(P('public')):
        if os.path.isfile(P('public', f)): shutil.copy(P('public', f), out)
    css_all = ['00-fonts.css'] + css_files
    h = shell.replace('<!--META-->', META_PWA).replace('<!--FONTS-->', '')
    h = h.replace('<!--STYLES-->', '\n'.join(f'<link rel="stylesheet" href="css/{f}">' for f in css_all))
    h = h.replace('<!--SCRIPTS-->', '<script src="vendor/matter.min.js"></script>\n' + '\n'.join(f'<script src="js/{f}"></script>' for f in js_files) +
        "\n<script>if('serviceWorker' in navigator && location.protocol.startsWith('http')) addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{}));</script>")
    wr(os.path.join(out, 'index.html'), h)
    files = ['./', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png', 'vendor/matter.min.js']
    files += ['css/' + f for f in css_all] + ['js/' + f for f in js_files] + ['fonts/' + f for f in sorted(os.listdir(P('public/fonts')))]
    ver = hashlib.sha1(''.join(rd(os.path.join(out, f)) for f in files if f.endswith(('.css', '.js', '.html')) and f != 'vendor/matter.min.js').encode()).hexdigest()[:8]
    wr(os.path.join(out, 'sw.js'), f"""// 오프라인 실행용 서비스 워커. 빌드할 때마다 CACHE 이름이 자동으로 바뀌어요.
const CACHE = 'jamo-{ver}';
const FILES = {files!r};
self.addEventListener('install', e => {{ e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES))); self.skipWaiting(); }});
self.addEventListener('activate', e => {{ e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))); self.clients.claim(); }});
self.addEventListener('fetch', e => {{
  if (e.request.method !== 'GET') return;
  e.respondWith(fetch(e.request).then(r => {{ const c = r.clone(); caches.open(CACHE).then(x => x.put(e.request, c)); return r; }}).catch(() => caches.match(e.request, {{ ignoreSearch: true }})));
}});
""".replace("'", "'"))
    print('docs/ 완료, 캐시 버전', ver)

if '--single' in sys.argv: single()
else: pages(); single()
