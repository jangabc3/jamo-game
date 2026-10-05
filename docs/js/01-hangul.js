
/* ---------- 한글 ---------- */
const L = [...'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ'];
const VW = [...'ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ'];
const T = ['', ...'ㄱㄲㄳㄴㄵㄶㄷㄹㄺㄻㄼㄽㄾㄿㅀㅁㅂㅄㅅㅆㅇㅈㅊㅋㅌㅍㅎ'];
const FINAL_OK = new Set([...'ㄱㄲㄴㄷㄹㅁㅂㅅㅆㅇㅈㅊㅋㅌㅍㅎ']);
const VCOMP = { 'ㅗㅏ': 'ㅘ', 'ㅗㅐ': 'ㅙ', 'ㅗㅣ': 'ㅚ', 'ㅜㅓ': 'ㅝ', 'ㅜㅔ': 'ㅞ', 'ㅜㅣ': 'ㅟ', 'ㅡㅣ': 'ㅢ', 'ㅏㅣ': 'ㅐ', 'ㅓㅣ': 'ㅔ', 'ㅑㅣ': 'ㅒ', 'ㅕㅣ': 'ㅖ' };
const VSPLIT = {}; for (const k in VCOMP) VSPLIT[VCOMP[k]] = [...k];
const CDBL = { 'ㄱ': 'ㄲ', 'ㄷ': 'ㄸ', 'ㅂ': 'ㅃ', 'ㅅ': 'ㅆ', 'ㅈ': 'ㅉ' };
const CSPLIT = {}; for (const k in CDBL) CSPLIT[CDBL[k]] = k;
const compose = (l, v, t = '') => String.fromCharCode(0xAC00 + (L.indexOf(l) * 21 + VW.indexOf(v)) * 28 + T.indexOf(t));
const decompose = s => { const c = s.charCodeAt(0) - 0xAC00; return [L[Math.floor(c / 588)], VW[Math.floor((c % 588) / 28)], T[c % 28]]; };
const isSyl = ch => { const c = ch.charCodeAt(0); return c >= 0xAC00 && c <= 0xD7A3; };
const typeOf = ch => ch === '★' ? 'W' : isSyl(ch) ? (decompose(ch)[2] ? 'F' : 'S') : (L.includes(ch) ? 'C' : 'V');
const validSyl = s => true;   // 겹받침도 받침 두 개를 차례로 붙여 만들어요
const TCOMP = { 'ㄱㅅ': 'ㄳ', 'ㄴㅈ': 'ㄵ', 'ㄴㅎ': 'ㄶ', 'ㄹㄱ': 'ㄺ', 'ㄹㅁ': 'ㄻ', 'ㄹㅂ': 'ㄼ', 'ㄹㅅ': 'ㄽ', 'ㄹㅌ': 'ㄾ', 'ㄹㅍ': 'ㄿ', 'ㄹㅎ': 'ㅀ', 'ㅂㅅ': 'ㅄ' };
const TSPLIT = Object.fromEntries(Object.entries(TCOMP).map(([k, v]) => [v, [...k]]));
const initials = w => [...w].map(s => decompose(s)[0]).join('');
