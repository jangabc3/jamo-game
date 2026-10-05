const TUT = [
  { h: '공을 떨어뜨려요', p: '화면을 누른 채 좌우로 움직이고, 손을 떼면 공이 떨어져요. 다음 공은 위쪽 "다음"에 보여요.', art: '<span class="mini c fall">ㄱ</span><span class="cap">손을 떼면 툭!</span>' },
  { h: '닿으면 글자가 돼요', p: '자음과 모음이 닿으면 한 글자가 되고, 받침 자음이 닿으면 받침이 붙어요. (바 + ㅇ = 방)', art: '<span class="mini c">ㄱ</span><span class="op">+</span><span class="mini v">ㅏ</span><span class="op">→</span><span class="mini s">가</span>' },
  { h: '두 글자가 낱말이 되면 펑!', p: '목표 낱말은 점수 두 배, 기본 낱말은 1.5배예요. 연달아 터뜨리면 얼쑤! 지화자! 콤보가 붙어요.', art: '<span class="mini s">가</span><span class="op">+</span><span class="mini s">방</span><span class="op">→</span><span class="mini w">가방</span>' },
  { h: '끝말잇기로 이어요', p: '낱말이 터지면 그 끝 글자가 "이을 글자"로 떠요. 그 글자로 시작하는 낱말을 이어서 만들면 점수가 점점 커져요. (가방 → 방학 → 학교) 끊겨도 괜찮아요, 새로 이어가면 돼요.', art: '<span class="mini w">가방</span><span class="op">→</span><span class="mini w">방학</span><span class="op">→</span><span class="mini w">학교</span>' },
  { h: '한 글자 낱말은 잠깐 기다려요', p: '약, 눈, 봄 같은 한 글자 낱말은 노란 테두리로 잠깐 기다려 줘요. 짝 글자를 만나면 약+사 = 약사처럼 두 글자 낱말이 되고, 공을 누르면 바로 터져요.', art: '<span class="mini f ripe">약</span><span class="op">+</span><span class="mini s">사</span><span class="op">→</span><span class="mini w">약사</span>' },
  { h: '사전에 있는 낱말은 다 돼요', p: '표준국어대사전의 두 글자 명사라면 무엇이든 터져요. 되는 낱말인지는 도감의 "사전"에서 찾아봐요.', art: '<span class="mini s">반</span><span class="op">+</span><span class="mini s">석</span><span class="op">→</span><span class="mini w">반석</span>' },
  { h: '점선을 넘으면 끝이에요', p: '공이 점선 위까지 쌓이면 끝나요. 막힐 땐 아래 지우개·폭죽·자석을 써요. 아이템은 낱말 세 개마다 하나씩 생겨요.', art: '<span class="mini c">ㅂ</span><span class="mini v">ㅏ</span><span class="mini s">바</span><span class="cap">점선 위로 쌓이면 끝!</span>' },
];
if (!ENABLE_SINGLES) { const i = TUT.findIndex(t => t.h.startsWith('한 글자')); if (i >= 0) TUT.splice(i, 1); }
if (!ENABLE_RELAY) { const i = TUT.findIndex(t => t.h.startsWith('끝말잇기')); if (i >= 0) TUT.splice(i, 1); }
let tutI = 0, tutThen = null;
function tutShow(back) {
  const t = TUT[tutI];
  { const c = document.querySelector('.tutcard'); c.classList.toggle('back', !!back); restart(c, 'go'); }
  $('tutArt').innerHTML = t.art; $('tutH').textContent = t.h; $('tutP').textContent = t.p;
  $('tutDots').innerHTML = TUT.map((_, i) => '<i class="' + (i === tutI ? 'on' : '') + '"></i>').join('');
  $('tutPrev').hidden = !tutI; $('tutBtns').classList.toggle('one', !tutI);
  $('tutNext').textContent = tutI === TUT.length - 1 ? '게임 시작' : '다음';
}
function openTut(then) { tutI = 0; tutThen = then; tutShow(); $('startOv').hidden = true; $('tutOv').hidden = false; $('tutNext').focus(); }
function closeTut(done) { $('tutOv').hidden = true; store.set('jamo-tut', '1'); if (tutThen) { const f = tutThen; tutThen = null; f(); } else $('startOv').hidden = false; }
document.addEventListener('click', e => { if (e.target.closest && e.target.closest('.btn, .seg button, .item, .iconbtn, .dextabs button')) { audio(); sfx('tap'); } }, true);
$('tutNext').onclick = () => { if (tutI < TUT.length - 1) { tutI++; tutShow(); } else closeTut(); };
$('tutPrev').onclick = () => { if (tutI > 0) { tutI--; tutShow(true); } };
$('tutSkip').onclick = () => closeTut();
$('howBtn').onclick = () => openTut(null);
$('startBtn').onclick = () => { if (!store.get('jamo-tut', '')) openTut(() => startGame(pickMode)); else startGame(pickMode); };
$('retryBtn').onclick = () => startGame(G.mode);
$('homeBtn').onclick = () => { bgmStop(); $('overOv').hidden = true; $('startOv').hidden = false; G.playing = false; selectMode(pickMode); refreshDailyBtn(); renderDex(); };
$('dailyBtn').onclick = () => startGame('daily');
$('contBtn').onclick = () => Ads.rewarded(() => {
  G.cont--;
  for (const b of [...G.balls]) if (b.position.y < G.danger + 110) { burst(b.position.x, b.position.y, 10, ['#FAF4E4', FILL[b.g.k]], 4); removeBall(b); }
  G.overT = 0; G.playing = true; G.over = false; G.ready = true; bgmStart();
  $('overOv').hidden = true; updateItems();
}, () => { $('oNote').hidden = false; $('oNote').textContent = '광고를 불러오지 못했어요. 잠시 뒤 다시 눌러 주세요.'; });

