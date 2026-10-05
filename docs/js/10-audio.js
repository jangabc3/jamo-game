
/* ---------- 소리 (외부 음원 없이 WebAudio로 직접 합성: 뮤직박스 + 말랑한 뾰로롱) ---------- */
let sfxOn = store.get('jamo-sfx', '1') !== '0', musicOn = store.get('jamo-bgm', '1') !== '0', vibOn = store.get('jamo-vib', '1') !== '0', hintOn = store.get('jamo-hint', '1') !== '0';
let AC = null, muted = false, master = null, sfxBus = null, bgmBus = null, noiseBuf = null;
function audio() {
  if (!AC) {
    try {
      AC = new (window.AudioContext || window.webkitAudioContext)();
      const comp = AC.createDynamicsCompressor(); comp.connect(AC.destination);
      master = AC.createGain(); master.gain.value = muted ? 0 : .9; master.connect(comp);
      sfxBus = AC.createGain(); sfxBus.connect(master);
      bgmBus = AC.createGain(); bgmBus.gain.value = 0; bgmBus.connect(master);
      noiseBuf = AC.createBuffer(1, AC.sampleRate * .5, AC.sampleRate);
      const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      sfxBus.gain.value = sfxOn ? 1 : 0;
    } catch { AC = null; }
  }
  if (AC && AC.state === 'suspended') AC.resume();
}
const scaleNote = i => 523.25 * Math.pow(2, Math.floor(i / 5)) * [1, 9 / 8, 5 / 4, 3 / 2, 5 / 3][((i % 5) + 5) % 5];
function note(f, d, vol = .14, delay = 0, o = {}) {
  if (!AC || muted) return;
  const t0 = AC.currentTime + delay, out = o.out || sfxBus;
  const g = AC.createGain(), lp = AC.createBiquadFilter();
  lp.type = 'lowpass'; lp.frequency.value = o.lp || 4500;
  g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + .008); g.gain.exponentialRampToValueAtTime(0.0001, t0 + d);
  g.connect(lp); lp.connect(out);
  const parts = o.bell ? [[1, 1], [2.76, .16], [5.4, .05]] : [[1, 1], [2, .22]];
  for (const [m, a] of parts) {
    const os = AC.createOscillator(); os.type = o.type || 'sine';
    os.frequency.setValueAtTime(f * m, t0);
    if (o.slide) os.frequency.exponentialRampToValueAtTime(f * m * o.slide, t0 + d * .8);
    const pg = AC.createGain(); pg.gain.value = a; os.connect(pg); pg.connect(g); os.start(t0); os.stop(t0 + d + .05);
  }
}
function puff(d, vol, f0, f1, delay = 0) {
  if (!AC || muted) return;
  const t0 = AC.currentTime + delay, src = AC.createBufferSource(), bp = AC.createBiquadFilter(), g = AC.createGain();
  src.buffer = noiseBuf; bp.type = 'bandpass'; bp.Q.value = 1.2;
  bp.frequency.setValueAtTime(f0, t0); bp.frequency.exponentialRampToValueAtTime(f1, t0 + d);
  g.gain.setValueAtTime(vol, t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + d);
  src.connect(bp); bp.connect(g); g.connect(sfxBus); src.start(t0); src.stop(t0 + d + .02);
}
const KIND_NOTE = { C: 0, V: 1, C2: 2, V2: 3, S: 4, F: 6, W: 7 };
function sfx(kind, v) {
  if (!sfxOn) return;
  if (kind === 'tap') { note(880, .05, .07, 0, { type: 'triangle', slide: .75 }); }
  if (kind === 'hint') { note(scaleNote(7), .25, .1, 0, { bell: true }); }
  if (kind === 'rare') { note(scaleNote(4), .22, .11, 0, { bell: true }); note(scaleNote(6), .3, .1, .07, { bell: true }); }
  if (kind === 'drop') { note(260, .09, .12, 0, { type: 'triangle', slide: .6 }); }
  if (kind === 'merge') { const f = scaleNote(KIND_NOTE[v] ?? 2); note(f, .2, .15, 0, { slide: 1.22, bell: true }); puff(.05, .04, 3000, 1200); }
  if (kind === 'single') { note(scaleNote(5), .22, .13, 0, { bell: true }); note(scaleNote(7), .3, .12, .07, { bell: true }); }
  if (kind === 'word') {
    const c = Math.max(1, v), o = Math.min(c - 1, 5);
    [0, 2, 3, 5].forEach((k, i) => note(scaleNote(o + k), .34, .14, i * .065, { bell: true }));
    note(scaleNote(o - 5), .3, .12, 0, { type: 'triangle', slide: 1.1 });
    puff(.18, .05, 5000, 1500);
    if (c >= 3) { note(scaleNote(o + 9), .5, .07, .3, { bell: true }); note(scaleNote(o + 7), .5, .06, .36, { bell: true }); }
  }
  if (kind === 'chain') { const c = Math.min(v, 9); for (let i = 0; i < 3; i++) note(scaleNote(c + i * 2), .26, .1, i * .05, { bell: true }); puff(.1, .04, 6000, 2500); }
  if (kind === 'erase') { note(520, .22, .1, 0, { type: 'triangle', slide: .4 }); puff(.12, .05, 4000, 800); }
  if (kind === 'bomb') { note(120, .45, .22, 0, { type: 'triangle', slide: .35 }); puff(.5, .22, 1800, 200); }
  if (kind === 'item') { note(scaleNote(5), .16, .12, 0, { bell: true }); note(scaleNote(8), .28, .12, .08, { bell: true }); }
  if (kind === 'new') { [5, 7, 9].forEach((k, i) => note(scaleNote(k), .3, .11, i * .08, { bell: true })); }
  if (kind === 'magnet') { note(200, .6, .1, 0, { type: 'triangle', slide: 2.4 }); }
  if (kind === 'magic') { [7, 9, 11, 14].forEach((k, i) => note(scaleNote(k), .42, .09, i * .07, { bell: true })); puff(.35, .035, 8000, 2500); }
  if (kind === 'discover') { [5, 7, 9, 12, 14].forEach((k, i) => note(scaleNote(k), .5, .1, .18 + i * .08, { bell: true })); }
  if (kind === 'quake') { note(70, .8, .22, 0, { type: 'triangle', slide: .5 }); puff(.7, .18, 500, 110); }
  if (kind === 'wind') { puff(1.3, .1, 300, 2400); puff(1.0, .06, 600, 3200, .25); }
  if (kind === 'ice') { [14, 12, 9, 7].forEach((k, i) => note(scaleNote(k), .5, .07, i * .08, { bell: true })); puff(.5, .04, 9000, 3500); }
  if (kind === 'bolt') { puff(.28, .26, 7000, 250); note(90, .4, .2, .04, { type: 'triangle', slide: .3 }); }
  if (kind === 'love') { [4, 6, 8, 11].forEach((k, i) => note(scaleNote(k), .6, .08, i * .12, { bell: true })); }
  if (kind === 'over') { [8, 6, 4, 1].forEach((k, i) => note(scaleNote(k), .5, .12, i * .16, { bell: true })); }
}
/* 배경음악: C-Am-F-G 네 마디를 도는 뮤직박스 */
const BGM = { on: false, step: 0, next: 0, timer: null };
const BASS = [261.6, 220, 174.6, 196], MEL = [2, -1, 3, -1, 4, 3, 2, -1, 4, -1, 3, -1, 2, 0, 1, -1, 3, -1, 2, -1, 1, 2, 3, -1, 4, 3, 2, 1, 0, -1, 1, -1];
function bgmPlay(i, delay) {
  const bar = Math.floor(i / 8) % 4;
  if (i % 8 === 0) note(BASS[bar] / 2, .7, .16, delay, { type: 'triangle', out: bgmBus, lp: 900 });
  if (i % 8 === 4) note(BASS[bar] * .75, .5, .09, delay, { type: 'triangle', out: bgmBus, lp: 900 });
  if (i % 8 === 2 || i % 8 === 6) note(BASS[bar] * 2, .25, .035, delay, { out: bgmBus, lp: 2500 });
  if (MEL[i] >= 0) note(scaleNote(MEL[i]), .5, .1, delay, { bell: true, out: bgmBus });
}
function bgmTick() {
  if (!AC || !BGM.on) return;
  const sd = 60 / (G.warn ? 120 : 94) / 2;
  while (BGM.next < AC.currentTime + .3) { bgmPlay(BGM.step % 32, Math.max(0, BGM.next - AC.currentTime)); BGM.step++; BGM.next += sd; }
}
function bgmStart() {
  if (!AC || BGM.on) return;
  BGM.on = true; BGM.step = 0; BGM.next = AC.currentTime + .15;
  bgmBus.gain.cancelScheduledValues(AC.currentTime); bgmBus.gain.setTargetAtTime(musicOn ? .5 : 0, AC.currentTime, .5);
  BGM.timer = setInterval(bgmTick, 90);
}
function bgmStop() {
  if (!BGM.on) return;
  BGM.on = false; clearInterval(BGM.timer);
  if (AC) bgmBus.gain.setTargetAtTime(0, AC.currentTime, .35);
}
