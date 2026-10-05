/* ---------- 도감 화면 ----------
   모은 낱말 : 내가 만들어 본 모든 낱말. 급수는 이 수로 올라가요 (60개씩 이어서 그려요)
   기본 낱말 : 일상에서 자주 쓰는 낱말(1,112개) 모음판. 모은 칸은 채워지고, 빈 칸은 초성만 보여요
   숨은 낱말 : 만들면 마법이 일어나는 낱말. 못 찾은 칸은 봉인돼 있어요
   사전      : 게임에 나오는 두 글자 낱말 전체 검색 */
let dexTab = null, dexInit = '전체', dexSort = 'abc', dexSel = null, dexList = [], dexShown = 0, dexLeftOnly = false;
const DEX_CHUNK = 60;
const dexAll = () => Object.keys(dex).filter(w => WORDS.has(w));
const initialOf = w => decompose(w[0])[0];
const mastery = n => n >= 7 ? 3 : n >= 3 ? 2 : n >= 1 ? 1 : 0;
const DOTS = '<i></i><i></i><i></i>';
const fmt = n => n.toLocaleString('ko-KR');
const manN = n => n >= 10000 ? (Math.floor(n / 1000) / 10) + '만' : fmt(n);
const ABOUT = {
  made: '내가 만들어 본 낱말이에요. 새 낱말이 늘수록 급수가 올라가요.',
  todo: '일상에서 자주 쓰는 낱말 ' + fmt(TOTAL) + '개예요. 만들면 점수 +50%!',
  magic: '만들면 게임에 마법이 일어나는 낱말이 숨어 있어요.',
  find: '사전에 실린 두 글자 낱말 ' + fmt(WORDS.size) + '개가 모두 게임에 나와요.',
};
const HINT = { made: '카드를 누르면 뜻이 나와요. 점 세 개는 얼마나 자주 만들었는지예요.', todo: '빈 칸을 누르면 초성이 보여요. 뜻 힌트도 볼 수 있어요.', magic: '봉인된 카드를 누르면 힌트를 볼 수 있어요.', find: '아는 낱말을 쳐 보세요. 한 글자만 치면 그 글자로 시작하는 낱말이 나와요.' };

function dexMsg(t) { const i = $('dexInfo'); i.classList.remove('has'); i.textContent = t; }
function dexCard(...kids) { const info = $('dexInfo'); info.innerHTML = ''; info.classList.add('has'); restart(info, 'flash'); info.append(...kids); return info; }
function mk(tag, cls, text) { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
const tierTag = w => CORESET.has(w) ? mk('span', 'tag core', '기본') : null;

function showMade(w) {
  const top = mk('div', 'itop'), m = mk('span', 'mdots m' + mastery(dex[w] || 0)); m.innerHTML = DOTS;
  top.append(mk('b', '', w)); const tg = tierTag(w); if (tg) top.append(tg);
  top.append(m, mk('small', '', (dex[w] || 0) ? dex[w] + '번 만들었어요' : '아직 못 만들었어요'));
  if (DEF[w]) { dexCard(top, mk('p', '', DEF[w]), mk('span', 'src', '뜻 출처: 국립국어원 (CC BY-SA 2.0 KR)')); return; }
  const look = mk('a', 'linkbtn peek', '표준국어대사전에서 뜻 찾아보기'); look.target = '_blank'; look.rel = 'noopener noreferrer';
  look.href = 'https://stdict.korean.go.kr/search/searchResult.do?searchKeyword=' + encodeURIComponent(w);
  dexCard(top, mk('p', 'soft', '뜻풀이를 준비 중이에요.'), look);
}
function showTodo(w) {
  // 초성만 먼저 보여 주고, 뜻은 "뜻 힌트 보기"를 눌러야 나와요. 낱말 자체는 보여 주지 않아요.
  const top = mk('div', 'itop');
  top.append(mk('b', 'hintb', initials(w)), mk('small', '', w.length + '글자 · 아직 못 만들었어요'));
  const btn = mk('button', 'hintbtn', '뜻 힌트 보기'); btn.type = 'button';
  btn.onclick = () => btn.replaceWith(DEF[w] ? mk('p', '', '뜻: ' + DEF[w]) : mk('p', 'soft', '뜻풀이를 준비 중이에요.'));
  dexCard(top, btn);
}
function showMagic(w) {
  const m = MAGIC[w], n = magicSeen[w] || 0, top = mk('div', 'itop');
  if (n) {
    top.append(mk('b', 'brushw', w), mk('span', 'tag ' + (m.kind === 'lore' ? 'lore' : 'magic'), m.kind === 'lore' ? '한글' : '마법'), mk('small', '', n + '번 만들었어요'));
    dexCard(top, mk('p', '', m.kind === 'lore' ? '“' + m.quote + '” — ' + m.who : m.desc));
    return;
  }
  top.append(mk('b', 'hintb', initials(w)), mk('small', '', '2글자 · 봉인됨'));
  const btn = mk('button', 'hintbtn', '힌트 보기'); btn.type = 'button';
  btn.onclick = () => btn.replaceWith(mk('p', '', '힌트: ' + m.hint));
  dexCard(top, btn);
}

/* ---------- 급수 ---------- */
function paintLevel() {
  const lv = dexLevel(), n = lv.n;
  $('dexLv').textContent = lv.s; $('dexLvU').textContent = lv.top ? '' : '급';
  $('dexSeal').className = 'lvseal' + (lv.top ? ' top' + lv.top : '') + (lv.s.length > 1 ? ' wide' : '');
  $('dexLvName').textContent = lv.g + ' · ' + lv.t;
  const nx = lv.next, need = nx ? Math.max(0, nx.n - n) : 0;
  $('dexFill').style.width = (nx ? Math.min(100, (n - lv.from) / Math.max(1, nx.n - lv.from) * 100) : 100) + '%';
  $('dexNum').textContent = !nx ? '가장 높은 급수예요!' : need > 0 ? nx.g + '까지 새 낱말 ' + need + '개 더' : nx.g + '까지 숨은 낱말 ' + (MAGIC_WORDS.length - magicCount()) + '개 더 찾기';
  $('dexPct').textContent = '모은 낱말 ' + fmt(n);
  $('tabMade').textContent = fmt(dexAll().length);
  $('tabTodo').textContent = dexCount() + '/' + fmt(TOTAL);
  $('tabMagic').textContent = magicCount() + '/' + MAGIC_WORDS.length;
  $('tabFind').textContent = manN(WORDS.size);
  $('dexTabs').querySelector('[data-f="magic"]').classList.toggle('new', magicCount() > magicOpened().length);
}
function paintGrades() {
  const lv = dexLevel(), list = $('gradeList'); list.innerHTML = '';
  GRADES.forEach((g, k) => {
    const done = k <= lv.i, cur = k === lv.i, li = mk('li', 'gsrow' + (done ? ' done' : '') + (cur ? ' cur' : '') + (g.top ? ' top' + g.top : ''));
    const seal = mk('span', 'gsseal' + (g.s.length > 1 ? ' wide' : '')); seal.append(mk('b', '', g.s)); if (!g.top) seal.append(mk('small', '', '급'));
    const body = mk('span', 'gsbody'); body.append(mk('strong', '', g.g + ' · ' + g.t), mk('small', '', k === 0 ? '처음 시작' : '새 낱말 ' + fmt(g.n) + '개' + (g.magic ? ' + 숨은 낱말 ' + MAGIC_WORDS.length + '개 모두' : '')));
    const st = mk('span', 'gsst', cur ? '지금' : done ? '' : '');
    if (done && !cur) st.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
    if (!done) st.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>';
    li.append(seal, body, st); list.appendChild(li);
  });
}
function openGrades() { paintGrades(); const s = $('gradeSheet'); s.hidden = false; restart(s, 'in'); const c = s.querySelector('.cur'); if (c) c.scrollIntoView({ block: 'center' }); $('gradeClose').focus(); }
function closeGrades() { $('gradeSheet').hidden = true; $('dexLvBtn').focus(); }
$('dexLvBtn').onclick = openGrades; $('gradeClose').onclick = closeGrades;

/* ---------- 숨은 낱말: 처음 본 카드는 봉인이 풀리는 연출 ---------- */
function magicOpened() { try { return (JSON.parse(store.get('jamo-magic-open', '[]')) || []).filter(w => MAGIC[w]); } catch { return []; } }

function baseList() {
  if (dexTab === 'made') return dexAll();
  if (dexTab === 'todo') return dexLeftOnly ? CORE.filter(w => !dex[w]) : CORE.slice();
  if (dexTab === 'magic') return MAGIC_WORDS.slice();
  const q = ($('dexQ').value || '').trim();
  return [...q].length === 1 ? ALL.filter(w => w[0] === q).slice(0, 80) : [];
}
function paintInits(base) {
  const box = $('dexInits'); box.hidden = dexTab === 'find' || dexTab === 'magic'; if (box.hidden) return;
  const cnt = {}, got = {}; for (const w of base) { const c = initialOf(w); cnt[c] = (cnt[c] || 0) + 1; if (dex[w]) got[c] = (got[c] || 0) + 1; }
  if (dexInit !== '전체' && !cnt[dexInit]) dexInit = '전체';
  box.innerHTML = '';
  const chip = (key, label, n, done) => {
    const b = mk('button', 'ichip' + (done ? ' done' : '')); b.type = 'button'; b.dataset.k = key; b.setAttribute('aria-pressed', String(dexInit === key));
    b.append(mk('b', '', label), mk('small', '', n)); box.appendChild(b);
  };
  const core = dexTab === 'todo' && !dexLeftOnly;
  chip('전체', '전체', String(base.length));
  for (const c of L) if (cnt[c]) chip(c, c, core ? (got[c] || 0) + '/' + cnt[c] : String(cnt[c]), core && got[c] === cnt[c]);
  const on = box.querySelector('[aria-pressed="true"]'); if (on) box.scrollLeft = Math.max(0, on.offsetLeft - 70);
}

function magicCardEl(w, fresh) {
  const got = !!magicSeen[w], m = MAGIC[w];
  const b = mk('button', 'dw mg' + (got ? ' got ' + (m.kind === 'lore' ? 'lore' : 'power') : ' sealed') + (dexSel === w ? ' sel' : '') + (fresh ? ' unseal' : '')); b.type = 'button'; b.dataset.w = w;
  if (got) b.appendChild(mk('span', 'dwt', w));
  else b.append(mk('span', 'wax', '?'), mk('span', 'dwt', initials(w)));
  if (fresh) b.appendChild(mk('span', 'waxfly'));
  b.setAttribute('aria-label', got ? '숨은 낱말 ' + w : '봉인된 숨은 낱말, 초성 ' + initials(w));
  return b;
}
function cardEl(w, fresh) {
  if (dexTab === 'magic') return magicCardEl(w, fresh);
  const got = !!dex[w], show = got || dexTab === 'find';
  const b = mk('button', 'dw' + (got ? ' got m' + mastery(dex[w]) : ' no') + (dexSel === w ? ' sel' : '')); b.type = 'button'; b.dataset.w = w;
  b.appendChild(mk('span', 'dwt', show ? w : initials(w)));
  if (got) { const d = mk('span', 'mdots m' + mastery(dex[w])); d.innerHTML = DOTS; b.appendChild(d); }
  if (dexTab === 'made' && CORESET.has(w)) b.classList.add('core');
  b.setAttribute('aria-label', show ? w : '아직 못 만든 낱말, 초성 ' + initials(w));
  return b;
}
let dexFresh = new Set();
function more() {
  const grid = $('dexGrid'); if (dexShown >= dexList.length) return false;
  const frag = document.createDocumentFragment(), end = Math.min(dexList.length, dexShown + DEX_CHUNK);
  for (let i = dexShown; i < end; i++) { const w = dexList[i], c = cardEl(w, dexFresh.has(w)); c.style.setProperty('--i', i - dexShown); frag.appendChild(c); }
  grid.appendChild(frag); dexShown = end; return true;
}

function renderDex() {
  if (!dexTab) dexTab = dexAll().length ? 'made' : 'todo';
  paintLevel();
  for (const x of $('dexTabs').children) x.setAttribute('aria-pressed', String(x.dataset.f === dexTab));
  $('dexAbout').textContent = ABOUT[dexTab];
  document.querySelector('.dexcard').classList.toggle('tab-find', dexTab === 'find');
  $('dexQ').hidden = dexTab !== 'find';
  const base = baseList();
  paintInits(base);
  let list = dexTab !== 'find' && dexInit !== '전체' ? base.filter(w => initialOf(w) === dexInit) : base.slice();
  if (dexTab === 'made') list.sort(dexSort === 'cnt' ? (a, b) => (dex[b] - dex[a]) || a.localeCompare(b, 'ko') : (a, b) => a.localeCompare(b, 'ko'));
  dexList = list; dexShown = 0;
  dexFresh = new Set();
  if (dexTab === 'magic') {   // 이번에 처음 보는 발견 카드는 봉인이 풀리는 연출
    const opened = magicOpened(); for (const w of MAGIC_WORDS) if (magicSeen[w] && !opened.includes(w)) dexFresh.add(w);
    if (dexFresh.size) { store.set('jamo-magic-open', JSON.stringify([...opened, ...dexFresh])); if (!reduced) setTimeout(() => sfx('discover'), 380); }
  }
  const grid = $('dexGrid'); grid.innerHTML = ''; grid.scrollTop = 0;
  grid.classList.toggle('magicgrid', dexTab === 'magic');
  const meta = dexTab === 'made' || dexTab === 'todo';
  $('dexMeta').hidden = !meta;
  if (dexTab === 'todo') {
    const got = list.filter(w => dex[w]).length;
    $('dexMetaT').textContent = (dexInit === '전체' ? '' : dexInit + ' · ') + (dexLeftOnly ? '못 모은 낱말 ' + fmt(list.length) + '개' : fmt(got) + ' / ' + fmt(list.length) + ' 모음');
    $('dexSort').hidden = false; $('dexSort').textContent = dexLeftOnly ? '모두 보기' : '못 모은 것만';
  } else {
    $('dexMetaT').textContent = (dexInit === '전체' ? '' : dexInit + ' · ') + fmt(list.length) + '개';
    $('dexSort').hidden = dexTab !== 'made'; $('dexSort').textContent = dexSort === 'abc' ? '가나다순' : '많이 만든 순';
  }
  if (!list.length && dexTab !== 'find') grid.appendChild(mk('p', 'dexempty', dexTab === 'made' ? '아직 만든 낱말이 없어요. 게임에서 낱말을 만들면 카드가 쌓여요.' : '기본 낱말을 모두 모았어요!'));
  more();
  if (!$("dexOv").hidden) while (grid.scrollHeight <= grid.clientHeight + 40 && more()) {}
  $('dexBtn2').textContent = '도감 · ' + dexLevel().g;
}

$('dexGrid').addEventListener('scroll', () => {
  const g = $('dexGrid'); if (g.scrollTop + g.clientHeight > g.scrollHeight - 320) more();
}, { passive: true });
$('dexGrid').addEventListener('click', e => {
  const b = e.target.closest('.dw'); if (!b) return;
  const w = b.dataset.w; dexSel = w;
  for (const x of $('dexGrid').querySelectorAll('.sel')) x.classList.remove('sel'); b.classList.add('sel');
  if (dexTab === 'magic') showMagic(w); else if (dex[w] || dexTab === 'find') showMade(w); else showTodo(w);
});
$('dexInits').addEventListener('click', e => {
  const b = e.target.closest('.ichip'); if (!b) return;
  dexInit = b.dataset.k; dexSel = null; dexMsg(HINT[dexTab]); renderDex();
});
$('dexSort').onclick = () => {
  if (dexTab === 'todo') dexLeftOnly = !dexLeftOnly; else dexSort = dexSort === 'abc' ? 'cnt' : 'abc';
  renderDex();
};
for (const b of $('dexTabs').children) b.onclick = () => {
  if (dexTab === b.dataset.f) return;
  dexTab = b.dataset.f; dexInit = '전체'; dexSel = null; dexMsg(HINT[dexTab]);
  renderDex();
  if (dexTab === 'find') $('dexQ').focus();
};
function dexSearch() {
  const q = ($('dexQ').value || '').trim();
  if (!q) { dexMsg(HINT.find); renderDex(); return; }
  if ([...q].length === 1) { const nn = ALL.filter(w => w[0] === q).length; dexMsg('"' + q + '"로 시작하는 낱말 ' + fmt(nn) + '개' + (nn > 80 ? ' (앞의 80개만 보여요. 두 글자를 쳐서 찾아보세요)' : '')); renderDex(); return; }
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
  $('gradeSheet').hidden = true; dexLeftOnly = false; $('dexBtn').classList.remove('ding');
  if (magicCount() > magicOpened().length) dexTab = 'magic';   // 새로 찾은 숨은 낱말이 있으면 그 탭부터
  $('dexOv').hidden = false; dexMsg(HINT[dexTab]); renderDex();
  restart($('dexSeal'), 'pop');
}
function closeDex() { if (!$('gradeSheet').hidden) { closeGrades(); return; } $('dexOv').hidden = true; if (dexWasPlaying && G.playing) { G.paused = false; G.last = 0; updateItems(); } }
$('dexBtn').onclick = openDex; $('dexBtn2').onclick = openDex; $('dexClose').onclick = closeDex;
document.addEventListener('keydown', e => { if (e.key === 'Escape' && !$('dexOv').hidden) { e.stopPropagation(); closeDex(); } }, true);
