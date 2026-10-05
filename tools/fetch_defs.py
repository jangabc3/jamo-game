#!/usr/bin/env python3
"""뜻풀이가 비어 있는 낱말을 표준국어대사전 오픈 API로 채워요.

준비 (둘 중 하나, 키는 사이트마다 따로 받아요)
  - 우리말샘(기본): https://opendict.korean.go.kr 로그인 → 오픈 API → 인증 키 신청. 하루 50,000건. 사용 URL 칸에는 배포 주소를 적어요
  - 표준국어대사전: https://stdict.korean.go.kr/openapi/openApiInfo.do
실행:
    export STDICT_KEY=발급받은키        # 이름은 같고 사이트만 --source 로 고르면 돼요
    python3 tools/fetch_defs.py --source stdict   # 표준국어대사전을 쓰려면 (기본은 opendict)
    python3 tools/fetch_defs.py            # 이어받기 가능. 중간에 멈춰도 data/defs_cache.json에 저장돼요
    python3 tools/fetch_defs.py --limit 200   # 먼저 200개만 시험
    python3 tools/fetch_defs.py --apply    # 받은 뜻을 data/dict.txt에 합치기
그다음 python3 tools/build.py 로 다시 빌드해요.
키는 코드나 저장소에 넣지 말고 환경변수로만 쓰세요.
"""
import json, os, re, sys, time, urllib.parse, urllib.request
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DICT, CACHE = os.path.join(ROOT, 'data/dict.txt'), os.path.join(ROOT, 'data/defs_cache.json')
SRC = {'opendict': 'https://opendict.korean.go.kr/api/search', 'stdict': 'https://stdict.korean.go.kr/api/search.do'}
source = sys.argv[sys.argv.index('--source') + 1] if '--source' in sys.argv else 'opendict'
URL = SRC[source]
MAXLEN = 46          # 앱 용량을 위해 뜻을 이 길이로 줄여요

def clean(t):
    t = re.sub(r'<[^>]+>|\[[^\]]*\]|\([^)]*\)', '', t)           # 태그, [..], (..) 제거
    t = re.sub(r'\s+', ' ', t.replace('|', '/').replace('`', "'")).strip()
    if len(t) > MAXLEN:
        cut = max(t.rfind(' ', 0, MAXLEN), t.rfind(',', 0, MAXLEN))
        t = t[:cut if cut > 20 else MAXLEN].rstrip(' ,') + '…'
    return t

def lookup(word, key):
    q = urllib.parse.urlencode({'key': key, 'q': word, 'req_type': 'json', 'method': 'exact', 'num': 10})
    with urllib.request.urlopen(URL + '?' + q, timeout=15) as r:
        raw = r.read().decode('utf8')
    if not raw.strip(): return None                                # 결과 없음
    data = json.loads(raw)
    if 'error' in data: raise RuntimeError(json.dumps(data['error'], ensure_ascii=False))
    items = (data.get('channel') or {}).get('item') or []
    if isinstance(items, dict): items = [items]
    for pref in ('명사', ''):                                      # 명사 뜻을 먼저, 없으면 아무거나 (용례는 쓰지 않아요: 출전 있는 용례는 별도 허락이 필요해요)
        for it in items:
            if re.sub(r'[\d\-^]', '', it.get('word', '')) != word: continue
            if pref and pref not in (it.get('pos') or ''): continue
            s = it.get('sense')
            s = s[0] if isinstance(s, list) and s else s
            if isinstance(s, dict) and s.get('definition'): return clean(s['definition'])
    return None

def load_rows():
    return [l.rstrip('\n').split('|') for l in open(DICT, encoding='utf8') if l.strip()]

def main():
    cache = json.load(open(CACHE, encoding='utf8')) if os.path.exists(CACHE) else {}
    if '--apply' in sys.argv:
        rows, n = load_rows(), 0
        with open(DICT, 'w', encoding='utf8') as f:
            for w, d, t in rows:
                if not d and cache.get(w): d, n = cache[w], n + 1
                f.write(f'{w}|{d}|{t}\n')
        print(f'{n}개 뜻을 합쳤어요'); return
    key = os.environ.get('STDICT_KEY')
    if not key: sys.exit('STDICT_KEY 환경변수에 인증 키를 넣어 주세요')
    limit = int(sys.argv[sys.argv.index('--limit') + 1]) if '--limit' in sys.argv else 10**9
    todo = [w for w, d, t in load_rows() if not d and w not in cache][:limit]
    print(f'받을 낱말 {len(todo)}개 (이미 받은 것 {len(cache)}개)')
    for i, w in enumerate(todo, 1):
        try:
            cache[w] = lookup(w, key) or ''                         # 못 찾으면 빈 값으로 기록해 다시 시도하지 않아요
        except Exception as e:
            print('멈춤:', w, e, '\n(호출 한도일 수 있어요. 내일 같은 명령으로 이어서 받으세요)'); break
        if i % 50 == 0:
            json.dump(cache, open(CACHE, 'w', encoding='utf8'), ensure_ascii=False); print(i, '/', len(todo))
        time.sleep(0.15)
    json.dump(cache, open(CACHE, 'w', encoding='utf8'), ensure_ascii=False)
    print('저장 완료. 이어서 --apply 로 합치세요')
main()
