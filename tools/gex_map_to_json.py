#!/usr/bin/env python3
"""
DS GEX saved map (.map)  ->  DS Replay feed (tools/fixtures/gex-<day>.json)

The web cannot fetch option chains, so DS Replay draws DS GEX from the tool's
OWN saved map file, the one DSGex.cs writes to Documents\\NinjaTrader 8\\DSGex
(SaveMap / AppendRow / LoadMap / ParseRow, DSGex.cs Build 2026-10-09):

    DSGEX<TAB>2                       header, format version
    lock / date / captured / chain / index / spot / basis / basisnote / oi /
    capticks / absgex / absgex0 / n   the CURRENT set's header
    L  kind price mag label strike net share vol since                 current set rows
    livestamp / livevol / livever / liveabs
    Z  kind price mag label strike net share vol since                 live 0DTE walls
    T  kind price mag label strike net share vol since until flag rank trail rows

  * every time stamp is a .NET DateTime tick count in UTC (100 ns since
    0001-01-01): CapTicks / Since / Until come from DateTime.UtcNow.Ticks
    (CommitLive, CommitMap) and "captured" carries the same instant as text,
    e.g. capticks 639271552511054600 == "2026-10-09 15:07:31 UTC";
  * "nan" in the net column = not recorded (ParseRow keeps Net = NaN); share
    and vol < 0 = not recorded (ParseRow keeps -1);
  * trail flag: 0 = an open-interest set level, 1 = a live 0DTE wall (shown
    when 0DTE walls source = VolumeLive, the default), 2 = an open-interest
    0DTE wall that a live wall replaced (hidden under VolumeLive) —
    MaterializeTrail;
  * trail rank: the G+ / G- rank inside its set (1 = strongest); the tool
    shows ranks <= G count (default 2).

This script selects every row (L, Z or T) whose validity window overlaps the
CME trading session of <day> (18:00 ET the evening before -> 17:00 ET), and
writes them with their prices on the chart (NQ) scale, the strike on the index
the options trade on (NDX), the gamma figures, the G rank and the window — in
.NET ticks, in UTC ISO and in DS Replay's clock (minutes since 2026-01-01 00:00
New York wall time, the clock of the session files' `t`).

Run:  python3 tools/gex_map_to_json.py [map] [day] [out]
      defaults: /home/claude/src/gex/DSGex_NQ_F.map 2026-10-08 tools/fixtures/gex-<day>.json
"""
import json
import math
import sys
from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo

ET = ZoneInfo("America/New_York")
EPOCH = datetime(1, 1, 1)
BASE_NY = datetime(2026, 1, 1)  # DS Replay clock origin (naive New York wall time)

KIND = {0: "res", 1: "sup", 2: "res0", 3: "sup0", 4: "flip", 5: "emh", 6: "eml", 7: "emb",
        8: "ivh", 9: "ivl", 10: "mpain", 11: "gpos", 12: "gneg", 13: "hgex"}
# what DS GEX draws with its shipped defaults (FamilyVisible + ApplyDefaults):
# EM bands (ShowEmBands = false) and the 1D range (ShowIv = false) are off.
SHOWN_BY_DEFAULT = {0, 1, 2, 3, 4, 5, 6, 10, 11, 12, 13}
G_COUNT = 2  # ApplyDefaults: GCount = 2


def ticks_to_utc(t: int) -> datetime:
    return (EPOCH + timedelta(microseconds=t // 10)).replace(tzinfo=timezone.utc)


def utc_to_ny_min(u: datetime) -> float:
    ny = u.astimezone(ET).replace(tzinfo=None)
    return round((ny - BASE_NY).total_seconds() / 60.0, 4)


def ny_to_ticks(ny: datetime) -> int:
    u = ny.replace(tzinfo=ET).astimezone(timezone.utc).replace(tzinfo=None)
    d = u - EPOCH
    return (d.days * 86400 + d.seconds) * 10_000_000 + d.microseconds * 10


def num(s: str):
    if s == "nan":
        return None
    v = float(s)
    return None if math.isnan(v) or math.isinf(v) else v


def parse(path: str):
    with open(path, encoding="utf-8-sig") as f:
        lines = [ln.rstrip("\n").rstrip("\r") for ln in f]
    if not lines or not lines[0].startswith("DSGEX\t"):
        raise SystemExit(f"{path}: not a DS GEX map (no DSGEX header)")
    head, rows = {"format": lines[0].split("\t")[1]}, []
    for ln in lines[1:]:
        p = ln.split("\t")
        if len(p) < 2:
            continue
        tag = p[0]
        if tag in ("L", "Z", "T"):
            if len(p) < 5:
                continue
            r = {"row": tag, "kind": int(p[1]), "price": float(p[2]), "mag": float(p[3]), "label": p[4]}
            if r["price"] <= 0 or not (0 <= r["kind"] <= 13):
                continue
            if len(p) >= 10:  # ParseRow
                st = num(p[5]); r["strike"] = st if st and st > 0 else None
                r["net"] = num(p[6])
                sh = num(p[7]); r["share"] = sh if sh is not None and 0 <= sh <= 1.0 else None
                vo = num(p[8]); r["vol"] = vo if vo is not None and vo > 0 else None
                r["since"] = int(p[9]) if int(p[9]) > 0 else None
            if tag == "T":
                if len(p) < 13:
                    continue
                r["until"], r["flag"], r["rank"] = int(p[10]), int(p[11]), int(p[12])
                if not r.get("since") or r["until"] <= r["since"]:
                    continue  # LoadMap drops these
            rows.append(r)
        else:
            head[tag] = p[1]
    return head, rows


def lock_at(et: datetime, morning=830, evening=1800):
    """DSGex.LockAt: which set a capture at this ET instant belongs to."""
    hm = et.hour * 100 + et.minute
    if hm >= evening:
        k, d = "E", (et + timedelta(days=1)).date()
    elif hm >= morning:
        k, d = "D", et.date()
    else:
        k, d = "E", et.date()
    lid = f"{k}{d:%Y%m%d}"
    name = ("Day set " if k == "D" else "Overnight set ") + f"{d:%Y-%m-%d}"
    return lid, name


def main():
    path = sys.argv[1] if len(sys.argv) > 1 else "/home/claude/src/gex/DSGex_NQ_F.map"
    day = sys.argv[2] if len(sys.argv) > 2 else "2026-10-08"
    out = sys.argv[3] if len(sys.argv) > 3 else f"tools/fixtures/gex-{day}.json"
    head, rows = parse(path)

    d = datetime.strptime(day, "%Y-%m-%d")
    s0, s1 = ny_to_ticks(d - timedelta(hours=6)), ny_to_ticks(d + timedelta(hours=17))  # 18:00 prev -> 17:00

    cap = int(head.get("capticks", "0") or 0)
    cur_since = cap
    sel = []
    for r in rows:
        if r["row"] == "T":
            since, until = r["since"], r["until"]
        else:  # current set / live walls: valid from their since (or the capture) and still standing
            since = r.get("since") or cur_since
            until = None
        if since >= s1 or (until is not None and until <= s0):
            continue
        sel.append((r, since, until))

    gp = gn = 0
    levels = []
    for r, since, until in sel:
        rank = r.get("rank", 0)
        if r["row"] != "T":
            if r["kind"] == 11: gp += 1; rank = gp
            if r["kind"] == 12: gn += 1; rank = gn
        flag = r.get("flag", 1 if r["row"] == "Z" else 0)
        su = ticks_to_utc(since)
        lid, lname = lock_at(su.astimezone(ET))
        lv = {
            "kind": r["kind"], "code": KIND[r["kind"]], "label": r["label"],
            "price": r["price"], "strike": r.get("strike"),
            "mag": r["mag"], "net": r.get("net"), "share": r.get("share"), "vol": r.get("vol"),
            "rank": rank, "flag": flag,
            "shownByDefault": r["kind"] in SHOWN_BY_DEFAULT and not (r["kind"] in (11, 12) and rank > G_COUNT) and flag != 2,
            "since": since, "until": until,
            "sinceUtc": su.strftime("%Y-%m-%dT%H:%M:%S.%fZ")[:-4] + "Z",
            "untilUtc": ticks_to_utc(until).strftime("%Y-%m-%dT%H:%M:%S.%fZ")[:-4] + "Z" if until else None,
            "sinceNy": su.astimezone(ET).strftime("%Y-%m-%d %H:%M:%S"),
            "untilNy": ticks_to_utc(until).astimezone(ET).strftime("%Y-%m-%d %H:%M:%S") if until else None,
            "sinceMin": utc_to_ny_min(su),
            "untilMin": utc_to_ny_min(ticks_to_utc(until)) if until else None,
            "set": lid, "setName": lname, "row": r["row"],
        }
        levels.append(lv)

    # the sets these rows belong to (grouped by their capture instant)
    sets = {}
    for lv in levels:
        k = (lv["set"], lv["since"] if lv["flag"] != 1 else None)
        if lv["flag"] == 1:
            continue
        st = sets.setdefault(lv["set"], {"lock": lv["set"], "name": lv["setName"], "since": lv["since"],
                                          "sinceNy": lv["sinceNy"], "sinceMin": lv["sinceMin"],
                                          "until": lv["until"], "untilNy": lv["untilNy"], "untilMin": lv["untilMin"]})
        if lv["since"] < st["since"]:
            st.update(since=lv["since"], sinceNy=lv["sinceNy"], sinceMin=lv["sinceMin"])
        # chart price / strike = the conversion ratio of the capturing chart (FillStrikes)
        if lv["kind"] in (0, 1) and lv["strike"]:
            st["basis"] = lv["price"] / lv["strike"]

    feed = {
        "tool": "DS GEX", "build": "2026-10-09", "market": "NQ", "underlying": "NDX",
        "day": day,
        "session": {"fromNy": f"{(d - timedelta(hours=6)):%Y-%m-%d %H:%M}", "toNy": f"{(d + timedelta(hours=17)):%Y-%m-%d %H:%M}",
                    "fromTicks": s0, "toTicks": s1},
        "sets": sorted(sets.values(), key=lambda x: x["since"]),
        "levels": sorted(levels, key=lambda x: x["since"]),  # stable: keeps the file (= tool list) order
        "source": {
            "file": path.split("/")[-1], "format": head.get("format"),
            "fileLock": head.get("lock"), "fileCaptured": head.get("captured"),
            "note": "Rows selected by validity window overlapping the session. Ticks are .NET UTC ticks; *Min fields are minutes since 2026-01-01 00:00 New York wall time (DS Replay clock).",
        },
    }
    with open(out, "w", encoding="utf-8") as f:
        json.dump(feed, f, indent=1)
    print(f"{out}: {len(levels)} levels from {len(sets)} set(s)")
    for st in feed["sets"]:
        print(f"  {st['name']} ({st['lock']}) valid {st['sinceNy']} -> {st['untilNy']} ET, basis {st.get('basis')}")
    for lv in feed["levels"]:
        print(f"  {'*' if lv['shownByDefault'] else ' '} {lv['label']:<11} {lv['price']:10.2f}  strike {lv['strike']}  mag {lv['mag']:.0f}  net {lv['net']}  rank {lv['rank']}")


if __name__ == "__main__":
    main()
