import Link from "next/link";
import { Reveal } from "@/components/ui/Reveal";
import { AFTER_CHECKOUT, onWaitlist } from "@/content/launch";
import { FAQ } from "@/content/faq";
import { TERMS } from "@/content/pricing";
import { SITE } from "@/content/site";

/**
 * "Before you buy" — the end of the store, directly under the prices and
 * DS Complete, which is where a buyer hesitates (2026-09-27).
 *
 * LEFT: how buying works, in three steps (content/launch.ts AFTER_CHECKOUT —
 * the same words the READMEs and the Whop FAQ use). It used to sit at the top of
 * /products and /pricing as a band; it now sits where the decision is made, so
 * the store opens on the products.
 * RIGHT: the questions (content/faq.ts), as native <details> — keyboard,
 * screen reader and find-in-page all work with no script.
 *
 * While the store is on a waitlist the checkout steps would be untrue, so they
 * step aside and the questions take the full width.
 */
export function BeforeYouBuy() {
  const open = !onWaitlist();
  return (
    <section id="faq" className="scroll-mt-[148px] border-t border-line">
      {/* "Bought once. Never rented." — the terms, said once, at the head of
          the reassurance rather than between the headline and the products
          (2026-09-27: the store now opens straight onto the panels). */}
      <div className="wrap pt-24 lg:pt-28">
        <Reveal>
          <h2 className="display-md text-ink">Bought once. Never rented.</h2>
        </Reveal>
        <div className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {TERMS.map((t, i) => (
            <Reveal key={t.title} delay={i * 80} className="border-t border-line-strong pt-5">
              <h3 className="display-sm text-ink">{t.title}</h3>
              <p className="mt-2.5 text-[14px] leading-relaxed text-slate text-pretty">{t.text}</p>
            </Reveal>
          ))}
        </div>
      </div>
      <div className="wrap grid gap-14 py-20 lg:grid-cols-12 lg:gap-8 lg:py-24">
        <Reveal className={open ? "lg:col-span-5" : "lg:col-span-12"}>
          <p className="label">Before you buy</p>
          <h3 className="display-md mt-4 text-ink text-balance">What happens when you buy.</h3>
          {open && (
            <ol className="mt-10 space-y-7">
              {AFTER_CHECKOUT.steps.map((s, i) => (
                <li key={s.title} className="grid grid-cols-[28px_minmax(0,1fr)] gap-x-3 border-t border-line-strong pt-5">
                  <span className="font-display text-[14px] tabular-nums text-gold-deep">{String(i + 1).padStart(2, "0")}</span>
                  <div>
                    <p className="text-[14.5px] font-medium text-ink">{s.title}</p>
                    <p className="mt-1.5 text-[14px] leading-relaxed text-slate text-pretty">{s.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </Reveal>

        <Reveal className={open ? "lg:col-span-6 lg:col-start-7" : "lg:col-span-8"} delay={80}>
          <ul className="border-b border-line">
            {FAQ.map((f) => (
              <li key={f.q} className="border-t border-line">
                <details className="group">
                  <summary className="flex cursor-pointer list-none items-start justify-between gap-6 py-5 text-[15px] leading-snug text-ink transition-colors hover:text-gold-deep [&::-webkit-details-marker]:hidden">
                    <span className="text-pretty">{f.q}</span>
                    <svg
                      viewBox="0 0 16 16"
                      className="mt-1 h-4 w-4 shrink-0 text-mute transition-transform duration-300 ease-silk group-open:rotate-45"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      aria-hidden="true"
                    >
                      <path d="M8 2.5v11M2.5 8h11" />
                    </svg>
                  </summary>
                  <p className="max-w-2xl pb-6 pr-10 text-[14px] leading-relaxed text-slate text-pretty">
                    {f.a}
                    {f.link && (
                      <>
                        {" "}
                        <Link href={f.link.href} className="whitespace-nowrap text-ink underline decoration-gold/60 underline-offset-4 hover:decoration-gold">
                          {f.link.label}
                        </Link>
                        .
                      </>
                    )}
                  </p>
                </details>
              </li>
            ))}
          </ul>
          <p className="mt-8 text-[14px] leading-relaxed text-slate">
            Still a question?{" "}
            <a href={`mailto:${SITE.email}`} className="text-ink underline decoration-gold/60 underline-offset-4 hover:decoration-gold">
              {SITE.email}
            </a>{" "}
            — a person answers, not a form.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
