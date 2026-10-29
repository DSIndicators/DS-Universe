import Link from "next/link";
import { PRODUCT_VIEWS } from "@/content/catalog";
import { BY_SLUG } from "@/content/products";
import { STACK } from "@/content/voice";

/* Every product a confluence names must exist (a renamed slug stops the build). */
for (const c of STACK.items) for (const s of c.slugs) if (!BY_SLUG[s]) throw new Error(`content/voice.ts: "${s}" is not a product.`);

/**
 * THE STACK — the house method in three steps, right under the hero: where
 * price reacted, which way the trend leans, whether the volume is real. Each
 * step names the products that answer it and links to their pages. Words only:
 * on the teal theme this is a teal field (app/globals.css), on white it sits
 * on white with teal numerals.
 */
export function Stack() {
  return (
    <section className="stack field" data-section="How we read a trade" aria-labelledby="stack-title">
      <div className="wb">
        <div className="stack-head">
          <div className="t">
            <p className="pp-label">
              <span className="num">01</span>&nbsp;&nbsp;{STACK.label}
            </p>
            <h2 id="stack-title" className="d2" style={{ marginTop: 18 }}>
              {STACK.title}
            </h2>
          </div>
          <p className="lead s">{STACK.lead}</p>
        </div>
        <ol className="stack-steps">
          {STACK.items.map((c) => (
            <li key={c.n}>
              <p className="stack-n num" aria-hidden="true">
                {c.n}
              </p>
              <p className="pp-label">{c.kicker}</p>
              <h3 className="d3 stack-q">{c.q}</h3>
              <p className="body stack-text">{c.text}</p>
              <p className="stack-tools">
                {c.slugs.map((s) => (
                  <Link key={s} className="lnk" href={PRODUCT_VIEWS[s].page}>
                    {PRODUCT_VIEWS[s].name}
                  </Link>
                ))}
              </p>
            </li>
          ))}
        </ol>
        <div className="stack-close">
          <p className="d2 stack-plan">{STACK.close}</p>
          <p className="body measure">{STACK.honest}</p>
        </div>
      </div>
    </section>
  );
}
