import type { Metadata } from "next";
import Link from "next/link";
import { Reveal } from "@/components/ui/Reveal";
import { Arrow } from "@/components/ui/Arrow";
import { AskButton } from "@/components/AskButton";
import { BoxCard } from "@/components/BoxCard";
import { VaultFacts, VaultLabel } from "@/components/Vault";
import { AFTER_CHECKOUT, onWaitlist } from "@/content/launch";
import { STORE_PATH, VAULT_PATH, VAULT_PRODUCTS, productHref } from "@/content/release";
import { DISCLOSURE, SITE } from "@/content/site";
import { VAULT_COPY } from "@/content/vault";

export const metadata: Metadata = {
  title: "Free Vault",
  description:
    "The Free Vault: free DS Universe indicators and tools for NinjaTrader 8. Each one is its own download, free permanently — not a trial and not a stripped build.",
  alternates: { canonical: VAULT_PATH },
};

/**
 * /free-vault — THE FREE VAULT (Tom, 2026-10-05).
 *
 * "A tab users can see instantly and be intrigued to go to"; the free products
 * that were on the home page and on a store shelf are "neatly placed on the
 * new Free vault page". Paid and free are kept apart: nothing here is priced,
 * nothing here is part of DS Complete, and the store (/products) shows none
 * of it.
 *
 * THE ORDER:
 *   1. What the vault is — one headline, two plain sentences, and its facts as
 *      a spec sheet (price, download, license, DS Complete).
 *   2. Every product in it, as a grid that closes on a full row at every
 *      width (see VAULT_GRID below): the heading stands beside the boxes on a
 *      desktop, as the facts stand beside the headline above.
 *   3. How a free download works — the three checkout steps the store uses,
 *      because a free product goes through the same checkout.
 *   4. One quiet pointer to the store, for the visitor who came for the paid
 *      lineup.
 *
 * Everything is in the vault's own voice (components/Vault.tsx): teal where
 * the store is gold, its own mark, a flat band where the store has panels.
 * No count of products is typed (the lineup changes).
 */
/**
 * THE VAULT'S GRID — no empty cell and no tile alone on a last row, at any
 * width, for whatever the vault holds (it held ten boxes until DS Toolkit left
 * for DS Complete on 2026-10-05, and holds nine now).
 *
 *   DESKTOP (1024px+)  five columns when the boxes fill whole rows of five;
 *                      otherwise THREE columns beside the heading, which
 *                      moves into a rail of its own on the left — with an
 *                      index of the vault under it — and stays in view while
 *                      the boxes scroll. Nine boxes: three rows of three,
 *                      each box within a few pixels of a store shelf's.
 *   TABLET (640px+)    three columns for the three-column layout, two for
 *                      the five-column one.
 *   PHONE              two columns. An odd number of boxes would leave the
 *                      last one alone, so the FIRST takes a whole row (its
 *                      box in column one, its words in column two —
 *                      BoxCard `lead`) and the rest pair off: nine boxes are
 *                      one lead row and four rows of two.
 *
 * A count that divides by neither five nor three still leaves a short last
 * row on wide screens; that is a count to lay out when it happens.
 */
function vaultGrid(n: number) {
  const five = n % 5 === 0;
  return {
    five,
    /** Phones pair the boxes off; with an odd count the first one leads. */
    lead: n % 2 === 1,
    // Written out in full: Tailwind cannot see a class built from a number.
    grid: five ? "grid-cols-2 lg:grid-cols-5" : "grid-cols-2 sm:grid-cols-3",
  };
}

export default function FreeVaultPage() {
  const ps = VAULT_PRODUCTS;
  const layout = vaultGrid(ps.length);
  const shelfHead = (
    <>
      <div>
        <h2 id="vault-shelf-title" className="display-md text-ink text-balance">
          {VAULT_COPY.shelfHeading}
        </h2>
        <p className="mt-2.5 text-[15px] leading-snug text-slate text-pretty">{VAULT_COPY.shelfSub}</p>
      </div>
      <p className="flex items-baseline gap-3 font-mono text-[10.5px] uppercase tracking-[0.16em] text-bull-text">
        <span className="block h-px w-8 self-center bg-bull" aria-hidden="true" />
        Free · permanently
      </p>
    </>
  );
  const tiles = ps.map((p, i) => <BoxCard key={p.slug} slug={p.slug} priority={i < 5} lead={layout.lead && i === 0} />);
  const open = !onWaitlist();
  return (
    <>
      {/* -------------------------------------------------------------- head */}
      <section className="hero-wash">
        <div className="wrap pb-14 pt-12 sm:pt-16 lg:pb-16 lg:pt-20">
          <div className="grid gap-12 lg:grid-cols-12 lg:items-end lg:gap-10">
            <Reveal className="lg:col-span-7">
              <VaultLabel />
              <h1 className="display-xl mt-5 text-ink text-balance">{VAULT_COPY.title}</h1>
              <p className="lede mt-6 max-w-xl text-pretty">{VAULT_COPY.lede}</p>
            </Reveal>
            <Reveal className="lg:col-span-5" delay={100}>
              <VaultFacts />
            </Reveal>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------ the vault */}
      <section className="wrap pb-20 lg:pb-28" aria-labelledby="vault-shelf-title">
        {/* No overflow clip on the three-column layout: its heading rail is
            sticky, and a clipped panel would become what it sticks to. */}
        <Reveal className={`vault-panel relative rounded-xl border p-6 sm:p-8 lg:p-10 ${layout.five ? "overflow-hidden" : ""}`}>
          {layout.five ? (
            <>
              <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-3">{shelfHead}</div>
              <div className={`mt-10 grid gap-x-5 gap-y-10 ${layout.grid}`}>{tiles}</div>
            </>
          ) : (
            // The heading as a rail beside the boxes (1024px+); above them below that.
            // The rail opens on a hairline level with the top edge of the first
            // row of boxes (a cover's frame carries a margin above its box),
            // and under the heading it lists what the vault holds — an index a
            // visitor can read in one look and jump from. It stays in view
            // while the boxes scroll.
            <div className="lg:grid lg:grid-cols-12 lg:gap-x-10">
              <div className="lg:col-span-4">
                <div className="lg:sticky lg:top-28 lg:mt-[18px] lg:border-t lg:border-line lg:pt-6">
                  <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-3 lg:flex-col lg:items-start lg:justify-start lg:gap-y-6">{shelfHead}</div>
                  <ul className="mt-8 hidden border-t border-line lg:block" aria-label="In the Free Vault">
                    {ps.map((p) => (
                      <li key={p.slug} className="border-b border-line">
                        <Link href={productHref(p.slug)} className="group flex items-baseline gap-3 py-2.5 text-[13.5px]">
                          <span className="text-ink transition-colors group-hover:text-bull-text">{p.name}</span>
                          <span className="ml-auto truncate text-[12px] text-mute">{p.category}</span>
                          <span className="w-3 shrink-0 text-mute transition-transform group-hover:translate-x-0.5 group-hover:text-bull-text" aria-hidden="true">
                            →
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className={`mt-10 grid gap-x-5 gap-y-10 lg:col-span-8 lg:mt-0 ${layout.grid}`}>{tiles}</div>
            </div>
          )}
        </Reveal>
      </section>

      {/* -------------------------------------------------------- how it works */}
      <section className="border-t border-line bg-mist">
        <div className="wrap grid gap-14 py-20 lg:grid-cols-12 lg:gap-8 lg:py-24">
          <Reveal className="lg:col-span-5">
            <p className="label">How it works</p>
            <h2 className="display-md mt-4 text-ink text-balance">A free product is licensed like a paid one.</h2>
            <p className="mt-6 max-w-md text-[14px] leading-relaxed text-slate text-pretty">
              {open ? AFTER_CHECKOUT.short : "Every product is on the waitlist while the files are being attached. Joining costs nothing."}
            </p>
            <p className="mt-6 text-[14px] leading-relaxed text-slate">
              A question first?{" "}
              <AskButton className="text-ink underline decoration-bull/60 underline-offset-4 hover:decoration-bull-text">Ask it here</AskButton>, or write to{" "}
              <a href={`mailto:${SITE.email}`} className="text-ink underline decoration-bull/60 underline-offset-4 hover:decoration-bull-text">
                {SITE.email}
              </a>
              .
            </p>
          </Reveal>
          {open && (
            <Reveal className="lg:col-span-6 lg:col-start-7" delay={80}>
              <ol className="space-y-7">
                {AFTER_CHECKOUT.steps.map((s, i) => (
                  <li key={s.title} className="grid grid-cols-[28px_minmax(0,1fr)] gap-x-3 border-t border-line-strong pt-5">
                    <span className="font-mono text-[12px] tabular-nums text-bull-text">{String(i + 1).padStart(2, "0")}</span>
                    <div>
                      <p className="text-[14.5px] font-medium text-ink">{s.title}</p>
                      <p className="mt-1.5 text-[14px] leading-relaxed text-slate text-pretty">{s.text}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </Reveal>
          )}
        </div>
      </section>

      {/* ------------------------------------------------------- the paid side */}
      <section className="border-t border-line">
        <Reveal className="wrap flex flex-col gap-8 py-20 md:flex-row md:items-end md:justify-between lg:py-24">
          <div className="max-w-xl">
            <p className="label">The store</p>
            <h2 className="display-md mt-4 text-ink text-balance">{VAULT_COPY.storeHeading}</h2>
            <p className="mt-4 text-[14.5px] leading-relaxed text-slate text-pretty">{VAULT_COPY.storeText}</p>
          </div>
          <Link href={STORE_PATH} className="btn-ghost group shrink-0">
            {VAULT_COPY.storeCta}
            <Arrow />
          </Link>
        </Reveal>
        <div className="wrap pb-16">
          <p className="max-w-3xl text-[13px] leading-relaxed text-mute">{DISCLOSURE.short}</p>
        </div>
      </section>
    </>
  );
}
