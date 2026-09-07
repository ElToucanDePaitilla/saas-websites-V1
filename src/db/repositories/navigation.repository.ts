/**
 * ============================================================================
 * REPOSITORY NAVIGATION — lecture BDD (Étape 5.2)
 * ----------------------------------------------------------------------------
 * Charge les entrées de navigation (Header Niveau 1 + Niveau 2, Footer) depuis
 * PostgreSQL (Drizzle) et les **reconstitue en arborescence** `SiteNavigation`
 * (`NavMenuEntry[]` avec `children`), prêtes pour hydrater
 * `NavigationStoreProvider` (`initialData`).
 *
 * La table `navigation_entries` est **plate** (auto-jointure `parent_id`) :
 *   - racines = `parent_id IS NULL` (tri `position`) ;
 *   - enfants Niveau 2 = lignes dont `parent_id` pointe vers une racine
 *     (tri `position` dans la liste du parent) — Header uniquement ;
 *   - le Footer est plat (aucun enfant en pratique, règle applicative 4.3).
 *
 * Couche **purement serveur**. Les erreurs de connexion remontent et sont
 * attrapées par le loader `src/db/load-initial-data.ts` (fallback seed).
 *
 * Référence : plans/ROADMAP-5.2-ssr-db-hydration.md §2.A
 * ============================================================================
 */

import { and, asc, eq } from "drizzle-orm";

import {
  resolveNavPreset,
  type NavArea,
  type NavMenuEntry,
  type NavPresetId,
  type SiteNavigation,
} from "../../lib/navigation";
import { getDatabase } from "../index";
import {
  navigationEntries,
  pages,
  type NavigationEntryInsert,
} from "../schema";
import { getPagesWithModules } from "./pages.repository";

type NavigationRow = typeof navigationEntries.$inferSelect;

/** Mappe une ligne `navigation_entries` vers le domaine `NavMenuEntry`. */
function toNavEntry(row: NavigationRow): NavMenuEntry {
  return {
    id: row.id,
    label: row.label,
    kind: row.kind,
    href: row.href,
    hidden: row.hidden,
    pageId: row.pageId,
    auto: row.auto,
  };
}

/** Construit la liste racine d'une zone, enfants Niveau 2 rattachés. */
function buildZoneEntries(
  rows: NavigationRow[],
  zone: NavArea,
  childrenByParent: Map<string, NavigationRow[]>
): NavMenuEntry[] {
  return rows
    .filter((row) => row.zone === zone && row.parentId === null)
    .sort((a, b) => a.position - b.position)
    .map((root) => {
      const entry = toNavEntry(root);
      const childRows = (childrenByParent.get(root.id) ?? [])
        .slice()
        .sort((a, b) => a.position - b.position);
      if (childRows.length > 0) {
        entry.children = childRows.map(toNavEntry);
      }
      return entry;
    });
}

/**
 * Charge la navigation complète d'un photographe (Header + Footer).
 * Retourne des listes vides si le tenant n'a aucune entrée (le loader décidera
 * alors de basculer sur le seed en mémoire).
 */
export async function getNavigation(
  photographerId: string
): Promise<SiteNavigation> {
  const database = getDatabase();

  const rows = await database
    .select()
    .from(navigationEntries)
    .where(eq(navigationEntries.photographerId, photographerId))
    .orderBy(asc(navigationEntries.position));

  const childrenByParent = new Map<string, NavigationRow[]>();
  for (const row of rows) {
    if (row.parentId !== null) {
      const siblings = childrenByParent.get(row.parentId) ?? [];
      siblings.push(row);
      childrenByParent.set(row.parentId, siblings);
    }
  }

  return {
    header: buildZoneEntries(rows, "header", childrenByParent),
    footer: buildZoneEntries(rows, "footer", childrenByParent),
  };
}

/* --------------------------------------------------------------------------
   ÉCRITURES (Étape 5.3 — persistance CRUD)
   -------------------------------------------------------------------------- */

/** Aplatit la navigation en lignes plates (racines + enfants Niveau 2). */
function flattenNavigation(
  photographerId: string,
  navigation: SiteNavigation
): NavigationEntryInsert[] {
  const rows: NavigationEntryInsert[] = [];
  const zones: Array<[NavArea, NavMenuEntry[]]> = [
    ["header", navigation.header],
    ["footer", navigation.footer],
  ];
  for (const [zone, entries] of zones) {
    entries.forEach((root, rootIndex) => {
      rows.push({
        id: root.id,
        photographerId,
        zone,
        label: root.label,
        kind: root.kind,
        href: root.href,
        hidden: root.hidden,
        auto: root.auto,
        pageId: root.pageId,
        parentId: null,
        position: rootIndex,
      });
      (root.children ?? []).forEach((child, childIndex) => {
        rows.push({
          id: child.id,
          photographerId,
          zone,
          label: child.label,
          kind: child.kind,
          href: child.href,
          hidden: child.hidden,
          auto: child.auto,
          pageId: child.pageId,
          parentId: root.id,
          position: childIndex,
        });
      });
    });
  }
  return rows;
}

/** Remplace la navigation Header/Footer complète en une transaction. */
export async function saveNavigation(
  photographerId: string,
  navigation: SiteNavigation
): Promise<void> {
  const database = getDatabase();
  await database.transaction(async (tx) => {
    await tx
      .delete(navigationEntries)
      .where(eq(navigationEntries.photographerId, photographerId));
    const rows = flattenNavigation(photographerId, navigation);
    if (rows.length > 0) {
      await tx.insert(navigationEntries).values(rows);
    }
  });
}

/**
 * Applique un **Preset Onboarding** de manière atomique côté serveur :
 *   1. lit les pages du photographe (domaine) ;
 *   2. résout la structure du preset (`resolveNavPreset`, helper pur 4.4) ;
 *   3. met à jour `is_in_menu` des pages concernées ;
 *   4. remplace le **Header** (le Footer est laissé intact).
 */
export async function applyPreset(
  photographerId: string,
  presetId: NavPresetId
): Promise<void> {
  const database = getDatabase();
  const { pages: sitePages } = await getPagesWithModules(photographerId);
  const resolved = resolveNavPreset(presetId, sitePages);

  await database.transaction(async (tx) => {
    for (const page of sitePages) {
      const next = resolved.inMenuByPageSlug[page.slug] === true;
      if (page.inMenu !== next) {
        await tx
          .update(pages)
          .set({ isInMenu: next, updatedAt: new Date() })
          .where(eq(pages.id, page.id));
      }
    }
    await tx.delete(navigationEntries).where(
      and(
        eq(navigationEntries.photographerId, photographerId),
        eq(navigationEntries.zone, "header")
      )
    );
    const headerRows: NavigationEntryInsert[] = [];
    resolved.header.forEach((root, rootIndex) => {
      headerRows.push({
        id: root.id,
        photographerId,
        zone: "header",
        label: root.label,
        kind: root.kind,
        href: root.href,
        hidden: root.hidden,
        auto: root.auto,
        pageId: root.pageId,
        parentId: null,
        position: rootIndex,
      });
      (root.children ?? []).forEach((child, childIndex) => {
        headerRows.push({
          id: child.id,
          photographerId,
          zone: "header",
          label: child.label,
          kind: child.kind,
          href: child.href,
          hidden: child.hidden,
          auto: child.auto,
          pageId: child.pageId,
          parentId: root.id,
          position: childIndex,
        });
      });
    });
    if (headerRows.length > 0) {
      await tx.insert(navigationEntries).values(headerRows);
    }
  });
}
