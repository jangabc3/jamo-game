
function draw(t) {
  ctx.setTransform(G.dpr * G.scale, 0, 0, G.dpr * G.scale, 0, 0);
  ctx.clearRect(0, 0, W, H);
  let sx = 0, sy = 0;
  const sk = t - G.shake.t;
  if (sk < 280) { const k = (1 - sk / 280) * G.shake.m; sx = (Math.random() - .5) * k; sy = (Math.random() - .5) * k; }
  drawDeco(t);
  ctx.save(); ctx.translate(sx, sy);
  if (G.bump) {
    const k = (t - G.bump.t) / 520;
    if (k >= 1) G.bump = null; else { const z = 1 + G.bump.a * Math.sin(Math.PI * Math.min(k * 1.4, 1)) * (1 - k * .5); ctx.translate(G.bump.x, G.bump.y); ctx.scale(z, z); ctx.translate(-G.bump.x, -G.bump.y); }
  }

  // 그릇: 한지 위 원고지 칸
  ctx.save(); ctx.translate(3, 4); rr(JL - 6, JT - 18, JR - JL + 12, JB - JT + 24, 16); ctx.closePath(); ctx.fillStyle = 'rgba(58,45,36,.16)'; ctx.fill(); ctx.restore();
  rr(JL - 6, JT - 18, JR - JL + 12, JB - JT + 24, 16); ctx.closePath(); ctx.fillStyle = '#FAF4E4'; ctx.fill();
  ctx.save(); ctx.beginPath(); ctx.rect(JL, JT, JR - JL, JB - JT); ctx.clip();
  const cell = (JR - JL) / 8;
  ctx.strokeStyle = 'rgba(90,58,38,.17)'; ctx.lineWidth = 1.2; ctx.beginPath();
  for (let i = 1; i < 8; i++) { const xx = JL + i * cell; ctx.moveTo(xx, JT); ctx.lineTo(xx, JB); }
  for (let yy = JB - cell; yy > JT; yy -= cell) { ctx.moveTo(JL, yy); ctx.lineTo(JR, yy); }
  ctx.stroke();
  if (G.mode === 'shrink' && G.playing) { ctx.fillStyle = 'rgba(194,57,43,.08)'; ctx.fillRect(JL, JT, JR - JL, G.danger - JT); }
  ctx.restore();
  // 위험선
  const warnA = G.warn ? .55 + .45 * Math.sin(t / 90) : .35;
  ctx.save(); ctx.setLineDash([9, 7]); ctx.lineWidth = 2; ctx.strokeStyle = G.warn ? `rgba(194,57,43,${warnA})` : 'rgba(31,27,24,.25)';
  ctx.beginPath(); ctx.moveTo(JL + 4, G.danger); ctx.lineTo(JR - 4, G.danger); ctx.stroke(); ctx.restore();

  // 조준
  if (G.playing && !G.tool && G.cur) {
    const r = RAD[kindOf(G.cur)], x = clampAim(G.aimX);
    ctx.save(); ctx.setLineDash([2, 8]); ctx.lineCap = 'round'; ctx.lineWidth = 2.5; ctx.strokeStyle = 'rgba(58,45,36,.28)';
    ctx.beginPath(); ctx.moveTo(x, DROPY + r + 6); ctx.lineTo(x, JB - 6); ctx.stroke(); ctx.restore();
    const bob = Math.sin(t / 260) * 2.5;
    drawBall(x, DROPY + bob, r, { ch: G.cur, k: kindOf(G.cur), t: typeOf(G.cur), seed: 0 }, 1, 1, G.ready ? 1 : .45, t);
    if (G.mode === 'auto' && !G.paused) {
      const k = Math.min((t - G.lastDrop) / 1000, 1);
      ctx.save(); ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.strokeStyle = '#B8321F'; ctx.beginPath(); ctx.arc(x, DROPY + bob, r + 7, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * k); ctx.stroke(); ctx.restore();
    }
  }

  // 힌트: 지금 공과 합쳐질 수 있는 공
  if (hintOn && G.playing && !G.paused && !G.tool && G.cur && G.ready) {
    const cur = { ch: G.cur, t: typeOf(G.cur) }, pu = .5 + .5 * Math.sin(t / 300);
    ctx.save(); ctx.lineWidth = 2.5; ctx.setLineDash([5, 5]); ctx.lineDashOffset = -t / 60;
    for (const b of G.balls) {
      if (b.g.dead || b.g.pop) continue;
      const r = rule(cur, b.g); if (!r) continue;
      ctx.globalAlpha = .35 + .35 * pu; ctx.strokeStyle = r.kind === 'word' ? '#B8321F' : '#3F7F77';
      ctx.beginPath(); ctx.arc(b.position.x, b.position.y, b.g.r + 5, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.restore();
  }
  if (G.need && G.playing && !G.paused) {
    ctx.save(); ctx.lineWidth = 3; ctx.strokeStyle = '#C8A24E'; ctx.globalAlpha = .6 + .3 * Math.sin(t / 220);
    for (const b of G.balls) if (!b.g.dead && b.g.ch === G.need && (b.g.t === 'S' || b.g.t === 'F')) { ctx.beginPath(); ctx.arc(b.position.x, b.position.y, b.g.r + 8, 0, Math.PI * 2); ctx.stroke(); }
    ctx.restore();
  }
  // 숨은 낱말 연결선
  for (const b of G.balls) if (b.g.link && !b.g.dead) {
    const o = b.g.link; const pulse = .55 + .35 * Math.sin(t / 160);
    ctx.save(); ctx.strokeStyle = '#D19A1F'; ctx.lineWidth = 3.5; ctx.globalAlpha = pulse; ctx.beginPath(); ctx.arc(b.position.x, b.position.y, b.g.r + 5, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
  }
  // 공
  for (const b of G.balls) {
    const g = b.g; let s = 1;
    if (g.pop) { const k = Math.min((t - g.pop) / 300, 1); s = reduced ? 1 : .45 + .55 * easeBack(k); }
    if (g.ripe) {
      const len = g.hasPartner ? RIPE_PARTNER_MS : RIPE_MS, kk = Math.min((t - g.ripe) / len, 1);
      s *= 1 + (reduced ? 0 : .035 * Math.sin(t / 150));
      ctx.save(); ctx.globalAlpha = .35 + .25 * Math.sin(t / 200); ctx.beginPath(); ctx.arc(b.position.x, b.position.y, g.r + 7, 0, Math.PI * 2);
      ctx.lineWidth = 5; ctx.strokeStyle = '#E8BC52'; ctx.stroke(); ctx.restore();
    }
    let [qx, qy] = squashOf(g, t, b.velocity.y);
        drawBall(b.position.x, b.position.y, g.r, g, s * qx, s * qy, 1, t);
    if (g.ripe) {
      const len = g.hasPartner ? RIPE_PARTNER_MS : RIPE_MS, kk = Math.min((t - g.ripe) / len, 1);
      ctx.save(); ctx.lineCap = 'round'; ctx.lineWidth = 3; ctx.strokeStyle = '#B8321F';
      ctx.beginPath(); ctx.arc(b.position.x, b.position.y, g.r + 5, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (1 - kk)); ctx.stroke(); ctx.restore();
    }
    if (G.mode === 'inflate' && g.grow > 1.02) { ctx.save(); ctx.globalAlpha = .35; ctx.lineWidth = 2; ctx.strokeStyle = '#B8321F'; ctx.beginPath(); ctx.arc(b.position.x, b.position.y, g.r + 3, 0, Math.PI * 2); ctx.stroke(); ctx.restore(); }
  }

  // 그릇 테두리 (공 위에): 이중선
  ctx.save(); rr(JL - 6, JT - 18, JR - JL + 12, JB - JT + 24, 16);
  ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.lineJoin = 'round'; ctx.lineCap = 'butt'; ctx.stroke();
  rr(JL - 11, JT - 18, JR - JL + 22, JB - JT + 29, 20);
  ctx.lineWidth = 1; ctx.stroke(); ctx.restore();

  // 자석 필드
  if (t < G.magnetUntil && G.playing) {
    ctx.save(); ctx.globalAlpha = .08 + .05 * Math.sin(t / 120); ctx.fillStyle = '#2F5F8A'; ctx.fillRect(JL, JT, JR - JL, JB - JT); ctx.restore();
  }

  // 효과
  G.fx.rings = G.fx.rings.filter(f => t - f.t < 420);
  for (const f of G.fx.rings) { const k = (t - f.t) / 420; ctx.save(); ctx.globalAlpha = 1 - k; ctx.lineWidth = 6 * (1 - k) + 1; ctx.strokeStyle = f.color; ctx.beginPath(); ctx.arc(f.x, f.y, f.r * (.6 + k * 1.1), 0, Math.PI * 2); ctx.stroke(); ctx.restore(); }
  G.fx.fly = G.fx.fly.filter(f => t - f.t < f.dur + 40);
  for (const f of G.fx.fly) {
    const k = Math.min((t - f.t) / f.dur, 1);
    let x, y, s = 1;
    if (f.kind === 'drop') { const e = k * k; x = f.x0 + (f.x1 - f.x0) * e; y = f.y0 + (f.y1 - f.y0) * e; s = 1 + .2 * (1 - k); }
    else { const e = easeOut(k); x = f.x0 + (f.x1 - f.x0) * e; y = f.y0 + (f.y1 - f.y0) * e; s = 1 - .35 * k; }
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.globalAlpha = k < .8 ? 1 : (1 - k) / .2;
    ctx.font = `700 26px ${F_GLYPH}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineWidth = 5; ctx.strokeStyle = '#FAF4E4'; ctx.lineJoin = 'round'; ctx.strokeText(f.ch, 0, 0);
    ctx.fillStyle = INK; ctx.fillText(f.ch, 0, 0); ctx.restore();
  }
  G.fx.parts = G.fx.parts.filter(p => t - p.t < p.life);
  for (const p of G.fx.parts) {
    p.vy += .18; p.x += p.vx; p.y += p.vy; p.vx *= .985;
    const k = (t - p.t) / p.life;
    ctx.save(); ctx.globalAlpha = 1 - k; ctx.fillStyle = p.c;
    if (p.star) { ctx.translate(p.x, p.y); ctx.rotate(k * 5); ctx.beginPath(); for (let i = 0; i < 10; i++) { const rr2 = (i % 2 ? .45 : 1) * p.r * 1.7 * (1 - k * .3), an = i * Math.PI / 5 - Math.PI / 2; ctx.lineTo(Math.cos(an) * rr2, Math.sin(an) * rr2); } ctx.closePath(); ctx.fill(); ctx.stroke(); }
    else if (p.sq) { ctx.translate(p.x, p.y); ctx.rotate(k * 8); ctx.fillRect(-p.r, -p.r * .6, p.r * 2, p.r * 1.2); }
    else { ctx.beginPath(); ctx.arc(p.x, p.y, p.r * (1 - k * .4), 0, Math.PI * 2); ctx.fill(); }
    ctx.restore();
  }
  G.fx.floats = G.fx.floats.filter(f => t - f.t < (f.big ? 1100 : 700));
  for (const f of G.fx.floats) {
    const life = f.big ? 1100 : 700, k = (t - f.t) / life;
    const s = f.big ? (k < .2 ? easeBack(k / .2) : 1) : 1;
    ctx.save(); ctx.translate(f.x, f.y - k * (f.big ? 50 : 30)); ctx.scale(s, s);
    ctx.globalAlpha = k > .7 ? (1 - k) / .3 : 1;
    ctx.font = `700 ${f.size}px ${F_GLYPH}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    if (f.big) { ctx.lineWidth = 6; ctx.strokeStyle = '#FAF4E4'; ctx.lineJoin = 'round'; ctx.strokeText(f.text, 0, 0); }
    ctx.fillStyle = f.color; ctx.fillText(f.text, 0, 0);
    ctx.restore();
  }
  drawBanner(t);
  ctx.restore();

  // 상단 안내 (목표 / 도구 / 남은 공)
  if (G.playing) {
    if (G.tool) {
      ctx.save(); ctx.fillStyle = 'rgba(31,27,24,.8)'; ctx.font = `18px ${F_BODY}`; ctx.textAlign = 'center';
      ctx.fillText(TOOL_HINT[G.tool], W / 2, 24); ctx.restore();
    } else {
      const tw = activeTarget();
      if (tw) {
        ctx.save(); ctx.font = `17px ${F_BODY}`; ctx.textBaseline = 'middle';
        const label = G.mode === 'daily' ? '목표 ' + Math.min(G.dailyDone.filter(Boolean).length + 1, G.dailyT.length) + '/' + G.dailyT.length : '목표', bonus = '×2';
        const wl = ctx.measureText(label).width, ww = ctx.measureText(tw).width, wb = ctx.measureText(bonus).width;
        const total = wl + ww + wb + 44, x0 = W - 12 - total, y0 = 10, h = 30;
        pill(x0, y0, total, h, '#FAF4E4');
        ctx.fillStyle = '#857663'; ctx.fillText(label, x0 + 12, y0 + h / 2 + 1);
        ctx.fillStyle = INK; ctx.font = `700 20px ${F_GLYPH}`; ctx.fillText(tw, x0 + 20 + wl, y0 + h / 2 + 1);
        ctx.font = `800 15px ${F_HEAD}`; ctx.fillStyle = '#B8321F'; ctx.fillText(bonus, x0 + 30 + wl + ww, y0 + h / 2 + 1);
        ctx.restore();
      }
      if (G.need) {
        ctx.save(); ctx.textBaseline = 'middle';
        const flash = G.now - G.relayFlash < 700, y0 = G.mode === 'normal' ? 10 : 46, h = 30;
        ctx.font = `14px ${F_BODY}`; const lab = '이을 글자', wl = ctx.measureText(lab).width;
        const rtxt = G.relay >= 2 ? G.relay + '단어' : '', rw = rtxt ? 52 : 0, total = wl + 12 + 30 + rw + 20, x0 = 12;
        pill(x0, y0, total, h, flash ? '#F4D88A' : '#FAF4E4');
        ctx.fillStyle = '#857663'; ctx.fillText(lab, x0 + 11, y0 + h / 2 + 1);
        ctx.beginPath(); ctx.arc(x0 + 11 + wl + 17, y0 + h / 2, 12, 0, Math.PI * 2); ctx.fillStyle = '#EDC565'; ctx.fill(); ctx.lineWidth = 1.5; ctx.strokeStyle = INK; ctx.stroke();
        ctx.fillStyle = INK; ctx.font = `700 15px ${F_GLYPH}`; ctx.textAlign = 'center'; ctx.fillText(G.need, x0 + 11 + wl + 17, y0 + h / 2 + 1);
        if (rtxt) { ctx.textAlign = 'left'; ctx.font = `800 14px ${F_HEAD}`; ctx.fillStyle = '#8A5A00'; ctx.fillText(rtxt, x0 + 11 + wl + 38, y0 + h / 2 + 1); }
        ctx.restore();
      }
      if (G.mode === 'daily') {
        const n = G.seq.length + (G.cur ? 1 : 0) + (G.next ? 1 : 0) + (G.next2 ? 1 : 0);
        ctx.save(); ctx.font = `800 15px ${F_HEAD}`; ctx.textBaseline = 'middle'; const txt = '남은 공 ' + n, w = ctx.measureText(txt).width + 22;
        pill(12, 10, w, 30, '#FAF4E4'); ctx.fillStyle = INK; ctx.fillText(txt, 23, 26); ctx.restore();
      } else if (G.mode !== 'normal') {
        ctx.save(); ctx.font = `14px ${F_BODY}`; ctx.textBaseline = 'middle'; const txt = MODES[G.mode][0], w = ctx.measureText(txt).width + 22;
        pill(12, 10, w, 28, '#FAF4E4'); ctx.fillStyle = INK; ctx.fillText(txt, 23, 25); ctx.restore();
      }
    }
  }
}
