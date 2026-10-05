const TOOL_HINT = { eraser: '지울 공을 눌러요', bomb: '폭탄을 터뜨릴 곳을 눌러요' };

/* ---------- 입력 ---------- */
function toWorld(e) { const b = cv.getBoundingClientRect(); return { x: (e.clientX - b.left) / b.width * W, y: (e.clientY - b.top) / b.height * H }; }
const clampAim = x => { const r = RAD[kindOf(G.cur || 'ㄱ')]; return Math.max(JL + r + 2, Math.min(JR - r - 2, x)); };
let pressing = false;
cv.addEventListener('pointerdown', e => {
  if (!G.playing || G.paused) return;
  audio();
  const p = toWorld(e);
  if (G.tool === 'eraser') {
    const hit = Query.point(G.balls.filter(b => !b.g.dead), p)[0];
    if (hit) {
      removeBall(hit); burst(hit.position.x, hit.position.y, 14, ['#FAF4E4', '#E9DDC3', FILL[hit.g.k]], 4); ring(hit.position.x, hit.position.y, hit.g.r + 10, '#FAF4E4');
      sfx('erase'); G.items.eraser--; G.tool = null; updateItems();
    }
    return;
  }
  if (G.tool === 'bomb') {
    if (p.y < JT - 10) return;
    explode(p.x, Math.min(p.y, JB - 20));
    G.items.bomb--; G.tool = null; updateItems();
    return;
  }
  const linkHit = G.balls.find(b => b.g.link && !b.g.dead && !b.g.link.g.dead && Math.hypot(b.position.x - p.x, b.position.y - p.y) < b.g.r + 8);
  if (linkHit) { const o = linkHit.g.link; const w = linkHit.g.linkW; linkHit.g.dead = o.g.dead = true; linkHit.g.link = o.g.link = null; G.queue.push({ a: linkHit, b: o, res: { kind: 'word', word: w } }); return; }
  const ripeHit = G.balls.find(b => b.g.ripe && !b.g.dead && Math.hypot(b.position.x - p.x, b.position.y - p.y) < b.g.r + 8);
  if (ripeHit) { singlePop(ripeHit); return; }
  cv.setPointerCapture(e.pointerId); pressing = true; G.aimX = clampAim(p.x);
});
cv.addEventListener('pointermove', e => { if (G.playing && !G.paused && !G.tool) G.aimX = clampAim(toWorld(e).x); });
cv.addEventListener('pointerup', () => { if (!pressing) return; pressing = false; if (G.mode !== 'auto') drop(); });
cv.addEventListener('pointercancel', () => { pressing = false; });

function explode(x, y) {
  const R = 78;
  let n = 0;
  for (const b of [...G.balls]) {
    if (Math.hypot(b.position.x - x, b.position.y - y) < R + b.g.r * .5) { burst(b.position.x, b.position.y, 8, ['#FAF4E4', '#E8BC52', FILL[b.g.k]], 4.5); removeBall(b); n++; }
  }
  ring(x, y, R, '#6FA37E'); ring(x, y, R * .6, '#FAF4E4'); ring(x, y, R * 1.2, '#B8321F');
  burst(x, y, 30, ['#6FA37E', '#B8321F', '#E8BC52', '#FAF4E4'], 7);
  shakeIt(14); sfx('bomb'); buzz([60, 30, 90]);
  if (n) { addScore(n * 2, x, y, true); float('펑! ' + n + '개', x, y - 20, 30, '#B8321F', true); }
  if (!reduced) G.bump = { t: G.now, x, y, a: .05 };
  // 폭발 바람: 남은 공을 살짝 밀어낸다
  for (const b of G.balls) {
    const dx = b.position.x - x, dy = b.position.y - y, d = Math.hypot(dx, dy) || 1;
    if (d < 190) Body.setVelocity(b, { x: b.velocity.x + dx / d * (190 - d) * .03, y: b.velocity.y + dy / d * (190 - d) * .03 - 1 });
  }
}

function drop() {
  if (!G.ready || !G.playing || G.paused || !G.cur) return;
  const wasWild = G.cur === '★';
  const b = makeBall(G.cur, clampAim(G.aimX), DROPY, 0, 2);
  b.g.pop = G.now; G.lastDrop = G.now;
  sfx('drop'); tutHook('drop');
  if (wasWild) { G.cur = G.stash; G.stash = null; }
  else { G.cur = G.next; G.next = G.next2; G.next2 = genJamo(); setNext(); }
  G.ready = false;
  updateItems();
  setTimeout(() => { G.ready = true; }, 380);
}

function useItem(k) {
  if (!G.playing || G.paused || !G.items[k]) return;
  audio();
  if (k === 'eraser' || k === 'bomb') { G.tool = G.tool === k ? null : k; }
  else if (k === 'wild') {
    if (G.cur === '★') { G.cur = G.stash; G.stash = null; G.items.wild++; }
    else if (G.cur) { G.stash = G.cur; G.cur = '★'; G.items.wild--; sfx('item'); }
  }
  else if (k === 'magnet') { G.items.magnet--; G.magnetUntil = G.now + 4500; sfx('magnet'); float('자석 ON', W / 2, 262, 26, '#3F7F77', true); }
  else if (k === 'shake') {
    G.items.shake--; shakeIt(10); sfx('erase');
    for (const b of G.balls) Body.setVelocity(b, { x: (Math.random() - .5) * 9, y: -4 - Math.random() * 8 });
  }
  updateItems();
}
for (const k in ITEMS) $(k).onclick = () => useItem(k);
