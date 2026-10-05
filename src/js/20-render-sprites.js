
/* ---------- 그리기 ---------- */
const easeBack = t => { const c = 1.9; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
const easeOut = t => 1 - Math.pow(1 - t, 3);
function squashOf(g, t, vy) {
  let sx = 1, sy = 1;
  if (g.sq) {
    const k = (t - g.sq.t) / 380;
    if (k >= 1) g.sq = null; else if (k > 0) { const w = Math.sin(k * Math.PI * 3) * (1 - k) * g.sq.a; sy = 1 - w; sx = 1 + w * .9; }
  }
  if (!g.sq && vy > 2.5 && !reduced) { const st = Math.min(vy * .01, .12); sy *= 1 + st; sx *= 1 - st * .7; }
  return [sx, sy];
}
const F_GLYPH = "'Gowun Batang', 'Batang', serif", F_HEAD = "'Hahmlet', 'Batang', serif", F_BODY = "'Gowun Dodum', sans-serif";
function blob(r, seed, k = 1) {
  // 판화처럼 살짝 일그러진 원
  ctx.beginPath();
  for (let i = 0; i <= 36; i++) {
    const a = i / 36 * Math.PI * 2, rad = r * (1 + .022 * Math.sin(a * 3 + seed) + .016 * Math.sin(a * 5 + seed * 1.7)) * k;
    const x = Math.cos(a) * rad, y = Math.sin(a) * rad;
    if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y);
  }
  ctx.closePath();
}
function drawBall(x, y, r, g, sx = 1, sy = 1, alpha = 1, t = 0) {
  const sd = (g.seed || 0) * .01;
  ctx.save(); ctx.globalAlpha = alpha; ctx.translate(x, y); ctx.scale(sx, sy);
  // 어긋난 먹 그림자 (목판 찍을 때 밀린 느낌)
  ctx.save(); ctx.translate(2.6, 3.6); blob(r, sd); ctx.fillStyle = 'rgba(31,27,24,.2)'; ctx.fill(); ctx.restore();
  blob(r, sd); ctx.fillStyle = FILL[g.k]; ctx.fill();
  ctx.lineWidth = 2.2; ctx.strokeStyle = INK; ctx.lineJoin = 'round'; ctx.stroke();
  const big = g.t === 'S' || g.t === 'F' || g.t === 'W';
  if (g.t === 'S' || g.t === 'F') { ctx.beginPath(); ctx.arc(0, 0, r - 5.5, 0, Math.PI * 2); ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(31,27,24,.38)'; ctx.stroke(); }
  if (g.t === 'W') { ctx.beginPath(); ctx.arc(0, 0, r - 5.5, 0, Math.PI * 2); ctx.setLineDash([3, 3]); ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(31,27,24,.5)'; ctx.stroke(); ctx.setLineDash([]); }
  ctx.fillStyle = (g.k === 'C' || g.k === 'C2' || g.k === 'V' || g.k === 'V2' || g.k === 'F') ? '#FAF4E4' : INK; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = `700 ${Math.round(r * (big ? .98 : 1.2))}px ${F_GLYPH}`;
  ctx.fillText(g.ch, 0, big ? r * .07 : r * .05);
  ctx.restore();
}
function rr(x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + h - r); ctx.quadraticCurveTo(x, y + h, x + r, y + h); ctx.lineTo(x + w - r, y + h); ctx.quadraticCurveTo(x + w, y + h, x + w, y + h - r); ctx.lineTo(x + w, y); }
function pill(x, y, w, h, fill) { ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(x, y, w, h, 5); else ctx.rect(x, y, w, h); ctx.fillStyle = fill; ctx.fill(); ctx.lineWidth = 1.5; ctx.strokeStyle = INK; ctx.stroke(); }

function drawDeco(t) {
  return;
  ctx.save();
  for (const d of G.deco) {
    d.y += d.v * .8; d.x += Math.sin(t / 1200 + d.p) * .35;
    if (d.y > H + 10) d.y = -10;
    ctx.globalAlpha = .55; ctx.save(); ctx.translate(d.x, d.y); ctx.rotate(t / 1400 * d.v + d.p); ctx.scale(d.s * .8, d.s * .8);
    ctx.fillStyle = d.p > 3.2 ? '#E7A79B' : '#F2D9CF';
    for (let i = 0; i < 5; i++) { ctx.rotate(Math.PI * 2 / 5); ctx.beginPath(); ctx.arc(0, -5, 4, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = '#C79A3E'; ctx.beginPath(); ctx.arc(0, 0, 1.8, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
  ctx.restore();
}
function wrapDef(t) { t = t || ''; if (t.length <= 24) return [t]; let cut = t.lastIndexOf(' ', 24); if (cut < 10) cut = 24; const a = t.slice(0, cut).trim(), b = t.slice(cut).trim(); return [a, b.length > 26 ? b.slice(0, 25) + '…' : b]; }
function drawBanner(t) {
  const bn = G.banner; if (!bn) return;
  const life = 2100, k = (t - bn.t) / life;
  if (k >= 1) { G.banner = null; return; }
  const inK = Math.min(k / .12, 1), outK = k > .82 ? (1 - k) / .18 : 1;
  const sc = .7 + .3 * Math.min(easeBack(inK), 1.06);
  ctx.save(); ctx.translate(W / 2, 196 + (1 - easeBack(inK)) * 26); ctx.globalAlpha = Math.min(outK, 1); ctx.scale(sc, sc);
  const cw = 316, lines = wrapDef(bn.def || ''), ch = lines.length > 1 ? 100 : 82;
  ctx.fillStyle = 'rgba(31,27,24,.2)'; ctx.fillRect(-cw / 2 + 4, -ch / 2 + 5, cw, ch);
  ctx.fillStyle = '#FAF4E4'; ctx.fillRect(-cw / 2, -ch / 2, cw, ch);
  ctx.lineWidth = bn.rare ? 2.5 : 1.5; ctx.strokeStyle = bn.rare ? '#B5861A' : INK; ctx.strokeRect(-cw / 2, -ch / 2, cw, ch);
  ctx.lineWidth = 1; ctx.strokeRect(-cw / 2 + 5, -ch / 2 + 5, cw - 10, ch - 10);
  // 붓으로 쓰듯 왼쪽에서 오른쪽으로 드러남
  ctx.font = `54px 'Nanum Brush Script', ${F_HEAD}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const tw = ctx.measureText(bn.word).width;
  const prog = easeOut(Math.min(Math.max((k - .05) / .22, 0), 1));
  ctx.save(); ctx.beginPath(); ctx.rect(-tw / 2 - 6, -ch / 2, (tw + 12) * prog, ch); ctx.clip();
  ctx.fillStyle = INK; ctx.fillText(bn.word, 0, lines.length > 1 ? -20 : -9); ctx.restore();
  ctx.font = `13px ${F_BODY}`; ctx.fillStyle = '#7C6B55'; ctx.globalAlpha *= Math.min(Math.max((k - .15) / .12, 0), 1);
  lines.forEach((ln, i) => ctx.fillText(ln, 0, (lines.length > 1 ? 22 : 25) + i * 17, cw - 30));
  // 낙관: 오른쪽 아래 붉은 도장
  ctx.save(); ctx.globalAlpha *= Math.min(Math.max((k - .2) / .08, 0), 1); ctx.translate(cw / 2 - 30, -ch / 2 + 30); ctx.rotate(.12);
  ctx.fillStyle = '#B8321F'; ctx.fillRect(-14, -14, 28, 28); ctx.fillStyle = '#FAF4E4'; ctx.font = `800 11px ${F_HEAD}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('낱', -6, -6); ctx.fillText('말', 6, -6); ctx.fillText('완', -6, 6); ctx.fillText('성', 6, 6); ctx.restore();
  // 카드 아래 한 줄: 기본 낱말 +50% · 도감 +1 같은 정보를 모아서 보여 줘요
  if (bn.tags && bn.tags.length) {
    ctx.save(); ctx.globalAlpha *= Math.min(Math.max((k - .22) / .1, 0), 1);
    const txt = bn.tags.join('  ·  '); ctx.font = `700 12.5px ${F_BODY}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const pw = Math.min(cw - 10, ctx.measureText(txt).width + 26), py = ch / 2 + 17;
    ctx.fillStyle = bn.rare ? '#8A6410' : '#3A2D24'; ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(-pw / 2, py - 11, pw, 22, 11); else ctx.rect(-pw / 2, py - 11, pw, 22); ctx.fill();
    ctx.fillStyle = '#FFF6DE'; ctx.fillText(txt, 0, py + .5, cw - 24); ctx.restore();
  }
  if (bn.isNew || bn.rare) {
    const st = Math.min(Math.max((k - .1) / .08, 0), 1);
    ctx.globalAlpha = Math.min(outK, 1) * st; ctx.translate(-cw / 2 + 12, -ch / 2 + 6); ctx.rotate(-.2); const z = 1 + (1 - st) * .9; ctx.scale(z, z);
    ctx.fillStyle = bn.rare ? '#C8961E' : '#B8321F'; ctx.fillRect(-22, -11, 44, 22);
    ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(251,246,234,.6)'; ctx.strokeRect(-19.5, -8.5, 39, 17);
    ctx.fillStyle = '#FAF4E4'; ctx.font = `800 13px ${F_HEAD}`; ctx.fillText(bn.rare ? '희귀' : 'NEW', 0, 1);
  }
  ctx.restore();
}
