import { cn } from "@/components/ui/cn";

/**
 * Blank image drop-zone. A dashed gold-bordered placeholder with a labelled
 * caption and a faint hint — used while Tom fills the Gallery / Showcase with
 * the new gold captures. Each Slot doubles as a checklist item: the label says
 * exactly which picture belongs in that space.
 */
export function Slot({
  label,
  hint = "Drop image here",
  className,
}: {
  label: string;
  hint?: string;
  className?: string;
}) {
  return (
    <div
      role="img"
      aria-label={`${label} — image placeholder`}
      className={cn(
        "flex h-full w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[#e3b24f]/25 bg-white/[0.015] p-5 text-center transition-colors duration-300 hover:border-[#e3b24f]/45 hover:bg-white/[0.03]",
        className,
      )}
    >
      <span className="font-mono text-[0.62rem] uppercase tracking-[0.2em] text-[#e3b24f]/80">
        {label}
      </span>
      <span className="font-mono text-[0.55rem] uppercase tracking-[0.16em] text-ink-gray/45">
        {hint}
      </span>
    </div>
  );
}
