"use client";

import * as React from "react";

import { persistVisualIdentity } from "@/lib/persistence-client";
import {
  getVisualIdentityServerSnapshot,
  getVisualIdentitySnapshot,
  hydrateVisualIdentity,
  subscribeVisualIdentity,
} from "@/lib/visual-identity-store";
import type { VisualIdentity } from "@/lib/visual-identity";

/**
 * ============================================================================
 * VISUAL IDENTITY PROVIDER — hydratation & persistance (Étape 9.1)
 * ----------------------------------------------------------------------------
 * Client Component monté dans le layout **front-office** (Header) et le layout
 * **admin** (`/admin/identite-visuelle`). Aucun contexte fourni : les
 * consommateurs lisent le store module via `useVisualIdentity`. Deux effets :
 *   - **hydratation** post-montage depuis `loadInitialData.visualIdentity` ;
 *   - **persistance** débouncée (400 ms) quand la BDD est disponible, en
 *     ignorant le 1er rendu et l'hydratation elle-même.
 *
 * Référence : plans/ROADMAP-9.1-visual-identity-logo.md §D-5
 * ============================================================================
 */

export function VisualIdentityProvider({
  children,
  initialVisualIdentity,
  persistenceEnabled = false,
}: {
  children: React.ReactNode;
  /** Configuration chargée côté serveur — absente : défauts (champs vierges). */
  initialVisualIdentity?: VisualIdentity;
  /** true quand la BDD est disponible : persistance des mutations. */
  persistenceEnabled?: boolean;
}) {
  const { visualIdentity } = React.useSyncExternalStore(
    subscribeVisualIdentity,
    getVisualIdentitySnapshot,
    getVisualIdentityServerSnapshot
  );

  const previousValue = React.useRef<VisualIdentity | null>(null);
  const isFirstRun = React.useRef(true);

  // Hydratation unique (post-montage, après le 1er rendu identique au SSR).
  React.useEffect(() => {
    if (!initialVisualIdentity) {
      return;
    }
    hydrateVisualIdentity(initialVisualIdentity);
    // L'hydratation ne doit pas être re-persistée.
    previousValue.current = getVisualIdentitySnapshot().visualIdentity;
  }, [initialVisualIdentity]);

  // Persistance débouncée des mutations — BDD disponible.
  React.useEffect(() => {
    if (!persistenceEnabled) {
      return;
    }
    if (isFirstRun.current) {
      isFirstRun.current = false;
      previousValue.current = visualIdentity;
      return;
    }
    const previous = previousValue.current;
    previousValue.current = visualIdentity;
    if (
      previous !== null &&
      JSON.stringify(previous) === JSON.stringify(visualIdentity)
    ) {
      return; // aucune mutation effective
    }
    const timer = window.setTimeout(() => {
      persistVisualIdentity(visualIdentity).catch((error: unknown) => {
        console.error("Persistance identité visuelle :", error);
      });
    }, 400);
    return () => window.clearTimeout(timer);
  }, [visualIdentity, persistenceEnabled]);

  return <>{children}</>;
}
