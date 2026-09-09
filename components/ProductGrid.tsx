import { ProductCard } from "@/components/ProductCard";
import { Reveal } from "@/components/ui/Reveal";
import type { Kind } from "@/content/products";
import { KIND_LABEL, byKind } from "@/content/products";

/** One group of the catalogue. Never renders a count. */
export function ProductGrid({ kind, id }: { kind: Kind; id?: string }) {
  const items = byKind(kind);
  const meta = KIND_LABEL[kind];
  return (
    <section id={id} className="scroll-mt-24">
      <Reveal className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] md:items-end">
        <h2 className="display-md text-ink">{meta.plural}</h2>
        <p className="body max-w-xl md:justify-self-end">{meta.blurb}</p>
      </Reveal>
      <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((p, i) => (
          <Reveal as="li" key={p.slug} delay={Math.min(i, 5) * 60}>
            <ProductCard product={p} priority={i < 3} />
          </Reveal>
        ))}
      </ul>
    </section>
  );
}
