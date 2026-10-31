import Link from "next/link";
import { getSession } from "@/lib/auth";
import { Rows } from "@/components/Rows";
import { PreviewBar } from "@/components/PreviewBar";
import { BILLING, COUNT, ESSENTIALS, ESSENTIALS_GROUPS, ESSENTIALS_PRODUCTS, JOIN_LABEL, PRICE_MONTHLY } from "@/content/vaults";
import { ESSENTIALS_DOWNLOAD, MANAGE } from "@/content/store";
import { INSTALL, ONE_WAY, UPDATE } from "@/content/install";
import { whopReady } from "@/lib/whop";

/**
 * The Essentials Vault, from the inside. A member gets the one download and
 * the list of everything it holds; anyone else sees the same list, locked,
 * with one way to open it. The lock is decided on the server for every request.
 */
export default async function MemberEssentials() {
  const s = (await getSession())!;
  const open = s.plan === "essentials";
  return (
    <>
      <PreviewBar s={s} back="/members/essentials" />
      <div className="stack-s">
        <p className="kicker">Essentials Vault · {open ? "Open" : "Locked"}</p>
        <h1 className="d2">{open ? `All ${COUNT.essentials} tools, one download.` : `${COUNT.essentials} tools behind this door.`}</h1>
        <p className="body">
          {open
            ? "Everything below runs on your one license. New indicators arrive in the same vault."
            : `Open the vault and every tool below goes onto your charts, along with every new one we make, for ${PRICE_MONTHLY}.`}
        </p>
      </div>

      {open ? (
        <div className="notice notice-teal">
          <div>
            <p className="d4">Your download</p>
            <p className="small">
              {ESSENTIALS_DOWNLOAD ? ONE_WAY : `Whop keeps your files with your membership: sign in at ${MANAGE.path}, then open DS Essentials Vault. ${ONE_WAY}`}
            </p>
          </div>
          <a className="btn" href={ESSENTIALS_DOWNLOAD ?? MANAGE.url} target="_blank" rel="noopener">
            {ESSENTIALS_DOWNLOAD ? "Download the vault" : "Open Whop"}
          </a>
        </div>
      ) : (
        <div className="notice notice-teal">
          <div>
            <p className="d4">{JOIN_LABEL}</p>
            <p className="small">{BILLING}</p>
            {!whopReady() && (
              <p className="small" style={{ marginTop: 8 }}>
                {`Already a member? Your files are with your membership on Whop: sign in at ${MANAGE.path}, then open DS Essentials Vault.`}
              </p>
            )}
          </div>
          <Link className="btn" href="/members/unlock">
            Unlock the vault
          </Link>
        </div>
      )}

      {ESSENTIALS_GROUPS.map((g) => (
        <div key={g.key} className="stack-s">
          <h2 className="d4" style={{ color: "var(--ink-3)", fontWeight: 500 }}>
            {g.name}
          </h2>
          <Rows items={g.products} locked={!open} />
        </div>
      ))}

      {open && (
        <div className="split" style={{ alignItems: "start" }}>
          <div className="stack-s">
            <h2 className="d3">Installing</h2>
            <ol className="install">
              {INSTALL.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ol>
          </div>
          <div className="stack-s">
            <h2 className="d3">Updating</h2>
            <ol className="install">
              {UPDATE.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ol>
          </div>
        </div>
      )}
      {!open && <p className="small">{ESSENTIALS_PRODUCTS.length} tools listed. Open any of them for its full page.</p>}
    </>
  );
}
