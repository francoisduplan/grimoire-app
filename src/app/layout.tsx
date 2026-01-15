import type { Metadata } from "next";
import { Cinzel, Spectral } from "next/font/google";
import "./globals.css";
import { CharacterProvider } from "@/context/CharacterContext";
import { MobileLayout } from "@/components/layout/MobileLayout";

const cinzel = Cinzel({ 
  subsets: ["latin"],
  variable: "--font-cinzel",
  display: "swap",
});

const spectral = Spectral({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-spectral",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Le Grimoire Arcanique",
  description: "Gestionnaire de sorts pour Magicien D&D 5e",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={`${cinzel.variable} ${spectral.variable}`}>
      <body className="font-serif bg-[var(--background)] text-[var(--foreground)] antialiased">
        <CharacterProvider>
          <MobileLayout>
            {children}
          </MobileLayout>
        </CharacterProvider>
      </body>
    </html>
  );
}
