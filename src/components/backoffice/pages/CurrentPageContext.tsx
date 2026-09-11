"use client";

import * as React from "react";

/**
 * ============================================================================
 * CONTEXTE « PAGE EN COURS D'ÉDITION » (Étape 11.2)
 * ----------------------------------------------------------------------------
 * Le sélecteur de lien du CTA ([`LinkTargetField`](../pages/modules/LinkTargetField.tsx))
 * doit distinguer une **section de la page courante** (`#ancre`) d'une **section
 * d'une autre page** (`/slug#ancre`).
 *
 * Or cette information n'est pas disponible dans la chaîne d'éditeurs :
 *   `PageEditor(pageId)` → `ModuleDndList(pageId)` → `ModuleRow(✗)`
 *   → `ModuleContentEditor(✗)` → `ModuleGalleryEditor(✗)` → `GalleryCtaPanel(✗)`
 *
 * Propager `pageId` sur quatre niveaux de props serait coûteux et fragile à
 * chaque refonte d'éditeur : un contexte local, posé par `ModuleDndList` (qui
 * possède déjà `pageId`), supprime tout prop drilling.
 *
 * **Hors Provider, `useCurrentPage()` retourne `{ pageId: null }`** au lieu de
 * lever une erreur : le champ de lien reste utilisable (toutes les ancres sont
 * alors produites en chemin absolu), ce qui autorise sa réutilisation future
 * ailleurs (ex. CTA de la rubrique Héro) sans contrainte d'imbrication.
 *
 * Référence : plans/ROADMAP-11.16-galleries-albums-cta-linkpicker.md §2.1 (D-7)
 * ============================================================================
 */

export type CurrentPageValue = {
  /** Identifiant de la page éditée — `null` hors contexte d'édition de page. */
  pageId: string | null;
};

/** Valeur de repli stable (référence constante : jamais de re-rendu parasite). */
const NO_CURRENT_PAGE: CurrentPageValue = Object.freeze({ pageId: null });

const CurrentPageContext = React.createContext<CurrentPageValue | undefined>(
  undefined
);

export function CurrentPageProvider({
  pageId,
  children,
}: {
  /** Identifiant de la page en cours d'édition. */
  pageId: string;
  children: React.ReactNode;
}) {
  const value = React.useMemo<CurrentPageValue>(() => ({ pageId }), [pageId]);
  return (
    <CurrentPageContext.Provider value={value}>
      {children}
    </CurrentPageContext.Provider>
  );
}

/**
 * Page en cours d'édition. Retourne `{ pageId: null }` hors Provider (aucune
 * exception) — les cibles sont alors toutes résolues en chemin absolu.
 */
export function useCurrentPage(): CurrentPageValue {
  return React.useContext(CurrentPageContext) ?? NO_CURRENT_PAGE;
}
