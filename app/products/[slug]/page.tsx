import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Reveal } from "@/components/ui/Reveal";
import { ProductCard, Arrow } from "@/components/ProductCard";
import { BY_SLUG, KIND_LABEL, PRODUCTS, byKind } from "@/content/products";
import { DEMOS, isReleased } from "@/content/release";
import { buyLabel, listingFor } from "@/content/whop";
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
  const demo = DEMOS[p.slug];
  const listing = listingFor(p.slug);

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
          <div className={`grid gap-10 pt-10 lg:grid-cols-12 lg:items-end ${demo || p.cover ? "pb-28 lg:pb-36" : "pb-16 lg:pb-20"}`}>
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

      {/* ------------------------------------------------------- still or demo */}
      {(demo || p.cover) && (
        <section className="wrap -mt-16 lg:-mt-24">
          <Reveal>
            <div className="overflow-hidden rounded-2xl border border-line bg-[#0f1114] shadow-monitor">
              <div className="relative aspect-[16/9]">
                {demo ? (
                  <video
                    className="absolute inset-0 h-full w-full object-cover"
                    src={demo.src}
                    poster={demo.poster}
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="metadata"
                    aria-label={`${p.name} running in NinjaTrader 8`}
                  />
                ) : (
                  <Image
                    src={p.cover!}
                    alt={`${p.name} on a NinjaTrader 8 chart`}
                    fill
                    priority
                    sizes="(min-width: 1280px) 1200px, 100vw"
                    className="object-cover object-left-top"
                  />
                )}
              </div>
            </div>
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
          <div className="mt-10 flex flex-wrap items-center gap-3">
            {listing ? (
              <>
                <a href={listing.product} target="_blank" rel="noopener" className="btn-primary">
                  {buyLabel(listing)}
                </a>
                {/* Appears the moment a Whop checkout link is added in content/whop.ts */}
                {listing.checkout && (
                  <a href={listing.checkout} target="_blank" rel="noopener" className="btn-ghost">
                    Quick checkout
                  </a>
                )}
              </>
            ) : (
              <span className="inline-flex h-12 items-center rounded-md border border-dashed border-line-strong px-5 text-[15px] text-slate">
                Coming soon
              </span>
            )}
            <Link href="/contact" className="btn-ghost">
              Ask a question
            </Link>
          </div>
          <p className="mt-8 max-w-xl text-[13px] leading-relaxed text-mute">{DISCLOSURE.short}</p>
        </Reveal>
      </section>

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
