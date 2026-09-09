import Link from "next/link";
import { ProductRow } from "@/components/ProductRow";
import { Reveal } from "@/components/ui/Reveal";
import { Arrow } from "@/components/ProductCard";
import { KIND_LABEL, byKind, type Kind } from "@/content/products";
import { CATALOGUE } from "@/content/site";

/** The whole catalogue on the home page, as two quiet two-column lists. Never a count. */
export function ProductIndex() {
  return (
    <section className="wrap py-24 lg:py-32">
      <Reveal className="max-w-3xl">
        <p className="label">{CATALOGUE.eyebrow}</p>
        <h2 className="display-lg mt-4 text-ink text-balance">{CATALOGUE.heading}</h2>
        <p className="lede mt-5 max-w-2xl text-pretty">{CATALOGUE.sub}</p>
      </Reveal>

      <div className="mt-16 space-y-20">
        {(["indicator", "addon"] as Kind[]).map((kind) => (
          <Group key={kind} kind={kind} />
        ))}
      </div>

      <Reveal className="mt-16 border-t border-line pt-8">
        <Link href="/products" className="group inline-flex items-center gap-2 text-[15px] text-ink">
          Browse with pictures
          <Arrow />
        </Link>
      </Reveal>
    </section>
  );
}

function Group({ kind }: { kind: Kind }) {
  const items = byKind(kind);
  const meta = KIND_LABEL[kind];
  return (
    <div className="grid gap-8 lg:grid-cols-12">
      <Reveal className="lg:col-span-3">
        <h3 className="display-md text-ink">{meta.plural}</h3>
        <p className="mt-3 max-w-xs text-[15px] leading-relaxed text-slate">{meta.blurb}</p>
      </Reveal>
      <Reveal className="lg:col-span-9" delay={80}>
        <ul className="grid border-t border-line md:grid-cols-2 md:gap-x-10">
          {items.map((p) => (
            <li key={p.slug} className="border-b border-line">
              <ProductRow product={p} />
            </li>
          ))}
        </ul>
      </Reveal>
    </div>
  );
}
