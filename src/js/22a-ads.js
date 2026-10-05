/* ---------- 광고 연결부 ----------
   지금은 광고 SDK가 없어서 광고 없이 바로 보상을 줘요(enabled = false).
   스토어 앱에서 AdMob을 붙일 때는 아래 두 함수 안만 바꾸면 돼요.
   (@capacitor-community/admob 플러그인 기준의 예시이며, 실제 사용 전 플러그인 문서로 확인하세요.) */
const Ads = {
  enabled: false,
  testing: true,                       // 출시 전에는 꼭 테스트 광고만 쓰세요
  ids: { rewarded: '', interstitial: '' },   // AdMob 광고 단위 ID (코드에 넣어도 되는 공개 값이에요)
  plugin() { return window.Capacitor && Capacitor.Plugins && Capacitor.Plugins.AdMob; },
  // 보상형: 끝까지 보면 onReward, 실패하거나 건너뛰면 onFail
  async rewarded(onReward, onFail = () => {}) {
    const AdMob = this.plugin();
    if (!this.enabled || !AdMob) { onReward(); return; }
    try {
      await AdMob.prepareRewardVideoAd({ adId: this.ids.rewarded, isTesting: this.testing });
      const r = await AdMob.showRewardVideoAd();
      if (r) onReward(); else onFail();
    } catch (e) { onFail(e); }
  },
  // 전면: 판이 끝난 뒤 N판마다 한 번. 너무 자주 띄우면 이탈이 늘어요
  every: 4,
  async afterGame(plays) {
    const AdMob = this.plugin();
    if (!this.enabled || !AdMob || plays % this.every) return;
    try { await AdMob.prepareInterstitial({ adId: this.ids.interstitial, isTesting: this.testing }); await AdMob.showInterstitial(); } catch (e) {}
  },
  label() { return this.enabled ? '광고 보고 이어하기' : '한 번 이어하기'; }
};
