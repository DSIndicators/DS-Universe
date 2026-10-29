"""
THE UPSCALE LADDERS (2026-10-26 night — Tom: "give all burned in screenshots
upscale enhancement. Meaning it shouldn't be blurry at all, exceptionally
pristine").

Why pictures look soft: a browser that has to draw a picture wider than its
pixels stretches it. A 2340-wide chart on a 2560-wide screen, or a 1080 cover
shown 1300 device pixels wide, is interpolated and every hairline and digit
goes soft. The fix has two halves:

  ABOVE the original width: an upscaled master. Each picture is run through
  Remacri 4x (an ESRGAN model; chosen in a bake-off of nine models on Tom's
  own chart text and covers because it changes the picture least: shrunk back
  to the original size it scored the highest PSNR against the original on 4
  of 5 test crops and a close second on the fifth, 32-41 dB where the fast
  models score 22-36 dB, and it keeps 1 px dotted lines that they erase). The master is then brought down (Lanczos) to the
  widths screens actually need.
  BELOW it: the original itself scaled down (Lanczos), never the master.

Every rung is a lossless WebP; nothing is cropped, recoloured or re-framed:
the master's colours are locked to the original's (lock_colour below).
The ladders are listed in content/hd.json, where the components read them:
covers by the SHA-1 of the cover file (tools/covers.mjs), wide charts by key.

Runs in Claude's cloud workspace: python3 -m pip install ncnn pillow numpy,
plus the ncnn model files (Real-ESRGAN v0.2.5.0 release, Upscayl's model set).
usage: python3 upscale.py <jobs.json> <models dir> <public dir> <hd.json> <cache dir>
"""
import hashlib, json, os, sys, time
import numpy as np
from PIL import Image

sys.path.insert(0, os.path.dirname(__file__))
from sr import SR

MODEL = "remacri-4x"
COVER_DOWN = [360, 720]
COVER_UP = [1440, 2160]
WIDE_DOWN = [1280, 1920, 2560, 2880, 3440]
WIDE_UP = [2560, 2880, 3440, 3840, 4680, 5760]


def psnr(a, b):
    m = ((a.astype(np.float64) - b.astype(np.float64)) ** 2).mean()
    return 99.0 if m == 0 else 10 * np.log10(255 ** 2 / m)


def lock_colour(master, img):
    """Tom's colours, exactly. ESRGAN models drift a few levels in flat areas
    (Remacri tints near-white panels blue: 248,248,249 -> 248,249,254), so the
    master is only trusted for what it is for — sharp edges:
      * the picture IS the original, stretched (Lanczos), wherever the
        original is flat (its 3x3 neighbourhood varies by 2 levels or less):
        to the level, in all three channels;
      * at edges, the model's brightness detail is added to the original's
        own colour (luminance only, so no hue can move), with a soft
        half-pixel blend between the two.
    So panels, grounds and fills come out the original colour to the level, and
    text and hairlines keep the model's sharpness without a halo. Done in
    strips so a 4x master of a wide chart fits in memory."""
    from PIL import ImageFilter
    s = master.size[0] // img.size[0]
    base = img.resize(master.size, Image.LANCZOS)
    mx = np.asarray(img.filter(ImageFilter.MaxFilter(3)), dtype=np.int16)
    mn = np.asarray(img.filter(ImageFilter.MinFilter(3)), dtype=np.int16)
    flat = Image.fromarray(((mx - mn).max(axis=2) <= 2).astype(np.uint8) * 255)
    mask = flat.resize(master.size, Image.NEAREST).filter(ImageFilter.GaussianBlur(s / 2))
    W, H = master.size
    out = Image.new("RGB", master.size)
    lum = np.array([0.299, 0.587, 0.114], dtype=np.float32)
    for y in range(0, H, 512):
        box = (0, y, W, min(H, y + 512))
        A = np.asarray(master.crop(box), dtype=np.float32)
        B = np.asarray(base.crop(box), dtype=np.float32)
        edge = 1.0 - np.asarray(mask.crop(box), dtype=np.float32)[..., None] / 255.0
        # the model's brightness detail, added to the original's own colour
        part = B + edge * ((A @ lum) - (B @ lum))[..., None]
        out.paste(Image.fromarray(np.clip(part + 0.5, 0, 255).astype(np.uint8)), box[:2])
    return out


def save(img, path):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    img.save(path, "WEBP", lossless=True, quality=100, method=6)


def main():
    jobs_path, models, public, hd_path, cache = sys.argv[1:6]
    jobs = json.load(open(jobs_path))
    hd = json.load(open(hd_path)) if os.path.exists(hd_path) else {}
    hd.setdefault("covers", {})
    hd.setdefault("wide", {})
    hd.setdefault("report", {})
    sr = None
    os.makedirs(cache, exist_ok=True)
    for job in jobs:
        src, kind, name = job["src"], job["kind"], job["name"]
        raw = open(src, "rb").read()
        sha = hashlib.sha1(raw).hexdigest()
        tag = sha[:10]
        img = Image.open(src).convert("RGB")
        w, h = img.size
        ai = job.get("upscale", True)
        master_path = os.path.join(cache, f"{name}-{tag}-x4.png")
        if ai and not os.path.exists(master_path):
            if sr is None:
                sr = SR(os.path.join(models, MODEL))
            t = time.time()
            last = [0]

            def prog(k, n):
                if time.time() - last[0] > 60:
                    last[0] = time.time()
                    print(f"   {name}: {k}/{n} tiles", flush=True)

            up = sr.run(np.asarray(img), prog)
            Image.fromarray(up).save(master_path)
            print(f"{name}: upscaled {w}x{h} -> {up.shape[1]}x{up.shape[0]} in {time.time() - t:.0f}s", flush=True)
        master = lock_colour(Image.open(master_path).convert("RGB"), img) if ai else None
        fid = psnr(np.asarray(img), np.asarray(master.resize((w, h), Image.LANCZOS))) if ai else None
        down = COVER_DOWN if kind == "cover" else WIDE_DOWN
        upw = COVER_UP if kind == "cover" else WIDE_UP
        rungs = []
        folder = "covers" if kind == "cover" else "wide"
        # Below the original's width: the original, scaled down. Above it (AI
        # only): the colour-locked master, up to 2x the original - and the
        # ladder always reaches that 2x cap, so a cover narrower than the fixed
        # rungs (DS Time Intervals, 696 wide) is never left with nothing above
        # its own size (2026-10-26).
        widths = [x for x in down if x < w]
        if ai:
            widths += [x for x in down + upw if w < x <= 2 * w]
            if max(upw) > 2 * w:
                widths.append(2 * w)
        for rw in sorted(set(widths)):
            rh = round(h * rw / w)
            out = (img if rw < w else master).resize((rw, rh), Image.LANCZOS)
            rel = f"/hd/{folder}/{name}-{tag}-{rw}.webp"
            save(out, public + rel)
            rungs.append({"src": rel, "w": rw})
        if kind == "cover":
            hd["covers"][sha] = rungs
        else:
            hd["wide"][name] = rungs
        hd["report"][name] = {"source": os.path.basename(src), "sha1": sha, "size": f"{w}x{h}", "model": MODEL if ai else "none (downscales of the original only)", "psnr_back_to_original_dB": round(fid, 2) if ai else None, "rungs": [r["w"] for r in rungs]}
        json.dump(hd, open(hd_path, "w"), indent=1)
        print(f"{name}: {w}x{h} rungs {[r['w'] for r in rungs]}  fidelity {fid if fid is None else round(fid, 2)} dB", flush=True)


if __name__ == "__main__":
    main()
