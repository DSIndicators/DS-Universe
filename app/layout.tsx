import type { Metadata, Viewport } from "next";
import Image from "next/image";
import localFont from "next/font/local";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { NT_LINKS } from "@/content/ninjatrader";
import { SITE } from "@/content/site";
import "./globals.css";

// Self-hosted (app/fonts, SIL OFL) — no call to Google, identical on every machine.
const display = localFont({
  src: [{ path: "./fonts/Outfit-Variable.woff2", weight: "100 900", style: "normal" }],
  variable: "--font-display",
  display: "swap",
});
const sans = localFont({
  src: [{ path: "./fonts/Inter-Variable.woff2", weight: "100 900", style: "normal" }],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: `${SITE.name} — ${SITE.tagline}`, template: `%s — ${SITE.name}` },
  description: SITE.description,
  icons: {
    icon: [{ url: "/brand/favicon.png", type: "image/png", sizes: "64x64" }, { url: "/brand/badge-32.png", type: "image/png", sizes: "32x32" }],
    apple: "/brand/badge-180.png",
  },
  openGraph: {
    title: `${SITE.name} — ${SITE.tagline}`,
    description: SITE.description,
    type: "website",
    url: SITE.url,
    siteName: SITE.name,
    images: [{ url: "/brand/og.png", width: 1200, height: 630, alt: `${SITE.name} — ${SITE.tagline}` }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE.name} — ${SITE.tagline}`,
    description: SITE.description,
    images: ["/brand/og.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#FFFFFF",
  colorScheme: "light",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable}`}>
      <body className="flex min-h-screen flex-col antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-ink focus:px-4 focus:py-2 focus:text-white"
        >
          Skip to content
        </a>
        {/* The platform bar — first thing on every page. Carries the official
            orange wordmark (h-14 bar so the logo keeps its required 18px clear
            space on all sides). BOTH the logo and the CTA go straight to the
            affiliate link (Tom, 2026-09-10) — this bar is on every page and is
            the most-seen thing on the site, so sending it via /ninjatrader was
            spending a click for nothing. The page itself is still in the nav
            for anyone who wants to read about the platform first. */}
        <div className="bg-ink">
          <div className="wrap flex h-14 items-center justify-center gap-5 text-[13px] text-white/85">
            <a
              href={NT_LINKS.partner}
              target="_blank"
              rel="sponsored noopener"
              className="inline-flex h-14 shrink-0 items-center"
              aria-label="NinjaTrader — visit ninjatrader.com"
            >
              <Image
                src="/brand/nt/ninjatrader-wordmark.png"
                alt="NinjaTrader"
                width={2376}
                height={300}
                priority
                className="h-[18px] w-auto"
              />
            </a>
            <span className="hidden truncate sm:inline">is our #1 recommended trading platform.</span>
            <a
              href={NT_LINKS.partner}
              target="_blank"
              rel="sponsored noopener"
              className="inline-flex shrink-0 items-center gap-1.5 font-medium text-white underline decoration-white/30 underline-offset-4 transition-colors hover:decoration-gold"
            >
              Get started for free <span aria-hidden="true">→</span>
            </a>
          </div>
        </div>
        <Navbar />
        <main id="main" className="flex-1">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
