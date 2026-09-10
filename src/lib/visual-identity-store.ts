"use client";

import * as React from "react";

import {
  DEFAULT_VISUAL_IDENTITY,
  normalizeVisualIdentity,
  type VisualIdentity,
} from "./visual-identity";

/**
 * ============================================================================
 * STORE PARTAGÉ — « Identité visuelle / Logo » (Étape 9.1)
 * ----------------------------------------------------------------------------
 * Singleton au niveau module (même pattern que `owner-profile`) consommé par
 * `useVisualIdentity()`. Le domaine pur (types/constantes/normalisation) vit
 * dans `visual-identity.ts` (importable côté serveur).
 * ============================================================================
 */

/** État partagé du module. */
export type VisualIdentitySnapshot = { visualIdentity: VisualIdentity };

let snapshot: VisualIdentitySnapshot = {
  visualIdentity: DEFAULT_VISUAL_IDENTITY,
};
const listeners = new Set<() => void>();

/** Applique une mutation puis notifie les abonnés. */
export function setVisualIdentity(
  updater: (previous: VisualIdentity) => VisualIdentity
): void {
  snapshot = { visualIdentity: updater(snapshot.visualIdentity) };
  for (const listener of listeners) {
    listener();
  }
}

/** Hydrate le store depuis un état chargé côté serveur (une fois par session). */
export function hydrateVisualIdentity(value: VisualIdentity): void {
  snapshot = { visualIdentity: normalizeVisualIdentity(value) };
  for (const listener of listeners) {
    listener();
  }
}

export function getVisualIdentitySnapshot(): VisualIdentitySnapshot {
  return snapshot;
}

/** Snapshot serveur (SSR/hydratation) — requis par `useSyncExternalStore`. */
export function getVisualIdentityServerSnapshot(): VisualIdentitySnapshot {
  return snapshot;
}

/** Abonnement au store. */
export function subscribeVisualIdentity(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Hook client : expose la configuration courante + `update(patch)`. */
export function useVisualIdentity(): {
  visualIdentity: VisualIdentity;
  update: (patch: Partial<VisualIdentity>) => void;
} {
  const current = React.useSyncExternalStore(
    subscribeVisualIdentity,
    getVisualIdentitySnapshot,
    getVisualIdentityServerSnapshot
  );
  const update = React.useCallback((patch: Partial<VisualIdentity>) => {
    setVisualIdentity((previous) => ({ ...previous, ...patch }));
  }, []);
  return { visualIdentity: current.visualIdentity, update };
}
