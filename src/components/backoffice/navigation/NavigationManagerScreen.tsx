"use client";

import dynamic from "next/dynamic";

/**
 * Point de montage de l'écran « Navigation & Menus » (Étape 4.3).
 * Charge `NavigationManager` — qui embarque `@hello-pangea/dnd` — **sans rendu
 * serveur** (`ssr: false`) : la bibliothèque accède au DOM et n'est pas
 * compatible avec l'hydratation SSR (évite tout `mismatch`). Un fallback
 * s'affiche pendant le chargement du module côté client.
 *
 * Référence : plans/ROADMAP-4.3-navigation-advanced.md §1.7
 */

const NavigationManager = dynamic(
  () =>
    import("./NavigationManager").then((module) => module.NavigationManager),
  {
    ssr: false,
    loading: () => (
      <div className="grid min-h-[50vh] place-items-center">
        <p className="text-sm text-muted-foreground">
          Chargement de la navigation…
        </p>
      </div>
    ),
  }
);

export function NavigationManagerScreen() {
  return <NavigationManager />;
}
