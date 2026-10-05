
/* ---------- 무대 ---------- */
const W = 400, H = 548, JL = 22, JR = 378, JT = 112, JB = 528, DANGER0 = 150, DROPY = 66, INK = '#3A2D24';
const RAD = { C: 15, V: 15, C2: 17.5, V2: 17.5, S: 23, F: 27, W: 24 };
const FILL = { C: '#DB6F5C', C2: '#C24F3D', V: '#6C9CC4', V2: '#40709C', S: '#EDC565', F: '#7DB08C', W: '#FAF4E4' };
const kindOf = ch => { const t = typeOf(ch); if (t === 'W') return 'W'; if (t === 'C') return CSPLIT[ch] ? 'C2' : 'C'; if (t === 'V') return VSPLIT[ch] ? 'V2' : 'V'; return t; };
const MODES = {
  normal: ['일반', '끝없이 이어지는 기본 모드예요.'],
  auto: ['자동 낙하', '공이 알아서 떨어져요. 위치만 정해요!'],
  shrink: ['위험선 하강', '위험선이 천천히 내려와요. 서둘러요!'],
  inflate: ['공 팽창', '공이 시간이 지날수록 부풀어요.'],
  daily: ['같은 공 대결', ''],
};
const ITEMS = { eraser: '지우개', bomb: '폭탄', wild: '만능', magnet: '자석', shake: '흔들기' };

const G = {
  engine: null, balls: [], queue: [], fx: { parts: [], rings: [], floats: [], fly: [] }, shake: { t: 0, m: 0 },
  mode: 'normal', score: 0, best: 0, startBest: 0, recordHit: false, combo: 0, lastPop: 0, wordsMade: 0, topWord: null, topPts: 0,
  cur: 'ㄱ', next: 'ㅏ', aimX: W / 2, ready: true, playing: false, over: false, overT: 0, warn: false, paused: false,
  items: { eraser: 1, bomb: 1, wild: 1, magnet: 1, shake: 1 }, tool: null, stash: null, magnetUntil: 0,
  cont: 1, scale: 1, dpr: 1, acc: 0, last: 0, now: 0, danger: DANGER0, lastDrop: 0, nextGrow: 0,
  slowUntil: 0, bump: null, banner: null, seq: [], dailyT: [], dailyDone: [], quietT: 0, target: null, deco: [],
};
const theme = { deco: 'petal' };
function initDeco() {
  G.deco = [];
  for (let i = 0; i < 22; i++) G.deco.push({ x: Math.random() * W, y: Math.random() * H, s: .5 + Math.random(), p: Math.random() * 6.28, v: .25 + Math.random() * .5 });
}
function applyBg() {}
const bestKey = () => G.mode === 'normal' ? 'jamo-best' : 'jamo-best-' + G.mode;
function loadBest() { G.best = parseInt(store.get(bestKey(), '0'), 10) || 0; }
