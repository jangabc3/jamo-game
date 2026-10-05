

/* ---------- 도감 화면 ---------- */
let dexFilter = 'all', dexSel = null;
function showDexInfo(w, got) {
  const info = $('dexInfo'); info.innerHTML = '';
  const bb = document.createElement('b'); bb.textContent = w; info.appendChild(bb);
  info.appendChild(document.createTextNode(DEF[w] || '표준국어대사전에 실린 낱말'));
  const cnt = document.createElement('small'); cnt.style.cssText = 'font-size:12px;color:#7C6B55';
  cnt.textContent = (CORESET.has(w) ? '자주 쓰는 낱말 · ' : '') + (got ? dex[w] + '번 만들었어요' : '아직 안 만들어 봤어요');
  info.appendChild(cnt);
}
const dexAll = () => Object.keys(dex).filter(w => WORDS.has(w));
function renderDex(fresh) {
  const n = dexCount(), all = dexAll().length;
  $('dexNum').textContent = '만든 낱말 ' + all + '개';
  $('dexPct').textContent = '자주 쓰는 낱말 ' + n + ' / ' + TOTAL;
  $('dexFill').style.width = (n / TOTAL * 100) + '%';
  $('dexQ').hidden = dexFilter !== 'find';
  const grid = $('dexGrid'); grid.innerHTML = '';
  const frag = document.createDocumentFragment();
  let list;
  if (dexFilter === 'got') list = dexAll().sort((a, b) => (dex[b] - dex[a]) || a.localeCompare(b, 'ko'));
  else if (dexFilter === 'find') {
    const q = ($('dexQ').value || '').trim();
    if (q.length === 1) list = ALL.filter(w => w[0] === q).slice(0, 80); else list = [];
  } else list = CORE;
  if (dexFilter === 'got' && !list.length) { const p = document.createElement('p'); p.style.gridColumn = '1 / -1'; p.textContent = '아직 만든 낱말이 없어요. 게임에서 낱말을 만들면 여기에 쌓여요.'; frag.appendChild(p); }
  for (const w of list) {
    const got = !!dex[w];
    const b = document.createElement('button');
    const show = got || dexFilter === 'find';
    b.type = 'button'; b.className = 'dw' + (got ? '' : ' no') + (dexSel === w ? ' sel' : '') + (fresh && fresh === w ? ' fresh' : '');
    b.textContent = show ? w : initials(w);
    b.setAttribute('aria-label', show ? w : '아직 못 만든 낱말, 초성 ' + initials(w));
    b.onclick = () => { dexSel = w; if (show) showDexInfo(w, got); else $('dexInfo').textContent = '초성은 ' + initials(w) + ' (' + w.length + '글자). 아직 못 만든 낱말이에요.'; for (const x of grid.children) x.classList.remove('sel'); b.classList.add('sel'); };
    b.style.setProperty('--i', frag.childNodes.length);
    frag.appendChild(b);
  }
  grid.appendChild(frag);
  $('dexBtn2').textContent = '도감 ' + all + '개';
}
function dexSearch() {
  const q = ($('dexQ').value || '').trim(), info = $('dexInfo');
  if (!q) { info.textContent = '아는 낱말을 쳐 보세요. 한 글자만 치면 그 글자로 시작하는 낱말이 나와요.'; renderDex(); return; }
  if ([...q].length === 1) { const nn = ALL.filter(w => w[0] === q).length; info.textContent = '"' + q + '"로 시작하는 낱말 ' + nn + '개' + (nn > 80 ? ' (앞의 80개만 보여요. 두 글자를 쳐서 찾아보세요)' : ''); renderDex(); return; }
  renderDex();
  if ([...q].length !== 2 || ![...q].every(isSyl)) { info.textContent = '이 게임은 두 글자 낱말만 써요.'; return; }
  if (WORDS.has(q)) showDexInfo(q, !!dex[q]);
  else info.textContent = '"' + q + '"은(는) 표준국어대사전의 두 글자 명사에 없어요. (줄임말, 새로 생긴 말, 고유명사는 없을 수 있어요)';
}
$('dexQ').addEventListener('input', dexSearch);
let dexWasPlaying = false;
function openDex() {
  dexWasPlaying = G.playing;
  if (G.playing) { G.paused = true; updateItems(); }
  dexSel = null; $('dexQ').value = ''; $('dexInfo').textContent = '낱말을 누르면 뜻이 나와요. 만든 낱말만 글자가 보여요.';
  renderDex(); $('dexOv').hidden = false; $('dexClose').focus();
}
function closeDex() { $('dexOv').hidden = true; if (dexWasPlaying && G.playing) { G.paused = false; G.last = 0; updateItems(); } }
$('dexBtn').onclick = openDex; $('dexBtn2').onclick = openDex; $('dexClose').onclick = closeDex;
for (const b of $('dexTabs').children) b.onclick = () => {
  dexFilter = b.dataset.f; for (const x of $('dexTabs').children) x.setAttribute('aria-pressed', String(x === b)); if (dexFilter === 'find') { $('dexInfo').textContent = '아는 낱말을 쳐 보세요. 한 글자만 치면 그 글자로 시작하는 낱말이 나와요.'; renderDex(); $('dexQ').focus(); } else renderDex();
};
