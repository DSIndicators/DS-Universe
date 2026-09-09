import Image from "next/image";
import { MONITOR } from "@/content/site";

/**
 * A CSS monitor. The screen is a 16:9 slot fed by content/site.ts → MONITOR.
 * Swap `src` for a recording (kind: "video") when the chart-in-action clip is ready.
 */
export function Monitor({ className = "", priority = false }: { className?: string; priority?: boolean }) {
  return (
    <div className={`relative ${className}`} aria-hidden={MONITOR.alt ? undefined : true}>
      {/* panel */}
      <div className="relative rounded-[14px] bg-gradient-to-b from-[#F1F2F5] to-[#DFE2E8] p-[10px] shadow-monitor ring-1 ring-black/[0.06]">
        <div className="relative aspect-[16/9] overflow-hidden rounded-[7px] bg-[#0f1114] ring-1 ring-black/40">
          {MONITOR.kind === "video" ? (
            <video
              className="absolute inset-0 h-full w-full object-cover"
              src={MONITOR.src}
              poster={MONITOR.poster}
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
            />
          ) : (
            <Image
              src={MONITOR.src}
              alt={MONITOR.alt}
              fill
              priority={priority}
              sizes="(min-width: 1024px) 60vw, 100vw"
              className="object-cover object-left-top"
            />
          )}
          {/* glass */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.06] via-transparent to-transparent" />
        </div>
        {/* chin with the mark */}
        <div className="flex h-[22px] items-center justify-center">
          <span className="block h-[5px] w-[5px] rounded-full bg-gold/70" aria-hidden="true" />
        </div>
      </div>
      {/* neck */}
      <div className="mx-auto h-[70px] w-[11%] bg-gradient-to-b from-[#D9DCE2] to-[#C9CDD5]" />
      {/* base */}
      <div className="mx-auto h-[12px] w-[38%] rounded-[3px] bg-gradient-to-b from-[#DFE2E8] to-[#C7CBD3] shadow-[0_10px_30px_-10px_rgba(20,22,26,0.35)]" />
      {/* floor shadow */}
      <div className="mx-auto mt-[-4px] h-6 w-[70%] rounded-[100%] bg-black/[0.07] blur-xl" />
    </div>
  );
}
