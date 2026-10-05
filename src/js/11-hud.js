
/* ---------- 점수/HUD ---------- */
// ---- 움직임 도우미 ----
function restart(el, cls) { if (!el || reduced) return; el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); }
function countUp(el, to, ms = 700, fmt = v => v) {
  if (reduced || !(to > 0)) { el.textContent = fmt(to); return; }
  const t0 = performance.now();
  (function tick(now) {
    const k = Math.min(1, (now - t0) / ms), e = 1 - Math.pow(1 - k, 3);
    el.textContent = fmt(Math.round(to * e));
    if (k < 1) requestAnimationFrame(tick);
  })(t0);
}
let shownScore = 0;
function addScore(pts, x, y, big) {
  G.score += pts; updateRank(true); restart($('score'), 'pop');
  if (!big) float('+' + pts, x, y - 6, 15, '#857663');
  if (G.mode !== 'daily' && G.score > G.best) { G.best = G.score; store.set(bestKey(), String(G.best)); }
}
function paintNext(el, ch, small) {
  el.textContent = ch || '·'; el.style.background = ch ? FILL[kindOf(ch)] : '#E6D8B8';
  el.style.color = ch && ['C','C2','V','V2'].includes(kindOf(ch)) ? '#FAF4E4' : '#1F1B18';
}
function setNext() {
  paintNext($('next2'), G.next2);
  const n = $('next'); n.textContent = G.next || '·'; n.style.background = G.next ? FILL[kindOf(G.next)] : '#E6D8B8'; n.style.color = G.next && ['C','C2','V','V2'].includes(kindOf(G.next)) ? '#FAF4E4' : '#1F1B18';
  n.style.transform = 'scale(1.2)'; setTimeout(() => n.style.transform = '', 160);
  const n2 = $('next2'); n2.style.transform = 'translateX(6px)'; setTimeout(() => n2.style.transform = '', 160); $('next2').style.visibility = G.next2 || G.playing ? 'visible' : 'hidden';
}
function updateMeter() {
  const m = $('meter'); if (!m) return;
  const full = Object.keys(ITEMS).every(k => G.items[k] >= 3), n = (G.cm || 0) % 3;
  [...m.querySelectorAll('.pips i')].forEach((e, i) => e.classList.toggle('on', !full && i < n));
  m.classList.toggle('full', full);
  if (n === 0 && (G.cm || 0) > 0 && !full) restart(m, 'earned');
  $('meterT').textContent = full ? '아이템이 가득 찼어요' : '낱말 ' + (3 - n) + '개 더 만들면 아이템 +1';
}
function updateItems() {
  updateMeter();
  for (const k in ITEMS) {
    const el = $(k);
    el.querySelector('i').textContent = G.items[k];
    el.disabled = (!G.items[k] && !(k === 'wild' && G.cur === '★')) || !G.playing || G.paused;
    el.classList.toggle('on', G.tool === k || (k === 'wild' && G.cur === '★') || (k === 'magnet' && G.now < G.magnetUntil));
  }
}
