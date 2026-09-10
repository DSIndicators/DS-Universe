import { WAITLIST_NOTE, onWaitlist, opensWhen } from "@/content/launch";

/**
 * The only place the waitlist is explained in words.
 *
 * It says two things and nothing else: joining costs nothing, and you will be
 * told when the doors open. No countdown, no "limited spots", no urgency — the
 * shop is honest about being shut, and that is the whole message.
 *
 * Renders nothing at all once content/launch.ts flips, so no page needs a
 * second edit to open for business.
 */
export function WaitlistNote({
  tone = "line",
  className = "",
}: {
  tone?: "line" | "band";
  className?: string;
}) {
  if (!onWaitlist()) return null;

  const body = `Joining costs nothing and charges nothing — you are told ${opensWhen()}.`;

  if (tone === "band") {
    return (
      <div className={`flex flex-wrap items-baseline gap-x-3 gap-y-1 rounded-lg border border-gold/25 bg-gold-tint px-4 py-3 ${className}`}>
        <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-gold-deep">
          {WAITLIST_NOTE.chip}
        </span>
        <span className="text-[14.5px] leading-relaxed text-slate">
          Every product is open for waitlist while we finish attaching files. {body}
        </span>
      </div>
    );
  }

  return (
    <p className={`flex items-start gap-2.5 text-[13.5px] leading-relaxed text-slate ${className}`}>
      <span className="mt-[7px] block h-1.5 w-1.5 shrink-0 rounded-full bg-gold" aria-hidden="true" />
      <span>
        <strong className="font-medium text-ink">Opening soon.</strong> {body}
      </span>
    </p>
  );
}
