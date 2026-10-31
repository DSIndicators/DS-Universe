import { getSession } from "@/lib/auth";
import { signOut } from "@/app/actions";
import { PreviewBar } from "@/components/PreviewBar";
import { ESSENTIALS, PRICE_MONTHLY } from "@/content/vaults";
import { MANAGE } from "@/content/store";
import { whopReady } from "@/lib/whop";

const CONNECT_ERR: Record<string, string> = {
  "whop-taken": "That Whop account is already connected to a different DS Universe account. Sign in to that one, or write to support@dsuniverse.net and we will move it.",
  "email-taken": "That email is already connected to a different Whop account. Write to support@dsuniverse.net and we will sort it out.",
};

export default async function Account({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const s = (await getSession())!;
  const ess = s.plan === "essentials";
  const { error } = await searchParams;
  const whop = whopReady();
  return (
    <>
      <PreviewBar s={s} back="/members/account" />
      <div className="stack-s">
        <p className="kicker">Account</p>
        <h1 className="d2">Your account</h1>
      </div>
      {error && CONNECT_ERR[error] && (
        <p className="form-err" role="alert">
          {CONNECT_ERR[error]}
        </p>
      )}
      <dl className="dl">
        <dt>Email</dt>
        <dd>{s.email}</dd>
        {s.name && (
          <>
            <dt>Name</dt>
            <dd>{s.name}</dd>
          </>
        )}
        <dt>Vaults</dt>
        <dd>{ess ? `Free Vault and ${ESSENTIALS.name}` : "Free Vault"}</dd>
        <dt>Membership</dt>
        <dd>
          {ess ? (
            <>
              {PRICE_MONTHLY}, billed by Whop. To change your card or cancel, sign in at{" "}
              <a className="lnk" href={MANAGE.url} target="_blank" rel="noopener">
                whop.com
              </a>
              , then Profile, then Orders.{" "}
              <a className="lnk" href={MANAGE.help} target="_blank" rel="noopener">
                Whop’s steps
              </a>
              .
            </>
          ) : (
            "None. The free account costs nothing and does not expire."
          )}
        </dd>
        <dt>Whop</dt>
        <dd>
          {s.whop ? (
            <>
              Connected{s.whopEmail && s.whopEmail !== s.email ? ` (${s.whopEmail})` : ""}. Your membership is read from Whop each time you open your vault.
            </>
          ) : whop ? (
            <>
              Not connected.{" "}
              <a className="lnk" href="/api/auth/whop?next=/members/account">
                Connect Whop
              </a>{" "}
              to open the Essentials Vault with the membership on your Whop account.
            </>
          ) : (
            "Not connected. Whop sign-in turns on at launch; on this preview the switch above stands in for it."
          )}
        </dd>
        <dt>Signs in with</dt>
        <dd>{[s.hasPassword && "Email and password", s.whop && "Whop"].filter(Boolean).join(" or ") || "Email and password"}</dd>
      </dl>
      <form action={signOut}>
        <button type="submit" className="btn btn-line">
          Sign out
        </button>
      </form>
    </>
  );
}
