
/* ---------- 게임 흐름 ---------- */
function tutHook() {}
function startGame(mode) {
  audio(); bgmStart(); pushGuard();
  G.mode = mode; loadBest();
  initWorld();
  const base = { score: 0, combo: 0, lastPop: 0, wordsMade: 0, topWord: null, topPts: 0, ready: true, playing: true, over: false, overT: 0, paused: false,
    items: { eraser: 1, bomb: 1, wild: 1, magnet: 1, shake: 1 }, tool: null, stash: null, magnetUntil: 0, shieldUntil: 0, loveN: 0, magicAt: -1e9, foundNow: [], cont: 1, cm: 0, seen: {}, hintRare: false, target: null,
    danger: DANGER0, lastDrop: G.now, nextGrow: G.now + 3500, slowUntil: 0, freezeUntil: 0, bump: null, banner: null, quietT: 0, recordHit: false, startBest: G.best, seq: [], dailyT: [], dailyDone: [], easy: (+store.get('jamo-plays', '0') || 0) < 2, lastWord: null, need: null, relay: 0, maxRelay: 0, relayFlash: 0, maxChain: 0, maxCombo: 0, chain: 0, chainT: 0, next2: null };
  Object.assign(G, base);
  $('vig').className = ''; rkIdx = 0; updateRank(false);
  shownScore = 0; $('score').textContent = 0; $('scoreL').textContent = '점수';
  G.fx = { parts: [], rings: [], floats: [], fly: [] };
  if (mode === 'daily') {
    const d = buildDaily(vsKey());
    G.dailyT = d.targets; G.dailyDone = d.targets.map(() => false); G.seq = d.seq;
  }
  G.cur = mode === 'daily' ? genJamo() : pickW(CW); G.next = mode === 'daily' ? genJamo() : pickW(VWT); G.next2 = genJamo(); setNext();
  $('startOv').hidden = true; $('overOv').hidden = true; $('dexOv').hidden = true;
  restart($('stage'), 'in');
  applyBg(0);
  if (mode === 'daily') $('best').textContent = '-';
  updateItems();
}
function finishText() {
  const m = G.mode;
  const base = `자모게임 ${MODES[m][0]}`;
  if (m === 'daily') return `자모게임 같은 공 대결\n내 점수 ${G.score}점 (${rankOf(G.score)})${VS.friend ? (G.score > VS.friend ? ' · 친구를 이겼어요!' : G.score < VS.friend ? ' · 아쉽게 졌어요' : ' · 비겼어요') : ''}\n같은 공으로 나를 이겨봐! ${vsLink()}`;
  return `${base}\n${G.score}점 · ${rankOf(G.score)} · 낱말 ${G.wordsMade}개${G.maxRelay >= 2 ? ' · 끝말잇기 ' + G.maxRelay + '단어' : ''}${G.topWord ? ' · 최고 득점 낱말 ' + G.topWord : ''}\n내 점수 깰 수 있어? ${location.origin + location.pathname}`;
}
function gameOver(finished) {
  $('vig').className = '';
  G.playing = false; G.over = true; G.tool = null; bgmStop();
  if (G.mode !== 'daily') store.set('jamo-plays', String((+store.get('jamo-plays', '0') || 0) + 1));
  const daily = G.mode === 'daily';
  if (daily) vsSave(G.score);
  sfx(finished ? 'new' : 'over'); buzz([60, 40, 60]); shakeIt(8);
  const rec = !daily && G.recordHit;
  if (rec) confetti(120);
  fillOver(rec, finished);
  if (!daily) Ads.afterGame(+store.get('jamo-plays', '0') || 0);
  setTimeout(() => { $('overOv').hidden = false; ($('retryBtn').hidden ? $('shareBtn') : $('retryBtn')).focus(); }, 650);
  updateItems(); refreshDailyBtn();
}
const RANKS = [[0, '한글 새내기'], [300, '서당 학동'], [800, '글방 훈장'], [1800, '집현전 학사'], [4000, '훈민정음 장인']];
let rkIdx = 0;
function updateRank(celebrate) {
  const sc = G.score; let i = 0; while (i + 1 < RANKS.length && sc >= RANKS[i + 1][0]) i++;
  const bar = $('rankbar'), nxt = RANKS[i + 1];
  $('rkName').textContent = RANKS[i][1];
  $('rkFill').style.width = (nxt ? Math.min(100, (sc - RANKS[i][0]) / (nxt[0] - RANKS[i][0]) * 100) : 100) + '%';
  $('rkNext').textContent = nxt ? nxt[1] + ' ' + nxt[0] + '점' : '최고 칭호';
  if (celebrate && i > rkIdx && G.playing) {
    float('새 칭호! ' + RANKS[i][1], W / 2, 270, 28, '#B8321F', true); confetti(60); sfx('new'); buzz([30, 30, 60]);
    bar.classList.remove('up'); void bar.offsetWidth; bar.classList.add('up');
  }
  rkIdx = i;
}
const rankOf = sc => { let n = RANKS[0][1]; for (const [t, nm] of RANKS) if (sc >= t) n = nm; return n; };
function fillOver(rec, finished) {
  const daily = G.mode === 'daily';
  $('oTitle').textContent = daily ? (finished ? '대결 끝!' : '그릇이 넘쳤어요') : finished ? '끝!' : '그릇이 넘쳤어요';
  $('oRec').hidden = !rec;
  { const r = rankOf(G.score); const el = $('oRank'); el.hidden = false; el.textContent = r; }
  countUp($('oScore'), G.score, 900); $('oBest').textContent = daily ? G.dailyDone.filter(Boolean).length + '/' + G.dailyT.length : G.best;
  $('oBestL').textContent = daily ? '완성한 목표' : '최고 기록';
  countUp($('oWords'), G.wordsMade, 700); $('oChain').textContent = (G.maxChain >= 2 ? G.maxChain + '번' : '-'); $('oCombo').textContent = (G.maxCombo ? G.maxCombo + '번' : '-'); $('oTop').textContent = G.topWord || '-';
  { const el = $('oMagic'), n = magicCount(), all = MAGIC_WORDS.length;
    el.hidden = daily;
    el.textContent = G.foundNow.length ? '숨은 낱말 발견: ' + G.foundNow.join(', ') + ' (' + n + '/' + all + ')' : n === 0 ? '게임 속에 숨은 낱말이 ' + all + '개 있어요. 도감에서 단서를 찾아보세요' : n < all ? '숨은 낱말 ' + n + '/' + all : '숨은 낱말을 모두 찾았어요!'; }
  $('oTopDef').textContent = G.topWord ? '한 번에 가장 많은 점수를 준 낱말 · +' + G.topPts + '점' + (DEF[G.topWord] ? '\n' + DEF[G.topWord] : '') : '';
  const grid = $('oGrid'); grid.hidden = !daily; grid.innerHTML = '';
  if (daily) {
    const fr = VS.friend, me = G.score, best = vsBest();
    grid.style.display = 'block';
    grid.innerHTML = '';
    const row = document.createElement('div'); row.className = 'vsrow';
    const mk = (lab, val, win) => { const d = document.createElement('div'); if (win) d.className = 'win'; const sm = document.createElement('small'); sm.textContent = lab; const bb = document.createElement('b'); bb.textContent = val; d.append(sm, bb); return d; };
    if (fr) {
      const vs = document.createElement('span'); vs.className = 'vs'; vs.textContent = 'VS';
      row.append(mk('나', me, me > fr), vs, mk('친구', fr, fr > me));
      const res = document.createElement('div'); res.className = 'vsres'; res.style.cssText = 'text-align:center;margin-top:6px;color:' + (me > fr ? '#B8321F' : '#7C6B55');
      res.textContent = me > fr ? '이겼어요! ' + (me - fr) + '점 차' : me === fr ? '비겼어요!' : '아쉬워요, ' + (fr - me) + '점 차';
      grid.append(row, res);
    } else {
      const vs = document.createElement('span'); vs.className = 'vs'; vs.textContent = '/';
      row.append(mk('이번 판', me, me >= best), vs, mk('내 최고', best, false));
      const res = document.createElement('div'); res.className = 'vsres'; res.style.cssText = 'text-align:center;margin-top:6px;color:#7C6B55;font-size:14px;font-weight:400';
      res.textContent = '친구에게 보내면 같은 공으로 겨뤄 볼 수 있어요';
      grid.append(row, res);
    }
  }
  $('retryBtn').hidden = false; $('retryBtn').textContent = daily ? '다시 도전' : '다시 하기'; $('contBtn').hidden = daily || !G.cont; $('contBtn').textContent = Ads.label();
  $('shareBtn').textContent = daily ? '친구에게 대결 신청' : '친구에게 도전장 보내기';
  $('oNote').textContent = daily ? '똑같은 공이 나오는 대결이에요. 같은 날이면 누구나 같은 순서예요.' : '위쪽 공 몇 개를 치우고 한 번 더 이어가요.';
  $('oNote').hidden = daily ? false : !G.cont;
}
