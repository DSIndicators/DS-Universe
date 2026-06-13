import type { Metadata, Viewport } from "next";
import { Poppins, JetBrains_Mono } from "next/font/google";
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
  title: "DS Universe — Intraday Futures Intelligence (MNQ / MES)",
  description:
    "DS Universe is a suite of intraday futures indicators for MNQ / MES. Nine instruments, one mind — the Radars decode the tape and the Systems map the field. Precision from orbit.",
  keywords: [
    "MNQ",
    "MES",
    "intraday futures",
    "trading indicators",
    "order flow",
    "NinjaTrader",
    "DS Universe",
  ],
  icons: {
    icon: "/brand/emblem.png",
    apple: "/brand/emblem.png",
  },
  openGraph: {
    title: "DS Universe — Intraday Futures Intelligence",
    description:
      "Nine instruments. One mind. Precision from orbit. Intraday futures intelligence for MNQ / MES.",
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
        {children}
      </body>
    </html>
  );
}
