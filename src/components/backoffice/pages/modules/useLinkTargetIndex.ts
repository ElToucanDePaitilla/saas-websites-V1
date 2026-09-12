"use client";

import * as React from "react";

import { usePagesStore } from "@/components/backoffice/PagesStoreProvider";
import {
  collectAnchorTargets,
  collectPageTargets,
  type LinkTargetIndex,
} from "@/lib/link-targets";
import type { PageModule } from "@/lib/pages";

import { useCurrentPage } from "../CurrentPageContext";

/**
 * ============================================================================
 * INDEX DES CIBLES DE LIEN — hook partagé (Étape 11.21-D3)
 * ----------------------------------------------------------------------------
 * Construit **une seule fois** l'index des destinations connues (pages du site +
 * sections de toutes les pages) à partir des données déjà chargées par le store.
 *
 * Pourquoi un hook ? `LinkTargetField` recalculait auparavant cet index **à
 * chaque instance** (parcours de toutes les pages et de tous leurs modules). Sur
 * un éditeur qui rend un contrôle **par diapositive** — le slider — cela
 * produisait N parcours complets (défaut B de l'audit). En centralisant le calcul
 * ici, un éditeur calcule l'index **une fois** puis le passe aux N contrôles
 * (prop `index` optionnelle de `LinkTargetField` / `LinkTargetSelect`).
 *
 * Propriétés : purement dérivé, sans mutation, sans effet de bord, sans accès
 * réseau. Le `useMemo` se recalcule uniquement quand les pages, leurs modules ou
 * la page en cours d'édition changent.
 *
 * Hors `CurrentPageProvider`, `useCurrentPage()` retourne `{ pageId: null }` :
 * toutes les sections sont alors résolues en chemin absolu (`/slug#ancre`), ce
 * qui autorise la réutilisation hors édition de page.
 * ============================================================================
 */

/**
 * Index des cibles connues.
 *
 * `provided` permet à un consommateur qui possède **déjà** l'index de le
 * réutiliser : le calcul est alors court-circuité, aucun parcours de pages n'est
 * effectué. Le paramètre reste **optionnel** afin de respecter les règles des
 * hooks — le hook est toujours appelé, seul le travail est évité.
 */
export function useLinkTargetIndex(
  provided?: LinkTargetIndex
): LinkTargetIndex {
  const { pages, getModules } = usePagesStore();
  const { pageId: currentPageId } = useCurrentPage();

  return React.useMemo<LinkTargetIndex>(() => {
    if (provided !== undefined) {
      return provided;
    }
    // Modules indexés par page — `collectAnchorTargets` lit ce dictionnaire.
    const modulesByPage: Record<string, PageModule[]> = {};
    for (const page of pages) {
      modulesByPage[page.id] = getModules(page.id);
    }
    return {
      pages: collectPageTargets(pages),
      anchors: collectAnchorTargets(pages, modulesByPage, currentPageId),
    };
  }, [provided, pages, getModules, currentPageId]);
}
