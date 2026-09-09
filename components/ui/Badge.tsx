import Image from "next/image";

/**
 * The DS Universe logo badge — the astronaut on a black disc (public/brand/badge-*.png).
 * Used ONLY where the logo appears: navbar, footer, favicon. Placeholders use <Mark />.
 */
export function Badge({ size = 34, className = "" }: { size?: number; className?: string }) {
  const src = size >= 96 ? "/brand/badge-512.png" : "/brand/badge-180.png";
  return (
    <Image src={src} alt="" width={size} height={size} aria-hidden="true" className={`rounded-full ${className}`} style={{ width: size, height: size }} />
  );
}
