/**
 * ============================================================================
 * PAGE PUBLIQUE — résolution serveur (Étape 6.3)
 * ----------------------------------------------------------------------------
 * `getPublicPage(slug)` charge une page **publiée** et ses modules ordonnés
 * pour le rendu Front-Office `/[slug]` et `/` :
 *   1. BDD (tenant démo) via `getPagesWithModules` → filtre `published` ;
 *   2. sinon **fallback seed** (`seedPages`/`buildSeedModules`) ;
 *   3. résolution **EXIF/blur** des images (`resolveMediaMetaByUrls`).
 * Retourne `null` pour un slug inconnu ou une page brouillon (→ `notFound()`).
 * Helpers SEO : description (1er module texte) + image OG.
 * ============================================================================
 */

import { getPagesWithModules } from "@/db/repositories/pages.repository";
import { resolvePublicPhotographerId } from "@/lib/supabase/session";
import { buildSeedModules, seedPages, type PageModule } from "./pages";
import {
  resolveMediaMetaByUrls,
  type ResolvedMediaMeta,
} from "./media-resolve";

export interface PublicPage {
  slug: string;
  title: string;
  menuTitle: string;
  modules: PageModule[];
  exifByUrl: Record<string, ResolvedMediaMeta>;
}

/** Collecte les URLs d'images portées par des modules (hero/about/gallery). */
function collectImageUrls(modules: PageModule[]): string[] {
  const urls: string[] = [];
  for (const mod of modules) {
    if (mod.content.type === "hero" && mod.content.media.url) {
      urls.push(mod.content.media.url);
    }
    if (mod.content.type === "about" && mod.content.media.url) {
      urls.push(mod.content.media.url);
    }
    if (mod.content.type === "gallery") {
      for (const image of mod.content.images) {
        if (image.url) urls.push(image.url);
      }
    }
  }
  return urls;
}

/** Description SEO : 1er texte de module (about/services/hero/cta/contact). */
export function publicDescription(modules: PageModule[]): string {
  for (const mod of modules) {
    const content = mod.content;
    if (content.type === "about" && content.text.trim()) {
      return content.text;
    }
    if (content.type === "services" && content.intro.trim()) {
      return content.intro;
    }
    if (content.type === "hero" && content.subheading.trim()) {
      return content.subheading;
    }
    if (content.type === "cta-banner" && content.subheading.trim()) {
      return content.subheading;
    }
  }
  return "Portfolio photographe professionnel.";
}

/** Image OpenGraph : 1re image hero/about/galerie. */
export function publicOgImage(modules: PageModule[]): string | null {
  for (const mod of modules) {
    const content = mod.content;
    if (content.type === "hero" && content.media.url) return content.media.url;
    if (content.type === "about" && content.media.url) return content.media.url;
    if (content.type === "gallery" && content.images[0]?.url) {
      return content.images[0].url;
    }
  }
  return null;
}

/**
 * Retourne la page publique publiée (site du photographe courant puis seed),
 * sinon `null`. Le site affiché = celui de la **session authentifiée** quand il
 * y en a une (contenu Back-Office visible sur `/` et `/[slug]`), sinon le
 * tenant de démo.
 */
export async function getPublicPage(slug: string): Promise<PublicPage | null> {
  const photographerId = await resolvePublicPhotographerId();

  // 1 — BDD du site courant ; page absente/brouillon → repli seed (sauf draft).
  try {
    const data = await getPagesWithModules(photographerId);
    const target = data.pages.find((page) => page.slug === slug);
    if (target) {
      if (target.status === "published") {
        const modules = data.modulesByPage[target.id] ?? [];
        const exifByUrl = await resolveMediaMetaByUrls(
          collectImageUrls(modules),
          photographerId
        );
        return {
          slug,
          title: target.title,
          menuTitle: target.menuTitle,
          modules,
          exifByUrl,
        };
      }
      // Page existante mais brouillon → non visible publiquement (404).
      return null;
    }
    // Page absente → repli seed (démo) pour ne jamais afficher un site vide.
  } catch {
    // BDD indisponible → repli seed.
  }

  // 2 — Fallback seed (mode démo).
  const seed = seedPages.find((page) => page.slug === slug);
  if (!seed || seed.status !== "published") {
    return null;
  }
  const modules = buildSeedModules(slug);
  const exifByUrl = await resolveMediaMetaByUrls(collectImageUrls(modules));
  return {
    slug,
    title: seed.title,
    menuTitle: seed.menuTitle,
    modules,
    exifByUrl,
  };
}
