"""DS Replay library - every recorded NQ session, rebuilt bar by bar from the trades.

    python tools/library/build_library.py <raw dir> <out dir> [contract ...]

<raw dir> holds NinjaTrader 8 .ncd files as tick/<contract>/*.Last.ncd (copied out of
Tom's NinjaTrader 8 database). Every bar is built from the trades themselves, so the
candle, its footprint (volume at bid / at ask per price), its buy/sell split, its
volume and its intrabar path all come from the same prints and always agree.
Bars are 1 minute, stamped by their CLOSE time (NinjaTrader convention: a trade at
exactly hh:mm:00.000 belongs to the bar that closes at hh:mm). Times are New York
local, as the database stores them.

The database's tick files are hourly (named by the local hour they end on) and some hours were
never downloaded. The bar grid therefore comes from the contract's minute file, and a
bar carries its trades (footprint, buy/sell, real path) only when the hour it sits in
was recorded in full - `real[i]` says which. Bars without trades keep the minute file's
OHLCV, buy/sell = -1, an empty footprint and a plain open-extreme-extreme-close path.

One file per session: <out>/<YYYY-MM-DD>.json, the CME session that opens 18:00 the
evening before and closes 17:00 on that date. When two contracts overlap around a
roll, the session is taken from the contract that traded more of it.
"""
import sys, os, glob, json, datetime as dt, collections
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
import ncd

EPOCH = dt.datetime(1, 1, 1)
BASE = dt.datetime(2026, 1, 1)
TICK = 0.25
MAXPTS = 24

def session_of(t):
    """trade date of the CME session a timestamp belongs to (18:00 opens the next day's session)"""
    d = t.date()
    return d + dt.timedelta(days=1) if t.hour >= 18 else d

class Bar:
    __slots__ = ('o', 'h', 'l', 'c', 'v', 'b', 's', 'fp', 'z')
    def __init__(self, p):
        self.o = self.h = self.l = self.c = p; self.v = self.b = self.s = 0
        self.fp = {}; self.z = [p]
    def add(self, p, side, v):
        if p > self.h: self.h = p
        if p < self.l: self.l = p
        self.c = p; self.v += v
        k = self.fp.get(p)
        if k is None: k = self.fp[p] = [0, 0]
        if side > 0: k[1] += v; self.b += v
        else: k[0] += v; self.s += v
        z = self.z
        if p != z[-1]:
            if len(z) >= 2 and (z[-1] - z[-2]) * (p - z[-1]) > 0: z[-1] = p   # same direction: extend the swing
            else: z.append(p)

def compress(z, o, h, l, c):
    """ordered swing path in ticks from the open, at most MAXPTS points, the true high, low and close kept"""
    q = [round((p - o) / TICK) for p in z]
    hi, lo, cl = round((h - o) / TICK), round((l - o) / TICK), round((c - o) / TICK)
    while len(q) > MAXPTS:
        best = None
        for j in range(1, len(q) - 1):
            if q[j] in (hi, lo): continue
            amp = min(abs(q[j] - q[j - 1]), abs(q[j + 1] - q[j]))
            if best is None or amp < best[0]: best = (amp, j)
        if best is None: break
        j = best[1]; del q[j]
        k = max(1, j - 1)
        while 0 < k < len(q) - 1 and (q[k] - q[k - 1]) * (q[k + 1] - q[k]) >= 0: del q[k]
    if q[-1] != cl: q.append(cl)
    return q

def build_contract(raw, contract):
    sessions = collections.defaultdict(dict)   # date -> {bar end minute (datetime): Bar}
    minutes = collections.defaultdict(dict)    # date -> {bar end minute: (o, h, l, c, v)}
    for f in sorted(glob.glob(os.path.join(raw, 'minute', contract, '*.Last.ncd'))):
        _, bs = ncd.read_minute(f, 0x8000)
        for x in bs: minutes[session_of(x[0] - dt.timedelta(seconds=30))][x[0]] = x[1:]
    files = sorted(glob.glob(os.path.join(raw, 'tick', contract, '*.Last.ncd')))
    hours = {dt.datetime.strptime(os.path.basename(f)[:12], '%Y%m%d%H%M') for f in files}   # local hour ENDS recorded
    for n, f in enumerate(files):
        _, _, tr = ncd.read_tick(f)
        for T, p, side, v in tr:
            t = EPOCH + dt.timedelta(microseconds=T // 10)
            e = t.replace(second=0, microsecond=0)
            if t != e: e += dt.timedelta(minutes=1)
            sd = session_of(t)
            bars = sessions[sd]
            b = bars.get(e)
            if b is None: b = bars[e] = Bar(p)
            b.add(p, side, v)
        if n % 200 == 0: print(f'  {contract} {n}/{len(files)}', flush=True)
    return sessions, minutes, hours

def recorded(e, hours):
    """the bar closing at local time e lies in an hour whose tick file exists (a file is
    named by the local hour it ENDS on: 202604151300.Last.ncd holds 12:00:00-12:59:59)"""
    h = (e - dt.timedelta(seconds=30)).replace(minute=0, second=0, microsecond=0) + dt.timedelta(hours=1)
    return h in hours

def write_session(out, day, contract, bars, mins, hours):
    keys = sorted(set(mins) | {e for e in bars if recorded(e, hours)})
    T, O, H, L, C, V, B, S, LO, BID, ASK, PATH, REAL = ([] for _ in range(13))
    for e in keys:
        b = bars.get(e)
        T.append(int((e - BASE).total_seconds() // 60))
        if b is None or not recorded(e, hours):
            o, h, l, c, v = mins[e]
            O.append(o); H.append(h); L.append(l); C.append(c); V.append(v); B.append(-1); S.append(-1)
            LO.append(0); BID.append([]); ASK.append([]); REAL.append(0)
            hi, lo, cl = round((h - o) / TICK), round((l - o) / TICK), round((c - o) / TICK)
            PATH.append([0, lo, hi, cl] if abs(lo) < abs(hi) else [0, hi, lo, cl]); continue
        REAL.append(1)
        O.append(b.o); H.append(b.h); L.append(b.l); C.append(b.c); V.append(b.v); B.append(b.b); S.append(b.s)
        lo = round(b.l / TICK); n = round(b.h / TICK) - lo + 1
        bid = [0] * n; ask = [0] * n
        for p, (bv, av) in b.fp.items():
            j = round(p / TICK) - lo; bid[j] = bv; ask[j] = av
        LO.append(lo); BID.append(bid); ASK.append(ask)
        PATH.append(compress(b.z, b.o, b.h, b.l, b.c))
    rec = {'v': 1, 'day': day.isoformat(), 'contract': contract, 'tick': TICK, 'tf': 1, 'n': len(keys),
           't': T, 'o': O, 'h': H, 'l': L, 'c': C, 'vol': V, 'buy': B, 'sell': S,
           'fp': {'lo': LO, 'bid': BID, 'ask': ASK}, 'path': PATH, 'real': REAL}
    with open(os.path.join(out, day.isoformat() + '.json'), 'w') as fh: json.dump(rec, fh, separators=(',', ':'))
    return sum(V), sum(REAL)

if __name__ == '__main__':
    raw, out = sys.argv[1], sys.argv[2]
    os.makedirs(out, exist_ok=True)
    contracts = sys.argv[3:] or sorted(os.listdir(os.path.join(raw, 'tick')))
    best = {}   # day -> (volume, contract)
    if os.path.exists(os.path.join(out, 'index.json')):
        best = {d: (r['vol'], r['contract']) for d, r in json.load(open(os.path.join(out, 'index.json'))).items()}
    for c in contracts:
        ss, mm, hours = build_contract(raw, c)
        for day in sorted(set(ss) | set(mm)):
            mins = mm.get(day, {})
            if len(mins) < 600: continue                       # holiday / partial session
            vol = sum(x[4] for x in mins.values())
            k = day.isoformat()
            if k in best and best[k][0] >= vol: continue
            write_session(out, day, c, ss.get(day, {}), mins, hours)
            best[k] = (vol, c)
        idx = {d: {'vol': v, 'contract': c2} for d, (v, c2) in sorted(best.items())}
        json.dump(idx, open(os.path.join(out, 'index.json'), 'w'), indent=0)
        print(c, 'sessions', len(ss), flush=True)
