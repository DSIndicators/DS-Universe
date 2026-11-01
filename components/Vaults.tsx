import Link from "next/link";
import { Tick } from "./Tick";
import { BILLING, COUNT, ESSENTIALS, FOUNDERS, JOIN_LABEL, PRICE, PRICE_DAY, money } from "@/content/vaults";
import { lifetimeCheckout } from "@/content/store";
import { returnOn } from "@/content/returns";

/**
 * THE CHOICE, side by side. Two options only (research: more tiers add
 * decision cost with no reliable gain; decoy tiers do not replicate). The
 * Essentials Vault carries the weight (teal, the one solid white button);
 * the Free Vault is the easy yes beside it. The renewal terms sit under its
 * button every time (ROSCA, New York GBL 527-a). No free trial (Tom, 2026-10-30).
 */
export function Vaults({ signedIn = false }: { signedIn?: boolean }) {
  const lifetime = ESSENTIALS.lifetime.show;
  return (
    <div className="vaults">
      <div className="vault">
        <p className="vault-name">
          Free Vault{returnOn() && <span style={{ opacity: 0.75, fontWeight: 500 }}> · Back</span>}
        </p>
        <div className="vault-price">
          <span className="fig">Free</span>
          <span className="per">with a free account</span>
        </div>
        <p className="body">The tools every chart can use, free for good. Not a trial and not a stripped build.</p>
        <ul className="vault-list">
          <li>
            <Tick /> {COUNT.free} free indicators and tools
          </li>
          <li>
            <Tick /> Each one its own download, no license
          </li>
          <li>
            <Tick /> New free tools added as they are made
          </li>
        </ul>
        <div className="vault-foot">
          <Link className="btn btn-line btn-wide" href={signedIn ? "/members/free-vault" : "/join"}>
            {signedIn ? "Open your Free Vault" : "Join free"}
          </Link>
          <p className="small">An email and a password. No card.</p>
        </div>
      </div>

      <div className="vault vault-ess">
        <p className="vault-name">
          Essentials Vault{FOUNDERS.active && <span style={{ opacity: 0.75, fontWeight: 500 }}> · {FOUNDERS.label}</span>}
        </p>
        <div className="vault-price">
          <span className="fig num">{PRICE}</span>
          <span className="per">a month, about {PRICE_DAY} a day</span>
        </div>
        <p className="body">Every paid DS indicator, and every one we build next, in one membership.</p>
        <ul className="vault-list">
          <li>
            <Tick /> All {COUNT.essentials} paid DS indicators and add-ons
          </li>
          <li>
            <Tick /> Every new indicator, added at no extra cost
          </li>
          <li>
            <Tick /> One license for every tool
          </li>
          <li>
            <Tick /> The Free Vault comes with it
          </li>
          <li>
            <Tick /> Cancel any time from your Whop account
          </li>
        </ul>
        <div className="vault-foot">
          <Link className="btn btn-white btn-wide" href={signedIn ? "/members/unlock" : "/join?vault=essentials"}>
            {JOIN_LABEL}
          </Link>
          <p className="small">{BILLING}</p>
          {lifetime && (
            <p className="small">
              Rather pay once? Owning it outright at the founders price of {money(ESSENTIALS.lifetime.price)} {lifetimeCheckout() ? "is open at checkout." : "opens soon."}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
