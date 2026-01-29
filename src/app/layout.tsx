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
  title: "Nettsjekk | Gratis analyse av din nettside",
  description: "Få en komplett analyse av nettsiden din på sekunder. SEO, ytelse, sikkerhet, innhold og AI-drevne anbefalinger - alt i én rapport.",
  keywords: ["nettside", "analyse", "SEO", "ytelse", "sikkerhet", "gratis", "AI"],
  authors: [{ name: "Mediabooster" }],
  openGraph: {
    title: "Nettsjekk | Gratis analyse av din nettside",
    description: "Få en komplett analyse av nettsiden din på sekunder. SEO, ytelse, sikkerhet og AI-anbefalinger.",
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
