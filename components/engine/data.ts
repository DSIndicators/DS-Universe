import type { Session } from "./types";

/** The file shape written by tools/build_sessions.py (see content/engine.ts). */
type Raw = {
  day: string; sym: string; name: string; tick: number; n: number; replayFrom: number;
  t: number[]; o: number[]; h: number[]; l: number[]; c: number[]; vol: number[]; buy: number[]; sell: number[];
  fp: { lo: number[]; bid: number[][]; ask: number[][] };
  path: number[][]; pathReal: number[];
};

export function fromRaw(r: Raw): Session {
  return {
    day: r.day, sym: r.sym, name: r.name, tick: r.tick, n: r.n, replayFrom: r.replayFrom,
    t: Int32Array.from(r.t), o: Float64Array.from(r.o), h: Float64Array.from(r.h), l: Float64Array.from(r.l), c: Float64Array.from(r.c),
    v: Float64Array.from(r.vol), buy: Float64Array.from(r.buy), sell: Float64Array.from(r.sell),
    fp: { lo: Int32Array.from(r.fp.lo), bid: r.fp.bid.map((a) => Int32Array.from(a)), ask: r.fp.ask.map((a) => Int32Array.from(a)) },
    path: r.path.map((a) => Int16Array.from(a)), pathReal: Uint8Array.from(r.pathReal),
  };
}

export type ExampleMeta = {
  id: string; tab: string; title: string; premise: string; tf: number;
  chapters: { i: number; title: string; text: string; tone: import("./types").Tone; price?: number }[];
};

const exCache = new Map<string, Promise<{ session: Session; meta: ExampleMeta }>>();

/** An example file (tools/showcase/build.ts): a session plus its title, premise and moments. */
export function loadExample(url: string) {
  let p = exCache.get(url);
  if (!p) {
    p = fetch(url).then((r) => { if (!r.ok) throw new Error(`${url}: ${r.status}`); return r.json(); }).then((r) => {
      const session = fromRaw(r);
      if (r.extra) session.extra = r.extra;
      return { session, meta: { id: r.id, tab: r.tab, title: r.title, premise: r.premise, tf: r.tf ?? 1, chapters: r.chapters ?? [] } };
    });
    exCache.set(url, p);
    p.catch(() => exCache.delete(url));
  }
  return p;
}

const cache = new Map<string, Promise<Session>>();

export function loadSession(url: string): Promise<Session> {
  let p = cache.get(url);
  if (!p) {
    p = fetch(url).then((r) => {
      if (!r.ok) throw new Error(`${url}: ${r.status}`);
      return r.json();
    }).then(fromRaw);
    cache.set(url, p);
    p.catch(() => cache.delete(url));
  }
  return p;
}

/** The forming bar at fraction `f` (0..1] of its recorded path. */
export function formingAt(s: Session, i: number, f: number) {
  const p = s.path[i], o = s.o[i], tk = s.tick;
  const segs = p.length - 1;
  const pos = Math.max(0, Math.min(1, f)) * segs;
  const j = Math.floor(pos);
  let hi = 0, lo = 0;
  for (let q = 0; q <= Math.min(j, segs); q++) { if (p[q] > hi) hi = p[q]; if (p[q] < lo) lo = p[q]; }
  let cur: number;
  if (j >= segs) cur = p[segs];
  else {
    const a = p[j], b = p[j + 1];
    cur = Math.round(a + (b - a) * (pos - j));
    if (cur > hi) hi = cur;
    if (cur < lo) lo = cur;
  }
  return { o, h: o + hi * tk, l: o + lo * tk, c: o + cur * tk };
}
