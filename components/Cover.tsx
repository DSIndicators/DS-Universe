import type { CoverView } from "@/content/catalog";

/**
 * A product's cover, or — until Tom drops one in — a quiet slot of the same
 * size carrying its name. `sizes` is the width the picture is laid out at, so
 * the browser picks the rung of its srcset ladder that fits (content/catalog.ts).
 */
export function Cover({
  cover,
  name,
  sizes,
  className,
  eager = false,
  decorative = false,
}: {
  cover?: CoverView;
  name: string;
  sizes: string;
  className?: string;
  eager?: boolean;
  decorative?: boolean;
}) {
  if (!cover)
    return (
      <span className={`slot ${className ?? ""}`} aria-hidden="true">
        <span>{name}</span>
      </span>
    );
  return (
    <img
      className={className}
      src={cover.src}
      srcSet={cover.srcSet}
      sizes={cover.srcSet ? sizes : undefined}
      width={cover.w}
      height={cover.h}
      alt={decorative ? "" : cover.alt}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      fetchPriority={eager ? "high" : "auto"}
      data-dark={cover.dark ? "" : undefined}
    />
  );
}
