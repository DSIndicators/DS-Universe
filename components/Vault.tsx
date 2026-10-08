import type { CSSProperties } from "react";
import Link from "next/link";
import { Reveal } from "@/components/ui/Reveal";
import { Arrow } from "@/components/ui/Arrow";
import { VAULT_PATH, VAULT_PRODUCTS } from "@/content/release";
import { VaultRail } from "@/components/VaultRail";
import { VAULT_COPY } from "@/content/vault";

/**
 * THE FREE VAULT on the page (2026-10-05). Its words live in content/vault.ts;
 * which products are in it is content/products.ts (series "vault").
 *
 * THE SYSTEM — so the vault reads as its own place while plainly belonging to
 * this site (Tom: sturdy and elegant; no pills, no gradient text, no glows):
 *   · ONE COLOUR. Gold is money on this site, and the store is gold. The vault
 *     is the house teal, which already means "free, on your chart, now" here
 *     (the trial, the hero's status light). It is used as a hairline, a mark
 *     and small type — never a fill behind a button, never a glow.
 *   · ONE MARK. A vault door: a square, its dial, the dial's index. Drawn on
 *     whole pixels so it is crisp at 12px.
 *   · ONE VOICE. "FREE VAULT" is always set in the instrument face (mono,
 *     small caps, spaced), the way the site labels prices and series — in the
 *     header that is what sets its tab apart from the plain words beside it.
 *   · A BAND, NOT A CARD. The store is made of rounded panels on a gold
 *     thread. The vault is a full-width band between two teal hairlines, so
 *     on the home page it cannot be mistaken for one more shelf.
 *
 * WHERE IT APPEARS:
 *   header / phone menu / footer   the "Free Vault" tab (components/Navbar.tsx)
 *   home hero                      VaultHeroNote   that it exists, one link
 *   home, after the paid lineup    VaultBand       what it is, its boxes, the way in
 *   /free-vault                    the page — since 2026-10-08 THE VAULT ROOM:
 *                                  brass, not teal (Tom: "hints of gold"); its
 *                                  dial (VaultDial), VaultPlaque, and the search
 *                                  and real-chart deposits (VaultRoom)
 *   /free-vault/<slug>             each product's own page (ProductPage.tsx)
 */

/** A vault door: the square, its dial, the dial's index. */
export function VaultMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 12 12" width="12" height="12" className={`shrink-0 ${className}`} fill="none" stroke="currentColor" strokeWidth="1" aria-hidden="true">
      <path d="M1.5 1.5h9v9h-9z" />
      <path d="M6 3.5a2.5 2.5 0 1 0 0 5a2.5 2.5 0 1 0 0 -5z" />
      <path d="M6 6V4.2" strokeLinecap="square" />
    </svg>
  );
}

/** The mark and the words, in the instrument voice. */
export function VaultLabel({
  className = "",
  text = VAULT_COPY.label,
  tone = "teal",
}: {
  className?: string;
  text?: string;
  /** "brass" inside the vault itself (/free-vault, 2026-10-08); teal everywhere else. */
  tone?: "teal" | "brass";
}) {
  return (
    <span className={`inline-flex items-center gap-2.5 font-mono text-[10.5px] uppercase tracking-[0.16em] ${tone === "brass" ? "text-vault" : "text-bull-text"} ${className}`}>
      <VaultMark />
      {text}
    </span>
  );
}

/** The facts as a spec sheet: small-caps key, plain value, one hairline each. */
export function VaultFacts({ className = "", tone = "plain" }: { className?: string; tone?: "plain" | "brass" }) {
  const rule = tone === "brass" ? "border-[rgba(201,165,94,0.2)]" : "border-line";
  return (
    <dl className={`border-t ${rule} ${className}`} aria-label="How the Free Vault works">
      {VAULT_COPY.facts.map((f) => (
        <div key={f.k} className={`grid grid-cols-[104px_minmax(0,1fr)] gap-x-4 border-b ${rule} py-2.5`}>
          <dt className={`pt-[3px] font-mono text-[10px] uppercase tracking-[0.14em] ${tone === "brass" ? "text-vault" : "text-mute"}`}>{f.k}</dt>
          <dd className="text-[13.5px] leading-snug text-ink text-pretty">{f.v}</dd>
        </div>
      ))}
    </dl>
  );
}

/**
 * THE PLAQUE — the same facts as VaultFacts, engraved across the foot of the
 * vault's entrance (/free-vault, 2026-10-08): four cells between two brass
 * hairlines, a key in the instrument face over each plain value. Two columns
 * on a phone, four from 768px.
 */
export function VaultPlaque({ className = "" }: { className?: string }) {
  return (
    <dl className={`vault-plaque grid grid-cols-2 md:grid-cols-4 ${className}`} aria-label="How the Free Vault works">
      {VAULT_COPY.facts.map((f) => (
        <div key={f.k} className="vault-plaque-cell px-0 py-5 md:px-6 md:first:pl-0">
          <dt className="font-mono text-[9.5px] uppercase tracking-[0.2em] text-vault">{f.k}</dt>
          <dd className="mt-2 text-[13.5px] leading-snug text-ink text-pretty">{f.v}</dd>
        </div>
      ))}
    </dl>
  );
}

/**
 * HOME HERO — one line under the trial note, built the same way (a hairline,
 * the label, one sentence, one link). No price: the hero carries none.
 */
export function VaultHeroNote({ className = "", style }: { className?: string; style?: CSSProperties }) {
  if (!VAULT_PRODUCTS.length) return null;
  return (
    <Link href={VAULT_PATH} className={`group block max-w-md border-t border-line pt-5 ${className}`} style={style}>
      <VaultLabel />
      <span className="mt-2 block text-[13.5px] leading-relaxed text-slate text-pretty">
        {VAULT_COPY.hero}{" "}
        <span className="whitespace-nowrap text-ink underline decoration-bull/60 underline-offset-4 transition-colors group-hover:decoration-bull-text">
          {VAULT_COPY.heroLink}
        </span>
      </span>
    </Link>
  );
}

/**
 * THE BAND — on the home page, after the paid lineup and in place of the free
 * shelf that used to close it. What the vault is on the left, its facts on
 * the right, and under them every box in it as one contact strip: small, in
 * whole rows on a phone and on one line above it (STRIP_COLS), never priced
 * and never mixed into the store's shelves.
 * Each box opens its own page in the vault.
 */
export function VaultBand() {
  const ps = VAULT_PRODUCTS;
  if (!ps.length) return null;
  return (
    <section id="free-vault" className="vault-band scroll-mt-[100px]" aria-labelledby="vault-band-title">
      <div className="wrap pt-20 lg:pt-24">
        <Reveal className="grid gap-x-10 gap-y-9 md:grid-cols-12 md:items-start">
          <div className="md:col-span-7">
            <VaultLabel tone="brass" />
            <h2 id="vault-band-title" className="display-lg mt-4 text-ink text-balance">
              {VAULT_COPY.band.heading}
            </h2>
            <p className="mt-4 max-w-xl text-[14.5px] leading-relaxed text-slate text-pretty">{VAULT_COPY.band.text}</p>
            <Link href={VAULT_PATH} className="vault-btn group mt-7">
              {VAULT_COPY.band.cta}
              <Arrow />
            </Link>
          </div>
          <VaultFacts className="md:col-span-5" tone="brass" />
        </Reveal>
      </div>
      {/* Every product in the vault by its own chart, on one sliding rail
          (components/VaultRail.tsx) — it replaced the strip of boxes. */}
      <Reveal delay={80} className="pb-20 pt-14 lg:pb-24">
        <VaultRail />
      </Reveal>
    </section>
  );
}

