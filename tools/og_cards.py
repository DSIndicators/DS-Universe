"""
Share cards (Open Graph / X) for every product that has its square cover.

    python tools/og_cards.py            (from DS-Universe-3, on the PC)

WHY (2026-10-09): a product link shared on TikTok, X, Discord or iMessage used
to preview with the one site-wide card. Each product now previews with its own
chart: the square cover on the right, the name, what it is and its price on
the left, on the site's own ground.

SOURCES, all read from the site so a card cannot disagree with it:
  content/covers.ts    which products have a cover, and its file
  content/products.ts  name and category
  content/pricing.ts   PRICES (flat(x) / FREE / WITH_COMPLETE)
Fonts: the site's own Inter Tight and JetBrains Mono (app/fonts, woff2),
decompressed to TTF in a temp folder with fontTools.

OUTPUT: public/og/<BATCH>/<slug>.png, 1200 x 630. A re-made card goes in a NEW
batch folder (one-year asset cache); content/covers.ts OG_BATCH names it.
"""
import io, json, os, re, sys, tempfile
from PIL import Image, ImageDraw, ImageFont

BATCH = "1009"
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
W, H = 1200, 630
GROUND = (8, 10, 13)
LINE = (29, 33, 39)
INK = (231, 236, 239)
SLATE = (163, 171, 179)
MUTE = (124, 132, 141)
GOLD = (205, 166, 86)
BRASS_LIGHT = (230, 207, 156)


def read(rel):
    with open(os.path.join(ROOT, rel), encoding="utf-8") as f:
        return f.read()


def fonts():
    from fontTools.ttLib import TTFont
    tmp = tempfile.mkdtemp(prefix="ds-og-")
    out = {}
    for key, name in [("sans", "InterTight-Latin-Variable.woff2"), ("mono", "JetBrainsMono-Latin-Variable.woff2")]:
        f = TTFont(os.path.join(ROOT, "app", "fonts", name))
        f.flavor = None
        path = os.path.join(tmp, key + ".ttf")
        f.save(path)
        out[key] = path
    return out


def font(path, size, weight):
    f = ImageFont.truetype(path, size)
    try:
        f.set_variation_by_axes([weight])
    except Exception:
        pass
    return f


def main():
    covers_ts = read("content/covers.ts")
    covers = dict(re.findall(r'^\s+"?([a-z0-9-]+)"?: \{\s*\n\s*src: "(/covers/sq/[^"]+)"', covers_ts, re.M))
    products_ts = read("content/products.ts")
    prods = {m.group(1): (m.group(2), m.group(3)) for m in re.finditer(r'"slug": "([^"]+)",\s*"name": "([^"]+)",\s*"kind": "[^"]+",\s*"series": "[^"]+",\s*"category": "([^"]+)"', products_ts)}
    pricing_ts = read("content/pricing.ts")
    block = pricing_ts[pricing_ts.index("export const PRICES"):]
    block = block[: block.index("};")]
    prices = {}
    for slug, val in re.findall(r'^\s+"?([a-z0-9-]+)"?: ([A-Za-z_]+(?:\([0-9.]+\))?)', block, re.M):
        if val.startswith("flat("):
            prices[slug] = "$" + format(float(val[5:-1]), ".2f")
        elif val == "FREE":
            prices[slug] = "Free"
        elif val == "WITH_COMPLETE":
            prices[slug] = "Free with DS Complete"
    f = fonts()
    out_dir = os.path.join(ROOT, "public", "og", BATCH)
    os.makedirs(out_dir, exist_ok=True)
    badge = Image.open(os.path.join(ROOT, "public", "brand", "badge-64.png")).convert("RGBA").resize((36, 36), Image.LANCZOS)
    made = []
    for slug, src in covers.items():
        if slug not in prods or slug not in prices:
            sys.exit(f"og_cards: {slug} has a cover but no product or price")
        name, category = prods[slug]
        price = prices[slug]
        cover = Image.open(os.path.join(ROOT, "public", src.lstrip("/"))).convert("RGB").resize((H, H), Image.LANCZOS)
        img = Image.new("RGB", (W, H), GROUND)
        img.paste(cover, (W - H, 0))
        d = ImageDraw.Draw(img)
        d.line([(W - H - 1, 0), (W - H - 1, H)], fill=LINE, width=1)
        left, right = 64, W - H - 56
        # brand line
        img.paste(badge, (left, 58), badge)
        mono = font(f["mono"], 15, 500)
        d.text((left + 50, 67), "D S   U N I V E R S E", font=mono, fill=GOLD)
        # the name, as large as fits in two lines
        words = name.split(" ")
        size = 64
        while True:
            fn = font(f["sans"], size, 420)
            lines, cur = [], ""
            for w in words:
                t = (cur + " " + w).strip()
                if d.textlength(t, font=fn) <= right - left:
                    cur = t
                else:
                    if cur:
                        lines.append(cur)
                    cur = w
            lines.append(cur)
            if len(lines) <= 2 and all(d.textlength(l, font=fn) <= right - left for l in lines):
                break
            size -= 2
        y = 210 if len(lines) == 1 else 176
        for l in lines:
            d.text((left, y), l, font=fn, fill=INK)
            y += int(size * 1.08)
        d.text((left, y + 14), category, font=font(f["sans"], 26, 400), fill=SLATE)
        # the price
        pf = font(f["sans"], 40 if price.startswith("$") or price == "Free" else 30, 400)
        d.line([(left, 470), (right, 470)], fill=LINE, width=1)
        d.text((left, 492), price, font=pf, fill=BRASS_LIGHT if price.startswith("Free") else INK)
        d.text((left, 552), "NinjaTrader 8  ·  dsuniverse.net", font=font(f["mono"], 16, 400), fill=MUTE)
        out = os.path.join(out_dir, slug + ".png")
        img.save(out, "PNG", optimize=True)
        made.append((slug, os.path.getsize(out)))
    print(json.dumps(made))


if __name__ == "__main__":
    main()
