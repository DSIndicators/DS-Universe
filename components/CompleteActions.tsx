import { AskButton } from "@/components/AskButton";
import { COMPLETE_COPY } from "@/content/pricing";
import { OPENING, completeLinks } from "@/content/whop";

/**
 * DS Complete's buttons (v3.1). One component, so the band on the home page,
 * the store and every paid product page offer exactly the same thing.
 *
 * Since 2026-10-29 (evening) the live checkout is ONE plan: 7 days free, then
 * $39.99 a month (plan_BDcgf0PEsWLeP). So there is one solid button — the
 * trial — with the checkout's own terms under it, word for word what Whop
 * shows. The $149.99 own-the-set button appears once its plan is entered in
 * content/whop.ts; until then a quiet line says that checkout opens soon,
 * with "Get notified". With no plan at all, the whole block is "Opening soon".
 */
export function CompleteActions({ noteClass = "small measure-s" }: { noteClass?: string }) {
  const l = completeLinks();
  if (!l.trialMonthly && !l.own) {
    return (
      <div className="ca">
        <p className="ca-row">
          <span className="btn btn-static" aria-disabled="true">
            {OPENING.label}
          </span>
          <AskButton className="btn" text={OPENING.complete.request}>
            {OPENING.notify}
          </AskButton>
        </p>
        <p className={noteClass} style={{ marginTop: 16 }}>
          {OPENING.complete.note}
        </p>
      </div>
    );
  }
  return (
    <div className="ca">
      <p className="ca-row">
        {l.trialMonthly && (
          <a className="btn" href={l.trialMonthly}>
            {COMPLETE_COPY.buttons.trial}
          </a>
        )}
        {l.own && (
          <a className={l.trialMonthly ? "btn btn-ghost" : "btn"} href={l.own}>
            {COMPLETE_COPY.buttons.own}
          </a>
        )}
      </p>
      {l.trialMonthly && (
        <p className={noteClass} style={{ marginTop: 16 }}>
          {COMPLETE_COPY.billing}
        </p>
      )}
      {!l.own && (
        <p className={noteClass} style={{ marginTop: 10 }}>
          {OPENING.complete.own}{" "}
          <AskButton className="lnk" text={OPENING.complete.ownRequest}>
            {OPENING.notify}
          </AskButton>
        </p>
      )}
    </div>
  );
}
