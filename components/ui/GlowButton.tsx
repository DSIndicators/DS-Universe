import Link from "next/link";
import { cn } from "@/components/ui/cn";

type GlowButtonProps = {
  children: React.ReactNode;
  href: string;
  variant?: "primary" | "ghost";
  className?: string;
};

/**
 * Primary = glowing aurora-filled CTA. Ghost = frosted-glass outline.
 * Renders an anchor via next/link so it works for in-page and external hrefs.
 */
export function GlowButton({
  children,
  href,
  variant = "primary",
  className,
}: GlowButtonProps) {
  const base =
    "group relative inline-flex items-center justify-center gap-2 rounded-full px-7 py-3 text-sm font-semibold tracking-wide transition-all duration-300 will-change-transform";

  if (variant === "ghost") {
    return (
      <Link
        href={href}
        className={cn(
          base,
          "glass text-ink-white hover:border-white/20 hover:bg-white/[0.07] hover:-translate-y-0.5",
          className,
        )}
      >
        {children}
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className={cn(
        base,
        "text-space-black hover:-translate-y-0.5",
        className,
      )}
    >
      {/* Aurora fill + glow */}
      <span
        aria-hidden
        className="absolute inset-0 rounded-full bg-gradient-to-r from-space-cyan via-space-magenta to-space-peach opacity-95 transition-opacity duration-300 group-hover:opacity-100"
      />
      <span
        aria-hidden
        className="absolute inset-0 rounded-full opacity-60 blur-xl transition-opacity duration-300 bg-gradient-to-r from-space-cyan via-space-magenta to-space-peach group-hover:opacity-90"
      />
      <span className="relative z-10 flex items-center gap-2">{children}</span>
    </Link>
  );
}
