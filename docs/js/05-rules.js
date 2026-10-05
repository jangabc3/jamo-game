
/* ---------- 오늘의 도전 (날짜가 시드) ---------- */
function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function dayInfo() { const d = new Date(Date.now() + 9 * 36e5); const y = d.getUTCFullYear(), m = d.getUTCMonth() + 1, dd = d.getUTCDate(); return { key: y * 10000 + m * 100 + dd, label: `${m}/${dd}`, no: Math.floor((Date.UTC(y, m - 1, dd) - Date.UTC(2026, 9, 1)) / 864e5) + 1 }; }

/* ---------- 합치기 규칙 ---------- */
const piecesOf = s => {
  const [l, v, t] = decompose(s), out = [];
  if (CSPLIT[l]) out.push(CSPLIT[l], CSPLIT[l]); else out.push(l);
  if (VSPLIT[v]) out.push(...VSPLIT[v]); else out.push(v);
  if (t) { if (TSPLIT[t]) out.push(...TSPLIT[t]); else if (CSPLIT[t]) out.push(CSPLIT[t], CSPLIT[t]); else out.push(t); }
  return out;
};
const SIMPLE_WORDS = [...WORDS].filter(w => CORESET.has(w) && piecesOf(w[0]).length + piecesOf(w[1]).length <= 5);
const USEFUL = new Set([...Object.keys(PARTNERS), ...SINGLES]);
for (const sy of [...USEFUL]) {   // 낱말 글자를 만드는 중간 글자도 합칠 수 있게
  const [l, v, t] = decompose(sy);
  if (t) { USEFUL.add(compose(l, v, '')); if (TSPLIT[t]) USEFUL.add(compose(l, v, TSPLIT[t][0])); }
}
function wildWord(s) {
  const ps = PARTNERS[s]; if (!ps || !ps.length) return null;
  const tw = activeTarget();
  let p = tw && tw.includes(s) ? [...tw].find(c => c !== s || tw[0] === tw[1]) : null;
  if (!p || !ps.includes(p)) p = ps[Math.floor(Math.random() * ps.length)];
  return WORDS.has(s + p) ? s + p : p + s;
}
function rule(A, B) {
  const a = A.t, b = B.t;
  if (a === 'W' || b === 'W') {
    if (a === 'W' && b === 'W') return null;
    const o = a === 'W' ? B : A;
    if (o.t !== 'S' && o.t !== 'F') return null;
    const w = wildWord(o.ch);
    return w ? { kind: 'word', word: w, wild: true } : null;
  }
  if (a === 'C' && b === 'C') {
    if (A.ch !== B.ch) return null;
    return CDBL[A.ch] ? { kind: 'merge', ch: CDBL[A.ch], tag: 'double' } : { kind: 'merge', ch: A.ch, tag: 'same' };
  }
  if (a === 'V' && b === 'V') {
    const c = VCOMP[A.ch + B.ch] || VCOMP[B.ch + A.ch];
    if (c) return { kind: 'merge', ch: c, tag: 'compound', from: A.ch + '+' + B.ch };
    return A.ch === B.ch ? { kind: 'merge', ch: A.ch, tag: 'same' } : null;
  }
  if ((a === 'C' && b === 'V') || (a === 'V' && b === 'C')) {
    const c = a === 'C' ? A.ch : B.ch, v = a === 'V' ? A.ch : B.ch;
    const ch = compose(c, v);
    if (!USEFUL.has(ch)) return null;
    return { kind: 'merge', ch, tag: 'cv' };
  }
  if ((a === 'S' && b === 'C') || (a === 'C' && b === 'S')) {
    const s = a === 'S' ? A.ch : B.ch, c = a === 'C' ? A.ch : B.ch;
    if (!FINAL_OK.has(c)) return null;
    const [l, v] = decompose(s);
    const ch = compose(l, v, c);
    if (!USEFUL.has(ch)) return null;
    return { kind: 'merge', ch, tag: 'final' };
  }
  if ((a === 'S' && b === 'V') || (a === 'V' && b === 'S')) {   // 오 + ㅏ = 와
    const sy = a === 'S' ? A : B, vo = a === 'V' ? A : B;
    const [l, v] = decompose(sy.ch), c = VCOMP[v + vo.ch];
    if (!c) return null;
    const ch = compose(l, c, '');
    if (!USEFUL.has(ch)) return null;
    return { kind: 'merge', ch, tag: 'cv' };
  }
  if ((a === 'F' && b === 'C') || (a === 'C' && b === 'F')) {
    const f = a === 'F' ? A : B, c = a === 'C' ? A : B;
    const [l, v, t] = decompose(f.ch), tc = TCOMP[t + c.ch];
    if (!tc) return null;
    const ch = compose(l, v, tc);
    if (!USEFUL.has(ch)) return null;
    return { kind: 'merge', ch, tag: 'final' };
  }
  if ((a === 'S' || a === 'F') && (b === 'S' || b === 'F')) {
    if (WORDS.has(A.ch + B.ch)) return { kind: 'word', word: A.ch + B.ch };
    if (WORDS.has(B.ch + A.ch)) return { kind: 'word', word: B.ch + A.ch };
    if (A.ch === B.ch) return { kind: 'merge', ch: A.ch, tag: 'same' };
  }
  return null;
}
