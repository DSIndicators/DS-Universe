import { CompleteActions } from "@/components/CompleteActions";
import { AFTER_CHECKOUT } from "@/content/launch";
import { COMPLETE, COMPLETE_COPY, COMPLETE_GROUPS, FOUNDERS, money } from "@/content/pricing";

/**
 * DS Complete (v3.1, 2026-10-29): the only paid product. The approved wording
 * (Website copy v3.1.md) on the left — headline, the four points, the body, and
 * what is inside, group by group, named from the catalogue; the founders price
 * and the three plans on the right. Every figure is content/pricing.ts.
 */
export function CompleteBand({ id, n, children }: { id?: string; n?: string; children?: React.ReactNode }) {
  return (
    <section id={id} className="complete field" data-section={COMPLETE.name} aria-labelledby={`${id ?? "complete"}-title`}>
      <div className="wb complete-grid">
        <div className="l">
          <p className="pp-label complete-label">
            {/* DS Complete is all of DS Universe: it carries the helmet. */}
            <img className="complete-mark" src="/brand/ds-mark-white-96.png" srcSet="/brand/ds-mark-white-48.png 46w, /brand/ds-mark-white-96.png 93w, /brand/ds-mark-white-144.png 139w" sizes="34px" width={441} height={456} alt="" />
            {n && (
              <>
                <span className="num">{n}</span>&nbsp;&nbsp;
              </>
            )}
            {FOUNDERS.active ? FOUNDERS.kicker : "The bundle"}
          </p>
          <h2 id={`${id ?? "complete"}-title`} className="d2" style={{ marginTop: 18 }}>
            {COMPLETE.name}
          </h2>
          <p className="d3 complete-head" style={{ marginTop: 22 }}>
            {COMPLETE_COPY.headline}
          </p>
          <ul className="points">
            {COMPLETE_COPY.points.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
          <p className="body measure" style={{ marginTop: 26 }}>
            {COMPLETE_COPY.body}
          </p>
          <dl className="inside">
            {COMPLETE_GROUPS.map((g) => (
              <div key={g.key}>
                <dt>{g.name}</dt>
                <dd>{g.names.join(", ")}</dd>
              </div>
            ))}
          </dl>
          <p className="small measure" style={{ marginTop: 18 }}>
            {COMPLETE_COPY.apart}
          </p>
        </div>
        <div className="r">
          <div className="cpx">
            <p>
              <span className="now num">{money(COMPLETE.monthly)}</span>
              <span className="per">a month</span>
            </p>
            <p>
              <span className="now num">{money(COMPLETE.own)}</span>
              <span className="per">to own the set</span>
            </p>
          </div>
          <p className="body measure-s" style={{ marginTop: 22 }}>
            {COMPLETE_COPY.trial}
          </p>
          <div style={{ marginTop: 30 }}>
            <CompleteActions />
          </div>
          <p className="small measure-s" style={{ marginTop: 18 }}>
            {AFTER_CHECKOUT.short}
          </p>
          {children}
        </div>
      </div>
    </section>
  );
}
