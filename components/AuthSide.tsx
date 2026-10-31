import { Tick } from "./Tick";
import { COVERS } from "@/content/pictures";
import { COUNT, PRICE_MONTHLY } from "@/content/vaults";

/** The calm column beside a form: what the account opens, and three covers as a glimpse. */
export function AuthSide({ essentials }: { essentials?: boolean }) {
  const glimpse = (essentials ? ["zones", "flow", "prorsi"] : ["session-levels", "vwap", "volume"]).map((s) => COVERS[s]).filter(Boolean);
  return (
    <aside className="auth-side">
      <div className="auth-side-in">
        <p className="kicker">{essentials ? "Essentials Vault" : "Your free account"}</p>
        <p className="d3">{essentials ? `Every paid DS indicator, and every new one, for ${PRICE_MONTHLY}.` : "One account opens both vaults."}</p>
        <ul className="checks">
          <li>
            <Tick /> The Free Vault: {COUNT.free} free tools, yours for good
          </li>
          <li>
            <Tick /> {essentials ? `All ${COUNT.essentials} paid tools, and every new one` : "Unlock the Essentials Vault whenever you like"}
          </li>
          <li>
            <Tick /> {essentials ? "Cancel any time from your Whop account" : "No card for the free account"}
          </li>
        </ul>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, paddingTop: 8 }}>
          {glimpse.map((c) => (
            <span key={c!.src} className="tile-pic">
              <img src={c!.src} srcSet={c!.srcSet} sizes="140px" width={c!.w} height={c!.h} alt={c!.alt} loading="lazy" decoding="async" />
            </span>
          ))}
        </div>
      </div>
    </aside>
  );
}
