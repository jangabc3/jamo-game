const DEF = {};
const TIER = {};
for (const line of DICT_SRC.split('\n')) { const q = line.split('|'); if (q.length >= 3) { DEF[q[0]] = q[1]; TIER[q[0]] = q[2].trim(); } }
const ALL = Object.keys(DEF).filter(w => [...w].every(s => isSyl(s) && validSyl(s))).sort((a, b) => a.localeCompare(b, 'ko'));
const WORDS = new Set(ALL.filter(w => w.length === 2));
const ENABLE_RELAY = false;   // 끝말잇기 체인 (너무 어려워서 끔)
const ENABLE_VS = false;      // 같은 공 대결 (끔)
const TAP_RARE = false;      // 흔하지 않은 낱말을 눌러서 확인하는 방식 (사용 안 함)
const ENABLE_SINGLES = false;   // 한 글자 낱말(약·눈…) 사용 여부
const SINGLES = new Set(ENABLE_SINGLES ? ALL.filter(w => w.length === 1 && decompose(w)[2]) : []);
const PARTNERS = {};
for (const w of WORDS) { const [a, b] = [...w]; (PARTNERS[a] = PARTNERS[a] || []).push(b); (PARTNERS[b] = PARTNERS[b] || []).push(a); }
const CORE = ALL.filter(w => TIER[w] === 'A' && (WORDS.has(w) || SINGLES.has(w)));
const CORESET = new Set(CORE);
const CPARTNERS = {};
for (const w of CORE) if (w.length === 2) { const [a, b] = [...w]; (CPARTNERS[a] = CPARTNERS[a] || []).push(b); (CPARTNERS[b] = CPARTNERS[b] || []).push(a); }
const TOTAL = CORE.length;

/* ---------- 도감 저장 ---------- */
let dex = {};
try { dex = JSON.parse(store.get('jamo-dex', '{}')) || {}; } catch { dex = {}; }
const dexCount = () => CORE.filter(w => dex[w]).length;
const dexExtra = () => Object.keys(dex).filter(w => !CORESET.has(w) && (WORDS.has(w) || SINGLES.has(w))).length;
// 도감 등급: 자주 쓰는 낱말을 몇 개 모았는지로 정해요
const DEX_LV = [[0, '낱말 새싹'], [10, '글방 학동'], [40, '서당 동무'], [100, '낱말 수집가'], [200, '한글 박사'], [400, '집현전 학사'], [700, '어휘 달인'], [1000, '도감왕']];
function dexLevel(n = dexCount()) {
  let i = 0; while (i + 1 < DEX_LV.length && n >= DEX_LV[i + 1][0]) i++;
  return { i, name: DEX_LV[i][1], from: DEX_LV[i][0], to: DEX_LV[i + 1] ? DEX_LV[i + 1][0] : null };
}
function recordWord(w) {
  if (dex[w]) { dex[w]++; store.set('jamo-dex', JSON.stringify(dex)); return false; }
  const lv0 = dexLevel().i;
  dex[w] = 1; store.set('jamo-dex', JSON.stringify(dex));
  if (CORESET.has(w) && dexLevel().i > lv0 && typeof G !== 'undefined' && G.playing) setTimeout(() => { float('도감 등급 상승! ' + dexLevel().name, W / 2, 230, 24, '#3F7F77', true); sfx('new'); }, 700);
  return true;
}
