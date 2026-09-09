import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/content/products";
import { Arrow } from "@/components/ProductCard";

/** A quiet catalogue row: thumbnail, category, name, one line, arrow. */
export function ProductRow({ product: p }: { product: Product }) {
  return (
    <Link
      href={`/products/${p.slug}`}
      className="group grid grid-cols-[88px_minmax(0,1fr)_auto] items-center gap-5 py-5 transition-colors duration-300 sm:grid-cols-[120px_minmax(0,1fr)_auto]"
      aria-label={`${p.name} — ${p.category}`}
    >
      <span className="relative block aspect-[16/9] overflow-hidden rounded-md border border-line bg-mist">
        {p.cover ? (
          <Image
            src={p.cover}
            alt=""
            fill
            sizes="120px"
            className="object-cover object-left-top transition-transform duration-700 ease-silk group-hover:scale-[1.06]"
          />
        ) : (
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="block h-2 w-2 rounded-full bg-gold/70 transition-transform duration-500 group-hover:scale-125" />
          </span>
        )}
      </span>
      <span className="min-w-0">
        <span className="label block truncate">{p.category}</span>
        <span className="mt-1 block font-display text-[19px] leading-tight text-ink transition-colors duration-300 group-hover:text-gold-deep">
          {p.name}
        </span>
        <span className="mt-1 hidden text-[14.5px] leading-snug text-slate sm:line-clamp-2">{p.purpose}</span>
      </span>
      <Arrow className="text-mute transition-colors group-hover:text-ink" />
    </Link>
  );
}
