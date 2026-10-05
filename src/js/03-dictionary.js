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
const dexCount = () => CORE.filter(w => dex[w]).length;            // 기본 낱말 중 모은 수
const dexMadeN = () => { let n = 0; for (const w in dex) if (WORDS.has(w) || SINGLES.has(w)) n++; return n; };   // 모은 낱말(모든 낱말, 한 번씩만 세요)
/* 도감 급수: 9급에서 시작해 1급까지 올라가고, 그 위에 특급과 명인이 있어요.
   기준은 하나예요. 새 낱말을 만들 때마다 한 칸씩 올라가요(같은 낱말은 한 번만 세요).
   명인은 낱말 수에 더해 숨은 낱말을 모두 찾아야 해요. */
const GRADES = [
  { g: '9급', s: '9', n: 0, t: '새싹' },
  { g: '8급', s: '8', n: 10, t: '떡잎' },
  { g: '7급', s: '7', n: 25, t: '줄기' },
  { g: '6급', s: '6', n: 50, t: '가지' },
  { g: '5급', s: '5', n: 90, t: '꽃봉오리' },
  { g: '4급', s: '4', n: 150, t: '꽃' },
  { g: '3급', s: '3', n: 230, t: '열매' },
  { g: '2급', s: '2', n: 340, t: '나무' },
  { g: '1급', s: '1', n: 500, t: '숲' },
  { g: '특급', s: '특', n: 800, t: '사전지기', top: 1 },
  { g: '명인', s: '명인', n: 1200, t: '한글 명인', top: 2, magic: true },
];
function magicAll() { try { return MAGIC_WORDS.every(w => magicSeen[w]); } catch { return false; } }
const gradeOk = (k, n) => n >= GRADES[k].n && (!GRADES[k].magic || magicAll());
function dexLevel(n = dexMadeN()) {
  let i = 0; while (i + 1 < GRADES.length && gradeOk(i + 1, n)) i++;
  const cur = GRADES[i], nx = GRADES[i + 1] || null;
  return { i, ...cur, name: cur.g + ' · ' + cur.t, from: cur.n, to: nx ? nx.n : null, next: nx, n };
}
function recordWord(w) {
  if (dex[w]) { dex[w]++; store.set('jamo-dex', JSON.stringify(dex)); return false; }
  const lv0 = dexLevel().i;
  dex[w] = 1; store.set('jamo-dex', JSON.stringify(dex));
  gradeCheck(lv0);
  return true;
}
// 급수가 올랐으면 게임 화면에 알려요 (숨은 낱말로 명인이 될 때도 불러요)
function gradeCheck(lv0) {
  const lv = dexLevel();
  if (lv.i > lv0 && typeof G !== 'undefined' && G.playing) setTimeout(() => {
    sfx('new'); buzz([30, 40, 70]); gradeStamp(lv);
    const b = $('dexBtn'); if (b) restart(b, 'bump');
  }, 1800);   // 낱말 카드가 사라진 뒤에 찍혀요
}

// 급수가 오르면 화면 가운데에 급수 도장이 쾅 찍혀요 (게임은 멈추지 않아요)
function gradeStamp(lv) {
  if (reduced) { float('도감 ' + lv.g + ' 달성! · ' + lv.t, W / 2, 230, 24, '#3F7F77', true); return; }
  const e = document.createElement('div'); e.className = 'gradeup' + (lv.top ? ' top' + lv.top : ''); e.setAttribute('aria-hidden', 'true');
  e.innerHTML = '<i class="gu-ring"></i><span class="gu-seal' + (lv.s.length > 1 ? ' wide' : '') + '"><b></b>' + (lv.top ? '' : '<small>급</small>') + '</span><span class="gu-txt"><small>도감 급수 달성</small><strong></strong></span>';
  e.querySelector('.gu-seal b').textContent = lv.s; e.querySelector('.gu-txt strong').textContent = lv.g + ' · ' + lv.t;
  document.body.appendChild(e); setTimeout(() => e.remove(), 2300);
}
