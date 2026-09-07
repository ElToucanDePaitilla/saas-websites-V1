import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Cormorant_Garamond, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

/**
 * ============================================================================
 * LAYOUT RACINE — structure minimale (neutre)
 * ----------------------------------------------------------------------------
 * Point d'entrée global de l'application (Next.js App Router). Il ne porte
 * QUE la structure technique partagée : <html>/<body>, le duo typographique
 * « Éditorial & Luxe » (thème « Éclat Minéral & Nacre ») et les métadonnées.
 *
 * Le chrome public (Header + Footer) a été déplacé dans le route group
 * `(front-office)/layout.tsx` afin que le Back-Office (`(back-office)/admin`)
 * puisse utiliser un chrome Dashboard dédié, sans Header/Footer public.
 *
 * Référence : plans/ROADMAP-3.1-pagemetadata.md §1.1
 * ============================================================================
 */

/**
 * Duo typographique « Éditorial & Luxe » du thème « Éclat Minéral & Nacre »
 * (SPECIFICATIONS-V8.md §10.3 — PROJECT_CONTEXT.md §2)
 * - Titres  : Cormorant Garamond (serif raffiné, graisses Light/Regular).
 * - Corps   : Plus Jakarta Sans (sans-serif géométrique, letter-spacing 0.02em).
 */
const fontHeading = Cormorant_Garamond({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
  display: "swap",
});

const fontBody = Plus_Jakarta_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Portfolio Photographe — Plateforme SaaS",
    template: "%s | Portfolio Photographe",
  },
  description:
    "SaaS Portfolio Photographes Pro — sites web portfolio, galeries privées, devis, réservation et e-commerce de tirages.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="fr"
      className={`${fontBody.variable} ${fontHeading.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
