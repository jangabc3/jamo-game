
/* ---------- 효과 ---------- */
function ring(x, y, r, color) { if (!reduced) G.fx.rings.push({ x, y, r, color, t: G.now }); }
function burst(x, y, n, colors, sp) {
  if (reduced) n = Math.min(n, 4);
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, s = sp * (0.4 + Math.random());
    G.fx.parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 2, r: 3 + Math.random() * 4, c: colors[i % colors.length], t: G.now, life: 600 + Math.random() * 400, sq: Math.random() < 0.4, star: false });
  }
}
function confetti(n) {
  if (reduced) return;
  const cols = ['#E88A7C', '#7DB8AF', '#E8BC52', '#6FA37E', '#9A93D0', '#FAF4E4'];
  for (let i = 0; i < n; i++) G.fx.parts.push({ x: Math.random() * W, y: -10 - Math.random() * 60, vx: (Math.random() - .5) * 3, vy: 1 + Math.random() * 3, r: 4 + Math.random() * 4, c: cols[i % cols.length], t: G.now, life: 1400 + Math.random() * 900, sq: true });
}
function fly(ch, x0, y0, x1, y1, kind, color) { if (!reduced) G.fx.fly.push({ ch, x0, y0, x1, y1, kind, color, t: G.now, dur: kind === 'drop' ? 210 : 170 }); }
function float(text, x, y, size, color, big) { G.fx.floats.push({ text, x: Math.max(60, Math.min(W - 60, x)), y, size, color, t: G.now, big }); }
function shakeIt(m) { if (!reduced) G.shake = { t: G.now, m }; }
function buzz(p) { try { vibOn && navigator.vibrate && navigator.vibrate(p); } catch {} }
