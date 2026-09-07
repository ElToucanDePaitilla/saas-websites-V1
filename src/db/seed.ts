/**
 * ============================================================================
 * SEED INITIAL — Volet 2 (Portfolio Photographe), Étape 5.1
 * ----------------------------------------------------------------------------
 * Injecte dans PostgreSQL (Supabase) le jeu de données aujourd'hui mock en
 * mémoire, en réutilisant les helpers métier comme **source unique** du contenu
 * (`../lib/pages.ts` : `seedPages`, `buildSeedModules`, `pageHref`) :
 *
 *   1. reset **idempotent** du tenant de démo (id fixe) — la suppression du
 *      profil cascade sur pages / modules / navigation (FK ON DELETE CASCADE) ;
 *   2. `profiles`  : profil « Photographe Démo » ;
 *   3. `pages`     : les 5 pages seed (slug vide = Accueil) — UUID retournés ;
 *   4. `page_modules` : modules par défaut par page (`buildSeedModules`) avec
 *      `order_index` (1..n), `is_visible = !hidden` et `content` JSONB typé ;
 *   5. `navigation_entries` : Header (5 racines `auto` liées aux pages) +
 *      sous-menu **démo Portfolio** (3 `custom` en Niveau 2 via `parent_id`) +
 *      Footer (entrées manuelles, sans l'Accueil).
 *
 * Ids pré-générés (`crypto.randomUUID()`) pour référencer les parents Niveau 2
 * avant insertion. Exécution : `npm run db:seed` (tsx).
 * Référence : plans/ROADMAP-5.1-database-schema.md §3.2
 * ============================================================================
 */

import { eq } from "drizzle-orm";

import { buildSeedModules, pageHref, seedPages } from "../lib/pages";
import {
  DEMO_DISPLAY_NAME,
  DEMO_EMAIL,
  DEMO_PROFILE_ID,
} from "./constants";
import { getDatabase } from "./index";
import {
  navigationEntries,
  pageModules,
  pages,
  profiles,
  type NavigationEntryInsert,
} from "./schema";

/** Sous-menu de démonstration Niveau 2 sous « Portfolio » (miroir du seed 4.3). */
const PORTFOLIO_CHILDREN: ReadonlyArray<{ label: string; href: string }> = [
  { label: "Mariages", href: "/portfolio#mariages" },
  { label: "Portraits", href: "/portfolio#portraits" },
  { label: "Corporate", href: "/portfolio#corporate" },
];

async function seed(): Promise<void> {
  // Le seed exige une BDD configurée : échec explicite si DATABASE_URL absente.
  const db = getDatabase();
  await db.transaction(async (tx) => {
    // ---- 1. Reset idempotent du tenant de démo (cascade sur le reste) ----
    await tx.delete(profiles).where(eq(profiles.id, DEMO_PROFILE_ID));

    // ---- 2. Profil de démonstration ----
    await tx.insert(profiles).values({
      id: DEMO_PROFILE_ID,
      email: DEMO_EMAIL,
      displayName: DEMO_DISPLAY_NAME,
    });

    // ---- 3. Pages (slug vide = Accueil) ----
    const insertedPages = await tx
      .insert(pages)
      .values(
        seedPages.map((page) => ({
          photographerId: DEMO_PROFILE_ID,
          slug: page.slug,
          title: page.title,
          menuTitle: page.menuTitle,
          status: page.status,
          isInMenu: page.inMenu,
        }))
      )
      .returning({ id: pages.id, slug: pages.slug, menuTitle: pages.menuTitle });
    const pageBySlug = new Map(
      insertedPages.map((row) => [row.slug, row])
    );

    // ---- 4. Modules par défaut de chaque page ----
    for (const page of seedPages) {
      const pageRow = pageBySlug.get(page.slug);
      if (!pageRow) {
        throw new Error(`Seed : page introuvable pour le slug "${page.slug}".`);
      }
      const modules = buildSeedModules(page.slug);
      if (modules.length === 0) {
        continue;
      }
      await tx.insert(pageModules).values(
        modules.map((module, index) => ({
          pageId: pageRow.id,
          moduleType: module.type,
          title: module.title,
          orderIndex: index + 1,
          isVisible: !module.hidden,
          animation: module.animation,
          anchorId: module.anchorId,
          layoutVariant: module.layoutVariant ?? "default",
          content: module.content,
        }))
      );
    }

    // ---- 5. Entrées de navigation ----
    const headerRoots: NavigationEntryInsert[] = [];
    const navChildren: NavigationEntryInsert[] = [];
    let portfolioRootId: string | null = null;

    seedPages.forEach((page, index) => {
      const pageRow = pageBySlug.get(page.slug);
      if (!pageRow) {
        throw new Error(`Seed : page introuvable pour le slug "${page.slug}".`);
      }
      const rootId = crypto.randomUUID();
      headerRoots.push({
        id: rootId,
        photographerId: DEMO_PROFILE_ID,
        zone: "header",
        label: pageRow.menuTitle,
        kind: "page",
        href: pageHref(page.slug),
        hidden: false,
        auto: true,
        pageId: pageRow.id,
        parentId: null,
        position: index,
      });
      if (page.slug === "portfolio") {
        portfolioRootId = rootId;
      }
    });

    // Sous-menu de démonstration (Niveau 2 — Header uniquement).
    if (portfolioRootId !== null) {
      PORTFOLIO_CHILDREN.forEach((child, index) => {
        navChildren.push({
          id: crypto.randomUUID(),
          photographerId: DEMO_PROFILE_ID,
          zone: "header",
          label: child.label,
          kind: "custom",
          href: child.href,
          hidden: false,
          auto: false,
          pageId: null,
          parentId: portfolioRootId,
          position: index,
        });
      });
    }

    // Footer : pages vitrines sauf l'Accueil (entrées manuelles).
    const footerRoots: NavigationEntryInsert[] = seedPages
      .filter((page) => page.slug !== "")
      .map((page, index) => {
        const pageRow = pageBySlug.get(page.slug);
        if (!pageRow) {
          throw new Error(`Seed : page introuvable pour le slug "${page.slug}".`);
        }
        return {
          photographerId: DEMO_PROFILE_ID,
          zone: "footer",
          label: pageRow.menuTitle,
          kind: "page",
          href: pageHref(page.slug),
          hidden: false,
          auto: false,
          pageId: pageRow.id,
          parentId: null,
          position: index,
        };
      });

    await tx
      .insert(navigationEntries)
      .values([...headerRoots, ...navChildren, ...footerRoots]);
  });
}

seed()
  .then(() => {
    console.log("Seed OK — tenant de démo réinitialisé.");
  })
  .catch((error: unknown) => {
    console.error("Seed KO :", error);
    process.exitCode = 1;
  });
