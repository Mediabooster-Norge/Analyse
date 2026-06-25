import type { Metadata } from "next";
import { Geist, Geist_Mono, Lora } from "next/font/google";
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

const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Selia | Fra analyse til gjennomføring på minutter",
  description:
    "Selia analyserer nettsiden din og produserer konkrete forbedringer – meta-tekst, artikler og handlingsplaner du kan bruke med én gang. Gratis å starte.",
  keywords: [
    "nettsideanalyse",
    "SEO analyse",
    "AI nettside",
    "gratis SEO verktøy",
    "nettside sjekk",
    "konkurrentanalyse",
    "AI artikkel generator",
    "norsk SEO",
  ],
  authors: [{ name: "Selia" }],
  openGraph: {
    title: "Selia | Fra analyse til gjennomføring på minutter",
    description:
      "Selia analyserer nettsiden din og produserer konkrete forbedringer – meta-tekst, artikler og handlingsplaner du kan bruke med én gang. Gratis å starte.",
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
        className={`${geistSans.variable} ${geistMono.variable} ${lora.variable} font-sans antialiased`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
