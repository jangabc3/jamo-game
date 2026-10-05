

/* ---------- 합성표 ---------- */
const GUIDE = [
  ['c:ㄱ', '+', 'v:ㅏ', '→', 's:가', '자음+모음'],
  ['s:가', '+', 'c:ㅇ', '→', 's:강', '글자+받침'],
  ['v:ㅗ', '+', 'v:ㅏ', '→', 'v:ㅘ', '모음끼리'],
  ['s:오', '+', 'v:ㅏ', '→', 's:와', '글자+모음'],
  ['c:ㄱ', '+', 'c:ㄱ', '→', 'c:ㄲ', '같은 자음'],
  ['s:가', '+', 's:방', '→', 'w:가방', '낱말 완성!'],
  ['w:가방', '→', 'w:방학', '→', 'w:학교', '끝말잇기'],
];
function openGuide() {
  const el = $('guideRows'); el.innerHTML = '';
  for (const r of GUIDE) {
    if (!ENABLE_RELAY && r[5] === '끝말잇기') continue;
    const row = document.createElement('div'); row.className = 'guiderow';
    r.forEach((x, i) => {
      if (i === 5) { const t = document.createElement('span'); t.className = 'tx'; t.textContent = x; row.appendChild(t); return; }
      if (x.length === 1) { const o = document.createElement('span'); o.className = 'op'; o.textContent = x; row.appendChild(o); return; }
      const m = document.createElement('span'); m.className = 'mini ' + x[0]; m.textContent = x.slice(2); row.appendChild(m);
    });
    el.appendChild(row);
  }
  $('guideOv').hidden = false; $('guideClose').focus();
}
$('guideClose').onclick = () => { $('guideOv').hidden = true; };
$('guideBtn').onclick = openGuide; $('setGuide').onclick = openGuide;
