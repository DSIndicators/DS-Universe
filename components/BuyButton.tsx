import { onWaitlist, opensWhen } from "@/content/launch";
import { buyHref, buyLabel, listingFor } from "@/content/whop";

/**
 * The buy button. One component, so every one on the site agrees about where
 * it goes and what it promises.
 *
 * It always leaves for the product's own Whop listing (content/whop.ts). While
 * the store is on a waitlist (content/launch.ts) it says "Join the waitlist",
 * which is what the Whop page's own button says — a click never promises more
 * than the next page does. Flip the waitlist off and every button on the site
 * becomes "Get access" / "Get it free" with no edit here.
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

/** One line of reassurance under a buy button, while the shop is shut. */
export function CtaNote({ className = "", tone = "light" }: { className?: string; tone?: "light" | "dark" }) {
  if (!onWaitlist()) return null;
  return (
    <p className={`text-[13px] leading-relaxed ${tone === "dark" ? "text-white/55" : "text-mute"} ${className}`}>
      Nothing is charged and no card is asked for — you are told {opensWhen()}.
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
