import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Cormorant_Garamond, Inter, Plus_Jakarta_Sans } from "next/font/google";
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
 * ----------------------------------------------------------------------------
 * DEUX TYPOGRAPHIES DISTINCTES — l'application et l'artefact (Étape 11.22)
 * ----------------------------------------------------------------------------
 * 1. **`--font-admin` — police de l'APPLICATION (Back-Office).**
 *    Inter, sans-serif neutre conçue pour les interfaces denses : x-hauteur
 *    élevée, chiffres tabulaires, graisses complètes en **un seul fichier
 *    variable** (aucun téléchargement multiple). Elle est **indépendante du
 *    thème du site public** : changer la charte du portfolio ne touche jamais
 *    l'administration.
 * 2. **`--font-body` / `--font-heading` — duo éditorial du SITE PUBLIC**
 *    (thème « Éclat Minéral & Nacre », SPECIFICATIONS-V8.md §10.3) :
 *    Cormorant Garamond pour les titres, Plus Jakarta Sans pour le corps.
 *
 * La répartition est appliquée dans `globals.css` : la police d'application est
 * le **défaut** (donc héritée aussi par les portails Radix montés dans
 * `<body>` : dialogues, menus, feuilles), et le duo éditorial est **restreint**
 * aux pages publiques via `body:not(:has(.admin))`. Voir § Typographie.
 */
const fontAdmin = Inter({
  variable: "--font-admin",
  subsets: ["latin"],
  display: "swap",
});

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
      /* Le site défile en douceur (`scroll-behavior: smooth`, ancres
         compensées de l'étape 11.16). Next a besoin de le savoir pour ne pas
         l'appliquer pendant ses propres transitions de route — sans cet
         attribut, un changement de page hérite du défilement animé et
         l'arrivée sur la nouvelle page « glisse » au lieu de se poser. */
      data-scroll-behavior="smooth"
      className={`${fontAdmin.variable} ${fontBody.variable} ${fontHeading.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
