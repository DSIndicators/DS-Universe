import Link from "next/link";
import { CompleteBand } from "@/components/CompleteBand";
import { Cover } from "@/components/Cover";
import { Reader } from "@/components/Reader";
import { Stack } from "@/components/Stack";
import { SectionBar } from "@/components/SectionBar";
import { WideFigure } from "@/components/Wide";
import { CAPABILITIES, WIDE } from "@/content/capabilities";
import { COVERS, PRODUCT_VIEWS } from "@/content/catalog";
import { STORE_PATH, STORE_SHELVES, VAULT_PATH, VAULT_PRODUCTS } from "@/content/release";
import { CATALOGUE, DISCLOSURE, HERO } from "@/content/site";
import { VAULT_COPY } from "@/content/vault";
import { DOORS, HERO_W, READS_LEAD, WHATS_NEW } from "@/content/voice";

/** CATALOGUE.sub without its last sentence: it promises "the guide to reading
 *  it", and the guide zips were retired on 2026-10-25 (Patch Notes & Versions
 *  U-071) — the same cut app/about/page.tsx makes. */
const STORE_TEXT = CATALOGUE.sub.replace(/\s*Open any cover[^.]*\.$/, "");

/** The covers each door shows: the store's first shelf, the vault's first row. */
const STORE_STRIP = STORE_SHELVES.flatMap((s) => s.products).filter((p) => COVERS[p.slug]).slice(0, 5);
const VAULT_STRIP = VAULT_PRODUCTS.filter((p) => COVERS[p.slug] && !COVERS[p.slug]?.dark).slice(0, 5);

/**
 * HOME (2026-10-26 night). The hero, the stack (the house method: location,
 * direction, participation; content/voice.ts), "What it reads", two doors — the store
 * and the Free Vault, each now a page of its own (/products, /free-vault) —
 * and DS Complete. The lineup and the vault no longer live here as long
 * sections: the header's tabs go to their own pages instead of scrolling this
 * one (Tom: "Each page should have its own elegantly unique pages").
 */
export default function Home() {
  return (
    <>
      {/* ------------------------------------------------ hero */}
      <section className="hero" aria-labelledby="hero-title" data-section="">
        <div className="wb hero-grid">
          <p className="hero-kicker">
            <Link href={VAULT_PATH}>{HERO_W.kicker}</Link>
          </p>
          <h1 id="hero-title" className="d1 hero-title">
            <span className="ht-1">{HERO_W.title}</span>
            <span className="ht-2">{HERO_W.titleTail}</span>
          </h1>
          <div className="hero-side">
            <p className="lead">{HERO_W.sub}</p>
            <div className="hero-links">
              <Link className="lnk" href={STORE_PATH}>
                {HERO.primary.label}
              </Link>
              <Link className="lnk lnk-quiet" href={VAULT_PATH}>
                {VAULT_COPY.band.cta}
              </Link>
            </div>
          </div>
        </div>
        <WideFigure pic={WIDE.hero} drawn />
      </section>

      {/* ------------------------------------------------ the stack: the house method */}
      <Stack />

      {/* ------------------------------------------------ what it reads */}
      <SectionBar n="02" title="What it reads" sub={READS_LEAD} />
      <Reader caps={CAPABILITIES} covers={COVERS} products={PRODUCT_VIEWS} disclosure={DISCLOSURE.chart} />

      {/* ------------------------------------------------ new in v3.1 */}
      <SectionBar n="03" title={WHATS_NEW.title} sub={WHATS_NEW.lead} />
      <section className="wb sbar-after news" aria-label={WHATS_NEW.title}>
        <ul className="points news-points">
          {WHATS_NEW.points.map((x) => (
            <li key={x}>{x}</li>
          ))}
        </ul>
        <ul className="news-new">
          {WHATS_NEW.slugs.map((s) => (
            <li key={s}>
              <Link href={PRODUCT_VIEWS[s].page} className="vault-pic" aria-label={PRODUCT_VIEWS[s].name}>
                <Cover cover={COVERS[s]} name={PRODUCT_VIEWS[s].name} sizes="(min-width: 1101px) 22vw, 46vw" decorative />
              </Link>
              <p className="d4 nm">
                <Link className="lnk lnk-bare" href={PRODUCT_VIEWS[s].page}>
                  {PRODUCT_VIEWS[s].name}
                </Link>
              </p>
              <p className="small">{PRODUCT_VIEWS[s].line}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* ------------------------------------------------ two doors */}
      <SectionBar n="04" title={DOORS.title} sub={DOORS.sub} />
      <section className="wb doors sbar-after" aria-label="The store and the Free Vault">
        <Door
          label="The store"
          title={CATALOGUE.heading}
          text={STORE_TEXT}
          href={STORE_PATH}
          cta={HERO.primary.label}
          strip={STORE_STRIP.map((p) => p.slug)}
        />
        <Door
          label={VAULT_COPY.label}
          title={VAULT_COPY.band.heading}
          text={VAULT_COPY.band.text}
          href={VAULT_PATH}
          cta={VAULT_COPY.band.cta}
          strip={VAULT_STRIP.map((p) => p.slug)}
        />
      </section>

      {/* ------------------------------------------------ DS Complete */}
      <WideFigure pic={WIDE.liquidity} />
      <CompleteBand id="complete" n="05" />
    </>
  );
}

/** One door: what is behind it in a heading and a paragraph, a row of its
 *  covers, and the one link through. */
function Door({ label, title, text, href, cta, strip }: { label: string; title: string; text: string; href: string; cta: string; strip: string[] }) {
  return (
    <div className="door">
      <p className="pp-label">{label}</p>
      <h2 className="d2" style={{ marginTop: 18 }}>
        <Link className="lnk-door" href={href}>
          {title}
        </Link>
      </h2>
      <p className="body measure" style={{ marginTop: 20 }}>
        {text}
      </p>
      <ul className="door-strip">
        {strip.map((s) => (
          <li key={s}>
            <Link href={PRODUCT_VIEWS[s].page} className="vault-pic" aria-label={PRODUCT_VIEWS[s].name}>
              <Cover cover={COVERS[s]} name={PRODUCT_VIEWS[s].name} sizes="(min-width: 1101px) 9vw, 18vw" decorative />
            </Link>
          </li>
        ))}
      </ul>
      <p style={{ marginTop: 28 }}>
        <Link className="btn" href={href}>
          {cta}
        </Link>
      </p>
    </div>
  );
}
