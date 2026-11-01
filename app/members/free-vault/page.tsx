import { Rows } from "@/components/Rows";
import { FREE_PRODUCTS, COUNT } from "@/content/vaults";
import { vaultListing } from "@/content/store";
import { INSTALL } from "@/content/install";
import { FRESH, FRESH_NAMES, returnOn } from "@/content/returns";

/** The Free Vault, opened: every free tool with its own download. */
export default function MemberFreeVault() {
  const back = returnOn();
  return (
    <>
      <div className="stack-s">
        <p className="kicker">{back ? "Free Vault · Open again" : "Free Vault · Open"}</p>
        <h1 className="d2">{back ? `Welcome back. ${COUNT.free} free tools, yours for good.` : `${COUNT.free} free tools, yours for good.`}</h1>
        <p className="body">
          Each tool is its own download on Whop, free, with no license. Take the ones you want; come back any time for the rest.
          {back && FRESH.length > 0 && <> New since the vault reopened: {FRESH_NAMES}.</>}
        </p>
      </div>
      <Rows
        items={FREE_PRODUCTS}
        action={(p) => {
          const l = vaultListing(p.slug);
          return l ? (
            <a className="btn btn-s" href={l.checkout} target="_blank" rel="noopener">
              Download
            </a>
          ) : (
            <span className="small">Opening soon</span>
          );
        }}
      />
      <div className="stack-s">
        <h2 className="d3">Putting a tool on your chart</h2>
        <ol className="install">
          {INSTALL.map((x) => (
            <li key={x}>{x}</li>
          ))}
        </ol>
      </div>
    </>
  );
}
