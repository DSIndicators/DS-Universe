# -*- coding: utf-8 -*-
"""Regenerates the sheet-driven parts of the DS Universe site from
"DS Universe - Master Product & Pricing Sheet.xlsx" (header row 3 on every tab):

    python3 gen_site_content.py <sheet.xlsx> <out-dir>

writes  products.entries.json   -> the PRODUCTS array of content/products.ts
        listing.entries.json    -> the LISTING object of content/listing-copy.ts
        markets.entries.ts      -> the MARKETS object of content/markets.ts
Sheet text is copied verbatim; the one transformation is the site's own rule that a
spaced hyphen (" - ") is set as an em dash (" — "), as the sheet's older rows already are.
Slugs and series keys are not in the sheet: SLUG and SECTION below.
"""
import json, re, sys
import openpyxl

SLUG = {
    "DS Bulk Replay Downloader": "bulk-replay-downloader",
    "DS Zones": "zones", "DS Iceberg": "iceberg", "DS Oracle": "oracle", "DS GEX": "gex", "DS Flow": "flow",
    "DS ProRSI": "prorsi", "DS ProLiquidityHunter": "proliquidityhunter", "DS ProHeikinAshi": "proheikinashi",
    "DS ProTrendRange": "protrendrange",
    "DS Adaptive Price Line": "adaptive-priceline", "DS Chart Price": "chart-price", "DS 258": "ds-258",
    "DS Parallax": "parallax", "DS Session Levels": "session-levels", "DS Toolkit": "toolkit",
    "DS Stochastics": "stochastics", "DS Squeeze": "squeeze", "DS MACD": "macd", "DS VWAP": "vwap",
    "DS ASL": "asl",
}
# the sheet's section bars -> the site's series keys.
# "DS COMPLETE EXCLUSIVE" holds what comes free with DS Complete and is not sold on its own: DS ASL and,
# since 2026-10-05, DS Toolkit. A product's series is whatever bar it sits under in the Product Catalog tab;
# if the sheet still lists DS Toolkit under FREE VAULT, content/pricing.ts stops the build (series/price guard).
SECTION = [("DATA UTILITY", "utility"), ("FLAGSHIP INDICATORS", "flagship"), ("PRO SERIES PANELS", "pro"),
           ("FREE VAULT", "vault"), ("DS COMPLETE EXCLUSIVE", "exclusive"), ("THE BUNDLE", None)]
ORDER = ["flagship", "pro", "utility", "exclusive", "vault"]  # the order the site lists its series in
KIND = {"Indicator": "indicator", "Add-On": "addon"}

def dash(s):
    return re.sub(r" - ", " — ", s.strip())

def rows(ws):
    """Yield (series, cells) for every product row, tracking the section bars."""
    series = None
    for r in ws.iter_rows(min_row=4, values_only=True):
        a, b = r[0], r[1]
        if a is None and b is None:
            continue
        if b is None and isinstance(a, str):
            hit = [k for bar, k in SECTION if a.startswith(bar)]
            series = hit[0] if a.startswith(tuple(bar for bar, _ in SECTION)) else series
            continue
        if isinstance(b, str) and b in SLUG:
            yield series, r

def main(sheet, out):
    wb = openpyxl.load_workbook(sheet, data_only=True)
    cat = {b: (s, r) for s, r in rows(wb["Product Catalog"]) for b in [r[1]]}
    det = {r[1]: r for _, r in rows(wb["Product Details"])}
    assert set(cat) == set(SLUG) == set(det), (set(SLUG) ^ set(cat), set(SLUG) ^ set(det))
    products = []
    for key in ORDER:
        for name, (series, r) in cat.items():
            if series != key:
                continue
            d = det[name]
            products.append({
                "slug": SLUG[name], "name": name, "kind": KIND[r[2]], "series": series, "category": r[3],
                "purpose": dash(r[4]), "hooks": [dash(h) for h in r[5:9]],
                "helps": dash(d[4]), "description": dash(d[5]),
            })
    json.dump(products, open(out + "/products.entries.json", "w", encoding="utf-8"), indent=4, ensure_ascii=False)

    listing = {}
    for series, r in rows(wb["Whop Listings"]):
        name, text = r[1], r[3]
        if not text.lstrip().startswith("✦"):
            continue  # DS ASL: no listing of its own (DS Toolkit's listing is retired, but its copy stays in the sheet)
        body = text.split("✦  ✦  ✦")[0]
        paras = [p.strip() for p in re.split(r"\n\s*\n", body) if p.strip()]
        assert paras[0].startswith("✦ "), name
        i = next(k for k, p in enumerate(paras) if p.startswith("◆ "))
        block = paras[i].split("\n")
        points = [l[2:].strip() for l in block[1:]]
        assert all(l.startswith("▸ ") for l in block[1:]) and len(points) == 4 and i == 2, name
        listing[SLUG[name]] = {"hook": dash(paras[0][2:]), "lede": dash(paras[1]), "heading": block[0][2:].strip(),
                               "points": [dash(p) for p in points], "close": [dash(p) for p in paras[i + 1:]]}
    json.dump(listing, open(out + "/listing.entries.json", "w", encoding="utf-8"), indent=4, ensure_ascii=False)

    q = lambda s: json.dumps(s, ensure_ascii=False)
    lines = []
    mk = {SLUG[r[1]]: r for _, r in rows(wb["Markets"])}
    for p in products:
        r = mk[p["slug"]]
        built, runs, cells, note = r[2], r[3], r[4:8], r[9]
        lines.append('  %s: {' % q(p["slug"]))
        lines.append('    headline: %s,' % q(runs.strip()))
        lines.append('    note: %s,' % q(note.strip()))
        lines.append('    builtOn: %s,' % ("true" if built.strip() != "—" else "false"))
        if all(c in ("Yes", "No") for c in cells):
            f, s, x, c = [("true" if v == "Yes" else "false") for v in cells]
            lines.append('    classes: { futures: %s, stocks: %s, forex: %s, crypto: %s },' % (f, s, x, c))
        else:
            lines.append('    /*SPECIAL*/')  # DS GEX (named markets) and the replay downloader: kept as written in markets.ts
        lines.append('  },')
    open(out + "/markets.entries.ts", "w", encoding="utf-8").write("\n".join(lines) + "\n")
    print(len(products), "products;", len(listing), "listings")

if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
