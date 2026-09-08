import type { ReactNode } from "react";

import { NavigationStoreProvider } from "@/components/backoffice/navigation/NavigationStoreProvider";
import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import { loadInitialData } from "@/db/load-initial-data";
import { resolvePublicPhotographerId } from "@/lib/supabase/session";

/**
 * ============================================================================
 * LAYOUT — Route Group (front-office) : chrome public du site photographe
 * ----------------------------------------------------------------------------
 * Reprend à l'identique le chrome Front-Office qui vivait auparavant dans le
 * layout racine `src/app/layout.tsx` :
 *   - Header fixe (glassmorphism nacré) en haut ;
 *   - conteneur `main` avec offset `pt-20` (5rem = hauteur `h-16` du Header
 *     + 16px de respiration) pour que le contenu défile sous la barre fixe ;
 *   - Footer en bas (`flex-1` sur le `<main>` pour ancrer le Footer en bas de
 *     page sur les contenus courts).
 *
 * Étape 4.5 : tout le chrome est enveloppé dans `NavigationStoreProvider`.
 * Grâce au **store module partagé** (plans/ROADMAP-4.5 §0.1), cette instance et
 * celle du layout `/admin` lisent le même état en mémoire : les modifications /
 * Presets Onboarding du Back-Office sont visibles sur le site public au sein
 * d'une même session (navigation SPA).
 *
 * Étape 5.2 : le layout (Server Component **async**) charge l'état initial
 * depuis la BDD (`loadInitialData`) et le transmet via la prop `initialData` —
 * l'hydratation du store se fait une fois par session. En cas de BDD
 * indisponible, `initialData` est absent → fallback sur le seed en mémoire
 * (plans/ROADMAP-5.2-ssr-db-hydration.md).
 *
 * Le Provider n'ajoute aucun nœud DOM (contexte React seul) : le Header / main /
 * Footer restent enfants directs du `<body>` en `flex flex-col`.
 *
 * Références : plans/ROADMAP-5.2-ssr-db-hydration.md §2.B —
 *              plans/ROADMAP-4.5-front-navigation.md §4 —
 *              plans/ROADMAP-3.1-pagemetadata.md §1.1 — ARCHITECTURE.md §2
 * ============================================================================
 */
export default async function FrontOfficeLayout({
  children,
}: {
  children: ReactNode;
}) {
  // Site public affiché = photographe connecté (session), sinon tenant démo.
  const photographerId = await resolvePublicPhotographerId();
  const initial = await loadInitialData(photographerId);

  return (
    <NavigationStoreProvider
      initialData={initial.navigation}
      persistenceEnabled={initial.dbAvailable}
    >
      <Header />
      <main className="flex-1 pt-20">{children}</main>
      <Footer />
    </NavigationStoreProvider>
  );
}