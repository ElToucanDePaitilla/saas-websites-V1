"use client";

import * as React from "react";

import { persistOwnerProfile } from "@/lib/persistence-client";
import {
  getOwnerProfileServerSnapshot,
  getOwnerProfileSnapshot,
  hydrateOwnerProfile,
  subscribeOwnerProfile,
  type OwnerProfile,
} from "@/lib/owner-profile";

/**
 * ============================================================================
 * OWNER PROFILE PROVIDER — hydratation & persistance du module « Profil » (8.2)
 * ----------------------------------------------------------------------------
 * Client Component monté dans le layout **front-office** (Header/Footer) et le
 * layout **admin** (`/admin/profile`). Il ne fournit AUCUN contexte : les
 * consommateurs lisent le store partagé au niveau module via `useOwnerProfile`
 * (Header, Footer, ProfileScreen). Ce Provider gère deux effets transverses :
 *   - **hydratation** post-montage depuis le profil chargé côté serveur
 *     (`loadInitialData.profile`, Étape 5.2/8.2) → `hydrateOwnerProfile` ;
 *   - **persistance** des mutations quand `persistenceEnabled` (BDD dispo) :
 *     débounce 400 ms + `persistOwnerProfile` (fire-and-forget, erreur
 *     journalisée), en ignorant le 1er rendu ET l'hydratation elle-même.
 *
 * Référence : plans/ROADMAP-8.2-owner-profile-persistence.md §D-4
 * ============================================================================
 */

export function OwnerProfileProvider({
  children,
  initialProfile,
  persistenceEnabled = false,
}: {
  children: React.ReactNode;
  /** Profil chargé côté serveur depuis la BDD — absent : seed mémoire. */
  initialProfile?: OwnerProfile;
  /** true quand la BDD est disponible (Étape 5.3) : persistance des mutations. */
  persistenceEnabled?: boolean;
}) {
  // S'abonne au store module pour déclencher la persistance à chaque mutation.
  const { profile } = React.useSyncExternalStore(
    subscribeOwnerProfile,
    getOwnerProfileSnapshot,
    getOwnerProfileServerSnapshot
  );

  // Hydratation unique (post-montage, après le 1er rendu identique au SSR).
  const previousProfile = React.useRef<OwnerProfile | null>(null);
  const isFirstRun = React.useRef(true);

  React.useEffect(() => {
    if (!initialProfile) {
      return;
    }
    hydrateOwnerProfile(initialProfile);
    // L'hydratation ne doit pas être re-persistée : mémorise la référence du
    // snapshot résultant pour que l'effet de persistance détecte « aucune
    // mutation effective ».
    previousProfile.current = getOwnerProfileSnapshot().profile;
  }, [initialProfile]);

  // Persistance débouncée des mutations (Étape 5.3) — BDD disponible.
  React.useEffect(() => {
    if (!persistenceEnabled) {
      return;
    }
    if (isFirstRun.current) {
      // Premier rendu (hydratation/seed) : rien à persister.
      isFirstRun.current = false;
      previousProfile.current = profile;
      return;
    }
    const previous = previousProfile.current;
    previousProfile.current = profile;
    if (
      previous !== null &&
      JSON.stringify(previous) === JSON.stringify(profile)
    ) {
      return; // aucune mutation effective
    }
    const timer = window.setTimeout(() => {
      persistOwnerProfile(profile).catch((error: unknown) => {
        console.error("Persistance profil :", error);
      });
    }, 400);
    return () => window.clearTimeout(timer);
  }, [profile, persistenceEnabled]);

  return <>{children}</>;
}
