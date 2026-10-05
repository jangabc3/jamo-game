/* ---------- 낱말 마법 ----------
   숨은 낱말을 만들면 그 낱말의 뜻대로 게임이 반응해요. (폭탄 → 펑, 얼음 → 시간이 느려져요 …)
   power : 게임에 영향을 주는 마법. 연달아 쓰면 쉬어야 해서(쿨타임) 균형이 무너지지 않아요.
   lore  : 연출만 있는 낱말. 훈민정음 서문의 한 구절이 나와요.
   처음 만든 낱말은 도감 '숨은 낱말' 탭에 모이고, 아이템을 하나 선물받아요.
   오늘의 도전에서는 공정하게 겨루도록 마법 효과를 끄고 연출만 보여 줘요. */
const MAGIC = {
  '폭탄': { kind: 'power', fx: 'bomb', desc: '가장 높이 쌓인 곳이 펑 터져요.', hint: '펑 하고 터지는 무기' },
  '자석': { kind: 'power', fx: 'magnet', desc: '4.5초 동안 짝이 맞는 공끼리 끌려와요.', hint: '쇠붙이를 끌어당기는 물건' },
  '지진': { kind: 'power', fx: 'quake', desc: '땅이 흔들려 공들이 튀어올라요.', hint: '땅이 흔들리는 자연재해' },
  '바람': { kind: 'power', fx: 'wind', desc: '공들이 한쪽으로 쓸려가요.', hint: '공기가 움직이는 것' },
  '얼음': { kind: 'power', fx: 'ice', desc: '3초 동안 시간이 느려지고 위험선이 멈춰요.', hint: '물이 얼어서 굳은 것' },
  '번개': { kind: 'power', fx: 'bolt', desc: '가장 높은 공 둘이 번쩍 사라져요.', hint: '비구름에서 번쩍이는 빛' },
  '사랑': { kind: 'power', fx: 'love', desc: '다음 공 3개가 짝이 맞는 글자로 나와요.', hint: '아끼고 소중히 여기는 마음' },
  '엄마': { kind: 'power', fx: 'mom', desc: '포근한 보호막이 7초 동안 지켜 줘요.', hint: '나를 낳아 길러 준 사람' },
  '마법': { kind: 'power', fx: 'magic', desc: '무슨 일이 일어날지는 아무도 몰라요.', hint: '신기한 힘으로 일으키는 조화' },
  '보물': { kind: 'power', fx: 'treasure', desc: '점수 150점을 얻어요.', hint: '아주 귀하고 값진 물건' },
  '세종': { kind: 'lore', quote: '나라의 말이 중국과 달라 글자가 서로 맞지 아니하므로', who: '훈민정음 서문', desc: '꽃잎이 날리며 훈민정음 서문이 나와요.', hint: '한글을 만든 임금님' },
  '훈민': { kind: 'lore', quote: '어리석은 백성이 말하고자 할 바가 있어도 제 뜻을 펴지 못하는 이가 많으니', who: '훈민정음 서문', desc: '꽃잎이 날리며 훈민정음 서문이 나와요.', hint: '백성을 가르친다는 뜻의 말' },
  '정음': { kind: 'lore', quote: '내가 이를 불쌍히 여겨 새로 스물여덟 글자를 만드니', who: '훈민정음 서문', desc: '꽃잎이 날리며 훈민정음 서문이 나와요.', hint: '바른 소리라는 뜻의 말' },
  '한글': { kind: 'lore', quote: '사람마다 쉽게 익혀 날마다 쓰는 데 편안케 하고자 할 따름이니라', who: '훈민정음 서문', desc: '꽃잎이 날리며 훈민정음 서문이 나와요.', hint: '우리나라 고유의 글자' },
};
const MAGIC_WORDS = Object.keys(MAGIC).filter(w => WORDS.has(w));   // 사전에 없는 낱말은 빼요
const MAGIC_CD = 16000;        // 같은 종류의 마법을 연달아 쓸 수 없는 시간(ms)
const MAGIC_LURE = 0.10;       // 새 목표를 고를 때 아직 못 찾은 숨은 낱말을 내줄 확률
const MAGIC_RANDOM = ['bomb', 'magnet', 'wind', 'ice', 'bolt', 'love', 'mom'];
const MAGIC_NAME = { bomb: '폭탄', magnet: '자석', wind: '바람', ice: '얼음', bolt: '번개', love: '사랑', mom: '엄마' };

let magicSeen = {};
try { magicSeen = JSON.parse(store.get('jamo-magic', '{}')) || {}; } catch { magicSeen = {}; }
const magicCount = () => MAGIC_WORDS.filter(w => magicSeen[w]).length;
const magicLeft = () => MAGIC_WORDS.filter(w => !magicSeen[w]);
/* 목표 낱말로 가끔 내줘서, 모르는 사이에 숨은 낱말을 만나게 해요 */
function magicLure() {
  if (G.mode === 'daily' || Math.random() >= MAGIC_LURE) return null;
  const left = magicLeft();
  return left.length ? left[Math.floor(Math.random() * left.length)] : null;
}

/* ---------- 화면 연출 (DOM 레이어) ---------- */
const fxLayer = document.createElement('div');
fxLayer.id = 'fxMagic'; fxLayer.setAttribute('aria-hidden', 'true'); document.body.appendChild(fxLayer);
function domFx(tag, cls, ms, css, html) {
  if (reduced) return null;
  const e = document.createElement(tag); e.className = 'mfx ' + cls;
  if (css) e.style.cssText = css;
  if (html) e.innerHTML = html;
  fxLayer.appendChild(e); setTimeout(() => e.remove(), ms + 200);
  return e;
}
const rnd = (a, b) => a + Math.random() * (b - a);
const stageRect = () => cv.getBoundingClientRect();
const toScreen = (x, y) => { const r = stageRect(); return { x: r.left + x / W * r.width, y: r.top + y / H * r.height }; };
const HEART = '<path d="M12 21s-7.5-4.6-9.6-9.3C.8 8 3 4.5 6.6 4.5c2 0 3.7 1.1 5.4 3 1.7-1.9 3.4-3 5.4-3 3.6 0 5.8 3.5 4.2 7.2C19.5 16.4 12 21 12 21z"/>';
function fxPetals() {
  const cols = ['#F0B7B0', '#F7D2CB', '#E8A3A0', '#FAF4E4', '#F3C9A8'];
  for (let i = 0; i < 26; i++) domFx('i', 'petal', 4600, `left:${rnd(0, 100)}%;--pc:${cols[i % cols.length]};--d:${rnd(2.8, 4.2)}s;--dl:${rnd(0, 1.2)}s;--sx:${rnd(-90, 90)}px;--rot:${rnd(260, 620)}deg;width:${rnd(9, 15)}px;height:${rnd(11, 17)}px`);
}
function fxHearts() {
  const cols = ['#DB6F5C', '#E88A7C', '#C24F3D', '#F0B7B0'];
  for (let i = 0; i < 12; i++) domFx('svg', 'heart', 3600, `left:${rnd(4, 92)}%;--hc:${cols[i % cols.length]};--s:${rnd(18, 34)}px;--d:${rnd(2.2, 3.2)}s;--dl:${rnd(0, .9)}s;--sx:${rnd(-40, 40)}px`, HEART).setAttribute('viewBox', '0 0 24 24');
}
function fxGusts(dir) {
  const r = stageRect();
  for (let i = 0; i < 9; i++) domFx('i', 'gust ' + (dir > 0 ? 'r' : 'l'), 1500, `top:${rnd(r.top + 20, r.bottom - 40)}px;width:${rnd(30, 60)}%;--dl:${rnd(0, .5)}s`);
}
function fxBolt(x, y) {
  const to = toScreen(x, y), r = stageRect(), W2 = innerWidth, H2 = innerHeight;
  let px = to.x + rnd(-24, 24), py = r.top - 10; const pts = [[px, py]];
  const steps = 7;
  for (let i = 1; i < steps; i++) { px = to.x + rnd(-26, 26) * (1 - i / steps); py = (to.y - (r.top - 10)) * i / steps + r.top - 10; pts.push([px, py]); }
  pts.push([to.x, to.y]);
  const s = domFx('svg', 'bolt', 600, '', `<polyline points="${pts.map(p => p.map(Math.round).join(',')).join(' ')}" fill="none" stroke="#FFFDF2" stroke-width="5" stroke-linejoin="round" stroke-linecap="round"/><polyline points="${pts.map(p => p.map(Math.round).join(',')).join(' ')}" fill="none" stroke="#E8BC52" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>`);
  if (s) s.setAttribute('viewBox', `0 0 ${W2} ${H2}`);
}

/* ---------- 효과 ---------- */
const topBalls = n => G.balls.filter(b => !b.g.dead).sort((a, b) => a.position.y - b.position.y).slice(0, n);
const shield = ms => { G.shieldUntil = Math.max(G.shieldUntil || 0, G.now + ms); };
const FX = {
  bomb() {
    const t = topBalls(1)[0];
    explode(t ? t.position.x : W / 2, Math.min(t ? t.position.y + 12 : (JT + JB) / 2, JB - 20));
  },
  magnet() { G.magnetUntil = G.now + 4500; sfx('magnet'); float('자석 ON', W / 2, 262, 24, '#3F7F77', true); updateItems(); },
  quake() {
    shakeIt(16); sfx('quake'); buzz([40, 30, 60, 30, 80]); shield(2600);
    for (const b of G.balls) Body.setVelocity(b, { x: (Math.random() - .5) * 7, y: -3 - Math.random() * 6 });
    ring(W / 2, JB - 6, 150, '#A89880'); burst(W / 2, JB - 8, 22, ['#E9DDC3', '#C8A24E', '#A89880'], 5);
  },
  wind() {
    const dir = Math.random() < .5 ? -1 : 1; sfx('wind'); shield(1800);
    for (const b of G.balls) Body.setVelocity(b, { x: b.velocity.x + dir * rnd(4.5, 6.5), y: b.velocity.y - .6 });
    fxGusts(dir); float(dir > 0 ? '바람 →' : '← 바람', W / 2, 262, 24, '#3F7F77', true);
  },
  ice() { G.slowUntil = G.now + 3200; shield(3200); sfx('ice'); domFx('div', 'frost', 3200, '--d:3.2s'); float('꽁꽁!', W / 2, 262, 28, '#4B86B8', true); },
  bolt() {
    const ts = topBalls(2); sfx('bolt'); shakeIt(8); buzz([30, 20, 70]); domFx('div', 'flash', 420);
    for (const b of ts) {
      const { x, y } = b.position; fxBolt(x, y);
      burst(x, y, 16, ['#FFFDF2', '#E8BC52', '#6C9CC4'], 5.5); ring(x, y, b.g.r + 26, '#E8BC52'); removeBall(b);
    }
    if (ts.length) { addScore(ts.length * 3, W / 2, 250, true); float('번쩍!', W / 2, 262, 30, '#8A6A1E', true); }
  },
  love() { G.loveN = 3; sfx('love'); fxHearts(); float('마음이 통해요', W / 2, 262, 24, '#C24F3D', true); },
  mom() { shield(7000); sfx('love'); domFx('div', 'hug', 7000, '--d:7s'); fxHearts(); float('포근한 보호막', W / 2, 262, 24, '#3F7F77', true); },
  treasure(x, y) { addScore(150, x, y - 30, true); confetti(70); sfx('new'); float('보물 +150', x, y - 56, 26, '#8A6A1E', true); },
};

/* ---------- 마법 카드 ---------- */
let mcTimer = 0;
function showMagicCard(word, tag, note, first) {
  const c = $('magicCard'); if (!c) return;
  const m = MAGIC[word];
  $('mcSeal').textContent = m.kind === 'lore' ? '한글' : '마법';
  $('mcTag').textContent = tag; $('mcWord').textContent = word; $('mcNote').textContent = note;
  c.style.top = Math.round(toScreen(0, JT + 6).y) + 'px';
  c.hidden = false; c.classList.remove('out', 'in', 'first'); void c.offsetWidth;
  c.classList.add('in'); c.classList.toggle('first', first);
  clearTimeout(mcTimer);
  mcTimer = setTimeout(() => { c.classList.add('out'); mcTimer = setTimeout(() => { c.hidden = true; }, 380); }, first ? 3400 : 2500);
}

function castMagic(word, x, y) {
  const m = MAGIC[word]; if (!m || !G.playing) return;
  const first = !magicSeen[word], daily = G.mode === 'daily';
  magicSeen[word] = (magicSeen[word] || 0) + 1;
  store.set('jamo-magic', JSON.stringify(magicSeen));
  let tag = first ? '숨은 낱말 발견! ' + magicCount() + '/' + MAGIC_WORDS.length : '숨은 낱말', note = m.desc;
  if (m.kind === 'power') {
    const cooling = !first && G.now - (G.magicAt || -1e9) < MAGIC_CD;
    if (daily) { note = '오늘의 도전에서는 마법이 잠들어 있어요.'; tag += ' · 효과 없음'; }
    else if (cooling) { note = '마법이 쉬고 있어요 · ' + Math.ceil((MAGIC_CD - (G.now - G.magicAt)) / 1000) + '초 뒤에 다시'; tag += ' · 쉬는 중'; }
    else {
      G.magicAt = G.now;
      let fx = m.fx;
      if (fx === 'magic') { fx = MAGIC_RANDOM[Math.floor(Math.random() * MAGIC_RANDOM.length)]; note = '마법이 「' + MAGIC_NAME[fx] + '」을 불러냈어요!'; }
      sfx('magic'); FX[fx](x, y);
    }
  } else {
    note = '“' + m.quote + '”'; tag = (first ? '숨은 낱말 발견! ' + magicCount() + '/' + MAGIC_WORDS.length + ' · ' : '') + m.who;
    fxPetals(); sfx('magic');
  }
  if (first) {
    G.foundNow.push(word);
    sfx('discover'); confetti(reduced ? 0 : 46); buzz([30, 40, 60]);
    if (!daily) setTimeout(() => { if (G.playing) earnItem(); }, 600);
    if (magicCount() === MAGIC_WORDS.length) setTimeout(() => { if (G.playing) { float('숨은 낱말을 모두 찾았어요!', W / 2, 220, 22, '#B8321F', true); confetti(reduced ? 0 : 110); sfx('new'); } }, 1800);
  }
  showMagicCard(word, tag, note, first);
}
