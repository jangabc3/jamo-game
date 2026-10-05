
/* ---------- 모드 / 시작 화면 ---------- */
let pickMode = store.get('jamo-mode', 'normal');
if (!MODES[pickMode] || pickMode === 'daily') pickMode = 'normal';
function selectMode(m) {
  pickMode = m; store.set('jamo-mode', m);
  for (const b of $('modes').children) b.setAttribute('aria-pressed', String(b.dataset.m === m));
  const prev = G.mode; G.mode = m; loadBest(); G.mode = prev;
  $('modeHint').textContent = MODES[m][1] + (G.best ? '  최고 ' + G.best : '');
  $('best').textContent = G.best;
}
for (const b of $('modes').children) b.onclick = () => selectMode(b.dataset.m);

const VS = { key: 0, friend: 0 };
(function () {
  try {
    const q = new URLSearchParams(location.search), v = +q.get('v'), sc = +q.get('s');
    if (v >= 20240101 && v <= 20991231 && sc >= 0 && sc < 1e7) { VS.key = v; VS.friend = sc | 0; }
    if (q.has('v')) history.replaceState(null, '', location.pathname);
  } catch {}
})();
const vsKey = () => VS.key || dayInfo().key;
const vsBest = () => { try { return (JSON.parse(store.get('jamo-vs', '{}')) || {})[vsKey()] || 0; } catch { return 0; } };
function vsSave(sc) { try { const o = JSON.parse(store.get('jamo-vs', '{}')) || {}; const k = vsKey(); if (sc > (o[k] || 0)) o[k] = sc; const ks = Object.keys(o).sort().slice(-30); const n = {}; ks.forEach(x => n[x] = o[x]); store.set('jamo-vs', JSON.stringify(n)); } catch {} }
function vsLink() { try { return location.origin + location.pathname + '?v=' + vsKey() + '&s=' + G.score; } catch { return ''; } }
function dailyState() { try { const d = JSON.parse(store.get('jamo-daily', 'null')); return d && d.key === dayInfo().key ? d : null; } catch { return null; } }
function refreshDailyBtn() {
  const b = vsBest(), btn = $('dailyBtn'); btn.hidden = !ENABLE_VS && !VS.friend;
  btn.textContent = VS.friend ? '친구와 대결' : '같은 공 대결';
  const n = $('vsNote'); if (n) n.textContent = VS.friend ? '친구가 ' + VS.friend + '점을 냈어요. 똑같은 공이 나와요. 이길 수 있을까요?' : '';
  if (n) n.hidden = !VS.friend;
}
