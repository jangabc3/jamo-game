
/* ---------- 다음 글자 ---------- */
const CW = { 'ㄱ': 9, 'ㄴ': 8, 'ㄷ': 6, 'ㄹ': 7, 'ㅁ': 6, 'ㅂ': 6, 'ㅅ': 8, 'ㅇ': 9, 'ㅈ': 6, 'ㅊ': 3, 'ㅋ': 2, 'ㅌ': 2, 'ㅍ': 2, 'ㅎ': 4 };
const VWT = { 'ㅏ': 10, 'ㅓ': 7, 'ㅗ': 8, 'ㅜ': 8, 'ㅡ': 5, 'ㅣ': 9, 'ㅐ': 3, 'ㅔ': 2, 'ㅑ': 2, 'ㅕ': 2, 'ㅛ': 1, 'ㅠ': 1 };
const pickW = (w, rnd = Math.random) => { let s = 0; for (const k in w) s += w[k]; let r = rnd() * s; for (const k in w) { r -= w[k]; if (r <= 0) return k; } return Object.keys(w)[0]; };
const basicOf = j => VSPLIT[j] ? VSPLIT[j][Math.floor(Math.random() * 2)] : (CSPLIT[j] || j);
let CORE_FIRST = null;
function coreFirst(c) {
  if (!CORE_FIRST) { CORE_FIRST = {}; for (const w of CORE) (CORE_FIRST[w[0]] = CORE_FIRST[w[0]] || []).push(w); }
  return CORE_FIRST[c] || [];
}
function newTarget() {
  const lure = magicLure();
  if (lure) { G.target = { word: lure, queue: [...piecesOf(lure[0]), ...piecesOf(lure[1])], idle: 0 }; return; }
  if (G.need && G.mode !== 'daily') {
    const ws = coreFirst(G.need).filter(w => WORDS.has(w));
    if (ws.length && Math.random() < 0.8) {
      const w = ws[Math.floor(Math.random() * ws.length)];
      const have = G.balls.some(b => !b.g.dead && b.g.ch === G.need && (b.g.t === 'S' || b.g.t === 'F'));
      G.target = { word: w, queue: have ? piecesOf(w[1]) : [...piecesOf(w[0]), ...piecesOf(w[1])], idle: 0 };
      return;
    }
  }
  const syls = G.balls.filter(b => !b.g.dead && (b.g.t === 'S' || b.g.t === 'F')).map(b => b.g.ch);
  const cands = [];
  for (const s of syls) for (const p of CPARTNERS[s] || []) cands.push([s, p]);
  if (cands.length && Math.random() < 0.85) {
    const [have, need] = cands[Math.floor(Math.random() * cands.length)];
    G.target = { word: WORDS.has(have + need) ? have + need : need + have, queue: piecesOf(need), idle: 0 };
  } else {
    const w = SIMPLE_WORDS[Math.floor(Math.random() * SIMPLE_WORDS.length)];
    G.target = { word: w, queue: [...piecesOf(w[0]), ...piecesOf(w[1])], idle: 0 };
  }
}
/* 난이도: 급수가 오를수록 필요한 글자를 덜 도와줘요. 숫자를 키우면 쉬워지고 줄이면 어려워져요.
   steer  = 목표 낱말에 필요한 글자를 그대로 내줄 확률
   helper = 그릇 안 글자와 어울리는 글자를 내줄 확률 */
const DIFF = { steer: [0.70, 0.60, 0.50, 0.42, 0.34], helper: [0.32, 0.26, 0.20, 0.15, 0.10] };
const rankIdxOf = sc => { let i = 0; while (i + 1 < RANKS.length && sc >= RANKS[i + 1][0]) i++; return i; };
const diffAt = k => DIFF[k][rankIdxOf(G.score)];
/* 급수가 오르면 그릇 안 어떤 글자와도 합쳐지지 않는 글자를 일부러 섞어요. 그릇이 더 빨리 차서 아이템과 배치를 아껴 써야 해요.
   숫자는 '내줄 때마다 이 확률로 방해 글자'예요. 0이면 끄고, 키우면 어려워져요. */
const DUD = [0, 0.10, 0.20, 0.30, 0.40];
function dudJamo(live) {
  for (let k = 0; k < 10; k++) {
    const c = Math.random() < 0.5 ? pickW(CW) : pickW(VWT), A = { ch: c, t: typeOf(c) };
    if (!live.some(b => rule(A, b.g))) return c;
  }
  return null;
}
function genJamo() {
  if (G.mode === 'daily') return G.seq.length ? G.seq.shift() : null;
  if (!G.target) newTarget();
  const tg = G.target, love = G.loveN > 0 ? (G.loveN--, true) : false;   // 사랑 마법: 짝이 맞는 글자만
  if (tg.queue.length && Math.random() < (love ? 1 : G.easy ? 0.88 : diffAt('steer'))) return tg.queue.shift();
  if (!tg.queue.length && ++tg.idle > 7) newTarget();
  const live = G.balls.filter(b => !b.g.dead);
  const freeC = live.filter(b => b.g.t === 'C').length, freeV = live.filter(b => b.g.t === 'V').length;
  const syls = live.filter(b => b.g.t === 'S' || b.g.t === 'F');
  const r = Math.random();
  if (syls.length && r < (love ? 1 : G.easy ? 0.35 : diffAt('helper'))) {
    const s = syls[Math.floor(Math.random() * syls.length)].g;
    if (s.t === 'S' && Math.random() < 0.35) {
      const [l, v] = decompose(s.ch);
      const opts = [...FINAL_OK].filter(t => SINGLES.has(compose(l, v, t)) && !CSPLIT[t]);
      if (opts.length) return opts[Math.floor(Math.random() * opts.length)];
    }
    const ps = CPARTNERS[s.ch];
    if (ps && ps.length) {
      const p = ps[Math.floor(Math.random() * ps.length)];
      const [l, v, t] = decompose(p);
      const pool = [l, v]; if (t) pool.push(t);
      return basicOf(pool[Math.floor(Math.random() * pool.length)]);
    }
  }
  if (!G.easy && live.length > 3 && Math.random() < DUD[rankIdxOf(G.score)]) { const d = dudJamo(live); if (d) return d; }
  if (freeC - freeV >= 2) return pickW(VWT);
  if (freeV - freeC >= 2) return pickW(CW);
  return Math.random() < 0.55 ? pickW(CW) : pickW(VWT);
}
function buildDaily(key) {
  const rnd = mulberry32(key * 7919 + 13);
  // 오늘의 단어는 받침 없는 쉬운 단어 위주 (자모 4개), 가끔 받침 한 개
  const easy = [...SIMPLE_WORDS].filter(w => piecesOf(w[0]).length + piecesOf(w[1]).length <= 4).sort();
  const mid = [...SIMPLE_WORDS].filter(w => piecesOf(w[0]).length + piecesOf(w[1]).length === 5).sort();
  const targets = [];
  while (targets.length < 8) {
    const pool = targets.length >= 5 && mid.length ? mid : easy;
    const w = pool[Math.floor(rnd() * pool.length)];
    if (!targets.includes(w)) targets.push(w);
  }
  const seq = [];
  for (const w of targets) { seq.push(...piecesOf(w[0]), ...piecesOf(w[1])); seq.push(pickW(CW, rnd), pickW(VWT, rnd)); }
  return { targets, seq };
}
