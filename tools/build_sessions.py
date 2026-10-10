"""Usage:  python tools/build_sessions.py 2026-10-12 [more days]   (NT_DB overrides the database path)
Build DS chart-engine session files from Tom's NinjaTrader 8 database (NQ 12-26).
Minute bars: db/minute (validated byte-exact against an NT8 text export, 76,800/76,800 bars).
Order flow: db/tick (bid/ask aggressor per trade; tick->minute aggregation matches the minute file's
high/low on every bar; open/close/volume differ only by trades stamped on the minute boundary)."""
import sys, glob, json, math, datetime as dt, collections, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__))); import ncd
DB = os.environ.get('NT_DB', r'C:\Users\wspan\Documents\NinjaTrader 8\db')  # the NinjaTrader 8 historical database
EPOCH = dt.datetime(1, 1, 1)
BASE = dt.datetime(2026, 1, 1)
TICK = 0.25

# ROLL: NQ 12-26 became the front month with the session of Mon 14 Sep 2026
# (opens Sun 13 Sep 18:00 ET) - its volume passes NQ 09-26's from that session
# on (Thu 10 Sep: Sep 544,758 vs Dec 9,856). Before it, bars come from NQ 09-26,
# back-adjusted by the Dec-Sep difference at the last common close (Fri 11 Sep
# 17:00: 29,691.00 - 29,391.75 = 299.25) - NinjaTrader's default "Merge back
# adjusted" policy, so history days carry front-month volume.
ROLL_AT = dt.datetime(2026, 9, 13, 18, 0)
ROLL_OFFSET = 299.25

def load_minutes():
    m = {}
    for f in sorted(glob.glob(f'{DB}/minute/NQ 09-26/*.Last.ncd')):
        _, b = ncd.read_minute(f, 0x8000)
        for x in b:
            if x[0] <= ROLL_AT:
                m[x[0]] = (x[1] + ROLL_OFFSET, x[2] + ROLL_OFFSET, x[3] + ROLL_OFFSET, x[4] + ROLL_OFFSET, x[5])
    for f in sorted(glob.glob(f'{DB}/minute/NQ 12-26/*.Last.ncd')):
        _, b = ncd.read_minute(f, 0x8000)
        for x in b:
            if x[0] > ROLL_AT: m[x[0]] = x[1:]
    return m

def load_ticks_for(day_from, day_to):
    """All trades between two naive ET datetimes, keyed by bar-end minute."""
    agg = collections.defaultdict(list)
    for f in sorted(glob.glob(f'{DB}/tick/NQ 12-26/*.Last.ncd')):
        stem = os.path.basename(f)[:12]
        hr = dt.datetime.strptime(stem, '%Y%m%d%H%M')
        if hr < day_from - dt.timedelta(hours=2) or hr > day_to + dt.timedelta(hours=2): continue
        _, _, tr = ncd.read_tick(f)
        for T, p, s, v in tr:
            t = EPOCH + dt.timedelta(microseconds=T // 10)
            if t < day_from or t > day_to: continue
            e = t.replace(second=0, microsecond=0)
            if t != e: e += dt.timedelta(minutes=1)
            agg[e].append((t, p, s, v))
    return agg

def path_from_trades(o, h, l, c, trades, maxpts=20):
    """Ordered price path inside one bar (in ticks from open), keeping the true order of extremes."""
    if trades:
        ps = [round((p - o) / TICK) for _, p, _, _ in trades]
        # zigzag compression
        z = [ps[0]]
        for q in ps[1:]:
            if q == z[-1]: continue
            if len(z) >= 2 and (z[-1] - z[-2]) * (q - z[-1]) > 0: z[-1] = q
            else: z.append(q)
        hi = round((h - o) / TICK); lo = round((l - o) / TICK); cl = round((c - o) / TICK)
        z = [0] + z if z[0] != 0 else z
        if z[-1] != cl: z.append(cl)
        # keep most significant swings
        while len(z) > maxpts:
            best = None
            for j in range(1, len(z) - 1):
                if z[j] in (hi, lo): continue
                amp = min(abs(z[j] - z[j - 1]), abs(z[j + 1] - z[j]))
                if best is None or amp < best[0]: best = (amp, j)
            if best is None: break
            j = best[1]; del z[j]
            # re-merge monotone runs
            k = max(1, j - 1)
            while 0 < k < len(z) - 1 and (z[k] - z[k - 1]) * (z[k + 1] - z[k]) >= 0:
                del z[k]
        # guarantee extremes present (minute h/l authoritative)
        if hi not in z: z.insert(max(1, len(z) - 1), hi)
        if lo not in z: z.insert(max(1, len(z) - 1), lo)
        return z, True
    hi = round((h - o) / TICK); lo = round((l - o) / TICK); cl = round((c - o) / TICK)
    first, second = (lo, hi) if abs(lo) < abs(hi) else (hi, lo)
    return [0, first, second, cl], False

def build(day, hist_days=3, end='16:00', name=None):
    m = load_minutes()
    d0 = dt.datetime.strptime(day, '%Y-%m-%d')
    rth_open = d0.replace(hour=9, minute=30)
    eh, em = map(int, end.split(':'))
    t_end = d0.replace(hour=eh, minute=em)
    t_end = min(t_end, max(m))
    # history: back to the 18:00 open hist_days trading sessions before
    sess_starts = sorted({(t - dt.timedelta(hours=18)).date() for t in m if t < rth_open})
    want = sess_starts[-(hist_days + 1):]  # sessions incl. the replay one
    t_start = dt.datetime.combine(want[0], dt.time(18, 0))
    keys = sorted(t for t in m if t_start < t <= t_end)
    flow_from = max(d0.replace(hour=0) - dt.timedelta(hours=6), ROLL_AT)  # replay day's overnight onward (never pre-roll ticks)
    trades = load_ticks_for(flow_from, t_end)
    T, O, H, L, C, V, B, S = [], [], [], [], [], [], [], []
    fp_lo, fp_bid, fp_ask, paths, real = [], [], [], [], []
    for t in keys:
        o, h, l, c, v = m[t]
        T.append(int((t - BASE).total_seconds() // 60)); O.append(o); H.append(h); L.append(l); C.append(c); V.append(v)
        tr = trades.get(t) if t > flow_from else None
        if tr:
            lo = min(p for _, p, _, _ in tr); hi = max(p for _, p, _, _ in tr)
            n = round((hi - lo) / TICK) + 1
            bid = [0] * n; ask = [0] * n; b = s = 0
            for _, p, sd, vv in tr:
                j = round((p - lo) / TICK)
                if sd > 0: ask[j] += vv; b += vv
                else: bid[j] += vv; s += vv
            B.append(b); S.append(s); fp_lo.append(round(lo / TICK)); fp_bid.append(bid); fp_ask.append(ask)
        else:
            B.append(-1); S.append(-1); fp_lo.append(0); fp_bid.append([]); fp_ask.append([])
        pth, ok = path_from_trades(o, h, l, c, tr)
        paths.append(pth); real.append(1 if ok else 0)
    i_open = next(i for i, t in enumerate(keys) if t > rth_open - dt.timedelta(minutes=1)) # bar ending 09:31 is index of first RTH bar? keep 09:30 bar as last pre
    i_open = next(i for i, t in enumerate(keys) if t >= rth_open + dt.timedelta(minutes=1))
    out = {
        'v': 1, 'sym': 'NQ 12-26', 'name': 'E-mini Nasdaq-100 · Dec 2026', 'tick': TICK, 'tf': '1 min',
        'day': day, 'base': '2026-01-01T00:00 ET (naive)', 'replayFrom': i_open, 'n': len(keys),
        't': T, 'o': O, 'h': H, 'l': L, 'c': C, 'vol': V, 'buy': B, 'sell': S,
        'fp': {'lo': fp_lo, 'bid': fp_bid, 'ask': fp_ask}, 'path': paths, 'pathReal': real,
        'src': 'NinjaTrader 8 historical database (minute + tick), NQ 12-26, recorded on the DS Universe machine',
    }
    return out

if __name__ == '__main__':
    import sys
    for day in sys.argv[1:]:
        o = build(day)
        s = json.dumps(o, separators=(',', ':'))
        fn = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'tools', 'fixtures', f'nq-{day}.json')
        open(fn, 'w').write(s)
        nf = sum(1 for x in o['buy'] if x >= 0)
        print(day, 'bars', o['n'], 'replayFrom', o['replayFrom'], 'flow bars', nf, 'realpaths', sum(o['pathReal']), f'{len(s)/1e3:.0f} KB')
