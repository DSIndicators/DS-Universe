import type { ListingCopy } from "@/content/listing-copy";

/**
 * The listing copy, laid out — the same words the buyer meets on Whop.
 *
 * They were written to be read in a store, so they already do the job a
 * product page needs: an opening claim, the mechanism behind it, four concrete
 * things on the chart, and a closing note that is usually about what the tool
 * does NOT do. Rendering them here means a visitor gets the full case without
 * leaving for Whop, and the store and the site cannot drift apart, because both
 * come from the same tab of the Product Information Sheet.
 *
 * The disclaimer each listing carries on Whop is deliberately not repeated: the
 * footer already renders the risk, hypothetical performance and trademark
 * disclosures in full, at body size, on every page.
 */
export function ListingDetail({ copy }: { copy: ListingCopy }) {
  return (
    <section className="border-t border-line">
      <div className="wrap grid gap-12 py-20 lg:grid-cols-12 lg:gap-8 lg:py-24">
        <div className="lg:col-span-5">
          <p className="label">In detail</p>
          <p className="display-sm mt-6 leading-[1.4] text-ink text-pretty">{copy.hook}</p>
        </div>

        <div className="lg:col-span-6 lg:col-start-7">
          <p className="body text-pretty">{copy.lede}</p>

          <h2 className="display-sm mt-10 text-ink">{copy.heading}</h2>
          <ul className="mt-5 space-y-3.5">
            {copy.points.map((p) => (
              <li key={p} className="flex items-start gap-3 text-[16px] leading-relaxed text-ink text-pretty">
                <span className="mt-[9px] block h-1.5 w-1.5 shrink-0 rounded-full bg-gold" aria-hidden="true" />
                <span>{p}</span>
              </li>
            ))}
          </ul>

          <p className="mt-8 border-t border-line pt-6 text-[15.5px] leading-relaxed text-slate text-pretty">
            {copy.close}
          </p>
        </div>
      </div>
    </section>
  );
}
