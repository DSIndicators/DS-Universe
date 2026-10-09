import { AFTER_CHECKOUT, onWaitlist, opensWhen } from "@/content/launch";
import { PENDING_NOTE, buyHref, buyLabel, isPending, listingFor, purchaseKey } from "@/content/whop";

/**
 * The buy button. One component, so every one on the site agrees about where
 * it goes and what it promises.
 *
 * It leaves for the product's DIRECT Whop checkout (content/whop.ts) and says
 * "Buy now" / "Get it free". While the store is on a waitlist
 * (content/launch.ts) it says "Join the waitlist" instead, with no edit here.
 *
 * A key with no listing renders nothing rather than a dead link. A product
 * that comes free with DS Complete and is not sold on its own (DS ASL, DS
 * Toolkit) is had through DS Complete's checkout and says "Get DS Complete"
 * (purchaseKey, buyLabel).
 *
 * A PENDING product (content/whop.ts PENDING_LISTING — its Whop listing does
 * not exist yet) gets no link at all: the button's place holds a plain,
 * inert "Not open yet", in the ghost button's own frame with a dashed edge,
 * so the page is honest about it and nothing can be clicked through to a
 * checkout that is not there. A production build refuses to run while any
 * product is pending, so visitors never meet this state.
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
  if (isPending(slug)) {
    return (
      <span
        data-pending={slug}
        className={`inline-flex h-10 cursor-default select-none items-center justify-center rounded-md border border-dashed border-line-strong px-5 text-[length:calc(13.5px*var(--type))] font-medium text-mute ${className}`}
      >
        {PENDING_NOTE.label}
      </span>
    );
  }
  const l = listingFor(purchaseKey(slug));
  if (!l) return null;
  return (
    <a
      href={buyHref(l)}
      data-buy={slug}
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
      <p className={`text-[length:calc(12.5px*var(--type))] leading-relaxed ${muted} ${className}`}>
        Nothing is charged and no card is asked for — you are told {opensWhen()}.
      </p>
    );
  }
  if (slug && isPending(slug)) {
    return <p className={`max-w-md text-[length:calc(12.5px*var(--type))] leading-relaxed ${muted} ${className}`}>{PENDING_NOTE.text}</p>;
  }
  const key = slug ? purchaseKey(slug) : undefined;
  const l = key ? listingFor(key) : undefined;
  return (
    <p className={`max-w-md text-[length:calc(12.5px*var(--type))] leading-relaxed ${muted} ${className}`}>
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
            {key !== slug ? "See DS Complete on Whop" : "See it on Whop"}
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
