import type { CSSProperties } from "react";
import Link from "next/link";
import { Reveal } from "@/components/ui/Reveal";
import { Arrow } from "@/components/ui/Arrow";
import { VAULT_PATH, VAULT_PRODUCTS, productHref } from "@/content/release";
import Image from "next/image";
import { squareCoverFor } from "@/content/covers";
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
    <span className={`inline-flex items-center gap-2.5 font-mono text-[length:calc(10.5px*var(--type))] uppercase tracking-[0.16em] ${tone === "brass" ? "text-vault" : "text-bull-text"} ${className}`}>
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
          <dt className={`pt-[3px] font-mono text-[length:calc(10px*var(--type))] uppercase tracking-[0.14em] ${tone === "brass" ? "text-vault" : "text-mute"}`}>{f.k}</dt>
          <dd className="text-[length:calc(13.5px*var(--type))] leading-snug text-ink text-pretty">{f.v}</dd>
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
          <dt className="font-mono text-[length:calc(9.5px*var(--type))] uppercase tracking-[0.2em] text-vault">{f.k}</dt>
          <dd className="mt-2 text-[length:calc(13.5px*var(--type))] leading-snug text-ink text-pretty">{f.v}</dd>
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
      <span className="mt-2 block text-[length:calc(13.5px*var(--type))] leading-relaxed text-slate text-pretty">
        {VAULT_COPY.hero}{" "}
        <span className="whitespace-nowrap text-ink underline decoration-bull/60 underline-offset-4 transition-colors group-hover:decoration-bull-text">
          {VAULT_COPY.heroLink}
        </span>
      </span>
    </Link>
  );
}

/**
 * THE BAND — on the home page, after the paid lineup (2026-10-09 overhaul,
 * Tom: the old band was "extremely poorly designed and needs a full overhaul").
 *
 * THE DEPOSIT WALL. A vault keeps what is in it in boxes, so the free tools are
 * shown as one: a wall of safe-deposit boxes, one per product, each with its
 * number engraved on the plate, its keyhole, a window onto its own chart, its
 * name, what it is and the one line that sells it. A box slides a few pixels
 * out of the wall when you point at it and its handle lengthens — the drawer
 * coming to you — and opens the product's page in the vault.
 *
 * What the vault is stands on the left (the heading, two sentences, the
 * facts, the way in); the wall fills the right. The wall always closes on a
 * full row: where the boxes do not fill the last row, the rest of the row is
 * empty boxes — locked, unnumbered — the way a real wall is never short a box.
 * No price anywhere (it is all free); no count typed (it is read off the
 * lineup). Styles: app/globals.css, THE DEPOSIT WALL.
 */
export function VaultBand() {
  const ps = VAULT_PRODUCTS;
  if (!ps.length) return null;
  const n = ps.length;
  const fill2 = (2 - (n % 2)) % 2; // to close a row of two (from 640px)
  const fill3 = (3 - (n % 3)) % 3; // to close a row of three (from 1024px)
  const fillers = Math.max(fill2, fill3);
  return (
    <section id="free-vault" className="vault-band scroll-mt-[100px]" aria-labelledby="vault-band-title">
      <div className="wrap grid gap-x-12 gap-y-12 py-20 lg:grid-cols-12 lg:py-28 2xl:gap-x-16">
        <Reveal className="lg:col-span-4 lg:self-start lg:sticky lg:top-[120px]">
          <VaultLabel tone="brass" />
          <h2 id="vault-band-title" className="display-lg mt-5 text-ink text-balance">
            {VAULT_COPY.band.heading}
          </h2>
          <p className="mt-5 max-w-md text-[length:calc(15px*var(--type))] leading-relaxed text-slate text-pretty">{VAULT_COPY.band.text}</p>
          <VaultFacts className="mt-8 max-w-md" tone="brass" />
          <Link href={VAULT_PATH} className="vault-btn group mt-8">
            {VAULT_COPY.band.cta}
            <Arrow />
          </Link>
        </Reveal>

        <div className="lg:col-span-8">
          <p className="mb-4 flex items-center gap-3 font-mono text-[length:calc(10px*var(--type))] uppercase tracking-[0.2em] text-vault">
            <span className="block h-px w-8 bg-[rgba(201,165,94,0.5)]" aria-hidden="true" />
            {String(n).padStart(2, "0")} boxes · every one free
          </p>
          <ul className="deposit-wall grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-3.5 lg:grid-cols-3" aria-label="Every product in the Free Vault">
            {ps.map((p, i) => (
              <li key={p.slug} className="flex min-w-0">
                <DepositBox slug={p.slug} no={i + 1} name={p.name} category={p.category} hook={p.hooks?.[0]} />
              </li>
            ))}
            {Array.from({ length: fillers }, (_, i) => (
              <li
                key={`empty-${i}`}
                aria-hidden="true"
                className={`hidden min-w-0 ${i < fill2 ? "sm:flex" : "sm:hidden"} ${i < fill3 ? "lg:flex" : "lg:hidden"}`}
              >
                <div className="deposit-box deposit-box-empty w-full">
                  <Keyhole className="h-4 w-4" />
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

/** A deposit box's keyhole: a round ward over a tapered slot. */
function Keyhole({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 12 16" className={className} fill="none" stroke="currentColor" strokeWidth="1" aria-hidden="true">
      <circle cx="6" cy="5.5" r="3" />
      <path d="M4.9 8.2 4.2 13.5h3.6L7.1 8.2" strokeLinejoin="round" />
    </svg>
  );
}

/** Where a box's window looks on its square cover when the cover's subject is not central. */
const WINDOW_FOCUS: Record<string, string> = { "chart-price": "50% 0%" };

/** One box on the wall: plate, window, name, the line that sells it, the way in. */
function DepositBox({ slug, no, name, category, hook }: { slug: string; no: number; name: string; category: string; hook?: string }) {
  const cover = squareCoverFor(slug);
  return (
    <Link href={productHref(slug)} className="deposit-box group w-full" aria-label={`${name} — ${category}. Free, in the vault.`}>
      <span className="deposit-plate">
        <span>Nº {String(no).padStart(2, "0")}</span>
        <Keyhole className="h-3.5 w-3 opacity-70" />
      </span>
      <span className="deposit-window">
        {cover && (
          <Image
            src={cover.src}
            alt=""
            fill
            sizes="(min-width: 1536px) 360px, (min-width: 1024px) 26vw, (min-width: 640px) 45vw, 112px"
            quality={92}
            className="object-cover"
            style={{ objectPosition: WINDOW_FOCUS[slug] ?? "50% 45%" }}
          />
        )}
      </span>
      <span className="deposit-body">
        <span className="block text-[length:calc(15.5px*var(--type))] font-medium tracking-[-0.01em] text-ink">{name}</span>
        <span className="mt-1 block font-mono text-[length:calc(9.5px*var(--type))] uppercase tracking-[0.18em] text-mute">{category}</span>
        {hook && <span className="mt-3 block text-[length:calc(13.5px*var(--type))] leading-snug text-slate text-pretty max-sm:hidden">{hook}</span>}
      </span>
      <span className="deposit-foot">
        <span className="font-mono text-[length:calc(10.5px*var(--type))] uppercase tracking-[0.18em] text-vault-light">Free</span>
        <span className="flex items-center gap-2 text-[length:calc(12.5px*var(--type))] text-slate transition-colors group-hover:text-vault-light">
          Open the box <Arrow className="transition-transform duration-300 group-hover:translate-x-0.5" />
        </span>
      </span>
    </Link>
  );
}
