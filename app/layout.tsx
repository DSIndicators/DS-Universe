import type { Metadata, Viewport } from "next";
import { Space_Grotesk, JetBrains_Mono } from "next/font/google";
import { SmoothAnchors } from "@/components/SmoothAnchors";
import { StoreBanner } from "@/components/StoreBanner";
import { SpaceBackground } from "@/components/ui/SpaceBackground";
import "./globals.css";

// Headlines / brand wordmark / body - Space Grotesk (precise, technical grotesk;
// the distinctive, professional alternative to the default geometric sans).
const poppins = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
});

// Spaced small-caps labels (the banner lettering).
const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://dsuniverse.net"),
  title: "DS Universe",
  description:
    "DS Universe is a suite of futures trading tools built for every timeframe. The DS Systems are intelligently mixed and run on one mind, the DS Registry, cross-referenced and rendered without a hint of lag. Precision from orbit.",
  keywords: [
    "multi-timeframe trading",
    "futures trading",
    "trading indicators",
    "order flow",
    "NinjaTrader",
    "DS Universe",
  ],
  icons: {
    icon: "/favicon.png",
    apple: "/favicon.png",
  },
  openGraph: {
    title: "DS Universe - Futures Intelligence, Every Timeframe",
    description:
      "The DS Systems, intelligently mixed and run on one mind, the DS Registry. Precision from orbit.",
    images: ["/brand/banner.png"],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "DS Universe - Futures Intelligence, Every Timeframe",
    description:
      "Thirteen indicators, two drawing tools, an add-on and the DS P&L. The Systems run on one mind. Precision from orbit.",
    images: ["/brand/banner.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#050505",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${poppins.variable} ${mono.variable}`}>
      <body className="bg-space-black text-ink-white antialiased">
        {/* Living space: one WebGL starfield behind the whole site. */}
        <SpaceBackground />
        {/* TEMP: store-status notice. Remove this line to take it down. */}
        <StoreBanner />
        {/* Mascot intentionally OFF (premium gold direction). */}
        <SmoothAnchors />
        {children}
      </body>
    </html>
  );
}
