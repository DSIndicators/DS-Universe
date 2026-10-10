"""NinjaTrader 8 .ncd decoder (minute + tick). Format per jrstokka/NinjaTraderNCDFiles (MIT), re-derived + validated against NT8 text exports."""
import struct, datetime as dt
EPOCH = dt.datetime(1,1,1)
def _be(b): return int.from_bytes(b,'big')

def read_minute(path, open2_off=0x4000):
    d=open(path,'rb').read()
    _, tick, price, ticks = struct.unpack('<IddQ', d[:28])
    t = EPOCH + dt.timedelta(microseconds=ticks//10)
    i=28; out=[]; last=price
    while i < len(d):
        m1=d[i]; m2=d[i+1]; i+=2
        tb=m1&3
        if tb==0: delta=1
        else:
            n={1:1,2:2,3:4}[tb]; delta=_be(d[i:i+n]); i+=n
        t += dt.timedelta(minutes=delta)
        ob=(m1>>2)&3
        if ob==0: od=0
        elif ob==1: od=d[i]-0x80; i+=1
        elif ob==2: od=_be(d[i:i+2])-open2_off; i+=2
        else: od=_be(d[i:i+4])-0x40000000; i+=4
        o = last + od*tick
        def rd(code):
            nonlocal i
            n={0:0,1:1,2:2,3:4}[code]
            v=_be(d[i:i+n]) if n else 0; i+=n; return v
        hd=rd((m2>>4)&3); ld=rd((m2>>6)&3)
        # C# reads high, low, close in that order
        h=o+hd*tick; l=o-ld*tick
        cd=rd(m2&3); c=l+cd*tick
        vb=(m1>>5)&7
        if vb==0: v=0
        elif vb==1: v=d[i]; i+=1
        elif vb==2: v=d[i]*100; i+=1
        elif vb==3: v=d[i]*500; i+=1
        elif vb==4: v=d[i]*1000; i+=1
        elif vb==5: v=_be(d[i:i+2]); i+=2
        elif vb==6: v=_be(d[i:i+4]); i+=4
        else: v=_be(d[i:i+8]); i+=8
        last=o
        out.append((t,round(o,2),round(h,2),round(l,2),round(c,2),v))
    return tick, out

def read_tick(path):
    """Returns (tickSize, [(datetime, price, side, volume)]) side=+1 traded at ask (buyer aggressor), -1 at bid."""
    d=open(path,'rb').read()
    tsz, tick, price, ticks = struct.unpack('<IddQ', d[:28])
    T = ticks; i=28; out=[]; last=price
    n=len(d)
    while i < n:
        m1=d[i]; m2=d[i+1]; i+=2
        tb=m1&7
        if tb==0: dtk=0
        elif tb==1: dtk=d[i]; i+=1
        elif tb==2: dtk=_be(d[i:i+2]); i+=2
        elif tb==3: dtk=_be(d[i:i+4]); i+=4
        elif tb==4: dtk=_be(d[i:i+8]); i+=8
        elif tb==5: dtk=d[i]*10_000_000; i+=1
        else: raise ValueError(f'time code {tb} at {i}')
        T += dtk*(1 if tb in (4,5) else tsz)
        pb=(m1>>6)&3
        if pb==0: pd=0
        elif pb==1: pd=(m2&0x1F)-16
        elif pb==2: pd=d[i]-0x80; i+=1
        else: pd=_be(d[i:i+4])-0x80000000; i+=4
        p=last+pd*tick
        s=(m1>>3)&7
        if s==7:
            sm=_be(d[i:i+2]); i+=2; side=-1 if sm<256 else 1
        elif s==6:
            sm=d[i]; i+=1; side=-1 if sm<16 else 1
        else:
            side = 1 if (s&1) else -1
        vb=(m2>>5)&7
        if vb==1: v=d[i]; i+=1
        elif vb==2: v=d[i]*100; i+=1
        elif vb==3: v=d[i]*500; i+=1
        elif vb==4: v=d[i]*1000; i+=1
        elif vb==5: v=_be(d[i:i+2]); i+=2
        elif vb==6: v=_be(d[i:i+4]); i+=4
        elif vb==7: v=_be(d[i:i+8]); i+=8
        else: raise ValueError(f'vol code 0 at {i}')
        last=p
        out.append((T, round(p,2), side, v))
    return tsz, tick, out
