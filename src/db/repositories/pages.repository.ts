/**
 * ============================================================================
 * REPOSITORY PAGES — lecture BDD (Étape 5.2)
 * ----------------------------------------------------------------------------
 * Charge les pages et leurs modules depuis PostgreSQL (Drizzle) et les mappe
 * vers le **domaine** (`SitePage` / `PageModule`, src/lib/pages.ts) pour
 * hydrater `PagesStoreProvider` (`initialData`).
 *
 * Mappers étanches BDD → domaine :
 *   - `is_in_menu` → `inMenu` ; `status` aligné sur `PageStatus` ;
 *   - `is_visible` (inverse du Toggle Eye) → `hidden = !is_visible` ;
 *   - `order_index` → ordre du tableau ; `content` JSONB typé `ModuleContent`.
 *
 * Cette couche est **purement serveur** (jamais importée par un Client
 * Component). Les erreurs de connexion sont laissées remonter : le loader
 * `src/db/load-initial-data.ts` les attrape pour basculer sur le seed en
 * mémoire (fallback gracieux hors-BDD).
 *
 * Référence : plans/ROADMAP-5.2-ssr-db-hydration.md §2.A
 * ============================================================================
 */

import { asc, eq, inArray } from "drizzle-orm";

import type { ModuleContent, PageModule, SitePage } from "../../lib/pages";
import { getDatabase } from "../index";
import { pageModules, pages } from "../schema";

/** Données de pages prêtes pour l'hydratation du store Pages. */
export interface PagesWithModules {
  pages: SitePage[];
  modulesByPage: Record<string, PageModule[]>;
}

/** Mappe une ligne `pages` vers le domaine `SitePage`. */
function toSitePage(row: typeof pages.$inferSelect): SitePage {
  return {
    id: row.id,
    title: row.title,
    menuTitle: row.menuTitle,
    slug: row.slug,
    status: row.status,
    inMenu: row.isInMenu,
    updatedAt: row.updatedAt.toISOString(),
  };
}

/** Mappe une ligne `page_modules` vers le domaine `PageModule`. */
function toPageModule(row: typeof pageModules.$inferSelect): PageModule {
  return {
    id: row.id,
    type: row.moduleType,
    title: row.title,
    hidden: !row.isVisible,
    animation: row.animation,
    anchorId: row.anchorId,
    layoutVariant: row.layoutVariant,
    content: row.content,
  };
}

/**
 * Charge les pages d'un photographe et leurs modules ordonnés.
 * Retourne des listes vides si le tenant n'a aucune donnée (le loader décidera
 * alors de basculer sur le seed en mémoire).
 */
export async function getPagesWithModules(
  photographerId: string
): Promise<PagesWithModules> {
  const database = getDatabase();

  const pageRows = await database
    .select()
    .from(pages)
    .where(eq(pages.photographerId, photographerId))
    .orderBy(asc(pages.createdAt));

  if (pageRows.length === 0) {
    return { pages: [], modulesByPage: {} };
  }

  const pageIds = pageRows.map((row) => row.id);
  const moduleRows = await database
    .select()
    .from(pageModules)
    .where(inArray(pageModules.pageId, pageIds))
    .orderBy(asc(pageModules.orderIndex));

  const modulesByPage: Record<string, PageModule[]> = {};
  for (const row of pageRows) {
    modulesByPage[row.id] = [];
  }
  for (const row of moduleRows) {
    modulesByPage[row.pageId]?.push(toPageModule(row));
  }

  return {
    pages: pageRows.map(toSitePage),
    modulesByPage,
  };
}

/* --------------------------------------------------------------------------
   ÉCRITURES (Étape 5.3 — persistance CRUD)
   -------------------------------------------------------------------------- */

/** Crée une page (id explicite — conservé du store client). */
export async function createPage(
  photographerId: string,
  page: {
    id: string;
    title: string;
    menuTitle: string;
    slug: string;
    status: SitePage["status"];
    inMenu: boolean;
  }
): Promise<void> {
  const database = getDatabase();
  await database.insert(pages).values({
    id: page.id,
    photographerId,
    slug: page.slug,
    title: page.title,
    menuTitle: page.menuTitle,
    status: page.status,
    isInMenu: page.inMenu,
  });
}

/** Met à jour les métadonnées d'une page. */
export async function updatePage(
  pageId: string,
  page: {
    title: string;
    menuTitle: string;
    slug: string;
    status: SitePage["status"];
    inMenu: boolean;
  }
): Promise<void> {
  const database = getDatabase();
  await database
    .update(pages)
    .set({
      slug: page.slug,
      title: page.title,
      menuTitle: page.menuTitle,
      status: page.status,
      isInMenu: page.inMenu,
      updatedAt: new Date(),
    })
    .where(eq(pages.id, pageId));
}

/** Supprime une page (cascade modules + navigation liée via les FK). */
export async function deletePage(pageId: string): Promise<void> {
  const database = getDatabase();
  await database.delete(pages).where(eq(pages.id, pageId));
}

/**
 * Remplace la liste complète (ordonnée) des modules d'une page en une
 * transaction : suppression puis réinsertion avec les ids préservés — couvre
 * ajout, suppression, réordonnancement, masquage et édition.
 */
export async function updateModules(
  pageId: string,
  modules: Array<{
    id: string;
    type: PageModule["type"];
    title: string;
    hidden: boolean;
    animation: PageModule["animation"];
    anchorId: string;
    layoutVariant?: string;
    content: unknown;
  }>
): Promise<void> {
  const database = getDatabase();
  await database.transaction(async (tx) => {
    await tx.delete(pageModules).where(eq(pageModules.pageId, pageId));
    if (modules.length === 0) {
      return;
    }
    await tx.insert(pageModules).values(
      modules.map((module, index) => ({
        id: module.id,
        pageId,
        moduleType: module.type,
        title: module.title,
        orderIndex: index + 1,
        isVisible: !module.hidden,
        animation: module.animation,
        anchorId: module.anchorId,
        layoutVariant: module.layoutVariant ?? "default",
        // Le contenu JSONB est validé/typé par le domaine ; à la frontière API
        // il reste `unknown` (zod) — resserré ici vers le type de la colonne.
        content: module.content as ModuleContent,
      }))
    );
  });
}
