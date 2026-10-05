/* ---------- 도감 화면: 등급 · 초성별 칸 · 숙련도 ---------- */
let dexFilter = 'all', dexSel = null, dexInit = '전체';
const dexAll = () => Object.keys(dex).filter(w => WORDS.has(w));
const initialOf = w => decompose(w[0])[0];
const DEX_INITS = L.filter(c => CORE.some(w => initialOf(w) === c));
const DEX_HINT = '카드를 누르면 뜻이 나와요';
const mastery = n => n >= 7 ? 3 : n >= 3 ? 2 : n >= 1 ? 1 : 0;

function showDexInfo(w, got) {
  const info = $('dexInfo'); info.innerHTML = ''; info.classList.add('has');
  const top = document.createElement('div'); top.className = 'itop';
  const bb = document.createElement('b'); bb.textContent = w;
  const m = document.createElement('span'); m.className = 'mdots m' + mastery(dex[w] || 0);
  m.innerHTML = '<i></i><i></i><i></i>'; m.title = '많이 만들수록 칸이 채워져요';
  const tag = document.createElement('small'); tag.textContent = got ? dex[w] + '번 만들었어요' : '아직 못 만들었어요';
  top.append(bb, m, tag);
  const def = document.createElement('p'); def.textContent = DEF[w] || '표준국어대사전에 실린 낱말';
  info.append(top, def);
}
function dexMsg(t) { const i = $('dexInfo'); i.classList.remove('has'); i.textContent = t; }

function paintLevel() {
  const n = dexCount(), lv = dexLevel(n), all = dexAll().length;
  $('dexLv').textContent = lv.i + 1;
  $('dexLvName').textContent = lv.name;
  $('dexFill').style.width = (lv.to ? (n - lv.from) / (lv.to - lv.from) * 100 : 100) + '%';
  $('dexNum').textContent = lv.to ? '다음 등급까지 ' + (lv.to - n) + '개' : '모든 등급 달성!';
  $('dexPct').textContent = '모은 낱말 ' + n + ' / ' + TOTAL + (all > n ? ' (그 밖에 ' + (all - n) + '개)' : '');
}
function paintInits() {
  const box = $('dexInits'); box.hidden = dexFilter !== 'all'; if (box.hidden) return;
  box.innerHTML = '';
  const mk = (key, label, got, tot) => {
    const b = document.createElement('button'); b.type = 'button';
    b.className = 'ichip' + (got === tot && tot ? ' done' : ''); b.setAttribute('aria-pressed', String(dexInit === key));
    b.innerHTML = '<b></b><small></small>'; b.firstChild.textContent = label; b.lastChild.textContent = got + '/' + tot;
    b.onclick = () => { dexInit = key; dexSel = null; dexMsg(DEX_HINT); renderDex(); };
    box.appendChild(b);
  };
  mk('전체', '전체', dexCount(), TOTAL);
  for (const c of DEX_INITS) { const ws = CORE.filter(w => initialOf(w) === c); mk(c, c, ws.filter(w => dex[w]).length, ws.length); }
  const on = box.querySelector('[aria-pressed="true"]'); if (on) box.scrollLeft = Math.max(0, on.offsetLeft - 60);
}

function renderDex(fresh) {
  paintLevel(); paintInits();
  $('dexQ').hidden = dexFilter !== 'find';
  const grid = $('dexGrid'); grid.innerHTML = '';
  const frag = document.createDocumentFragment();
  let list;
  if (dexFilter === 'got') list = dexAll().sort((a, b) => (dex[b] - dex[a]) || a.localeCompare(b, 'ko'));
  else if (dexFilter === 'find') {
    const q = ($('dexQ').value || '').trim();
    list = [...q].length === 1 ? ALL.filter(w => w[0] === q).slice(0, 80) : [];
  } else list = dexInit === '전체' ? CORE : CORE.filter(w => initialOf(w) === dexInit);
  if (dexFilter === 'got' && !list.length) { const p = document.createElement('p'); p.className = 'dexempty'; p.textContent = '아직 만든 낱말이 없어요. 게임에서 낱말을 만들면 카드가 쌓여요.'; frag.appendChild(p); }
  for (const w of list) {
    const got = !!dex[w], show = got || dexFilter === 'find';
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'dw' + (got ? ' got m' + mastery(dex[w]) : ' no') + (dexSel === w ? ' sel' : '') + (fresh && fresh === w ? ' fresh' : '');
    const t = document.createElement('span'); t.className = 'dwt'; t.textContent = show ? w : initials(w);
    b.appendChild(t);
    if (got) { const d = document.createElement('span'); d.className = 'mdots m' + mastery(dex[w]); d.innerHTML = '<i></i><i></i><i></i>'; b.appendChild(d); }
    b.setAttribute('aria-label', show ? w : '아직 못 만든 낱말, 초성 ' + initials(w));
    b.onclick = () => {
      dexSel = w;
      if (show) showDexInfo(w, got); else dexMsg('초성은 ' + initials(w) + ', ' + w.length + '글자예요. 아직 못 만든 낱말이에요.');
      for (const x of grid.children) x.classList.remove('sel'); b.classList.add('sel');
    };
    b.style.setProperty('--i', frag.childNodes.length);
    frag.appendChild(b);
  }
  grid.appendChild(frag);
  $('dexBtn2').textContent = '도감 ' + dexAll().length + '개';
}
function dexSearch() {
  const q = ($('dexQ').value || '').trim();
  if (!q) { dexMsg('아는 낱말을 쳐 보세요. 한 글자만 치면 그 글자로 시작하는 낱말이 나와요.'); renderDex(); return; }
  if ([...q].length === 1) { const nn = ALL.filter(w => w[0] === q).length; dexMsg('"' + q + '"로 시작하는 낱말 ' + nn + '개' + (nn > 80 ? ' (앞의 80개만 보여요. 두 글자를 쳐서 찾아보세요)' : '')); renderDex(); return; }
  renderDex();
  if ([...q].length !== 2 || ![...q].every(isSyl)) { dexMsg('이 게임은 두 글자 낱말만 써요.'); return; }
  if (WORDS.has(q)) showDexInfo(q, !!dex[q]);
  else dexMsg('"' + q + '"은(는) 표준국어대사전의 두 글자 명사에 없어요. (줄임말, 새로 생긴 말, 고유명사는 없을 수 있어요)');
}
$('dexQ').addEventListener('input', dexSearch);
let dexWasPlaying = false;
function openDex() {
  dexWasPlaying = G.playing;
  if (G.playing) { G.paused = true; updateItems(); }
  dexSel = null; $('dexQ').value = ''; dexMsg(DEX_HINT);
  renderDex(); $('dexOv').hidden = false;
  restart($('dexLv').parentNode, 'pop');
}
function closeDex() { $('dexOv').hidden = true; if (dexWasPlaying && G.playing) { G.paused = false; G.last = 0; updateItems(); } }
$('dexBtn').onclick = openDex; $('dexBtn2').onclick = openDex; $('dexClose').onclick = closeDex;
for (const b of $('dexTabs').children) b.onclick = () => {
  dexFilter = b.dataset.f; dexSel = null;
  for (const x of $('dexTabs').children) x.setAttribute('aria-pressed', String(x === b));
  if (dexFilter === 'find') { dexMsg('아는 낱말을 쳐 보세요. 한 글자만 치면 그 글자로 시작하는 낱말이 나와요.'); renderDex(); $('dexQ').focus(); }
  else { dexMsg(DEX_HINT); renderDex(); }
};
