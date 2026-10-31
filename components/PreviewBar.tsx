import { previewPlan } from "@/app/actions";
import { localPreview, type Session } from "@/lib/auth";

/**
 * LOCAL PREVIEW (localhost:3003 only). Lets Tom see the members area as a
 * free member and as an Essentials member without a real checkout. It only
 * renders when the launcher sets DS_LOCAL_PREVIEW=1, and the action behind it
 * refuses otherwise. It never exists on the live site.
 */
export function PreviewBar({ s, back }: { s: Session; back: string }) {
  if (!localPreview()) return null;
  const to = s.plan === "essentials" ? "free" : "essentials";
  return (
    <div className="preview-bar">
      <span>
        <strong>Local preview only.</strong> {`You are seeing this as ${s.plan === "essentials" ? "an Essentials member" : "a free member"}. On the live site, Whop decides this.`}
      </span>
      <form action={previewPlan}>
        <input type="hidden" name="plan" value={to} />
        <input type="hidden" name="back" value={back} />
        <button type="submit" className="btn btn-line btn-s">
          {to === "essentials" ? "View as an Essentials member" : "View as a free member"}
        </button>
      </form>
    </div>
  );
}
