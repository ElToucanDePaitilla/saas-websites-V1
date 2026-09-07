/**
 * ============================================================================
 * STORE MOCK PARTAGÉ — Navigation (Étape 4.5)
 * ----------------------------------------------------------------------------
 * État **partagé au niveau module** (singleton en mémoire) de la navigation du
 * site. Il est consommé par `NavigationStoreProvider` via `useSyncExternalStore`
 * à la fois dans le layout Back-Office `/admin` et dans le layout public `/`.
 *
 * Pourquoi un état au niveau module ?
 *   - `/admin` et `/` sont des route groups avec des layouts **distincts** :
 *     un `useState` local au Provider créerait une instance isolée par montage,
 *     réinitialisée sur le seed à chaque changement de layout — les presets et
 *     éditions du Back-Office ne seraient jamais visibles sur le site public ;
 *   - l'état vit ici (module), les actions le mutent via `setNavigationState`
 *     et tous les Providers montés s'abonnent : au sein d'une **même session**
 *     (sans rechargement plein du navigateur), naviguer de `/admin` vers `/`
 *     conserve l'état édité.
 *
 * Limite du mock (documentée) : un **rechargement plein** du navigateur
 * réinitialise le module sur le seed `buildSeedNavigation()` — la persistance
 * durable viendra avec l'intégration BDD/Supabase.
 *
 * TypeScript strict, zéro `any`. Aucune dépendance externe.
 * Référence : plans/ROADMAP-4.5-front-navigation.md §0.1
 * ============================================================================
 */

import {
  buildSeedNavigation,
  type NavPresetId,
  type SiteNavigation,
} from "./navigation";

/** État complet partagé par toutes les instances du Provider. */
export type NavigationSnapshot = {
  navigation: SiteNavigation;
  /** Preset Onboarding appliqué (badge « Preset actif ») — null = personnalisé. */
  appliedPresetId: NavPresetId | null;
};

let snapshot: NavigationSnapshot = {
  navigation: buildSeedNavigation(),
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
