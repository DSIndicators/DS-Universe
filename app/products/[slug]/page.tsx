import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Reveal } from "@/components/ui/Reveal";
import { ProductCard, Arrow } from "@/components/ProductCard";
import { ProductGallery } from "@/components/ProductGallery";
import { ListingDetail } from "@/components/ListingDetail";
import { TestFirst } from "@/components/TestFirst";
import { WaitlistNote } from "@/components/ui/WaitlistNote";
import { BY_SLUG, KIND_LABEL, PRODUCTS, byKind } from "@/content/products";
import { isReleased } from "@/content/release";
import { shotsFor } from "@/content/shots";
import { listingCopyFor } from "@/content/listing-copy";
import { buyHref, buyLabel, listingFor } from "@/content/whop";
import { money, priceFor } from "@/content/pricing";
import { DISCLOSURE, SITE } from "@/content/site";

type Params = { slug: string };

export function generateStaticParams(): Params[] {
  // Only the released lineup gets a public page; the rest of the generated
  // catalogue returns as it releases (content/release.ts).
  return PRODUCTS.filter((p) => isReleased(p.slug)).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const p = BY_SLUG[slug];
  if (!p) return {};
  return { title: p.name, description: p.purpose };
}

export default async function ProductPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const p = BY_SLUG[slug];
  if (!p || !isReleased(slug)) notFound();

  const kin = byKind(p.kind).filter((s) => isReleased(s.slug));
  const siblings = kin.filter((s) => s.slug !== p.slug);
  const idx = kin.findIndex((s) => s.slug === p.slug);
  const more = [...siblings.slice(idx), ...siblings.slice(0, idx)].slice(0, 3);
  const shots = shotsFor(p.slug);
  const listingCopy = listingCopyFor(p.slug);
  const listing = listingFor(p.slug);
  const price = priceFor(p.slug);

  return (
    <>
      {/* ---------------------------------------------------------------- head */}
      <section className="hero-wash">
        <div className="wrap pt-10 sm:pt-14 lg:pt-16">
          <Reveal>
            <Link href="/products" className="group inline-flex items-center gap-2 text-[14px] text-slate hover:text-ink">
              <Arrow className="rotate-180 group-hover:-translate-x-0.5" />
              All products
            </Link>
          </Reveal>
          <div className={`grid gap-10 pt-10 lg:grid-cols-12 lg:items-end ${shots.length ? "pb-28 lg:pb-36" : "pb-16 lg:pb-20"}`}>
            <Reveal className="lg:col-span-7">
              <div className="flex flex-wrap items-center gap-2">
                <span className="chip-gold">{KIND_LABEL[p.kind].singular}</span>
                <span className="label pl-1">{p.category}</span>
              </div>
              <h1 className="display-xl mt-5 text-ink">{p.name}</h1>
              <p className="lede mt-6 max-w-2xl text-pretty">{p.purpose}</p>
            </Reveal>
            <Reveal className="lg:col-span-5 lg:justify-self-end" delay={100}>
              <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1" aria-label="Highlights">
                {p.hooks.map((h) => (
                  <li key={h} className="flex items-center gap-3 rounded-lg border border-line bg-white/80 px-4 py-3 text-[15px] text-ink">
                    <span className="block h-1.5 w-1.5 shrink-0 rounded-full bg-gold" aria-hidden="true" />
                    {h}
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------ pictures */}
      {/* Every real view of the tool, one stage and a rail. The page is the
          same height whether a product has one picture or six. */}
      {shots.length > 0 && (
        <section className="wrap -mt-16 lg:-mt-24">
          <Reveal>
            <ProductGallery name={p.name} shots={shots} />
          </Reveal>
        </section>
      )}

      {/* ---------------------------------------------------------------- body */}
      <section className="wrap grid gap-12 py-20 lg:grid-cols-12 lg:py-28">
        <Reveal className="lg:col-span-4">
          <p className="label">How it helps</p>
          <dl className="mt-8 space-y-6 border-t border-line pt-8">
            <div>
              <dt className="text-[13px] text-mute">Type</dt>
              <dd className="mt-1 text-[16px] text-ink">{KIND_LABEL[p.kind].singular}</dd>
            </div>
            <div>
              <dt className="text-[13px] text-mute">Category</dt>
              <dd className="mt-1 text-[16px] text-ink">{p.category}</dd>
            </div>
            <div>
              <dt className="text-[13px] text-mute">Platform</dt>
              <dd className="mt-1 text-[16px] text-ink">{SITE.platform}</dd>
            </div>
          </dl>
        </Reveal>
        <Reveal className="lg:col-span-7 lg:col-start-6" delay={80}>
          <p className="display-sm leading-[1.45] text-ink text-pretty">{p.helps}</p>

          {/* The price, once, right above the button that acts on it. One list
              price struck through, one live price. Never a second anchor. */}
          {price && (
            <div className="mt-10 border-t border-line pt-6">
              {price.free ? (
                <>
                  <p className="font-display text-[30px] leading-none text-ink">Free</p>
                  <p className="mt-2 text-[14px] text-slate">
                    Yours to keep. Not a trial, and it does not expire.
                  </p>
                </>
              ) : price.bundleOnly ? (
                <>
                  <p className="font-display text-[30px] leading-none text-ink">In the bundle</p>
                  <p className="mt-2 text-[14px] text-slate">
                    DS Toolkit is not sold on its own — it comes with the indicators bundle.{" "}
                    <Link href="/pricing" className="text-ink underline decoration-line underline-offset-4 hover:decoration-gold">
                      See what that costs
                    </Link>
                    .
                  </p>
                </>
              ) : (
                <>
                  <div className="flex flex-wrap items-baseline gap-3">
                    <span className="font-display text-[30px] leading-none tabular-nums text-ink">
                      {money(price.now)}
                    </span>
                    <span className="text-[16px] tabular-nums text-mute line-through">
                      {money(price.list)}
                    </span>
                    <span className="chip-gold">Founders</span>
                  </div>
                  <p className="mt-2 text-[14px] text-slate">
                    One payment, not a subscription. Later versions included.
                  </p>
                </>
              )}
              {/* Under the number, above the button that acts on it. */}
              <WaitlistNote className="mt-4" />
            </div>
          )}

          <div className="mt-8 flex flex-wrap items-center gap-3">
            {listing ? (
              <>
                {/* Straight to the Whop payment window when we have the checkout
                    link; the listing page otherwise (buyHref decides, one place). */}
                <a href={buyHref(listing)} target="_blank" rel="noopener" className="btn-primary">
                  {buyLabel(listing)}
                </a>
                {/* Only worth showing once the primary button skips the listing —
                    for buyers who want the Whop page, its details and reviews. */}
                {listing.checkout && (
                  <a href={listing.product} target="_blank" rel="noopener" className="btn-ghost">
                    See it on Whop
                  </a>
                )}
              </>
            ) : price?.bundleOnly ? (
              <Link href="/pricing" className="btn-primary">
                See the bundle
              </Link>
            ) : (
              <span className="inline-flex h-12 items-center rounded-md border border-dashed border-line-strong px-5 text-[15px] text-slate">
                Coming soon
              </span>
            )}
            <Link href="/contact" className="btn-ghost">
              Ask a question
            </Link>
          </div>
          <p className="mt-8 max-w-xl text-[15px] leading-relaxed text-slate">{DISCLOSURE.short}</p>
        </Reveal>
      </section>

      {/* ------------------------------------------------------------ in detail */}
      {listingCopy && <ListingDetail copy={listingCopy} />}

      {/* ----------------------------------------------------- test it yourself */}
      <TestFirst productName={p.name} />

      {/* ---------------------------------------------------------------- more */}
      {more.length > 0 && (
        <section className="border-t border-line bg-mist">
          <div className="wrap py-20 lg:py-24">
            <Reveal className="flex items-end justify-between gap-6">
              <h2 className="display-md text-ink">More {KIND_LABEL[p.kind].plural.toLowerCase()}</h2>
              <Link href="/products" className="group hidden items-center gap-2 text-[15px] text-ink sm:inline-flex">
                All products
                <Arrow />
              </Link>
            </Reveal>
            <ul className="mt-10 grid gap-5 md:grid-cols-3">
              {more.map((s, i) => (
                <Reveal as="li" key={s.slug} delay={i * 80}>
                  <ProductCard product={s} />
                </Reveal>
              ))}
            </ul>
          </div>
        </section>
      )}
    </>
  );
}
