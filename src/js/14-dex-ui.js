/* ---------- 도감 화면 ----------
   만든 낱말  : 내가 터뜨려 본 모든 낱말 (많아져도 60개씩 이어서 그려요)
   도전 낱말  : 자주 쓰는 낱말(1,112개) 중 아직 못 만든 것. 뜻과 초성이 단서예요
   낱말 찾기  : 사전 전체 검색
   두 목록은 겹치지 않아요. 만들면 도전에서 빠지고 만든 낱말로 넘어가요. */
let dexTab = null, dexInit = '전체', dexSort = 'abc', dexSel = null, dexList = [], dexShown = 0;
const DEX_CHUNK = 60;
const dexAll = () => Object.keys(dex).filter(w => WORDS.has(w));
const initialOf = w => decompose(w[0])[0];
const mastery = n => n >= 7 ? 3 : n >= 3 ? 2 : n >= 1 ? 1 : 0;
const DOTS = '<i></i><i></i><i></i>';
const HINT = { made: '카드를 누르면 뜻이 나와요', todo: '카드를 누르면 뜻과 힌트가 나와요', find: '아는 낱말을 쳐 보세요. 한 글자만 치면 그 글자로 시작하는 낱말이 나와요.' };

function dexMsg(t) { const i = $('dexInfo'); i.classList.remove('has'); i.textContent = t; }
function dexCard(...kids) { const info = $('dexInfo'); info.innerHTML = ''; info.classList.add('has'); restart(info, 'flash'); info.append(...kids); return info; }
function mk(tag, cls, text) { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }

function showMade(w) {
  const top = mk('div', 'itop'), m = mk('span', 'mdots m' + mastery(dex[w] || 0)); m.innerHTML = DOTS;
  top.append(mk('b', '', w), m, mk('small', '', (dex[w] || 0) ? dex[w] + '번 만들었어요' : '아직 못 만들었어요'));
  if (DEF[w]) { dexCard(top, mk('p', '', DEF[w])); return; }
  const look = mk('a', 'linkbtn peek', '표준국어대사전에서 뜻 찾아보기'); look.target = '_blank'; look.rel = 'noopener noreferrer';
  look.href = 'https://stdict.korean.go.kr/search/searchResult.do?searchKeyword=' + encodeURIComponent(w);
  dexCard(top, mk('p', 'soft', '뜻풀이를 준비 중이에요.'), look);
}
function showTodo(w) {
  const top = mk('div', 'itop'), hint = mk('b', 'hintb', initials(w));
  top.append(hint, mk('small', '', w.length + '글자 · 아직 못 만들었어요'));
  const btn = mk('button', 'linkbtn peek', '낱말 보기'); btn.type = 'button';
  btn.onclick = () => { hint.textContent = w; hint.classList.remove('hintb'); btn.remove(); };
  dexCard(top, mk('p', '', '뜻: ' + (DEF[w] || '')), btn);
}

function paintLevel() {
  const n = dexCount(), lv = dexLevel(n);
  $('dexLv').textContent = lv.i + 1;
  $('dexLvName').textContent = lv.name;
  $('dexFill').style.width = (lv.to ? (n - lv.from) / (lv.to - lv.from) * 100 : 100) + '%';
  $('dexNum').textContent = lv.to ? '다음 등급까지 ' + (lv.to - n) + '개' : '모든 등급 달성!';
  $('dexPct').textContent = '자주 쓰는 낱말 ' + n + ' / ' + TOTAL;
  $('tabMade').textContent = dexAll().length + '개';
  $('tabTodo').textContent = (TOTAL - n) + '개';
}

function baseList() {
  if (dexTab === 'made') return dexAll();
  if (dexTab === 'todo') return CORE.filter(w => !dex[w]);
  const q = ($('dexQ').value || '').trim();
  return [...q].length === 1 ? ALL.filter(w => w[0] === q).slice(0, 80) : [];
}
function paintInits(base) {
  const box = $('dexInits'); box.hidden = dexTab === 'find'; if (box.hidden) return;
  const cnt = {}; for (const w of base) { const c = initialOf(w); cnt[c] = (cnt[c] || 0) + 1; }
  if (dexInit !== '전체' && !cnt[dexInit]) dexInit = '전체';
  box.innerHTML = '';
  const chip = (key, label, n) => {
    const b = mk('button', 'ichip'); b.type = 'button'; b.dataset.k = key; b.setAttribute('aria-pressed', String(dexInit === key));
    b.append(mk('b', '', label), mk('small', '', String(n))); box.appendChild(b);
  };
  chip('전체', '전체', base.length);
  for (const c of L) if (cnt[c]) chip(c, c, cnt[c]);
  const on = box.querySelector('[aria-pressed="true"]'); if (on) box.scrollLeft = Math.max(0, on.offsetLeft - 70);
}

function cardEl(w) {
  const got = !!dex[w], show = got || dexTab === 'find';
  const b = mk('button', 'dw' + (got ? ' got m' + mastery(dex[w]) : ' no') + (dexSel === w ? ' sel' : '')); b.type = 'button'; b.dataset.w = w;
  b.appendChild(mk('span', 'dwt', show ? w : initials(w)));
  if (got) { const d = mk('span', 'mdots m' + mastery(dex[w])); d.innerHTML = DOTS; b.appendChild(d); }
  b.setAttribute('aria-label', show ? w : '아직 못 만든 낱말, 초성 ' + initials(w));
  return b;
}
function more() {
  const grid = $('dexGrid'); if (dexShown >= dexList.length) return false;
  const frag = document.createDocumentFragment(), end = Math.min(dexList.length, dexShown + DEX_CHUNK);
  for (let i = dexShown; i < end; i++) { const c = cardEl(dexList[i]); c.style.setProperty('--i', i - dexShown); frag.appendChild(c); }
  grid.appendChild(frag); dexShown = end; return true;
}

function renderDex() {
  if (!dexTab) dexTab = dexAll().length ? 'made' : 'todo';
  paintLevel();
  for (const x of $('dexTabs').children) x.setAttribute('aria-pressed', String(x.dataset.f === dexTab));
  $('dexQ').hidden = dexTab !== 'find';
  const base = baseList();
  paintInits(base);
  let list = dexTab !== 'find' && dexInit !== '전체' ? base.filter(w => initialOf(w) === dexInit) : base.slice();
  if (dexTab === 'made') list.sort(dexSort === 'cnt' ? (a, b) => (dex[b] - dex[a]) || a.localeCompare(b, 'ko') : (a, b) => a.localeCompare(b, 'ko'));
  dexList = list; dexShown = 0;
  const grid = $('dexGrid'); grid.innerHTML = ''; grid.scrollTop = 0;
  $('dexMeta').hidden = dexTab === 'find';
  $('dexMetaT').textContent = (dexInit === '전체' ? '' : dexInit + ' · ') + list.length + '개';
  $('dexSort').hidden = dexTab !== 'made'; $('dexSort').textContent = dexSort === 'abc' ? '가나다순' : '많이 만든 순';
  if (!list.length && dexTab !== 'find') grid.appendChild(mk('p', 'dexempty', dexTab === 'made' ? '아직 만든 낱말이 없어요. 게임에서 낱말을 만들면 카드가 쌓여요.' : '자주 쓰는 낱말을 모두 모았어요!'));
  more();
  if (!$("dexOv").hidden) while (grid.scrollHeight <= grid.clientHeight + 40 && more()) {}
  $('dexBtn2').textContent = '도감 ' + dexAll().length + '개';
}

$('dexGrid').addEventListener('scroll', () => {
  const g = $('dexGrid'); if (g.scrollTop + g.clientHeight > g.scrollHeight - 320) more();
}, { passive: true });
$('dexGrid').addEventListener('click', e => {
  const b = e.target.closest('.dw'); if (!b) return;
  const w = b.dataset.w; dexSel = w;
  for (const x of $('dexGrid').querySelectorAll('.sel')) x.classList.remove('sel'); b.classList.add('sel');
  if (dex[w] || dexTab === 'find') showMade(w); else showTodo(w);
});
$('dexInits').addEventListener('click', e => {
  const b = e.target.closest('.ichip'); if (!b) return;
  dexInit = b.dataset.k; dexSel = null; dexMsg(HINT[dexTab]); renderDex();
});
$('dexSort').onclick = () => { dexSort = dexSort === 'abc' ? 'cnt' : 'abc'; renderDex(); };
for (const b of $('dexTabs').children) b.onclick = () => {
  dexTab = b.dataset.f; dexInit = '전체'; dexSel = null; dexMsg(HINT[dexTab]); renderDex();
  if (dexTab === 'find') $('dexQ').focus();
};
function dexSearch() {
  const q = ($('dexQ').value || '').trim();
  if (!q) { dexMsg(HINT.find); renderDex(); return; }
  if ([...q].length === 1) { const nn = ALL.filter(w => w[0] === q).length; dexMsg('"' + q + '"로 시작하는 낱말 ' + nn + '개' + (nn > 80 ? ' (앞의 80개만 보여요. 두 글자를 쳐서 찾아보세요)' : '')); renderDex(); return; }
  renderDex();
  if ([...q].length !== 2 || ![...q].every(isSyl)) { dexMsg('이 게임은 두 글자 낱말만 써요.'); return; }
  if (WORDS.has(q)) showMade(q);
  else dexMsg('"' + q + '"은(는) 표준국어대사전의 두 글자 명사에 없어요. (줄임말, 새로 생긴 말, 고유명사는 없을 수 있어요)');
}
$('dexQ').addEventListener('input', dexSearch);
let dexWasPlaying = false;
function openDex() {
  dexWasPlaying = G.playing;
  if (G.playing) { G.paused = true; updateItems(); }
  dexTab = dexAll().length ? 'made' : 'todo'; dexInit = '전체'; dexSel = null; $('dexQ').value = '';
  $('dexOv').hidden = false; dexMsg(HINT[dexTab]); renderDex();
  restart($('dexLv').parentNode, 'pop');
}
function closeDex() { $('dexOv').hidden = true; if (dexWasPlaying && G.playing) { G.paused = false; G.last = 0; updateItems(); } }
$('dexBtn').onclick = openDex; $('dexBtn2').onclick = openDex; $('dexClose').onclick = closeDex;
