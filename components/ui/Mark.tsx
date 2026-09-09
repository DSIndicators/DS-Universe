/** The simple DS ring — the placeholder glyph used on add-on tiles. Flat, one colour. */
export function Mark({ size = 28, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true" className={className}>
      <circle cx="24" cy="24" r="17" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeDasharray="86 21" transform="rotate(-62 24 24)" />
      <circle cx="24" cy="24" r="5.5" fill="currentColor" />
    </svg>
  );
}
