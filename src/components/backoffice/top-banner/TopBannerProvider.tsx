"use client";

import * as React from "react";

import { persistTopBanner } from "@/lib/persistence-client";
import {
  getTopBannerServerSnapshot,
  getTopBannerSnapshot,
  hydrateTopBanner,
  subscribeTopBanner,
} from "@/lib/top-banner-store";
import { createDefaultTopBanner, type TopBanner } from "@/lib/top-banner";

/**
 * ============================================================================
 * TOP BANNER PROVIDER — hydratation & persistance
 * ----------------------------------------------------------------------------
 * Client Component monté dans le layout **front-office** (rendu public du
 * bandeau) et le layout **admin** (`/admin/bandeau-alerte`). Aucun contexte
 * fourni : les consommateurs lisent le store module via `useTopBanner`. Deux
 * effets :
 *   - **hydratation** post-montage depuis `loadInitialData.topBanner` ;
 *   - **persistance** débouncée (400 ms) quand la BDD est disponible, en
 *     ignorant le 1er rendu et l'hydratation elle-même.
 *
 * Même mécanique que `VisualIdentityProvider` : la dupliquer plutôt que la
 * paramétrer évite de coupler deux réglages globaux indépendants.
 * ============================================================================
 */

export function TopBannerProvider({
  children,
  initialTopBanner,
  persistenceEnabled = false,
}: {
  children: React.ReactNode;
  /** Configuration chargée côté serveur — absente : défauts (désactivé). */
  initialTopBanner?: TopBanner;
  /** true quand la BDD est disponible : persistance des mutations. */
  persistenceEnabled?: boolean;
}) {
  const { topBanner } = React.useSyncExternalStore(
    subscribeTopBanner,
    getTopBannerSnapshot,
    getTopBannerServerSnapshot
  );

  const previousValue = React.useRef<TopBanner | null>(null);
  const isFirstRun = React.useRef(true);

  // Hydratation unique (post-montage, après le 1er rendu identique au SSR).
  React.useEffect(() => {
    if (initialTopBanner) {
      hydrateTopBanner(initialTopBanner);
    } else if (persistenceEnabled) {
      // BDD disponible mais aucune ligne : l'absence est une information, on
      // réinitialise donc le store (sinon un bandeau supprimé resterait affiché
      // sur les navigations suivantes). Hors BDD (`persistenceEnabled` false),
      // on préserve la valeur en mémoire, partagée avec le Back-Office.
      hydrateTopBanner(createDefaultTopBanner());
    }
    // L'hydratation ne doit pas être re-persistée.
    previousValue.current = getTopBannerSnapshot().topBanner;
  }, [initialTopBanner, persistenceEnabled]);

  // Persistance débouncée des mutations — BDD disponible.
  React.useEffect(() => {
    if (!persistenceEnabled) {
      return;
    }
    if (isFirstRun.current) {
      isFirstRun.current = false;
      previousValue.current = topBanner;
      return;
    }
    const previous = previousValue.current;
    previousValue.current = topBanner;
    if (
      previous !== null &&
      JSON.stringify(previous) === JSON.stringify(topBanner)
    ) {
      return; // aucune mutation effective
    }
    const timer = window.setTimeout(() => {
      persistTopBanner(topBanner).catch((error: unknown) => {
        console.error("Persistance bandeau d'alerte :", error);
      });
    }, 400);
    return () => window.clearTimeout(timer);
  }, [topBanner, persistenceEnabled]);

  return <>{children}</>;
}
