import Link from "next/link";
import { TrialMark } from "@/components/Trial";
import { TRIAL_NOTICE } from "@/content/trial";
import { VAULT_PATH } from "@/content/release";

/**
 * THE TRIAL NOTICE (2026-10-14) — one slim strip under the NinjaTrader bar on
 * every page, while the 3-day trial is closed and the next one is prepared.
 * Words and switch: content/trial.ts TRIAL_NOTICE.
 *
 * Built in the trial's own voice so it reads as the same system: bull teal,
 * the three-candle mark, mono small caps for the label, a hairline under it.
 * No fill colour, no glow, no close button — it is one line and it scrolls
 * away with the page (it is not sticky). The whole strip links to /trial,
 * which says the same thing in full; the Free Vault is the thing to do today.
 */
export function TrialNotice() {
  if (!TRIAL_NOTICE.active) return null;
  return (
    <div className="trial-notice border-b">
      <div className="wrap flex min-h-10 items-center justify-center gap-x-3 py-2 text-center">
        <Link href="/trial" className="group inline-flex min-w-0 items-center gap-3 text-[length:calc(12.5px*var(--type))] text-slate">
          <TrialMark className="text-bull-text" />
          {/* Phones: the short form, one line. */}
          <span className="font-mono text-[length:calc(10.5px*var(--type))] uppercase tracking-[0.14em] text-bull-text sm:hidden">
            {TRIAL_NOTICE.short}
          </span>
          <span className="hidden min-w-0 items-center gap-3 sm:inline-flex">
            <span className="font-mono text-[length:calc(10.5px*var(--type))] uppercase tracking-[0.14em] text-bull-text">{TRIAL_NOTICE.label}</span>
            <span className="h-3 w-px bg-line-strong" aria-hidden="true" />
            <span className="truncate text-ink transition-colors group-hover:text-bull-text">{TRIAL_NOTICE.line}</span>
          </span>
        </Link>
        <Link
          href={VAULT_PATH}
          className="hidden shrink-0 text-[length:calc(12.5px*var(--type))] text-slate underline decoration-bull/50 underline-offset-4 transition-colors hover:text-ink hover:decoration-bull-text md:inline"
        >
          Free Vault in the meantime
        </Link>
      </div>
    </div>
  );
}
