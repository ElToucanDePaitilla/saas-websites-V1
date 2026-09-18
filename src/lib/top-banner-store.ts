"use client";

import * as React from "react";

import {
  createDefaultTopBanner,
  normalizeTopBanner,
  type TopBanner,
} from "./top-banner";

/**
 * ============================================================================
 * STORE PARTAGÉ — « Mini-bandeau Alerte / Promo »
 * ----------------------------------------------------------------------------
 * Singleton au niveau module (même pattern que `visual-identity-store`)
 * consommé par `useTopBanner()`. Le domaine pur (types/constantes/normalisation)
 * vit dans `top-banner.ts` (importable côté serveur).
 * ============================================================================
 */

/** État partagé du module. */
export type TopBannerSnapshot = {
  topBanner: TopBanner;
  /**
   * true dès qu'une valeur serveur (ou une mutation) a été posée. Permet au
   * chrome public de rendre la valeur **initiale du serveur** tant que le store
   * n'a pas été hydraté, au lieu des défauts — c'est ce qui rend le bandeau
   * présent dans le HTML SSR sans mismatch d'hydratation.
   */
  hydrated: boolean;
};

let snapshot: TopBannerSnapshot = {
  topBanner: createDefaultTopBanner(),
  hydrated: false,
};
const listeners = new Set<() => void>();

/** Applique une mutation puis notifie les abonnés. */
export function setTopBanner(
  updater: (previous: TopBanner) => TopBanner
): void {
  snapshot = { topBanner: updater(snapshot.topBanner), hydrated: true };
  for (const listener of listeners) {
    listener();
  }
}

/** Hydrate le store depuis un état chargé côté serveur (une fois par session). */
export function hydrateTopBanner(value: TopBanner): void {
  snapshot = { topBanner: normalizeTopBanner(value), hydrated: true };
  for (const listener of listeners) {
    listener();
  }
}

export function getTopBannerSnapshot(): TopBannerSnapshot {
  return snapshot;
}

/** Snapshot serveur (SSR/hydratation) — requis par `useSyncExternalStore`. */
export function getTopBannerServerSnapshot(): TopBannerSnapshot {
  return snapshot;
}

/** Abonnement au store. */
export function subscribeTopBanner(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Hook client : expose la configuration courante + `update(patch)`. */
export function useTopBanner(): {
  topBanner: TopBanner;
  update: (patch: Partial<TopBanner>) => void;
} {
  const current = React.useSyncExternalStore(
    subscribeTopBanner,
    getTopBannerSnapshot,
    getTopBannerServerSnapshot
  );
  const update = React.useCallback((patch: Partial<TopBanner>) => {
    setTopBanner((previous) => ({ ...previous, ...patch }));
  }, []);
  return { topBanner: current.topBanner, update };
}

/**
 * Hook du **chrome public** : rend la valeur serveur (`fallback`) tant que le
 * store n'est pas hydraté, puis la valeur du store.
 *
 * Pourquoi ce détour : le store est un singleton de module, hydraté côté client
 * après montage (comme tous les stores du projet). Un chrome qui lirait le store
 * d'emblée rendrait les défauts au premier rendu et ferait apparaître le bandeau
 * **après** le montage — le contenu sauterait de sa hauteur. En servant le
 * `getServerSnapshot` sur la valeur initiale, le HTML SSR contient déjà le
 * bandeau, l'hydratation lit la même valeur (aucun mismatch, aucun flash), et
 * une fois le store hydraté il prend le relais (les modifications de l'admin
 * restent visibles dans la même session).
 */
export function useTopBannerWithFallback(fallback?: TopBanner): TopBanner {
  const initial = React.useMemo(
    () => fallback ?? createDefaultTopBanner(),
    [fallback]
  );
  const getSnapshot = React.useCallback(() => {
    const current = getTopBannerSnapshot();
    return current.hydrated ? current.topBanner : initial;
  }, [initial]);
  const getServerSnapshot = React.useCallback(() => initial, [initial]);
  return React.useSyncExternalStore(
    subscribeTopBanner,
    getSnapshot,
    getServerSnapshot
  );
}
