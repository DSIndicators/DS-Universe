import { PRICE_MONTHLY } from "@/content/vaults";

/** Three steps from here to a chart. */
export function Steps() {
  const steps = [
    { t: "Create your free account", b: "An email and a password, nothing else. The Free Vault opens the moment you are in." },
    { t: "Join the Essentials Vault", b: `One checkout on Whop, ${PRICE_MONTHLY}, month to month. Your license is switched on shortly after, and you can cancel any time.` },
    { t: "Import into NinjaTrader", b: "Take the whole vault in one archive, or only the tools you use. One license runs them all, and new indicators arrive in the same vault." },
  ];
  return (
    <ol className="steps">
      {steps.map((s, i) => (
        <li key={s.t} className="step">
          <p className="step-n num">0{i + 1}</p>
          <h3 className="d3">{s.t}</h3>
          <p className="body">{s.b}</p>
        </li>
      ))}
    </ol>
  );
}
