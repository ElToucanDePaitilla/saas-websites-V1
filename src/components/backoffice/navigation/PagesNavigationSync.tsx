"use client";

import * as React from "react";

import { usePagesStore } from "@/components/backoffice/PagesStoreProvider";
import { pageHref, type SitePage } from "@/lib/pages";
import {
  findNavEntry,
  isPurgableOrphanNavEntry,
  type NavMenuEntry,
} from "@/lib/navigation";

import { useNavigationStore } from "./NavigationStoreProvider";

/**
 * ============================================================================
 * SYNCHRONISATION PAGES ↔ NAVIGATION (Étapes 4.2 & 4.3)
 * ----------------------------------------------------------------------------
 * Composant sans rendu (`null`) monté **sous les deux Providers** dans le
 * Layout `/admin` (`PagesStoreProvider` > `NavigationStoreProvider`). Il observe
 * les pages (source de vérité) et **réconcilie de façon idempotente** le menu.
 *
 * Étape 4.3 : le parcours du **Header devient récursif** (racine + `children`).
 * Une page rattachée (entrée `page`/`auto`) peut donc se trouver **à la racine
 * OU dans un sous-menu de Niveau 2** — la réconciliation la retrouve où qu'elle
 * soit, sans jamais créer de doublon ni réordonner. Le Footer reste plat.
 *
 * Règles (distinction **entrées auto** / **manuelles**, cf. `NavMenuEntry.auto`) :
 *   1. Une page `inMenu === true` sans entrée `pageId` **nulle part dans le
 *      Header** (racine ou sous-menu) → ajout d'une entrée **auto** à la racine
 *      (label = `menuTitle`, href = `pageHref(slug)`) ;
 *   2. Toute entrée (auto **ou** manuelle) liée à une page existante est mise à
 *      jour : `label`, `href`, et `hidden = (page.status === "draft")` (un
 *      Brouillon est masqué du menu sans être supprimé — spec §7.2-D) ;
 *   3. Une page retirée du menu (`inMenu === false`) ou disparue fait retirer
 *      **uniquement ses entrées auto du Header** — où qu'elles soient (racine
 *      ou sous-menu) — les entrées **manuelles** sont conservées ;
 *   4. **Cascade** : toute entrée (Header racine/sous-menu ET Footer, auto ou
 *      manuelle) dont la page **n'existe plus** est retirée (anti-lien orphelin).
 *
 * Garde-fous :
 *   - les liens libres (`pageId: null`) et l'**ordre** ne sont jamais modifiés ;
 *   - comparaison avant toute action → l'effet se stabilise (au plus deux
 *     passes) sans boucle Pages ↔ Navigation ;
 *   - zéro `any`, TypeScript strict.
 *
 * Références : plans/ROADMAP-4.2-pages-nav-sync.md §1.4 —
 *              plans/ROADMAP-4.3-navigation-advanced.md §1.3
 * ============================================================================
 */

function entriesEqual(
  entry: NavMenuEntry,
  page: SitePage
): { label: boolean; href: boolean; hidden: boolean } {
  return {
    label: entry.label === page.menuTitle,
    href: entry.href === pageHref(page.slug),
    hidden: entry.hidden === (page.status === "draft"),
  };
}

/** Aplatit une liste racine Header : items de Niveau 1 + leurs enfants (4.3). */
function flattenHeader(list: NavMenuEntry[]): NavMenuEntry[] {
  return list.flatMap((entry) => [entry, ...(entry.children ?? [])]);
}

export function PagesNavigationSync() {
  const { pages } = usePagesStore();
  const { getEntries, addEntry, updateEntry, removeEntry } = useNavigationStore();

  const header = getEntries("header");
  const footer = getEntries("footer");

  React.useEffect(() => {
    const pageById = new Map(pages.map((page) => [page.id, page]));

    // Aplatissement Header (racine + sous-menus) — le Footer reste plat.
    const headerEntries = flattenHeader(header);

    // ---- 1 : garantir une entrée AUTO (à la racine) pour chaque page inMenu
    //          absente de TOUT le Header (racine ou sous-menu). ----
    for (const page of pages) {
      if (!page.inMenu) {
        continue;
      }
      const alreadyInHeader = headerEntries.some(
        (entry) => entry.pageId === page.id
      );
      if (!alreadyInHeader) {
        addEntry("header", {
          kind: "page",
          label: page.menuTitle,
          href: pageHref(page.slug),
          pageId: page.id,
          auto: true,
        });
      }
    }

    // ---- 2 : maintenir label/href/hidden de TOUTES les entrées liées à une
    //          page existante (auto et manuelles, Header racine/sous-menu et
    //          Footer — cohérence MenuTitle/slug/statut). ----
    for (const entry of [...headerEntries, ...footer]) {
      if (entry.pageId === null) {
        continue; // lien libre : jamais synchronisé
      }
      const page = pageById.get(entry.pageId);
      if (!page) {
        continue; // traité au point 4 (cascade)
      }
      const equal = entriesEqual(entry, page);
      if (!equal.label || !equal.href || !equal.hidden) {
        // L'entrée appartient au Header (où qu'elle soit) sinon au Footer.
        const inHeader = findNavEntry(header, entry.id) !== undefined;
        updateEntry(inHeader ? "header" : "footer", entry.id, {
          label: page.menuTitle,
          href: pageHref(page.slug),
          hidden: page.status === "draft",
        });
      }
    }

    // ---- 3 : retirer du Header les entrées AUTO (racine OU sous-menu) dont la
    //          page quitte le menu ou n'existe plus. ----
    for (const entry of headerEntries) {
      if (!entry.auto || entry.pageId === null) {
        continue;
      }
      const page = pageById.get(entry.pageId);
      if (page === undefined || !page.inMenu) {
        removeEntry("header", entry.id);
      }
    }

    // ---- 4 : cascade — retirer les entrées liées dont la page n'existe plus
    //          (Header racine/sous-menu ET Footer, auto et manuelles). ----
    for (const entry of [...headerEntries, ...footer]) {
      if (entry.pageId === null) {
        continue;
      }
      if (!pageById.has(entry.pageId)) {
        const inHeader = findNavEntry(header, entry.id) !== undefined;
        removeEntry(inHeader ? "header" : "footer", entry.id);
      }
    }

    // ---- 5 : liens INTERNES orphelins (10.1.a) — entrées `custom` sans
    //          `pageId` ciblant un slug inexistant (ancres du seed,
    //          liens manuels morts…). Les URL externes et les ancres locales
    //          sont conservées, ainsi que les **cibles de modèles** (4.4),
    //          placeholders intentionnels « page à créer ». ----
    const slugs = new Set(pages.map((page) => page.slug));
    for (const entry of [...headerEntries, ...footer]) {
      if (isPurgableOrphanNavEntry(entry, slugs)) {
        const inHeader = findNavEntry(header, entry.id) !== undefined;
        removeEntry(inHeader ? "header" : "footer", entry.id);
      }
    }
  }, [pages, header, footer, addEntry, updateEntry, removeEntry]);

  return null;
}
