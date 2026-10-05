function applyAudioPrefs() {
  if (sfxBus) sfxBus.gain.value = sfxOn ? 1 : 0;
  if (bgmBus && BGM.on) bgmBus.gain.setTargetAtTime(musicOn ? .5 : 0, AC.currentTime, .2);
}
function syncToggles() {
  const nm = { sfx: '효과음', bgm: '배경음', vib: '진동', hint: '힌트' };
  for (const b of $('setToggles').children) { const on = { sfx: sfxOn, bgm: musicOn, vib: vibOn, hint: hintOn }[b.dataset.k]; b.setAttribute('aria-pressed', String(on)); b.innerHTML = nm[b.dataset.k] + '<br>' + (on ? '켜짐' : '꺼짐'); }
}
for (const b of $('setToggles').children) b.onclick = () => {
  const k = b.dataset.k;
  if (k === 'sfx') { sfxOn = !sfxOn; store.set('jamo-sfx', sfxOn ? '1' : '0'); }
  if (k === 'bgm') { musicOn = !musicOn; store.set('jamo-bgm', musicOn ? '1' : '0'); }
  if (k === 'hint') { hintOn = !hintOn; store.set('jamo-hint', hintOn ? '1' : '0'); }
  if (k === 'vib') { vibOn = !vibOn; store.set('jamo-vib', vibOn ? '1' : '0'); buzz(30); }
  audio(); applyAudioPrefs(); syncToggles();
};
let setWasPlaying = false;
function openSettings() {
  setWasPlaying = G.playing && !G.paused;
  if (G.playing) { G.paused = true; updateItems(); }
  const inGame = G.playing;
  $('setTitle').textContent = inGame ? '일시정지' : '설정';
  $('setResume').textContent = inGame ? '계속하기' : '닫기';
  $('setGame').hidden = !inGame;
  syncToggles(); $('setOv').hidden = false; $('setResume').focus();
}
function closeSettings() {
  $('setOv').hidden = true;
  if (G.playing && setWasPlaying) { G.paused = false; G.last = 0; updateItems(); }
  setWasPlaying = false;
}
$('gear').onclick = () => { if ($('setOv').hidden) openSettings(); };
// 앱 전환·화면 꺼짐·전화: 게임 중이면 일시정지 창을 열고 소리를 재워요. 돌아와도 "계속하기"를 눌러야 이어져요
function onHide() {
  if (G.playing && !G.paused && $('setOv').hidden && $('dexOv').hidden) openSettings();
  try { if (AC && AC.state === 'running') AC.suspend(); } catch {}
}
function onShow() { try { if (AC && AC.state === 'suspended' && (sfxOn || musicOn)) AC.resume(); } catch {} G.last = 0; }
document.addEventListener('visibilitychange', () => { document.hidden ? onHide() : onShow(); });
window.addEventListener('pagehide', onHide);
window.addEventListener('blur', () => { if (document.hidden) onHide(); });
$('optBtn').onclick = openSettings;
$('setResume').onclick = closeSettings;
$('setHow').onclick = () => { const was = setWasPlaying; $('setOv').hidden = true; openTut(() => { setWasPlaying = was; $('setOv').hidden = false; }); };
$('setRestart').onclick = () => { $('setOv').hidden = true; setWasPlaying = false; startGame(G.mode); };
$('setHome').onclick = () => { $('setOv').hidden = true; setWasPlaying = false; G.paused = false; $('homeBtn').onclick(); };
document.addEventListener('keydown', e => { if (e.key === 'Escape' && $('dexOv').hidden && $('tutOv').hidden && !$('startOv').hidden === false) { $('setOv').hidden ? openSettings() : closeSettings(); } });
// 안드로이드 뒤로가기: 게임 중이면 일시정지 창을 열어요
try { history.replaceState({ jamo: 0 }, ''); } catch {}
function pushGuard() { try { history.pushState({ jamo: 1 }, ''); } catch {} }
window.addEventListener('popstate', () => {
  if (G.playing || !$('setOv').hidden) { if ($('setOv').hidden) openSettings(); else closeSettings(); pushGuard(); }
});
