/**
 * ============================================================================
 * STORE MOCK PARTAGÉ — Navigation (Étape 4.5, ajusté en 10.1)
 * ----------------------------------------------------------------------------
 * État **partagé au niveau module** (singleton en mémoire) de la navigation du
 * site. Il est consommé par `NavigationStoreProvider` via `useSyncExternalStore`
 * à la fois dans le layout Back-Office `/admin` et dans le layout public `/`.
 *
 * Étape 10.1 — le défaut est désormais une navigation **VIDE** : le seed n'est
 * plus un fallback implicite du store. Il est fourni **explicitement** par le
 * serveur (`loadInitialData`) lorsque la BDD est injoignable — un site dont la
 * BDD est vide n'affiche donc plus de menu fantôme.
 *
 * TypeScript strict, zéro `any`. Aucune dépendance externe.
 * Référence : plans/ROADMAP-4.5-front-navigation.md §0.1 — ROADMAP-10.1 §D-3
 * ============================================================================
 */

import type { NavPresetId, SiteNavigation } from "./navigation";

/** État complet partagé par toutes les instances du Provider. */
export type NavigationSnapshot = {
  navigation: SiteNavigation;
  /** Preset Onboarding appliqué (badge « Preset actif ») — null = personnalisé. */
  appliedPresetId: NavPresetId | null;
};

let snapshot: NavigationSnapshot = {
  // Défaut **vide** (10.1) : plus aucune navigation de démonstration implicite.
  navigation: { header: [], footer: [] },
  appliedPresetId: null,
};

const listeners = new Set<() => void>();

/** Snapshot courant (client) — nouvelle référence à chaque mutation. */
export function getNavigationSnapshot(): NavigationSnapshot {
  return snapshot;
}

/**
 * Snapshot pour le rendu serveur / première passe d'hydratation : renvoie l'état
 * courant (structure du seed au premier chargement) — identique entre le rendu
 * serveur et le premier rendu client → aucun mismatch d'hydratation.
 */
export function getNavigationServerSnapshot(): NavigationSnapshot {
  return snapshot;
}

/** Abonnement au store (utilisé par `useSyncExternalStore`). */
export function subscribeNavigation(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Applique une mutation à l'état partagé puis notifie tous les abonnés.
 * L'updater reçoit l'état précédent et retourne le nouvel état (immutable :
 * une nouvelle référence d'objet est requise pour déclencher le re-rendu).
 */
export function setNavigationState(
  updater: (previous: NavigationSnapshot) => NavigationSnapshot
): void {
  snapshot = updater(snapshot);
  for (const listener of listeners) {
    listener();
  }
}

/**
 * true une fois l'état initial hydraté depuis la BDD (une seule fois/session).
 */
let hydrated = false;

/**
 * Hydrate l'état partagé depuis les données serveur (Étape 5.2).
 * N'applique l'état initial qu'**une seule fois par session** : un garde-fou
 * évite que les remontages de Provider (navigations SPA entre `/admin` et `/`)
 * écrasent les mutations de l'utilisateur par une re-hydratation.
 */
export function hydrateNavigation(initial: NavigationSnapshot): void {
  if (hydrated) {
    return;
  }
  hydrated = true;
  snapshot = {
    navigation: initial.navigation,
    appliedPresetId: initial.appliedPresetId,
  };
  for (const listener of listeners) {
    listener();
  }
}
