import { Tick } from "./Tick";
import { COVERS } from "@/content/pictures";
import { BY_SLUG } from "@/content/products";
import { STRENGTHS } from "@/content/strengths";
import { COUNT, PRICE_MONTHLY } from "@/content/vaults";

const ESS = ["zones", "flow", "prorsi", "gex", "compass", "ember"];
const FREE = ["session-levels", "vwap", "volume", "parallax", "chart-price", "adaptive-priceline"];

/** The calm column beside a form: what the account opens, why the suite is worth keeping, and six named
 *  covers as a glimpse. On a phone it sits below the form, so nothing here stands between a visitor and
 *  the button. */
export function AuthSide({ essentials }: { essentials?: boolean }) {
  const glimpse = (essentials ? ESS : FREE).map((s) => ({ s, c: COVERS[s], name: BY_SLUG[s]?.name ?? s })).filter((g) => g.c);
  const two = STRENGTHS.filter((x) => x.key !== "together");
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
        <div className="auth-strengths">
          {two.map((x) => (
            <div key={x.key} className="auth-strength">
              <p className="auth-fig num" data-nobio="">
                {x.fig}
              </p>
              <div>
                <p className="auth-strength-t">{x.title}</p>
                <p className="small">{x.key === "speed" ? "DS Flow now draws at 0.5x the time of NinjaTrader's own candles, down from 2.4x." : x.short}</p>
              </div>
            </div>
          ))}
        </div>
        <ul className="auth-glimpse" aria-label={essentials ? "A few of the Essentials tools" : "A few of the free tools"}>
          {glimpse.map((g) => (
            <li key={g.s}>
              <span className="tile-pic">
                <img src={g.c!.src} srcSet={g.c!.srcSet} sizes="(max-width: 860px) 30vw, 140px" width={g.c!.w} height={g.c!.h} alt={g.c!.alt} loading="lazy" decoding="async" />
              </span>
              <span className="auth-glimpse-n">{g.name}</span>
            </li>
          ))}
        </ul>
        <p className="small auth-privacy">Your email is used for your account and nothing else.</p>
      </div>
    </aside>
  );
}
