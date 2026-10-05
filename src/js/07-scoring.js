
/* ---------- 점수/단어 ---------- */
function activeTarget() {
  if (G.mode === 'daily') { const i = G.dailyDone.indexOf(false); return i < 0 ? null : G.dailyT[i]; }
  return G.target ? G.target.word : null;
}
function comboStep() {
  G.combo = G.now - G.lastPop < 2200 ? G.combo + 1 : 1;
  G.lastPop = G.now; G.maxCombo = Math.max(G.maxCombo || 0, G.combo);
  return 1 + (G.combo - 1) * 0.5;
}
function checkRecord(x, y) {
  if (!G.recordHit && G.startBest > 0 && G.score > G.startBest && G.mode !== 'daily') {
    G.recordHit = true;
    float('신기록!', W / 2, 250, 34, '#B8321F', true);
    confetti(70); sfx('new'); buzz([30, 30, 60]);
  }
}
function earnItem() {
  const keys = Object.keys(ITEMS).filter(k => G.items[k] < 3);
  if (!keys.length) return;
  const k = keys[Math.floor(Math.random() * keys.length)];
  G.items[k]++; updateItems(); sfx('item');
  float('+' + ITEMS[k], W / 2, 300, 26, '#3F7F77', true);
  const el = $(k); el.classList.remove('pulse'); void (el.offsetWidth); el.classList.add('pulse');
}
// 낱말 카드: 작은 글씨를 공 위에 흩뿌리지 않고 카드 아래 한 줄(tags)로 모아요
function showBanner(word, x, y, tags) {
  const first = recordWord(word), core = CORESET.has(word);
  G.banner = { word, def: DEF[word] || '', isNew: first && core, rare: first && !core, tags: tags || [], t: G.now };
  if (first) sfx('new');
  return first;
}
function wordPop(word, x, y, parts) {
  const common = CORESET.has(word);
  const mult = common ? comboStep() : 1;
  const jamo = [...word].reduce((n, s) => { const [l, v, t] = decompose(s); return n + (CSPLIT[l] ? 2 : 1) + (VSPLIT[v] ? 2 : 1) + (t ? 1 : 0); }, 0);
  let hit = false;
  if (G.mode === 'daily') { const i = G.dailyT.indexOf(word); if (i >= 0 && !G.dailyDone[i]) { G.dailyDone[i] = true; hit = true; } }
  else if (G.target && G.target.word === word) { hit = true; }
  const nSeen = G.seen[word] || 0; G.seen[word] = nSeen + 1;
  const firstEver = !dex[word];   // 도감에 처음 올라가는 낱말
  const rep = Math.max(.25, 1 - .25 * nSeen);
  const base = common ? (30 + jamo * 6) * 1.5 * mult : (TIER[word] === 'B' ? 16 + jamo * 3 : TIER[word] === 'C' ? 8 + jamo * 2 : 5 + jamo * 1.5);
  let relayMul = 1;
  if (ENABLE_RELAY) {
  if (G.lastWord && word[0] === G.lastWord[G.lastWord.length - 1]) G.relay++;
  else { if (G.relay >= 2) float('끝말잇기가 끊겼어요', W / 2, 330, 15, '#7C6B55'); G.relay = 1; }
  G.maxRelay = Math.max(G.maxRelay || 0, G.relay);
  if (G.relay >= 2) relayMul = Math.min(3, 1 + 0.25 * (G.relay - 1));
  G.lastWord = word; G.need = word[word.length - 1]; G.relayFlash = G.now;
  }
  const pts = Math.max(1, Math.round(base * rep * (hit ? 2 : 1) * relayMul));
  const rareBonus = firstEver && !common && G.mode !== 'daily' ? 10 : 0;   // 처음 만든 희귀 낱말은 보너스
  addScore(pts + rareBonus, x, y - 10, true);
  if (hit) float('목표 달성 ×2', W / 2, 262, 26, '#B8321F', true);
  if (G.relay >= 2) { float('끝말잇기 ×' + relayMul.toFixed(2).replace(/\.?0+$/, '') + ' · ' + G.relay + '단어', W / 2, 296, 20 + Math.min(G.relay, 6), '#8A5A00', true); sfx('chain', G.relay + 2); buzz([20, 20, 40]); }
  if (G.mode !== 'daily' && (hit || G.relay >= 1)) newTarget();
  G.wordsMade++;
  if (pts + rareBonus > G.topPts) { G.topPts = pts + rareBonus; G.topWord = word; }
  const tags = [];
  if (common) tags.push('기본 낱말 +50%');
  if (rareBonus) tags.push('희귀 낱말 +' + rareBonus);
  if (firstEver) tags.push('도감 +1');
  if (nSeen) tags.push('같은 낱말 −' + Math.round((1 - rep) * 100) + '%');
  showBanner(word, x, y, tags);
  if (common && G.combo > 1) float(['', '', '얼쑤! ×2', '좋다! ×3', '지화자! ×4', '얼씨구! ×5'][Math.min(G.combo, 5)] + (G.combo > 5 ? ' ×' + G.combo : ''), W / 2, 226, 30, '#B8321F', true);
  ring(x, y, 70, '#E8BC52'); ring(x, y, 40, '#FAF4E4');
  if (rareBonus) { burst(x, y, 26, ['#EDC565', '#F6DA82', '#FAF4E4', '#D9A93A'], 5.5); ring(x, y, 90, '#D9A93A'); }
  else burst(x, y, common ? 34 : 12, ['#DB6F5C', '#6C9CC4', '#EDC565', '#7DB08C', '#FAF4E4'], common ? 6.5 : 4);
  shakeIt(common ? 7 + Math.min(G.combo, 5) : 2);
  if (!reduced && common) { G.slowUntil = G.now + 420; G.bump = { t: G.now, x, y, a: .07 + Math.min(G.combo, 5) * .01 }; }
  sfx(common ? 'word' : 'rare', G.combo);
  tutHook('word', common);
  buzz(G.combo >= 4 ? [30, 20, 50, 20, 80] : G.combo >= 2 ? [25, 25, 50] : [20, 30, 40]);
  G.cm++; if (G.cm % 3 === 0) earnItem();
  updateMeter();
  checkRecord(x, y);
  if (MAGIC[word]) setTimeout(() => castMagic(word, x, y), 0);   // 처리 중인 합치기가 끝난 뒤에 마법을 써요
}
function singlePop(b) {
  const { x, y } = b.position;
  const w = b.g.ch;
  removeBall(b);
  const mult = comboStep();
  addScore(Math.round(15 * mult), x, y, true);
  G.wordsMade++;
  showBanner(w, x, y);
  ring(x, y, 50, '#6FA37E');
  burst(x, y, 18, ['#6FA37E', '#E8BC52', '#FAF4E4', '#1F1B18'], 4.8);
  shakeIt(3);
  sfx('single', G.combo);
  buzz(15);
  if (G.wordsMade % 4 === 0) earnItem();
  checkRecord(x, y);
}
