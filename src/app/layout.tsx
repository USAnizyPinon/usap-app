import type { Metadata, Viewport } from "next";
import { Playfair_Display, Montserrat } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import Header from "@/components/Header";
import Providers from "@/components/Providers";
import InstallBanner from "@/components/InstallBanner";

const display = Playfair_Display({
  subsets: ["latin"],
  weight: ["700", "900"],
  variable: "--font-display",
  display: "swap",
});

const sans = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "US Anizy-Pinon",
    template: "%s · US Anizy-Pinon",
  },
  description:
    "L'application du club de l'US Anizy-Pinon : matchs, équipes, effectifs et actualités.",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, title: "USAP", statusBarStyle: "black-translucent" },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icon-192.png", type: "image/png", sizes: "192x192" },
    ],
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "US Anizy-Pinon",
    description: "Matchs, équipes, effectifs et actualités du club.",
    images: ["/og-image.png"],
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#0c0c0d",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${display.variable} ${sans.variable}`}>
      <body className="flex min-h-dvh flex-col">
        <Providers>
          <Header />
          <main className="flex-1">{children}</main>
          <InstallBanner />

          <footer className="mt-20 border-t border-white/10 bg-noir-2">
            <div className="wrap flex flex-col gap-4 py-10 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-display text-lg font-black uppercase">US Anizy-Pinon</p>
                <p className="mt-1 text-xs text-cream/50">
                  Un club, une passion, une famille.
                </p>
              </div>
              <nav className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-cream/60">
                <Link href="/matchs" className="hover:text-jaune">
                  Matchs
                </Link>
                <Link href="/equipes" className="hover:text-jaune">
                  Équipes
                </Link>
                <Link href="/actus" className="hover:text-jaune">
                  Actus
                </Link>
                <Link href="/classement" className="hover:text-jaune">
                  Classement
                </Link>
                <Link href="/evenements" className="hover:text-jaune">
                  Événements
                </Link>
                <Link href="/galerie" className="hover:text-jaune">
                  Galerie
                </Link>
                <Link href="/partenaires" className="hover:text-jaune">
                  Partenaires
                </Link>
                <Link href="/bureaux" className="hover:text-jaune">
                  Les bureaux
                </Link>
                <Link href="/mentions-legales" className="hover:text-jaune">
                  Mentions légales
                </Link>
                <Link href="/confidentialite" className="hover:text-jaune">
                  Confidentialité
                </Link>
              </nav>
            </div>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
