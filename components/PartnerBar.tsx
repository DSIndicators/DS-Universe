import { NT_ASSETS, NT_LINKS } from "@/content/ninjatrader";

const ext = { target: "_blank", rel: "sponsored noopener" } as const;

/**
 * THE PARTNER STRIP (2026-10-26, Tom: "add our ninjatrader affiliate link on
 * the top elegantly"). One quiet line above the header on every page: it
 * scrolls away with the page while the header stays.
 *
 * - The wordmark links to NT_LINKS.logo, the short link NinjaTrader asked us
 *   to use for every logo placement; the button uses the partner link, the
 *   same as the /ninjatrader page's "Get Started for FREE!".
 * - The sentence and the button text are the NinjaTrader vendor kit's own
 *   words, as on /ninjatrader (never reworded).
 * - "Partner" says plainly that this is a partner link (rel="sponsored").
 */
export function PartnerBar() {
  return (
    <aside className="ptr" aria-label="Our recommended trading platform">
      <div className="wrap ptr-in">
        <span className="ptr-tag">Partner</span>
        <a className="ptr-mark" href={NT_LINKS.logo} {...ext} aria-label="NinjaTrader, visit ninjatrader.com">
          <img src={NT_ASSETS.wordmark} srcSet={NT_ASSETS.wordmarkSet} sizes="90px" alt="NinjaTrader" width={2376} height={300} />
        </a>
        <p className="ptr-text">NinjaTrader® is our #1 recommended trading platform.</p>
        <a className="ptr-go" href={NT_LINKS.partner} {...ext}>
          Get Started for FREE!
        </a>
      </div>
    </aside>
  );
}
