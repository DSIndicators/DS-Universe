import type { Metadata, Viewport } from "next";
import { Poppins, JetBrains_Mono } from "next/font/google";
import { SmoothAnchors } from "@/components/SmoothAnchors";
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
  metadataBase: new URL("https://dsuniverse.example"),
  title: "DS Universe",
  description:
    "DS Universe is a suite of intraday trading tools. Every instrument is intelligently mixed and bound by one mind — the DS Registry — cross-referenced and rendered without a hint of lag. Precision from orbit.",
  keywords: [
    "intraday trading",
    "intraday futures",
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
    title: "DS Universe — Intraday Futures Intelligence",
    description:
      "Every instrument intelligently mixed, bound by one mind. Precision from orbit — intraday futures intelligence.",
    images: ["/brand/banner.png"],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "DS Universe — Intraday Futures Intelligence",
    description: "Nine instruments. One mind. Precision from orbit.",
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
        <SmoothAnchors />
        {children}
      </body>
    </html>
  );
}
