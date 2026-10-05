const TOOL_HINT = { eraser: '지울 공을 눌러요', bomb: '폭죽을 터뜨릴 곳을 눌러요', scissors: '나눌 글자 공을 눌러요' };

/* ---------- 입력 ---------- */
function toWorld(e) { const b = cv.getBoundingClientRect(); return { x: (e.clientX - b.left) / b.width * W, y: (e.clientY - b.top) / b.height * H }; }
const clampAim = x => { const r = radOf(kindOf(G.cur || 'ㄱ')); return Math.max(JL + r + 2, Math.min(JR - r - 2, x)); };
let pressing = false;
cv.addEventListener('pointerdown', e => {
  if (!G.playing || G.paused) return;
  audio();
  const p = toWorld(e);
  if (G.tool === 'scissors') { const hit = ballAt(p); if (hit) snip(hit); return; }
  if (G.tool === 'eraser') {
    const hit = ballAt(p);
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
  if (!G.ready || !G.playing || G.paused || !G.cur || G.now < (G.freezeUntil || 0)) return;
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
  const cancelWild = k === 'wild' && G.cur === '★';   // 만능을 쓴 상태면 개수가 0이어도 다시 눌러 취소할 수 있어요
  if (!G.playing || G.paused || (!G.items[k] && !cancelWild)) return;
  audio();
  if (k === 'eraser' || k === 'bomb' || k === 'scissors') { G.tool = G.tool === k ? null : k; }
  else if (k === 'wild') {
    if (G.cur === '★') { G.cur = G.stash; G.stash = null; G.items.wild++; }
    else if (G.cur) { G.stash = G.cur; G.cur = '★'; G.items.wild--; sfx('item'); wildFx(); }
  }
  else if (k === 'shake') {
    G.items.shake--; shakeIt(10); sfx('erase'); G.wobble = G.now; buzz([20, 30, 20, 30, 40]);
    burst((JL + JR) / 2, JB - 8, 18, ['#E9DDC3', '#C8A24E', '#A89880'], 5); float('출렁!', W / 2, 262, 26, '#3F7F77', true);
    for (const b of G.balls) Body.setVelocity(b, { x: (Math.random() - .5) * 9, y: -4 - Math.random() * 8 });
  }
  updateItems();
}
for (const k in ITEMS) $(k).onclick = () => useItem(k);

// 만능: 떨어뜨릴 자리에서 ★이 반짝이며 나타나요
function wildFx() {
  const x = clampAim(G.aimX);
  ring(x, DROPY, 34, '#E8BC52'); ring(x, DROPY, 20, '#FAF4E4');
  if (!reduced) for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2; G.fx.parts.push({ x, y: DROPY, vx: Math.cos(a) * 3.2, vy: Math.sin(a) * 3.2 - 1, r: 3.2, c: i % 2 ? '#EDC565' : '#FAF4E4', t: G.now, life: 700, sq: false, star: true }); }
  G.bumpCur = G.now;
}

// 손가락은 정확하지 않아요: 공 안이 아니어도 가장자리 근처(16)면 가장 가까운 공을 골라요
function ballAt(p) {
  let hit = Query.point(G.balls.filter(b => !b.g.dead), p)[0];
  if (!hit) { let best = 1e9; for (const b of G.balls) { if (b.g.dead) continue; const d = Math.hypot(b.position.x - p.x, b.position.y - p.y) - b.g.r; if (d < 16 && d < best) { best = d; hit = b; } } }
  return hit || null;
}

/* ---------- 가위: 공을 한 단계 풀어요 ----------
   받침 있는 글자 → 받침을 떼요 (강 → 가 + ㅇ, 겂 → 거 + ㅂ + ㅅ)
   받침 없는 글자 → 자음과 모음으로 (가 → ㄱ + ㅏ, 과 → ㄱ + ㅘ)
   겹자음·겹모음 → 둘로 (ㄲ → ㄱ + ㄱ, ㅘ → ㅗ + ㅏ)
   기본 자모(ㄱ, ㅏ)와 만능(★)은 더 나눌 수 없어요 */
function splitOf(ch) {
  const t = typeOf(ch);
  if (t === 'F') { const [l, v, f] = decompose(ch); return [compose(l, v), ...(TSPLIT[f] || [f])]; }
  if (t === 'S') { const [l, v] = decompose(ch); return [l, v]; }
  if (t === 'C' && CSPLIT[ch]) return [CSPLIT[ch], CSPLIT[ch]];
  if (t === 'V' && VSPLIT[ch]) return [...VSPLIT[ch]];
  return null;
}
const SNIP_GRACE = 5000;   // 같은 공에서 나뉜 조각끼리는 이 시간 동안 다시 붙지 않아요(다른 공과는 바로 붙어요)
let snipSeq = 0;
function snip(b) {
  const parts = splitOf(b.g.ch);
  if (!parts) { float('더 나눌 수 없어요', b.position.x, b.position.y - b.g.r - 14, 15, '#7C6B55', true); sfx('tap'); return; }
  const { x, y } = b.position, r0 = b.g.r;
  removeBall(b);
  G.fx.cuts.push({ x, y, r: r0, t: G.now, a: -0.7 + Math.random() * .3 });
  const n = parts.length, sid = ++snipSeq;
  parts.forEach((ch, i) => {
    const ang = -Math.PI / 2 + (i - (n - 1) / 2) * 1.05, k = kindOf(ch), r = radOf(k);
    const px = Math.max(JL + r + 2, Math.min(JR - r - 2, x + Math.cos(ang) * r0 * .55)), py = Math.min(JB - r - 2, y + Math.sin(ang) * r0 * .4);
    const nb = makeBall(ch, px, py, Math.cos(ang) * 2.6, -2.2 - Math.random());
    nb.g.snip = sid; nb.g.snipUntil = G.now + SNIP_GRACE; nb.g.pop = G.now;
  });
  burst(x, y, 14, ['#FAF4E4', '#E9DDC3', FILL[b.g.k] || '#EDC565'], 4.2); ring(x, y, r0 + 10, '#FAF4E4');
  float('싹둑!', x, y - r0 - 16, 22, '#3F7F77', true);
  sfx('snip'); buzz([15, 30, 25]);
  G.items.scissors--; G.tool = null; updateItems();
}
