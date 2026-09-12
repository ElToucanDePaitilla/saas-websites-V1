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
  isPurgableOrphanNavEntry,
  resolveNavPreset,
  type NavArea,
  type NavMenuEntry,
  type NavPresetId,
  type SiteNavigation,
} from "../../lib/navigation";
import { pageHref } from "../../lib/pages";
import { getDatabase } from "../index";
import {
  navigationEntries,
  pages,
  type NavigationEntryInsert,
} from "../schema";
import { getPagesWithModules, listPageSlugs } from "./pages.repository";

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
 * Déduplique les lignes de navigation (doublons accumulés en BDD) :
 * une seule entrée conservée par (zone, parent, page_id OU href), en gardant la
 * première occurrence (position la plus faible). Les enfants dont le parent
 * a été retiré (doublon) sont eux-mêmes retirés (anti-orphelins).
 */
function dedupeNavigationRows(rows: NavigationRow[]): NavigationRow[] {
  const firstByKey = new Map<string, NavigationRow>();

  // Tri stable pour choisir « la première » : zone → racines d'abord → position.
  const sorted = rows.slice().sort((a, b) => {
    if (a.zone !== b.zone) {
      return a.zone.localeCompare(b.zone);
    }
    const aRoot = a.parentId === null ? 0 : 1;
    const bRoot = b.parentId === null ? 0 : 1;
    if (aRoot !== bRoot) {
      return aRoot - bRoot;
    }
    return a.position - b.position;
  });

  for (const row of sorted) {
    const pageKey =
      row.pageId !== null ? `page:${row.pageId}` : `href:${row.href}`;
    const key = `${row.zone}|${row.parentId ?? "root"}|${pageKey}`;
    if (!firstByKey.has(key)) {
      firstByKey.set(key, row);
    }
  }

  const kept = rows.filter((row) => {
    const pageKey =
      row.pageId !== null ? `page:${row.pageId}` : `href:${row.href}`;
    const key = `${row.zone}|${row.parentId ?? "root"}|${pageKey}`;
    return firstByKey.get(key) === row;
  });

  // Retire les enfants dont le parent a été supprimé en doublon.
  const rootIds = new Set(
    kept.filter((row) => row.parentId === null).map((row) => row.id)
  );
  return kept.filter(
    (row) => row.parentId === null || rootIds.has(row.parentId)
  );
}

/**
 * Charge la navigation complète d'un photographe (Header + Footer).
 * Retourne des listes vides si le tenant n'a aucune entrée (le loader décidera
 * alors de basculer sur le seed en mémoire). Déduplique les éventuels doublons
 * accumulés en BDD (voir `dedupeNavigationRows`).
 */
export async function getNavigation(
  photographerId: string
): Promise<SiteNavigation> {
  const database = getDatabase();

  const rawRows = await database
    .select()
    .from(navigationEntries)
    .where(eq(navigationEntries.photographerId, photographerId))
    .orderBy(asc(navigationEntries.position));

  const rows = dedupeNavigationRows(rawRows);

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

/**
 * Purge les **liens de navigation orphelins** (Étape 10.1.a) : entrées sans
 * `pageId` (liens libres) dont le `href` cible un slug interne qui n'existe
 * plus. Les entrées rattachées à une page sont déjà nettoyées par la FK
 * `ON DELETE CASCADE` ; ce nettoyage couvre les entrées `custom` (ancres du
 * seed, liens manuels morts…).
 *
 * Les **cibles de modèles** (Étape 4.4) sont **préservées** : ce sont des
 * placeholders intentionnels (« page à créer ») — sans quoi appliquer un
 * modèle sur un site vierge serait aussitôt annulé (cf.
 * `isPurgableOrphanNavEntry`).
 *
 * Retourne le nombre d'entrées supprimées (0 → aucune écriture).
 * À n'appeler que lorsque le site est **vide** (0 page) pour ne jamais
 * supprimer un placeholder volontaire d'un site en construction.
 */
export async function pruneOrphanNavigation(
  photographerId: string
): Promise<number> {
  const [navigation, slugs] = await Promise.all([
    getNavigation(photographerId),
    listPageSlugs(photographerId),
  ]);
  if (navigation.header.length === 0 && navigation.footer.length === 0) {
    return 0;
  }
  const slugSet = new Set(slugs);
  let removed = 0;

  // Header (racine + sous-menu Niveau 2) : un parent retiré emporte ses enfants.
  const filterHeader = (entries: NavMenuEntry[]): NavMenuEntry[] =>
    entries
      .filter((entry) => {
        if (isPurgableOrphanNavEntry(entry, slugSet)) {
          removed += 1;
          return false;
        }
        return true;
      })
      .map((entry) => ({
        ...entry,
        children: entry.children ? filterHeader(entry.children) : entry.children,
      }));

  const header = filterHeader(navigation.header);
  const footer = navigation.footer.filter((entry) => {
    if (isPurgableOrphanNavEntry(entry, slugSet)) {
      removed += 1;
      return false;
    }
    return true;
  });

  if (removed === 0) {
    return 0;
  }
  await saveNavigation(photographerId, { header, footer });
  return removed;
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

/** true si la chaîne est un UUID PostgreSQL valide. */
function isUuid(value: string): boolean {
  return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(
    value
  );
}

/**
 * Réconcilie les `page_id` avant persistance : le store peut encore porter des
 * ids **mock** non-UUID (`seed-home`, …) quand le tenant n'a pas (encore) de
 * navigation en BDD. Règles :
 *   - `page_id` UUID valide **appartenant au tenant** → conservé ;
 *   - sinon entrée `page` → résolu par `href` vers la vraie page (si existante) ;
 *   - sinon → `null` (lien conservé, sans FK cassée).
 */
function reconcileNavigation(
  navigation: SiteNavigation,
  pageIds: Set<string>,
  pageByHref: Map<string, string>
): SiteNavigation {
  function reconcileEntry(entry: NavMenuEntry): NavMenuEntry {
    const children =
      entry.children?.map((child) => reconcileEntry(child)) ?? [];
    let pageId: string | null = entry.pageId ?? null;
    if (pageId !== null && isUuid(pageId) && pageIds.has(pageId)) {
      // OK : id réel du tenant.
    } else if (entry.kind === "page") {
      pageId = pageByHref.get(entry.href) ?? null;
    } else {
      pageId = null;
    }
    return { ...entry, pageId, children };
  }
  return {
    header: navigation.header.map(reconcileEntry),
    footer: navigation.footer.map(reconcileEntry),
  };
}

/** Remplace la navigation Header/Footer complète en une transaction. */
export async function saveNavigation(
  photographerId: string,
  navigation: SiteNavigation
): Promise<void> {
  const database = getDatabase();
  const { pages } = await getPagesWithModules(photographerId);
  const pageIds = new Set(pages.map((page) => page.id));
  const pageByHref = new Map(
    pages.map((page) => [pageHref(page.slug), page.id])
  );
  const normalized = reconcileNavigation(navigation, pageIds, pageByHref);

  await database.transaction(async (tx) => {
    await tx
      .delete(navigationEntries)
      .where(eq(navigationEntries.photographerId, photographerId));
    const rows = flattenNavigation(photographerId, normalized);
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
