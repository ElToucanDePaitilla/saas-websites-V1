"use client";

import * as React from "react";

import { TopBannerBar } from "@/components/layout/TopBannerBar";
import {
  topBannerTotalHeight,
  topBannerVisible,
  type TopBanner,
} from "@/lib/top-banner";
import { useTopBannerWithFallback } from "@/lib/top-banner-store";

/**
 * ============================================================================
 * CHROME PUBLIC — Mini-bandeau Alerte / Promo (au-dessus du Header)
 * ----------------------------------------------------------------------------
 * Client Component monté par le layout front-office. Il lit le store partagé,
 * gère la **fermeture de session** du bandeau et rend, autour du Header et du
 * `<main>` :
 *
 *   1. la barre `position: fixed` (`z-index: 60`, au-dessus du Header `z-50`) ;
 *   2. un **wrapper portant `--top-banner-offset`** (hauteur totale occupée).
 *
 * Le wrapper est en `display: contents` : il **n'ajoute aucun nœud de mise en
 * page**. C'est le piège central du plan — le `<body>` est `flex flex-col` et
 * `main` compte sur `flex-1` pour ancrer le Footer. Un simple `<div>` aurait
 * capté ce `flex-1` à sa place ; `display: contents` laisse Header et `main` se
 * comporter comme enfants directs, tout en transmettant les variables CSS (qui
 * s'héritent dans l'arbre DOM, pas dans l'arbre de rendu).
 *
 * La barre elle-même est déléguée à `TopBannerBar`, partagée avec l'aperçu de
 * l'écran d'édition : une seule implémentation du balisage et des variables.
 *
 * Fermeture : `sessionStorage` exposé comme **source externe** via
 * `useSyncExternalStore` — lire la mémoire dans un `useEffect` + `setState`
 * déclenchait un rendu en cascade (règle `react-hooks/set-state-in-effect`), et
 * un état initial lu pendant le rendu casserait l'hydratation. Le snapshot
 * serveur vaut `false` : le bandeau peut apparaître une frame avant la
 * vérification post-hydratation — limite assumée, sans script inline.
 *
 * La variable `--top-banner-offset` est aussi reportée sur
 * `document.documentElement` afin que `NavLink` (un simple `<a>`/`<Link>`, hors
 * du wrapper) compense les ancres sous le bandeau au moment du clic.
 * ============================================================================
 */

/** Variables CSS personnalisées posées en style inline (idiome `CardItem`). */
type CSSVars = React.CSSProperties & Record<`--${string}`, string>;

/** Source externe de l'état « fermé pour la session » (clé par photographe). */
function createDismissedStore(storageKey: string) {
  let value = false;
  let initialized = false;
  const listeners = new Set<() => void>();

  function read(): boolean {
    try {
      return window.sessionStorage.getItem(storageKey) === "1";
    } catch {
      // Stockage indisponible (navigation privée stricte) : non fermé.
      return false;
    }
  }

  return {
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    /** Valeur mémorisée : `useSyncExternalStore` exige un retour stable. */
    getSnapshot(): boolean {
      if (!initialized) {
        value = read();
        initialized = true;
      }
      return value;
    },
    getServerSnapshot(): boolean {
      return false;
    },
    dismiss() {
      value = true;
      initialized = true;
      try {
        window.sessionStorage.setItem(storageKey, "1");
      } catch {
        // La fermeture vaut pour la page courante, sans mémoire de session.
      }
      for (const listener of listeners) {
        listener();
      }
    },
  };
}

export function TopBannerChrome({
  photographerId,
  initialTopBanner,
  children,
}: {
  /** Identifiant du photographe — isolé la fermeture par tenant. */
  photographerId: string;
  /** Réglage chargé côté serveur : sert de valeur SSR avant hydratation. */
  initialTopBanner?: TopBanner;
  children: React.ReactNode;
}) {
  const topBanner = useTopBannerWithFallback(initialTopBanner);
  const store = React.useMemo(
    () => createDismissedStore(`top-banner-dismissed:${photographerId}`),
    [photographerId]
  );
  const dismissed = React.useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getServerSnapshot
  );

  const visible = topBannerVisible(topBanner) && !dismissed;
  const offset = visible ? topBannerTotalHeight(topBanner) : 0;

  // Report sur la racine du document pour `NavLink` (ancre compensée).
  React.useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--top-banner-offset", `${offset}px`);
    return () => {
      root.style.removeProperty("--top-banner-offset");
    };
  }, [offset]);

  return (
    <div
      style={
        {
          display: "contents",
          "--top-banner-offset": `${offset}px`,
        } as CSSVars
      }
    >
      {visible ? (
        <TopBannerBar topBanner={topBanner} onDismiss={store.dismiss} />
      ) : null}
      {children}
    </div>
  );
}
