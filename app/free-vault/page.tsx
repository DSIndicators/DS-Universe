import type { Metadata } from "next";
import Link from "next/link";
import { Reveal } from "@/components/ui/Reveal";
import { Arrow } from "@/components/ui/Arrow";
import { AskButton } from "@/components/AskButton";
import { VaultLabel, VaultPlaque } from "@/components/Vault";
import { VaultDial } from "@/components/VaultDial";
import { VaultRoom, VaultSearchLink } from "@/components/VaultRoom";
import { AFTER_CHECKOUT_FREE, onWaitlist } from "@/content/launch";
import { STORE_PATH, VAULT_PATH } from "@/content/release";
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
 * Everything is in the vault's own voice (components/Vault.tsx): brass where
 * the store is gold, its own mark. No count of products is typed (the lineup
 * changes).
 *
 * A MARKETPLACE, NOT A JOURNAL (2026-10-08, later): the entrance is kept
 * short so the products start within the first screen on a desktop, and the
 * products are laid out as a store — filters beside, cards with their price
 * and button (components/VaultRoom.tsx, components/ProductCard.tsx). On a
 * phone the dial is drawn smaller for the same reason.
 */
export default function FreeVaultPage() {
  const open = !onWaitlist();
  return (
    // .vault-room turns the whole page's light to brass (app/globals.css).
    <div className="vault-room">
      {/* -------------------------------------------------------- the entrance */}
      <section className="vault-entrance relative overflow-hidden">
        <div className="wrap relative pt-10 sm:pt-12 lg:pt-14">
          <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-10">
            <Reveal className="lg:col-span-7">
              <VaultLabel tone="brass" />
              <h1 className="vault-title display-xl mt-5 text-ink text-balance">{VAULT_COPY.title}</h1>
              <p className="lede mt-6 max-w-xl text-pretty">{VAULT_COPY.lede}</p>
              <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
                <a href="#deposits" className="vault-btn group">
                  {VAULT_COPY.enter}
                  <span aria-hidden="true" className="transition-transform duration-300 group-hover:translate-y-0.5">↓</span>
                </a>
                <VaultSearchLink className="font-mono text-[length:calc(10.5px*var(--type))] uppercase tracking-[0.16em] text-mute transition-colors hover:text-vault-light">
                  {VAULT_COPY.enterSearch} <span className="ml-1 hidden border border-[rgba(201,165,94,0.3)] px-1 md:inline" aria-hidden="true">/</span>
                </VaultSearchLink>
              </div>
            </Reveal>
            <div className="relative mx-auto w-full max-w-[200px] sm:max-w-[280px] lg:col-span-5 lg:max-w-[340px] 2xl:max-w-[420px]">
              <VaultDial className="block w-full text-vault" />
            </div>
          </div>
          <Reveal delay={120}>
            <VaultPlaque className="mt-10 lg:mt-12" />
          </Reveal>
        </div>
      </section>

      {/* -------------------------------------------------------- the deposits */}
      <section id="deposits" className="wrap scroll-mt-[96px] pb-20 pt-10 lg:pb-28 lg:pt-14" aria-labelledby="vault-shelf-title">
        <div className="vault-chamber relative p-5 sm:p-8 lg:p-10">
          <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-3">
            <div className="max-w-2xl">
              <h2 id="vault-shelf-title" className="display-md text-ink text-balance">
                {VAULT_COPY.shelfHeading}
              </h2>
              <p className="mt-2.5 text-[length:calc(15px*var(--type))] leading-snug text-slate text-pretty">{VAULT_COPY.shelfSub}</p>
            </div>
            <p className="flex items-baseline gap-3 font-mono text-[length:calc(10.5px*var(--type))] uppercase tracking-[0.16em] text-vault">
              <span className="block h-px w-8 self-center bg-vault" aria-hidden="true" />
              Free · permanently
            </p>
          </div>
          <div className="mt-7">
            <VaultRoom />
          </div>
          <p className="mt-12 max-w-3xl border-t border-[rgba(201,165,94,0.16)] pt-5 text-[length:calc(12.5px*var(--type))] leading-relaxed text-mute">
            {VAULT_COPY.chartsNote} {DISCLOSURE.chart}{" "}
            <Link href="/disclosures" className="underline decoration-mute/50 underline-offset-4 hover:text-ink">
              Disclosures
            </Link>
          </p>
        </div>
      </section>

      {/* -------------------------------------------------------- how it works */}
      <section className="border-t border-[rgba(201,165,94,0.18)] bg-mist">
        <div className="wrap grid gap-14 py-20 lg:grid-cols-12 lg:gap-8 lg:py-24">
          <Reveal className="lg:col-span-5">
            <p className="label">How it works</p>
            <h2 className="display-md mt-4 text-ink text-balance">Free, with nothing to switch on.</h2>
            <p className="mt-6 max-w-md text-[length:calc(14px*var(--type))] leading-relaxed text-slate text-pretty">
              {open ? AFTER_CHECKOUT_FREE.short : "Every product is on the waitlist while the files are being attached. Joining costs nothing."}
            </p>
            <p className="mt-6 text-[length:calc(14px*var(--type))] leading-relaxed text-slate">
              A question first?{" "}
              <AskButton className="text-ink underline decoration-vault/60 underline-offset-4 hover:decoration-vault-light">Ask it here</AskButton>, or write to{" "}
              <a href={`mailto:${SITE.email}`} className="text-ink underline decoration-vault/60 underline-offset-4 hover:decoration-vault-light">
                {SITE.email}
              </a>
              .
            </p>
          </Reveal>
          {open && (
            <Reveal className="lg:col-span-6 lg:col-start-7" delay={80}>
              <ol className="space-y-7">
                {AFTER_CHECKOUT_FREE.steps.map((s, i) => (
                  <li key={s.title} className="grid grid-cols-[28px_minmax(0,1fr)] gap-x-3 border-t border-line-strong pt-5">
                    <span className="font-mono text-[length:calc(12px*var(--type))] tabular-nums text-vault">{String(i + 1).padStart(2, "0")}</span>
                    <div>
                      <p className="text-[length:calc(14.5px*var(--type))] font-medium text-ink">{s.title}</p>
                      <p className="mt-1.5 text-[length:calc(14px*var(--type))] leading-relaxed text-slate text-pretty">{s.text}</p>
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
            <p className="mt-4 text-[length:calc(14.5px*var(--type))] leading-relaxed text-slate text-pretty">{VAULT_COPY.storeText}</p>
          </div>
          <Link href={STORE_PATH} className="btn-ghost group shrink-0">
            {VAULT_COPY.storeCta}
            <Arrow />
          </Link>
        </Reveal>
        <div className="wrap pb-16">
          <p className="max-w-3xl text-[length:calc(13px*var(--type))] leading-relaxed text-mute">{DISCLOSURE.short}</p>
        </div>
      </section>
    </div>
  );
}
