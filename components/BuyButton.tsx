import { AFTER_CHECKOUT, onWaitlist, opensWhen } from "@/content/launch";
import { buyHref, buyLabel, listingFor } from "@/content/whop";

/**
 * The buy button. One component, so every one on the site agrees about where
 * it goes and what it promises.
 *
 * It leaves for the product's DIRECT Whop checkout (content/whop.ts) and says
 * "Buy now" / "Get it free". While the store is on a waitlist
 * (content/launch.ts) it says "Join the waitlist" instead, with no edit here.
 *
 * A key with no listing renders nothing rather than a dead link.
 */
export function BuyButton({
  slug,
  variant = "primary",
  className = "",
  label,
}: {
  slug: string;
  variant?: "primary" | "ghost";
  className?: string;
  /** Override the words (e.g. "DS Complete — $374.95"). */
  label?: string;
}) {
  const l = listingFor(slug);
  if (!l) return null;
  return (
    <a
      href={buyHref(l)}
      target="_blank"
      rel="noopener"
      className={`${variant === "primary" ? "btn-primary" : "btn-ghost"} ${className}`}
    >
      {label ?? buyLabel(slug)}
      <External />
    </a>
  );
}

/**
 * One line under a buy button. Open: what happens after checkout (the
 * NinjaTrader email, the files at once, the license by hand) and, given a
 * slug, a quiet link to the product's Whop listing. Waitlist: the old promise.
 */
export function CtaNote({
  className = "",
  tone = "light",
  slug,
}: {
  className?: string;
  tone?: "light" | "dark";
  slug?: string;
}) {
  const muted = tone === "dark" ? "text-white/55" : "text-mute";
  if (onWaitlist()) {
    return (
      <p className={`text-[13px] leading-relaxed ${muted} ${className}`}>
        Nothing is charged and no card is asked for — you are told {opensWhen()}.
      </p>
    );
  }
  const l = slug ? listingFor(slug) : undefined;
  return (
    <p className={`max-w-md text-[13px] leading-relaxed ${muted} ${className}`}>
      {AFTER_CHECKOUT.short}
      {l && (
        <>
          {" "}
          <a
            href={l.product}
            target="_blank"
            rel="noopener"
            className={`underline underline-offset-4 transition-colors ${
              tone === "dark" ? "decoration-white/30 hover:text-white" : "decoration-line-strong hover:text-ink"
            }`}
          >
            See it on Whop
          </a>
        </>
      )}
    </p>
  );
}

function External() {
  return (
    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 opacity-70" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 3.5H3.5v9h9V10M9 3.5h3.5V7M12.5 3.5 7 9" />
    </svg>
  );
}
