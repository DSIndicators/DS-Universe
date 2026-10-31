import { FAQ } from "@/content/faq";

/** Questions as plain disclosure rows. Native <details>: works without script, keyboard and screen reader friendly. */
export function Faq({ short }: { short?: boolean }) {
  const list = short ? FAQ.filter((f) => f.short) : FAQ;
  return (
    <div className="faq">
      {list.map((f, i) => (
        <details key={f.q} open={i === 0}>
          <summary>{f.q}</summary>
          <div className="body stack-s">
            {f.a.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
        </details>
      ))}
    </div>
  );
}
