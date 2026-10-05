
/* ---------- 물리 월드 ---------- */
function initWorld() {
  G.engine = Engine.create({ positionIterations: 8, velocityIterations: 6 });
  G.engine.gravity.y = 1.15;
  Composite.add(G.engine.world, [
    Bodies.rectangle(W / 2, JB + 30, W * 2, 60, { isStatic: true, friction: .4 }),
    Bodies.rectangle(JL - 30, H / 2 - 200, 60, H * 2, { isStatic: true, friction: .1 }),
    Bodies.rectangle(JR + 30, H / 2 - 200, 60, H * 2, { isStatic: true, friction: .1 }),
  ]);
  Events.on(G.engine, 'collisionStart', onCollide);
  G.balls = []; G.queue = [];
}
function makeBall(ch, x, y, vx = 0, vy = 0) {
  const k = kindOf(ch), r = radOf(k);
  const b = Bodies.circle(x, y, r, { restitution: .18, friction: .06, frictionAir: .004, density: .0012 });
  b.g = { ch, k, t: typeOf(ch), r, born: G.now, dead: false, ripe: 0, seed: Math.random() * 4000, grow: 1, sq: null };
  Body.setVelocity(b, { x: vx, y: vy });
  Composite.add(G.engine.world, b);
  G.balls.push(b);
  return b;
}
function removeBall(b) { b.g.dead = true; Composite.remove(G.engine.world, b); G.balls = G.balls.filter(x => x !== b); }
function onCollide(e) {
  if (!G.playing) return;
  for (const p of e.pairs) {
    const a = p.bodyA, b = p.bodyB;
    const rel = Math.hypot(a.velocity.x - b.velocity.x, a.velocity.y - b.velocity.y);
    if (rel > 2.6 && !reduced) {
      const amp = Math.min(rel / 14, .3);
      if (a.g && !a.g.dead) a.g.sq = { t: G.now, a: amp };
      if (b.g && !b.g.dead) b.g.sq = { t: G.now, a: amp };
    }
    if (!a.g || !b.g || a.g.dead || b.g.dead) continue;
    const res = rule(a.g, b.g);
    if (!res) continue;
    if (TAP_RARE && res.kind === 'word' && !CORESET.has(res.word)) {   // 흔하지 않은 낱말: 저절로 터지지 않고, 눌러서 확인
      if (!a.g.link && !b.g.link) {
        a.g.link = b; b.g.link = a; a.g.linkW = b.g.linkW = res.word;
        if (!G.hintRare) { G.hintRare = true; float('숨은 낱말! 눌러서 확인', (a.position.x + b.position.x) / 2, Math.min(a.position.y, b.position.y) - 34, 16, '#8A6A1E', true); }
        sfx('hint');
      }
      continue;
    }
    a.g.dead = b.g.dead = true;
    G.queue.push({ a, b, res });
  }
}
function applyMagnet() {
  const live = G.balls.filter(b => !b.g.dead); G.magPairs = [];
  for (let i = 0; i < live.length; i++) for (let j = i + 1; j < live.length; j++) {
    const a = live[i], b = live[j];
    const dx = b.position.x - a.position.x, dy = b.position.y - a.position.y, d = Math.hypot(dx, dy);
    if (d > 230 || d < 1) continue;
    if (!rule(a.g, b.g)) continue;
    if (G.magPairs.length < 8) G.magPairs.push([a, b]);
    const f = 0.0026, nx = dx / d, ny = dy / d;
    Body.applyForce(a, a.position, { x: nx * f * a.mass, y: ny * f * a.mass });
    Body.applyForce(b, b.position, { x: -nx * f * b.mass, y: -ny * f * b.mass });
  }
}

function applyTargetPull() {
  // 목표 단어를 이루는 두 글자 공은 서로 살짝 끌려요
  const words = G.mode === 'daily' ? G.dailyT.filter((_, i) => !G.dailyDone[i]) : (G.target ? [G.target.word] : []);
  for (const w of words) {
    const A = G.balls.filter(b => !b.g.dead && b.g.ch === w[0]), B = G.balls.filter(b => !b.g.dead && b.g.ch === w[1]);
    for (const a of A) for (const b of B) {
      if (a === b) continue;
      const dx = b.position.x - a.position.x, dy = b.position.y - a.position.y, d = Math.hypot(dx, dy);
      if (d < 4 || d > 400) continue;
      const f = 0.0058, nx = dx / d;
      Body.applyForce(a, a.position, { x: nx * f * a.mass, y: 0 });
      Body.applyForce(b, b.position, { x: -nx * f * b.mass, y: 0 });
    }
  }
}
const RIPE_MS = 4500, RIPE_PARTNER_MS = 9500;
function partnersOf(b) {
  const out = [];
  for (const o of G.balls) {
    if (o === b || o.g.dead || (o.g.t !== 'S' && o.g.t !== 'F')) continue;
    if (CORESET.has(b.g.ch + o.g.ch) || CORESET.has(o.g.ch + b.g.ch)) out.push(o);
  }
  return out;
}
function applyRipePull() {
  for (const b of G.balls) {
    if (!b.g.ripe || b.g.dead) continue;
    const ps = partnersOf(b);
    b.g.hasPartner = ps.length > 0;
    for (const o of ps) {
      const dx = o.position.x - b.position.x, d = Math.abs(dx);
      if (d < 4 || d > 420) continue;
      const f = 0.0030 * Math.sign(dx);
      Body.applyForce(b, b.position, { x: f * b.mass, y: 0 });
      Body.applyForce(o, o.position, { x: -f * o.mass, y: 0 });
    }
  }
}
function processQueue() {
  const q = G.queue; G.queue = [];
  for (const { a, b, res } of q) {
    const ra = a.g.r * a.g.r, rb = b.g.r * b.g.r;
    const x = (a.position.x * ra + b.position.x * rb) / (ra + rb), y = (a.position.y * ra + b.position.y * rb) / (ra + rb);
    const vx = (a.velocity.x + b.velocity.x) / 2, vy = (a.velocity.y + b.velocity.y) / 2;
    Composite.remove(G.engine.world, a); Composite.remove(G.engine.world, b);
    G.balls = G.balls.filter(z => z !== a && z !== b);
    if (res.kind === 'merge') {
      const nb = makeBall(res.ch, x, Math.min(y, JB - radOf(kindOf(res.ch)) - 1), vx, vy - 1.5);
      nb.g.pop = G.now;
      const pts = { cv: 2, final: 3, compound: 6, double: 6, same: 1 }[res.tag] || 1;
      addScore(pts, x, y, false);
      ring(x, y, nb.g.r, FILL[nb.g.k]);
      burst(x, y, 8, [FILL[a.g.k], FILL[b.g.k], '#FAF4E4'], 3.2);
      G.chain = G.now - (G.chainT || 0) < 700 ? (G.chain || 1) + 1 : 1; G.chainT = G.now;
      G.maxChain = Math.max(G.maxChain || 0, G.chain);
      if (G.chain >= 3) {
        const c = Math.min(G.chain, 8);
        G.fx.floats = G.fx.floats.filter(f => !String(f.text).startsWith('연쇄')); float('연쇄 ×' + G.chain, x, y - 62, 18 + c * 2, '#3F7F77', true); addScore(G.chain * 2, x, y, true); shakeIt(2 + c);
        ring(x, y, 40 + c * 8, '#3F7F77'); burst(x, y, 10 + c * 3, ['#7DB08C', '#EDC565', '#FAF4E4'], 4 + c * .4);
        if (!reduced) G.bump = { t: G.now, x, y, a: .03 + c * .006 };
        sfx('chain', G.chain); buzz([15, 15, 15 + c * 5]);
      }
      sfx('merge', nb.g.k); if (res.tag === 'cv') tutHook('merge');
      buzz(8);
      // 조립 연출: 자모가 날아와 붙는다 / 받침은 위에서 툭 떨어진다
      if (res.tag === 'final') {
        const cball = a.g.t === 'C' ? a : b;
        fly(cball.g.ch, x + (Math.random() - .5) * 8, y - 78, x, y - 2, 'drop', FILL[cball.g.k]);
        nb.g.sq = { t: G.now + 170, a: .3 };
      } else if (res.tag === 'cv' || res.tag === 'compound' || res.tag === 'double') {
        fly(a.g.ch, a.position.x, a.position.y, x, y, 'in', FILL[a.g.k]);
        fly(b.g.ch, b.position.x, b.position.y, x, y, 'in', FILL[b.g.k]);
      }
      if (res.tag === 'compound') float(res.from.replace('+', ' + ') + ' = ' + res.ch, x, y - 40, 18, '#3F7F77');
      if (res.tag === 'double') float(a.g.ch + ' + ' + b.g.ch + ' = ' + res.ch, x, y - 40, 18, '#B8321F');
      if (nb.g.t === 'F' && SINGLES.has(res.ch)) {
        nb.g.ripe = G.now;
        if (!store.get('gb-hint', '')) { store.set('gb-hint', '1');  }
      }
    } else {
      wordPop(res.word, x, y, [a.g, b.g]);
    }
  }
}
