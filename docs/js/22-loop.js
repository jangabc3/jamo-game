
function step(t) {
  G.now = t;
  const dt = G.last ? Math.min(t - G.last, 100) : 16.7; G.last = t;
  if (G.playing && !G.paused && PERF.cap > 1) { PERF.sum += dt; if (++PERF.n >= 90) { PERF.low = PERF.sum / PERF.n > 26 ? PERF.low + 1 : 0; PERF.n = 0; PERF.sum = 0; if (PERF.low >= 2) { PERF.cap = 1; resize(); } } }
  if (G.engine && G.playing && !G.paused && !(t < (G.freezeUntil || 0))) {
    const slow = t < G.slowUntil ? .35 : 1;
    G.acc += dt * slow; let n = 0;
    while (G.acc >= 1000 / 60 && n < 4) {
      if (t < G.magnetUntil) applyMagnet();
      applyTargetPull(); applyRipePull();
      Engine.update(G.engine, 1000 / 60); processQueue(); G.acc -= 1000 / 60; n++;
    }
    if (n === 4) G.acc = 0;
    for (const b of G.balls) if (b.g.link) { const o = b.g.link; if (o.g.dead || b.g.dead || Math.hypot(b.position.x - o.position.x, b.position.y - o.position.y) > b.g.r + o.g.r + 7) { if (o.g.link === b) o.g.link = null; b.g.link = null; } }
    for (const b of [...G.balls]) if (b.g.ripe && !b.g.dead && t - b.g.ripe > (b.g.hasPartner ? RIPE_PARTNER_MS : RIPE_MS)) singlePop(b);
    if (G.mode === 'auto' && G.ready && G.cur && t - G.lastDrop > 1000) drop();
    if (G.mode === 'shrink') G.danger = Math.min(G.danger + dt * .0012, 340);
    if (G.mode === 'inflate' && t > G.nextGrow) {
      G.nextGrow = t + 3500;
      for (const b of G.balls) if (b.g.grow < 1.27 && !b.g.dead) { Body.scale(b, 1.04, 1.04); b.g.r *= 1.04; b.g.grow *= 1.04; }
    }
    let above = false;
    for (const b of G.balls) if (t - b.g.born > 1300 && b.position.y - b.g.r < G.danger) { above = true; break; }
    if (t < (G.shieldUntil || 0)) above = false;   // 낱말 마법(지진·엄마 …)의 보호막
    if (above && !G.warn) tutHook('warn');
    G.warn = above;
    { let top = 1e9; for (const b of G.balls) if (!b.g.dead && t - b.g.born > 1300) top = Math.min(top, b.position.y - b.g.r); const near = !above && top < G.danger + 70; $('vig').className = above ? 'warn' : near ? 'near' : ''; }
    G.overT = above ? G.overT + dt : 0;
    if (G.overT > 1900) gameOver(false);
    else if (G.mode === 'daily' && !G.cur && !G.seq.length) {
      let still = true; for (const b of G.balls) if (Math.hypot(b.velocity.x, b.velocity.y) > .35) { still = false; break; }
      G.quietT = still ? G.quietT + dt : 0;
      if (G.quietT > 1500 || t - G.lastDrop > 9000) gameOver(true);
    }
  }
  if (shownScore !== G.score) {
    shownScore += Math.max(1, Math.round((G.score - shownScore) * .2));
    if (shownScore > G.score) shownScore = G.score;
    $('score').textContent = shownScore;
    if ((shownScore | 0) % 5 === 0 || shownScore === G.score) applyBg(shownScore);
  }
  if (G.mode !== 'daily') $('best').textContent = G.playing ? Math.max(G.startBest || 0, shownScore) : G.best;
  draw(t);
  requestAnimationFrame(step);
}
