import { onWaitlist, opensWhen } from "@/content/launch";

/**
 * The only place the waitlist is explained in words.
 *
 * It says two things and nothing else: joining costs nothing, and you will be
 * told when the doors open. No countdown, no "limited spots", no urgency — the
 * shop is honest about being shut, and that is the whole message.
 *
 * Renders nothing at all once content/launch.ts flips, so no page needs a
 * second edit to open for business. (The "band" tone that carried "How buying
 * works" on /products and /pricing retired 2026-09-27: the three steps now live
 * in components/BeforeYouBuy.tsx, at the foot of the store.)
 */
export function WaitlistNote({ className = "" }: { className?: string }) {
  if (!onWaitlist()) return null;

  const body = `Joining costs nothing and charges nothing — you are told ${opensWhen()}.`;

  return (
    <p className={`flex items-start gap-2.5 text-[length:calc(12.5px*var(--type))] leading-relaxed text-slate ${className}`}>
      <span className="mt-[7px] block h-1.5 w-1.5 shrink-0 rounded-full bg-gold" aria-hidden="true" />
      <span>
        <strong className="font-medium text-ink">Opening soon.</strong> {body}
      </span>
    </p>
  );
}
