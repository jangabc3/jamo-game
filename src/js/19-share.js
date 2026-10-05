async function makeCard() {
  try { await Promise.all([document.fonts.load("800 40px 'Hahmlet'"), document.fonts.load("400 40px 'Nanum Brush Script'"), document.fonts.load("700 40px 'Gowun Batang'"), document.fonts.load("20px 'Gowun Dodum'")]); } catch {}
  const c = document.createElement('canvas'); c.width = 1080; c.height = 1350; const x = c.getContext('2d');
  const daily = G.mode === 'daily', INKC = '#3A2D24', RED = '#B8321F';
  x.fillStyle = '#EFE4CC'; x.fillRect(0, 0, 1080, 1350);
  x.fillStyle = 'rgba(58,45,36,.16)'; x.fillRect(86, 96, 920, 1170);
  x.fillStyle = '#FAF4E4'; x.fillRect(70, 80, 920, 1170);
  x.strokeStyle = 'rgba(90,58,38,.14)'; x.lineWidth = 2; x.beginPath();
  for (let i = 1; i < 8; i++) { const gx = 70 + i * 115; x.moveTo(gx, 80); x.lineTo(gx, 1250); }
  for (let i = 1; i < 10; i++) { const gy = 80 + i * 117; x.moveTo(70, gy); x.lineTo(990, gy); }
  x.stroke();
  x.strokeStyle = INKC; x.lineWidth = 6; x.strokeRect(70, 80, 920, 1170);
  x.textAlign = 'center'; x.textBaseline = 'alphabetic'; x.fillStyle = INKC;
  x.font = "400 150px 'Nanum Brush Script','Gowun Batang',serif"; x.fillText('자모게임', 540, 270);
  x.font = "400 34px 'Gowun Dodum',sans-serif"; x.fillStyle = '#7C6B55';
  x.fillText(daily ? (VS.friend ? '친구와 같은 공 대결' : '같은 공 대결') : MODES[G.mode][0] + ' 모드', 540, 330);
  // 급수 도장
  const rk = rankOf(G.score);
  x.save(); x.translate(540, 470); x.rotate(-.04);
  x.font = "400 96px 'Nanum Brush Script','Gowun Batang',serif"; const w = x.measureText(rk).width + 90;
  x.strokeStyle = RED; x.lineWidth = 7; x.strokeRect(-w / 2, -80, w, 124); x.strokeStyle = 'rgba(184,50,31,.45)'; x.lineWidth = 2; x.strokeRect(-w / 2 + 9, -71, w - 18, 106);
  x.fillStyle = RED; x.fillText(rk, 0, 20); x.restore();
  x.fillStyle = INKC; x.font = "800 200px 'Hahmlet','Gowun Batang',serif"; x.fillText(String(G.score), 540, 760);
  x.font = "400 36px 'Gowun Dodum',sans-serif"; x.fillStyle = '#7C6B55'; x.fillText('점', 540, 815);
  const rows = daily ? [['낱말', G.wordsMade + '개'], ['최장 연쇄', G.maxChain >= 2 ? G.maxChain + '번' : '-']] : [['낱말', G.wordsMade + '개'], ['최장 연쇄', G.maxChain >= 2 ? G.maxChain + '번' : '-'], ['최고 콤보', G.maxCombo ? G.maxCombo + '번' : '-']];
  const cw = 860 / rows.length;
  rows.forEach((r, i) => { const cx = 110 + cw * i + cw / 2;
    x.fillStyle = '#7C6B55'; x.font = "400 32px 'Gowun Dodum',sans-serif"; x.fillText(r[0], cx, 900);
    x.fillStyle = INKC; x.font = "800 56px 'Hahmlet',serif"; x.fillText(r[1], cx, 970); });
  x.strokeStyle = 'rgba(90,70,54,.4)'; x.lineWidth = 2; x.beginPath(); x.moveTo(130, 1030); x.lineTo(950, 1030); x.stroke();
  if (G.topWord) {
    x.fillStyle = INKC; x.font = "700 84px 'Gowun Batang',serif"; x.fillText(G.topWord, 540, 1130);
    x.fillStyle = '#7C6B55'; x.font = "400 30px 'Gowun Dodum',sans-serif";
    const d = (DEF[G.topWord] || '').slice(0, 34); x.fillText(d + (DEF[G.topWord] && DEF[G.topWord].length > 34 ? '…' : ''), 540, 1185);
  }
  x.fillStyle = RED; x.font = "800 34px 'Hahmlet',serif"; x.fillText('내 점수 깰 수 있어?', 540, 1300);
  return new Promise(res => c.toBlob(res, 'image/png'));
}
$('shareBtn').onclick = async () => {
  const text = finishText(), btn = $('shareBtn'), old = btn.textContent;
  let ok = false;
  btn.textContent = '카드를 만드는 중…';
  try {
    const blob = await makeCard();
    const file = blob && new File([blob], 'jamogame.png', { type: 'image/png' });
    if (file && navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], text }); ok = true; }
    else if (blob) { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'jamogame.png'; document.body.appendChild(a); a.click(); a.remove(); ok = true; btn.textContent = '이미지를 저장했어요'; setTimeout(() => { btn.textContent = old; }, 1800); return; }
  } catch (e) { if (e && e.name === 'AbortError') { btn.textContent = old; return; } }
  if (!ok) { try { if (navigator.share) { await navigator.share({ text }); ok = true; } } catch (e) { if (e && e.name === 'AbortError') { btn.textContent = old; return; } } }
  if (!ok) { try { await navigator.clipboard.writeText(text); ok = true; } catch {} }
  btn.textContent = ok ? '공유했어요' : '공유가 안 돼요. 화면을 캡처해 주세요';
  setTimeout(() => { btn.textContent = old; }, 1800);
};
