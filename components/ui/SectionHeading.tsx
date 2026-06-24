import { Eyebrow } from "@/components/ui/Eyebrow";
import { cn } from "@/components/ui/cn";

type SectionHeadingProps = {
  eyebrow?: string;
  /** First line, rendered in ink-white. */
  title: string;
  /** Optional second line, rendered in ink-gray (brochure two-tone headline). */
  titleMuted?: string;
  intro?: string;
  align?: "left" | "center";
  className?: string;
};

/** Two-tone Poppins headline with a teal eyebrow — the brochure section header. */
export function SectionHeading({
  eyebrow,
  title,
  titleMuted,
  intro,
  align = "left",
  className,
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4",
        align === "center" && "items-center text-center",
        className,
      )}
    >
      {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
      <h2 className="font-sans text-3xl font-bold leading-[1.1] tracking-tight sm:text-4xl md:text-5xl">
        <span className="text-ink-white">{title}</span>
        {titleMuted && (
          <>
            {" "}
            <span className="text-gold">{titleMuted}</span>
          </>
        )}
      </h2>
      {intro && (
        <p
          className={cn(
            "max-w-2xl text-base leading-relaxed text-ink-gray sm:text-lg",
            align === "center" && "mx-auto",
          )}
        >
          {intro}
        </p>
      )}
    </div>
  );
}
