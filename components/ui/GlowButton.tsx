import { cn } from "@/components/ui/cn";

type GlowButtonProps = {
  children: React.ReactNode;
  href: string;
  variant?: "primary" | "ghost";
  className?: string;
};

const BEVEL =
  "linear-gradient(180deg, rgba(255,255,255,0.45), rgba(255,255,255,0) 45%, rgba(0,0,0,0.22))";

/**
 * Primary = beveled molten-gold CTA (sharp rectangle, raised, with a hover
 * glint). Ghost = frosted-glass outline. Plain anchor so in-page "#" links are
 * handled by SmoothAnchors (clean URLs).
 */
export function GlowButton({
  children,
  href,
  variant = "primary",
  className,
}: GlowButtonProps) {
  const base =
    "group relative inline-flex items-center justify-center gap-2 rounded-none px-7 py-3 text-sm font-semibold tracking-wide transition-all duration-300 will-change-transform";

  if (variant === "ghost") {
    return (
      <a
        href={href}
        className={cn(
          base,
          "glass text-ink-white hover:border-[#e3b24f]/[0.16] hover:bg-white/[0.07] hover:-translate-y-0.5",
          className,
        )}
      >
        {children}
      </a>
    );
  }

  return (
    <a
      href={href}
      className={cn(
        base,
        "text-space-black shadow-[0_10px_30px_-10px_rgba(227,178,79,0.7)] ring-1 ring-[#fff1cf]/40 hover:-translate-y-0.5",
        className,
      )}
    >
      {/* Molten-gold fill */}
      <span
        aria-hidden
        className="bg-ai absolute inset-0 rounded-none opacity-95 transition-opacity duration-300 group-hover:opacity-100"
      />
      {/* Top bevel highlight + bottom shade so it reads as a raised gold key */}
      <span
        aria-hidden
        className="absolute inset-0 rounded-none"
        style={{ background: BEVEL }}
      />
      {/* Sweeping gold glint on hover */}
      <span aria-hidden className="absolute inset-0 overflow-hidden rounded-none">
        <span className="absolute inset-y-0 -left-1/2 w-1/2 -skew-x-12 bg-white/35 blur-md opacity-0 transition-all duration-700 group-hover:left-[140%] group-hover:opacity-100" />
      </span>
      {/* Soft outer bloom */}
      <span
        aria-hidden
        className="bg-ai absolute inset-0 rounded-none opacity-60 blur-xl transition-opacity duration-300 group-hover:opacity-90"
      />
      <span className="relative z-10 flex items-center gap-2">{children}</span>
    </a>
  );
}
