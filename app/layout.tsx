import type { Metadata, Viewport } from "next";
import { Poppins, JetBrains_Mono } from "next/font/google";
import { SmoothAnchors } from "@/components/SmoothAnchors";
import { StoreBanner } from "@/components/StoreBanner";
import { MouseGlow } from "@/components/ui/MouseGlow";
import { OrbMascot } from "@/components/ui/OrbMascot";
import "./globals.css";

// Headlines / brand wordmark / body — Poppins (incl. ExtraBold for the hero).
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
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
    "DS Universe is a suite of futures trading tools built for every timeframe. The DS Systems are intelligently mixed and run on one mind — the DS Registry — cross-referenced and rendered without a hint of lag. Precision from orbit.",
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
    title: "DS Universe — Futures Intelligence, Every Timeframe",
    description:
      "The DS Systems, intelligently mixed and run on one mind — the DS Registry. Precision from orbit — futures intelligence for every timeframe.",
    images: ["/brand/banner.png"],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "DS Universe — Futures Intelligence, Every Timeframe",
    description: "Nine instruments. The Systems run on one mind. Precision from orbit.",
    images: ["/brand/banner.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#050507",
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
        {/* TEMP: store-status notice. Remove this line to take it down. */}
        <StoreBanner />
        <MouseGlow />
        <OrbMascot />
        <SmoothAnchors />
        {children}
      </body>
    </html>
  );
}
