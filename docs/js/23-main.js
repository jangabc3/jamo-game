
const PERF = { cap: (navigator.hardwareConcurrency || 8) <= 4 ? 1.5 : 2, n: 0, sum: 0, low: 0 };
function resize() {
  const st = $('stage');
  const sw = st.clientWidth, sh = st.clientHeight;
  G.scale = Math.max(.4, Math.min(sw / W, sh / H));
  G.dpr = Math.min(window.devicePixelRatio || 1, PERF.cap);
  cv.style.width = W * G.scale + 'px'; cv.style.height = H * G.scale + 'px';
  cv.width = Math.round(W * G.scale * G.dpr); cv.height = Math.round(H * G.scale * G.dpr);
}
window.addEventListener('resize', resize);

initDeco();
initWorld(); resize(); selectMode(pickMode); setNext(); renderDex(); refreshDailyBtn(); updateItems();
(document.fonts && document.fonts.load ?  Promise.all([document.fonts.load("700 30px 'Gowun Batang'"), document.fonts.load("800 30px 'Hahmlet'"), document.fonts.load("16px 'Gowun Dodum'")]) : Promise.resolve()).catch(() => {}).finally(() => requestAnimationFrame(step));
