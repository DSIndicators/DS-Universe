import { FAQ } from "@/content/faq";
import { site } from "@/content/links";

/** The store's questions (DS-Universe-3 content/faq.ts, verbatim), each one a
 *  row that opens in place. Native <details>: keyboard and reader friendly,
 *  nothing to hydrate. */
export function Faq() {
  return (
    <ul className="faq">
      {FAQ.map((f) => (
        <li key={f.q}>
          <details>
            <summary>
              <span>{f.q}</span>
              <span className="pm" aria-hidden="true" />
            </summary>
            <p className="body measure">
              {f.a}
              {f.link && (
                <>
                  {" "}
                  <a className="lnk" href={site(f.link.href)}>
                    {f.link.label}
                  </a>
                  .
                </>
              )}
            </p>
          </details>
        </li>
      ))}
    </ul>
  );
}
