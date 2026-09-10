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

import { and, asc, eq, inArray } from "drizzle-orm";

import {
  demotedHomeSlug,
  type ModuleContent,
  type PageModule,
  type SitePage,
} from "../../lib/pages";
import { ensurePhotographerProfile } from "../../lib/supabase/session";
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
    isHome: row.isHome,
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
  // Étape 10.1 : la ligne `profiles` (ancre FK) n'est plus garantie par
  // l'auto-seed — on l'assure à la demande avant toute écriture (mode démo).
  await ensurePhotographerProfile(photographerId, null);
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
 * Slugs de toutes les pages d'un photographe (select léger) — utilisé par la
 * purge des liens de navigation orphelins (Étape 10.1.a).
 */
export async function listPageSlugs(photographerId: string): Promise<string[]> {
  const database = getDatabase();
  const rows = await database
    .select({ slug: pages.slug })
    .from(pages)
    .where(eq(pages.photographerId, photographerId));
  return rows.map((row) => row.slug);
}

/** Page d'accueil du photographe (Étape 10.1) — `null` si non définie. */
export async function getHomePage(
  photographerId: string
): Promise<SitePage | null> {
  const database = getDatabase();
  const rows = await database
    .select()
    .from(pages)
    .where(
      and(eq(pages.photographerId, photographerId), eq(pages.isHome, true))
    )
    .limit(1);
  const row = rows[0];
  return row ? toSitePage(row) : null;
}

/**
 * Désigne la page d'accueil (Étape 10.1) — **transaction** :
 *  1. l'ancien accueil est démasqué et son slug vide est libéré (renommé) ;
 *  2. la page cible devient `is_home = true` avec le slug canonique `""`.
 */
export async function setHomePage(
  photographerId: string,
  pageId: string
): Promise<void> {
  await ensurePhotographerProfile(photographerId, null);
  const database = getDatabase();
  await database.transaction(async (tx) => {
    const currentRows = await tx
      .select({ id: pages.id })
      .from(pages)
      .where(
        and(eq(pages.photographerId, photographerId), eq(pages.isHome, true))
      )
      .limit(1);
    const currentHome = currentRows[0];
    if (currentHome && currentHome.id !== pageId) {
      await tx
        .update(pages)
        .set({
          isHome: false,
          // Libère le slug vide (unique par photographe) avant la promotion.
          slug: demotedHomeSlug(currentHome.id),
          updatedAt: new Date(),
        })
        .where(eq(pages.id, currentHome.id));
    }
    await tx
      .update(pages)
      .set({ isHome: true, slug: "", updatedAt: new Date() })
      .where(and(eq(pages.id, pageId), eq(pages.photographerId, photographerId)));
  });
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
