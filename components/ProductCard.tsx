import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/content/products";
import { KIND_LABEL } from "@/content/products";
import { Mark } from "@/components/ui/Mark";

export function ProductCard({ product, priority = false }: { product: Product; priority?: boolean }) {
  const p = product;
  return (
    <Link href={`/products/${p.slug}`} className="card group block overflow-hidden" aria-label={`${p.name} — ${p.category}`}>
      <div className="relative aspect-[16/9] overflow-hidden border-b border-line bg-mist">
        {p.cover ? (
          <Image
            src={p.cover}
            alt={`${p.name} on a NinjaTrader 8 chart`}
            fill
            priority={priority}
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover object-left-top transition-transform duration-700 ease-silk group-hover:scale-[1.025]"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-start justify-between p-6">
            <span className="chip-gold">{KIND_LABEL[p.kind].singular}</span>
            <Mark size={44} className="text-line-strong transition-colors duration-500 group-hover:text-gold" />
          </div>
        )}
      </div>
      <div className="p-6">
        <p className="label">{p.category}</p>
        <h3 className="display-sm mt-2 text-ink">{p.name}</h3>
        <p className="mt-3 text-[15px] leading-relaxed text-slate">{p.purpose}</p>
        <span className="mt-5 inline-flex items-center gap-1.5 text-[14px] text-ink">
          Learn more
          <Arrow />
        </span>
      </div>
    </Link>
  );
}

export function Arrow({ className = "" }: { className?: string }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      className={`transition-transform duration-300 ease-silk group-hover:translate-x-0.5 ${className}`}
    >
      <path d="M3 8h9M8.5 4.5 12 8l-3.5 3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
