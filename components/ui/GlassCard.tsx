import { cn } from "@/components/ui/cn";

type GlassCardProps = React.HTMLAttributes<HTMLDivElement> & {
  children: React.ReactNode;
  className?: string;
  /** Adds the lift + intensified glow on hover. */
  interactive?: boolean;
  /** Tint of the ambient glow behind the card. */
  glow?: "violet" | "cyan" | "teal" | "ember" | "none";
};

const glowMap: Record<NonNullable<GlassCardProps["glow"]>, string> = {
  violet: "before:bg-space-violet/20",
  cyan: "before:bg-space-cyan/20",
  teal: "before:bg-accent-teal/20",
  ember: "before:bg-[#d99a3a]/30",
  none: "before:bg-transparent",
};

/** Frosted glass panel with an optional blurred glow halo and hover lift. */
export function GlassCard({
  children,
  className,
  interactive = false,
  glow = "none",
  ...rest
}: GlassCardProps) {
  return (
    <div
      className={cn(
        "glass relative rounded-2xl",
        // ambient glow halo
        "before:pointer-events-none before:absolute before:-inset-px before:-z-10 before:rounded-2xl before:opacity-0 before:blur-2xl before:transition-opacity before:duration-500",
        glowMap[glow],
        interactive &&
          "transition-all duration-500 hover:-translate-y-1.5 hover:border-[#e3b24f]/[0.14] hover:bg-white/[0.06] hover:before:opacity-100",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
