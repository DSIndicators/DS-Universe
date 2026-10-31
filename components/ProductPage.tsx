import Link from "next/link";
import { notFound } from "next/navigation";
import { Shot } from "./Shot";
import { Tile, lineFor } from "./Tile";
import { Tick } from "./Tick";
import { BY_SLUG, KIND_LABEL } from "@/content/products";
import { COVERS, DESK, widePic } from "@/content/pictures";
import { pointersFor } from "@/content/pointers";
import { vaultWording, BILLING, ESSENTIALS, JOIN_LABEL, PRICE_MONTHLY, isFree, ESSENTIALS_PRODUCTS, FREE_PRODUCTS } from "@/content/vaults";
import { vaultListing } from "@/content/store";
import { getSession } from "@/lib/auth";

/**
 * One tool, one page. Its picture is CONTAINED in the left column (sticky on
 * a wide screen, so it stays beside the words), never wider than ~540 px; it
 * opens full size on click. The words lead with what it is for, four facts,
 * and the one action that fits the vault it is in. The long "How it works"
 * is folded away: there for the reader who wants it, not in everyone's way.
 */
export async function ProductPage({ slug, vault }: { slug: string; vault: "free" | "essentials" }) {
  const p = BY_SLUG[slug];
  if (!p || isFree(p) !== (vault === "free")) notFound();
  const s = await getSession();
  const free = isFree(p);
  const cover = COVERS[slug];
  const desk = DESK[slug] ? widePic(DESK[slug]!) : undefined;
  const reads = pointersFor(slug).reads;
  const mates = (free ? FREE_PRODUCTS : ESSENTIALS_PRODUCTS).filter((x) => x.slug !== slug && x.series === p.series).slice(0, 4);
  const more = mates.length >= 3 ? mates : (free ? FREE_PRODUCTS : ESSENTIALS_PRODUCTS).filter((x) => x.slug !== slug).slice(0, 4);
  const listing = free ? vaultListing(slug) : undefined;

  let action: React.ReactNode;
  if (free) {
    action = s ? (
      <Link className="btn" href="/members/free-vault">
        Get it from your Free Vault
      </Link>
    ) : (
      <Link className="btn" href={`/join?next=${encodeURIComponent("/members/free-vault")}`}>
        Join free to download
      </Link>
    );
  } else if (s?.plan === "essentials") {
    action = (
      <Link className="btn" href="/members/essentials">
        Open it in your vault
      </Link>
    );
  } else {
    action = (
      <Link className="btn" href={s ? "/members/unlock" : "/join?vault=essentials"}>
        {JOIN_LABEL}
      </Link>
    );
  }

  return (
    <div>
      {/* DS Live Background is the one dark exception (Tom, 2026-10-26): its page's ground is not white. A dark picture elsewhere (DS Bulk Replay Downloader's window) only gets a dark frame. */}
      <section className={`sec-tight${p.slug === "live-background" ? " pp-dark" : ""}`}>
        <div className="wrap">
          <nav className="crumbs" aria-label="Breadcrumb">
            <Link href={free ? "/free-vault" : "/essentials"}>{free ? "Free Vault" : "Essentials Vault"}</Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page">{p.name}</span>
          </nav>
          <div className="pp" style={{ marginTop: 28 }}>
            <div className="pp-pic">
              {cover ? <Shot pic={cover} sizes="(max-width: 900px) 92vw, 540px" priority /> : (
                <div className="tile-pic">
                  <span className="tile-empty">Picture coming</span>
                </div>
              )}
            </div>
            <div className="pp-copy">
              <p className="kicker">
                {free ? "In the Free Vault" : "In the Essentials Vault"} · {KIND_LABEL[p.kind].singular} · {p.version}
              </p>
              <h1 className="d2">{p.name}</h1>
              <p className="lead">{lineFor(p)}</p>
              <ul className="checks">
                {p.hooks.map((h) => (
                  <li key={h}>
                    <Tick /> {h}
                  </li>
                ))}
              </ul>
              <div className="pp-buy">
                {free ? (
                  <p className="body">
                    Free for good with a free account. Its own download, no license.{!listing && " Its download is being put back up and opens soon."}
                  </p>
                ) : (
                  <p className="body">
                    Comes with the {ESSENTIALS.name}: every paid DS indicator for {PRICE_MONTHLY}, with every new one added at no extra cost. Not sold on its own.
                  </p>
                )}
                <div className="actions">
                  {action}
                  {!free && (
                    <Link className="btn btn-line" href="/essentials">
                      What else is inside
                    </Link>
                  )}
                </div>
                {!free && s?.plan !== "essentials" && <p className="small">{BILLING}</p>}
              </div>
              <div className="stack">
                <h2 className="d3">What it is for</h2>
                <p className="body">{vaultWording(p.helps)}</p>
              </div>
              {reads && (
                <div className="stack-s">
                  <h2 className="d4">What it reads from your chart</h2>
                  <p className="body">{reads}</p>
                </div>
              )}
              <details className="pp-more">
                <summary>How it works, in full</summary>
                <p className="body">{vaultWording(p.description)}</p>
              </details>
              {desk && (
                <div className="stack-s" style={{ paddingTop: 12 }}>
                  <h2 className="d4">On a full chart</h2>
                  <Shot pic={desk} sizes="(max-width: 900px) 92vw, 620px" caption={desk.caption} />
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {more.length > 0 && (
        <section className="sec">
          <div className="wrap">
            <div className="group-head">
              <h2 className="d3">Also in the {free ? "Free Vault" : "Essentials Vault"}</h2>
              <Link className="lnk lnk-teal small lnk-see" href={free ? "/free-vault" : "/essentials"}>
                See all
              </Link>
            </div>
            <div className="tiles tiles-s">
              {more.map((m) => (
                <Tile key={m.slug} p={m} tag={false} sizes="(max-width: 600px) 46vw, (max-width: 960px) 24vw, 220px" />
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
