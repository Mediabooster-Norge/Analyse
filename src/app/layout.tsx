import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Booster | Din digitale markedssjef – og AI kollega",
  description: "Spar titusenvis av kroner på dyre verktøy og byråtimer. Booster gir deg gratis webanalyse, SEO, sikkerhet og AI-anbefalinger på minutter.",
  keywords: ["nettside", "analyse", "SEO", "ytelse", "sikkerhet", "gratis", "AI", "markedssjef", "digital markedsføring", "Booster"],
  authors: [{ name: "Booster" }],
  openGraph: {
    title: "Booster | Din digitale markedssjef – og AI kollega",
    description: "Spar titusenvis av kroner på dyre verktøy og byråtimer. Booster gir deg gratis webanalyse, SEO, sikkerhet og AI-anbefalinger på minutter.",
    type: "website",
    locale: "nb_NO",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="no">
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
