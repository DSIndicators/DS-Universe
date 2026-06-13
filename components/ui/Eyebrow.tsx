import { cn } from "@/components/ui/cn";

type EyebrowProps = {
  children: React.ReactNode;
  className?: string;
  /** Show the small teal orbit dot before the label (brochure-style). */
  dot?: boolean;
};

/** Uppercase, wide-tracked teal label — the banner's spaced lettering. */
export function Eyebrow({ children, className, dot = true }: EyebrowProps) {
  return (
    <span className={cn("label-caps inline-flex items-center gap-2", className)}>
      {dot && (
        <span
          aria-hidden
          className="h-1.5 w-1.5 rounded-full bg-accent-teal shadow-glow-teal"
        />
      )}
      {children}
    </span>
  );
}
