import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { PreviewBar } from "@/components/PreviewBar";
import { Tick } from "@/components/Tick";
import { BILLING, COUNT, ESSENTIALS, FOUNDERS, PRICE, PRICE_DAY, money } from "@/content/vaults";
import { essentialsCheckout, lifetimeCheckout } from "@/content/store";
import { whopReady } from "@/lib/whop";

/**
 * The step before checkout. Says exactly what happens next, in the order it
 * happens (New York GBL 527-a / ROSCA: the renewal terms, clear and before the
 * card is asked for), and names the one thing checkout will ask that people
 * do not expect: the email on their NinjaTrader account, for the license.
 */
export default async function Unlock({ searchParams }: { searchParams: Promise<{ welcome?: string }> }) {
  const s = (await getSession())!;
  if (s.plan === "essentials") redirect("/members/essentials");
  const { welcome } = await searchParams;
  const checkout = essentialsCheckout();
  const own = lifetimeCheckout();
  const whop = whopReady();
  return (
    <>
      <PreviewBar s={s} back="/members/unlock" />
      {welcome && <p className="form-ok">Your free account is ready and the Free Vault is open. One more step for Essentials.</p>}
      <div className="stack-s">
        <p className="kicker">Unlock the Essentials Vault</p>
        <h1 className="d2">{`${PRICE} a month. Every paid DS indicator.`}</h1>
        <p className="body">{`All ${COUNT.essentials} paid tools today, and every one we add later, at no extra cost.`}</p>
      </div>
      <div className="vaults" style={{ gridTemplateColumns: "1fr" }}>
        <div className="vault">
          <dl className="dl">
            <dt>Today</dt>
            <dd>{`${PRICE}, your first month.`}</dd>
            <dt>Every month after</dt>
            <dd>
              {`${PRICE} a month (about ${PRICE_DAY} a day) until you cancel.`}
              {FOUNDERS.active && <span className="small" style={{ display: "block", marginTop: 4 }}>{`The founders price, open ${FOUNDERS.until}.`}</span>}
            </dd>
            <dt>Cancel</dt>
            <dd>Any time in your Whop account. You are not billed again, and the vault stays open until the end of the month you paid for.</dd>
            <dt>At checkout</dt>
            <dd>A card, and the email on your NinjaTrader account: your license is tied to it.</dd>
            <dt>After checkout</dt>
            <dd>Access is switched on by a person, so allow a short gap before your first chart. Restart NinjaTrader once it is on.</dd>
          </dl>
          <ul className="checks">
            <li>
              <Tick /> Checkout is run by Whop, which DS Universe uses for every membership
            </li>
          </ul>
          <div className="vault-foot">
            {checkout ? (
              <a className="btn btn-wide" href={checkout} target="_blank" rel="noopener">
                Continue to secure checkout
              </a>
            ) : (
              <span className="btn btn-wide" aria-disabled="true">
                Checkout opens soon
              </span>
            )}
            <p className="small">{BILLING}</p>
            {whop &&
              (s.whop ? (
                <p className="small">
                  Your Whop account is connected, so the vault opens here on its own once checkout is done.{" "}
                  <Link className="lnk" href="/members/essentials">
                    Open the Essentials Vault
                  </Link>
                  .
                </p>
              ) : (
                <p className="small">
                  Paid already, or a member on Whop?{" "}
                  <a className="lnk" href="/api/auth/whop?next=/members/essentials">
                    Connect Whop
                  </a>{" "}
                  and the vault opens on this account.
                </p>
              ))}
            {ESSENTIALS.lifetime.show && (
              <p className="small">
                Rather pay once? Owning it outright at the founders price of {money(ESSENTIALS.lifetime.price)}{" "}
                {own ? (
                  <a className="lnk" href={own} target="_blank" rel="noopener">
                    is open here
                  </a>
                ) : (
                  "opens soon"
                )}
                .
              </p>
            )}
          </div>
        </div>
      </div>
      <p className="small">
        Not today?{" "}
        <Link className="lnk" href="/members/free-vault">
          Your Free Vault is open
        </Link>{" "}
        and stays yours.
      </p>
    </>
  );
}
