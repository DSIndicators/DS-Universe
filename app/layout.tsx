import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Header } from "@/components/Header";
import { PartnerBar } from "@/components/PartnerBar";
import { Footer } from "@/components/Footer";
import { Guard } from "@/components/Guard";
import { Help } from "@/components/Help";
import { SITE } from "@/content/site";
import "./globals.css";

// Self-hosted, SIL OFL. Manrope for display, Inter Tight for text.
const display = localFont({
  src: [{ path: "./fonts/Manrope-Latin-Variable.woff2", weight: "200 800", style: "normal" }],
  variable: "--font-display",
  display: "swap",
});
const text = localFont({
  src: [{ path: "./fonts/InterTight-Latin-Variable.woff2", weight: "100 900", style: "normal" }],
  variable: "--font-text",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: `${SITE.name} — ${SITE.tagline}`, template: `%s — ${SITE.name}` },
  description: SITE.description,
  // LIVE as dsuniverse.net from 2026-10-29: indexed (it was a local mockup,
  // set to noindex, until then). Absolute URLs for shares come from SITE.url.
  metadataBase: new URL(SITE.url),
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    siteName: SITE.name,
    url: SITE.url,
    images: [{ url: "/brand/ds-logo-black-720.png", width: 720, height: 720, alt: "DS Universe, Trading Indicators" }],
  },
  twitter: { card: "summary" },
  // The helmet from Tom's new logo (cut from "Minimal logo (1).png" with his
  // OK, 2026-10-26): black on a light browser tab, white on a dark one.
  icons: {
    icon: [
      { url: "/brand/icon-black-32.png", sizes: "32x32", type: "image/png", media: "(prefers-color-scheme: light)" },
      { url: "/brand/icon-black-48.png", sizes: "48x48", type: "image/png", media: "(prefers-color-scheme: light)" },
      { url: "/brand/icon-white-32.png", sizes: "32x32", type: "image/png", media: "(prefers-color-scheme: dark)" },
      { url: "/brand/icon-white-48.png", sizes: "48x48", type: "image/png", media: "(prefers-color-scheme: dark)" },
      { url: "/brand/icon-black-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/brand/apple-icon.png", sizes: "180x180" }],
  },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#fefefe" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${text.variable} bio-off`} suppressHydrationWarning>
      <head>
        {/* Bionic reading is off by default (the server sends class="bio-off"); lifted before first paint only for a visitor who turned it on (components/FocusSwitch.tsx). */}
        <script dangerouslySetInnerHTML={{ __html: `try{if(localStorage.getItem("ds-bionic")==="on")document.documentElement.classList.remove("bio-off")}catch(e){}` }} />
      </head>
      <body>
        <a className="skip" href="#main">
          Skip to content
        </a>
        <PartnerBar />
        <Header />
        <main id="main">{children}</main>
        <Footer />
        <Guard />
        {/* Help: answers, and a way to ask, on every page (components/Help.tsx, from the live site). */}
        <Help />
      </body>
    </html>
  );
}
