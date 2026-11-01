import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Header } from "@/components/Header";
import { PartnerBar } from "@/components/PartnerBar";
import { Footer } from "@/components/Footer";
import { Help } from "@/components/Help";
import { getSession } from "@/lib/auth";
import { SITE } from "@/content/site";
import { ReturnStrip } from "@/components/ReturnStrip";
import { RETURN, returnOn, FRESH, FRESH_NAMES } from "@/content/returns";
import { COUNT } from "@/content/vaults";
import "./globals.css";

// Self-hosted, SIL OFL. Manrope for display, Inter Tight for text (as the white site).
const display = localFont({ src: [{ path: "./fonts/Manrope-Latin-Variable.woff2", weight: "200 800", style: "normal" }], variable: "--font-display", display: "swap" });
const text = localFont({ src: [{ path: "./fonts/InterTight-Latin-Variable.woff2", weight: "100 900", style: "normal" }], variable: "--font-text", display: "swap" });

export const metadata: Metadata = {
  title: { default: `${SITE.name} — ${SITE.tagline}`, template: `%s — ${SITE.name}` },
  description: SITE.description,
  metadataBase: new URL(SITE.url),
  // Live on dsuniverse.net since 2026-10-31 (Tom: "launch website to main"). The members area stays out of search (app/members/layout.tsx, next.config.mjs).
  robots: { index: true, follow: true },
  icons: {
    icon: [
      { url: "/brand/icon-black-32.png", sizes: "32x32", type: "image/png", media: "(prefers-color-scheme: light)" },
      { url: "/brand/icon-white-32.png", sizes: "32x32", type: "image/png", media: "(prefers-color-scheme: dark)" },
      { url: "/brand/icon-black-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/brand/apple-icon.png", sizes: "180x180" }],
  },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#fefefe" };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const s = await getSession();
  const first = s ? (s.name?.split(" ")[0] || s.email.split("@")[0]) : "";
  return (
    <html lang="en" className={`${display.variable} ${text.variable} bio-off`} suppressHydrationWarning>
      <head>
        {/* Typography fixation is off by default; lifted before first paint only for a visitor who turned it on (components/FocusSwitch.tsx). */}
        <script dangerouslySetInnerHTML={{ __html: `try{if(localStorage.getItem("ds-bionic")==="on")document.documentElement.classList.remove("bio-off")}catch(e){}` }} />
        {/* The Free Vault return line, once closed on this browser, stays closed from the first paint (components/ReturnStrip.tsx). */}
        <script dangerouslySetInnerHTML={{ __html: `try{if(localStorage.getItem(${JSON.stringify(RETURN.key)}))document.documentElement.classList.add("ret-off")}catch(e){}` }} />
      </head>
      <body>
        <a className="skip" href="#main">
          Skip to content
        </a>
        {returnOn() && <ReturnStrip count={COUNT.free} fresh={FRESH_NAMES} freshCount={FRESH.length} storageKey={RETURN.key} />}
        <PartnerBar />
        <Header member={s ? { first, plan: s.plan } : null} />
        <main id="main">{children}</main>
        <Footer />
        <Help />
      </body>
    </html>
  );
}
