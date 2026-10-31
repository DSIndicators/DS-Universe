import Link from "next/link";
import { getSession } from "@/lib/auth";
import { PreviewBar } from "@/components/PreviewBar";
import { Arrow, Lock, Tick } from "@/components/Tick";
import { COVERS } from "@/content/pictures";
import { BILLING, COUNT, ESSENTIALS_PRODUCTS, FREE_PRODUCTS, JOIN_LABEL, PRICE_MONTHLY } from "@/content/vaults";

/** The first page after joining or signing in: both vaults, what is open, the one next step. */
export default async function MembersHome({ searchParams }: { searchParams: Promise<{ welcome?: string; reset?: string }> }) {
  const s = (await getSession())!;
  const { welcome, reset } = await searchParams;
  const ess = s.plan === "essentials";
  const first = s.name?.split(" ")[0] || "";
  const strip = (slugs: string[]) =>
    slugs.map((slug) => COVERS[slug]).filter(Boolean).slice(0, 4).map((c) => (
      <span key={c!.src} className={`tile-pic${c!.dark ? " tile-pic-dark" : ""}`}>
        <img src={c!.src} srcSet={c!.srcSet} sizes="120px" width={c!.w} height={c!.h} alt="" loading="lazy" decoding="async" />
      </span>
    ));
  return (
    <>
      <PreviewBar s={s} back="/members" />
      {reset && !welcome && <p className="form-ok">Your new password is saved, and you are signed in.</p>}
      {welcome && <p className="form-ok">Your account is ready{first ? `, ${first}` : ""}. The Free Vault is open.</p>}
      <div className="stack-s">
        <p className="kicker">Your vault</p>
        <h1 className="d2">{first ? `Good to see you, ${first}.` : "Good to see you."}</h1>
        <p className="body">{ess ? "Both vaults are open. Take the whole Essentials Vault in one archive or only the tools you use; one license runs them all." : "Your Free Vault is open. The Essentials Vault is one step away whenever you want it."}</p>
      </div>

      <div className="vaults" style={{ marginTop: 36 }}>
        <div className="vault">
          <p className="vault-name" style={{ display: "flex", justifyContent: "space-between" }}>
            <span>Essentials Vault</span>
            <span className={`lock`} style={{ color: ess ? "var(--teal)" : undefined }}>{ess ? "Open" : <><Lock /> Locked</>}</span>
          </p>
          <p className="d3">{COUNT.essentials} paid tools{ess ? ", all yours." : "."}</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, opacity: ess ? 1 : 0.6 }}>{strip(ESSENTIALS_PRODUCTS.map((p) => p.slug))}</div>
          <div className="vault-foot">
            {ess ? (
              <Link className="btn btn-wide" href="/members/essentials">
                Open the Essentials Vault <Arrow />
              </Link>
            ) : (
              <>
                <Link className="btn btn-wide" href="/members/unlock">
                  {JOIN_LABEL}
                </Link>
                <p className="small">{BILLING}</p>
              </>
            )}
          </div>
        </div>
        <div className="vault">
          <p className="vault-name" style={{ display: "flex", justifyContent: "space-between" }}>
            <span>Free Vault</span>
            <span className="lock" style={{ color: "var(--teal)" }}>Open</span>
          </p>
          <p className="d3">{COUNT.free} free tools, yours for good.</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>{strip(FREE_PRODUCTS.map((p) => p.slug))}</div>
          <div className="vault-foot">
            <Link className="btn btn-line btn-wide" href="/members/free-vault">
              Open the Free Vault <Arrow />
            </Link>
          </div>
        </div>
      </div>

      {!ess && (
        <div className="notice notice-teal">
          <div>
            <p className="d4">Every new paid indicator goes into the Essentials Vault.</p>
            <p className="small">Members get each one at no extra cost, for {PRICE_MONTHLY}.</p>
          </div>
          <ul className="checks" style={{ fontSize: "0.92rem" }}>
            <li>
              <Tick /> Cancel any time
            </li>
          </ul>
        </div>
      )}
    </>
  );
}
