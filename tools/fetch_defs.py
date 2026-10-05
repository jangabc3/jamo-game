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
    python3 tools/fetch_defs.py --workers 4   # 4개씩 동시에 받아 빠르게 (서버가 오류를 많이 내면 1~2로)
    python3 tools/fetch_defs.py --apply    # 받은 뜻을 data/dict.txt에 합치기
그다음 python3 tools/build.py 로 다시 빌드해요.
키는 코드나 저장소에 넣지 말고 환경변수로만 쓰세요.
"""
import html, json, os, re, sys, time, urllib.parse, urllib.request
from concurrent.futures import ThreadPoolExecutor
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DICT, CACHE = os.path.join(ROOT, 'data/dict.txt'), os.path.join(ROOT, 'data/defs_cache.json')
SRC = {'opendict': 'https://opendict.korean.go.kr/api/search', 'stdict': 'https://stdict.korean.go.kr/api/search.do'}
source = sys.argv[sys.argv.index('--source') + 1] if '--source' in sys.argv else 'opendict'
URL = SRC[source]
MAXLEN = 46          # 앱 용량을 위해 뜻을 이 길이로 줄여요

def clean(t):
    t = html.unescape(html.unescape(t))                         # &amp;lt; 처럼 두 번 감싸진 글자를 풀어요
    t = re.sub(r'<[^>]+>|\[[^\]]*\]|\([^)]*\)', '', t)           # 태그, [..], (..) 제거
    t = re.sub(r'\s+', ' ', t.replace('|', '/').replace('`', "'")).strip()
    if len(t) > MAXLEN:
        cut = max(t.rfind(' ', 0, MAXLEN), t.rfind(',', 0, MAXLEN))
        t = t[:cut if cut > 20 else MAXLEN].rstrip(' ,') + '…'
    return t

def fetch(url):
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (jamo-game dict tool)', 'Accept': 'application/json'})
    for k in range(2):                                             # 느리면 최대 3번 다시 시도
        try:
            with urllib.request.urlopen(req, timeout=25) as r: return r.read().decode('utf8')
        except Exception:
            if k == 1: raise
            time.sleep(2 + 3 * k)

BAD_CAT = {'인명', '지명', '문학', '책명', '작품', '인물'}          # 사람 이름·작품 이름 같은 뜻은 피해요

def lookup(word, key):
    q = urllib.parse.urlencode({'key': key, 'q': word, 'req_type': 'json', 'method': 'exact', 'num': 10})
    raw = fetch(URL + '?' + q)
    if not raw.strip(): return None                                # 결과 없음
    data = json.loads(raw)
    if 'error' in data: raise RuntimeError(json.dumps(data['error'], ensure_ascii=False))
    items = (data.get('channel') or {}).get('item') or []
    if isinstance(items, dict): items = [items]
    senses = []
    for it in items:
        if re.sub(r'[\d\-^]', '', it.get('word', '')) != word: continue   # '나옹^설화' 같은 다른 낱말은 건너뛰어요
        ss = it.get('sense')
        ss = ss if isinstance(ss, list) else [ss] if ss else []
        senses += [x for x in ss if isinstance(x, dict) and x.get('definition')]
    def rank(x):                                                   # 낮을수록 좋아요: 일반 명사 > 그 밖의 명사 > 나머지
        return (x.get('cat') in BAD_CAT, '명사' not in (x.get('pos') or ''), bool(x.get('cat')))
    senses.sort(key=rank)                                          # 같은 점수면 사전에 나온 순서를 지켜요
    return clean(senses[0]['definition']) if senses else None

def load_rows():
    return [l.rstrip('\n').split('|') for l in open(DICT, encoding='utf8') if l.strip()]

def main():
    cache = json.load(open(CACHE, encoding='utf8')) if os.path.exists(CACHE) else {}
    if '--apply' in sys.argv:
        rows, n = load_rows(), 0
        with open(DICT, 'w', encoding='utf8', newline='\n') as f:
            for w, d, t in rows:
                if not d and cache.get(w): d, n = cache[w], n + 1
                f.write(f'{w}|{d}|{t}\n')
        print(f'{n}개 뜻을 합쳤어요'); return
    key = os.environ.get('STDICT_KEY')
    if not key: sys.exit('STDICT_KEY 환경변수에 인증 키를 넣어 주세요')
    limit = int(sys.argv[sys.argv.index('--limit') + 1]) if '--limit' in sys.argv else 10**9
    todo = [w for w, d, t in load_rows() if not d and w not in cache][:limit]
    print(f'받을 낱말 {len(todo)}개 (이미 받은 것 {len(cache)}개)')
    workers = int(sys.argv[sys.argv.index('--workers') + 1]) if '--workers' in sys.argv else 3   # 동시에 몇 개씩 물을지 (서버가 불안정하면 1~4)
    fails, bad_chunks, done = [], 0, 0
    t0 = time.time()
    def one(w):
        try: return w, lookup(w, key) or '', None
        except Exception as e: return w, None, str(e)[:60]
    with ThreadPoolExecutor(max_workers=workers) as ex:
        for k in range(0, len(todo), 25):                           # 25개씩 처리하고 저장해요
            chunk = todo[k:k + 25]; ok = 0
            for w, d, err in ex.map(one, chunk):
                if err is None: cache[w] = d; ok += 1              # 못 찾으면 빈 값으로 기록해 다시 시도하지 않아요
                else: fails.append(w)                               # 서버 오류(502 등)는 기록하지 않고 건너뛰어요. 다음 실행 때 다시 받아요
            done += len(chunk)
            json.dump(cache, open(CACHE, 'w', encoding='utf8', newline='\n'), ensure_ascii=False)
            rate = done / (time.time() - t0)
            print(f'{done} / {len(todo)}  (성공 {ok}/{len(chunk)}, 남은 시간 약 {int((len(todo) - done) / rate / 60)}분)', flush=True)
            bad_chunks = bad_chunks + 1 if ok == 0 else 0
            if bad_chunks >= 3: print('3번 연속으로 모두 실패해서 멈춰요. 서버가 불안정하거나 호출 한도일 수 있어요. 잠시 뒤 같은 명령으로 이어서 받으세요'); break
            time.sleep(0.15)
    if fails: print(f'이번에 못 받은 낱말 {len(fails)}개: 같은 명령을 다시 실행하면 이어서 받아요')
    json.dump(cache, open(CACHE, 'w', encoding='utf8', newline='\n'), ensure_ascii=False)
    print('저장 완료. 이어서 --apply 로 합치세요')
main()