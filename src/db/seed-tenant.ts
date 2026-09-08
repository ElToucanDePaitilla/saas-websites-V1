/**
 * ============================================================================
 * AMORÇAGE TENANT — pages/modules/navigation réels (Étape 5.x / correctif)
 * ----------------------------------------------------------------------------
 * Quand un tenant (photographe authentifié ou démo) n'a **aucune page** en BDD,
 * le store Back-Office se réinitialisait sur le seed mock aux ids factices
 * (`seed-home`…) → toute persistance échouait (`invalid input type uuid`).
 *
 * `ensureTenantSeeded(photographerId)` crée, si absent, des **lignes réelles**
 * (UUID générés par PostgreSQL) : profil + pages seed + modules par défaut +
 * navigation Header/Footer — réutilisant les helpers métier (`seedPages`,
 * `buildSeedModules`, `pageHref`). Idempotent (no-op si le tenant a déjà des
 * pages).
 *
 * Couche serveur, Drizzle (rôle service — bypass RLS).
 * ============================================================================
 */

import { eq } from "drizzle-orm";

import { buildSeedModules, pageHref, seedPages } from "../lib/pages";
import { getDatabase } from "./index";
import {
  navigationEntries,
  pageModules,
  pages,
  profiles,
  type NavigationEntryInsert,
  type PageModuleInsert,
} from "./schema";

/** Crée le contenu « starter » d'un tenant vide (idempotent). */
export async function ensureTenantSeeded(
  photographerId: string
): Promise<void> {
  const database = getDatabase();
  const existing = await database
    .select({ id: pages.id })
    .from(pages)
    .where(eq(pages.photographerId, photographerId))
    .limit(1);
  if (existing.length > 0) {
    return; // tenant déjà amorcé
  }

  await database.transaction(async (tx) => {
    // Profil d'ancrage (id = auth.uid() ou démo) — jamais écrasé.
    await tx
      .insert(profiles)
      .values({
        id: photographerId,
        email: `tenant-${photographerId}@placeholder`,
        displayName: "",
      })
      .onConflictDoNothing({ target: profiles.id });

    // Pages seed (UUID réels retournés).
    const insertedPages = await tx
      .insert(pages)
      .values(
        seedPages.map((page) => ({
          photographerId,
          slug: page.slug,
          title: page.title,
          menuTitle: page.menuTitle,
          status: page.status,
          isInMenu: page.inMenu,
        }))
      )
      .returning({ id: pages.id, slug: pages.slug });
    const pageIdBySlug = new Map(
      insertedPages.map((row) => [row.slug, row.id])
    );

    // Modules par défaut par page.
    for (const page of seedPages) {
      const pageId = pageIdBySlug.get(page.slug);
      if (!pageId) {
        continue;
      }
      const modules = buildSeedModules(page.slug);
      if (modules.length === 0) {
        continue;
      }
      await tx.insert(pageModules).values(
        modules.map(
          (module, index): PageModuleInsert => ({
            pageId,
            moduleType: module.type,
            title: module.title,
            orderIndex: index + 1,
            isVisible: !module.hidden,
            animation: module.animation,
            anchorId: module.anchorId,
            layoutVariant: module.layoutVariant ?? "default",
            content: module.content,
          })
        )
      );
    }

    // Navigation Header (racines auto liées aux pages) + Footer (manuelles).
    const navRows: NavigationEntryInsert[] = [];
    let portfolioRootId: string | null = null;

    seedPages.forEach((page, index) => {
      const pageId = pageIdBySlug.get(page.slug);
      if (!pageId) {
        return;
      }
      const rootId = crypto.randomUUID();
      navRows.push({
        id: rootId,
        photographerId,
        zone: "header",
        label: page.menuTitle,
        kind: "page",
        href: pageHref(page.slug),
        hidden: page.status === "draft",
        auto: true,
        pageId,
        parentId: null,
        position: index,
      });
      if (page.slug === "portfolio") {
        portfolioRootId = rootId;
      }
    });

    if (portfolioRootId) {
      const children = [
        { label: "Mariages", href: "/portfolio#mariages" },
        { label: "Portraits", href: "/portfolio#portraits" },
        { label: "Corporate", href: "/portfolio#corporate" },
      ];
      children.forEach((child, index) => {
        navRows.push({
          id: crypto.randomUUID(),
          photographerId,
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

    seedPages
      .filter((page) => page.slug !== "")
      .forEach((page, index) => {
        const pageId = pageIdBySlug.get(page.slug);
        if (!pageId) {
          return;
        }
        navRows.push({
          photographerId,
          zone: "footer",
          label: page.menuTitle,
          kind: "page",
          href: pageHref(page.slug),
          hidden: page.status === "draft",
          auto: false,
          pageId,
          parentId: null,
          position: index,
        });
      });

    if (navRows.length > 0) {
      await tx.insert(navigationEntries).values(navRows);
    }
  });
}
