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

import {
  getHomePage,
  getPagesWithModules,
} from "@/db/repositories/pages.repository";
import { resolvePublicPhotographerId } from "@/lib/supabase/session";
import {
  bannerImageSources,
  buildSeedModules,
  galleryImageSources,
  heroParallaxImageSources,
  heroSliderImageSources,
  heroStaticArtSources,
  heroVideoImageSources,
  resolveCtaBannerContent,
  resolveGalleryContent,
  resolveHeroContent,
  resolveHeroParallaxContent,
  resolveHeroSliderContent,
  resolveHeroVideoContent,
  seedPages,
  type PageModule,
} from "./pages";
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
    if (mod.content.type === "hero") {
      // Héro : sources art-direction selon la variante (static ou slider).
      const sources =
        mod.content.variant === "slider"
          ? heroSliderImageSources(resolveHeroSliderContent(mod.content))
          : mod.content.variant === "video"
            ? heroVideoImageSources(resolveHeroVideoContent(mod.content))
            : mod.content.variant === "parallax"
              ? heroParallaxImageSources(resolveHeroParallaxContent(mod.content))
              : heroStaticArtSources(resolveHeroContent(mod.content));
      for (const source of sources) {
        urls.push(source.url);
      }
    }
    if (mod.content.type === "about" && mod.content.media.url) {
      urls.push(mod.content.media.url);
    }
    if (mod.content.type === "gallery") {
      // Galerie : images directes (static/dynamic) ou images d'albums (portfolio).
      for (const image of galleryImageSources(resolveGalleryContent(mod.content))) {
        urls.push(image.url);
      }
    }
    if (mod.content.type === "cta-banner") {
      // Bandeau message / CTA (Étape 11.27) : photo de fond, visuels du
      // carrousel ou replis de la vidéo — un bandeau peut être le seul visuel
      // d'une page, ses images méritent donc le même sort que les autres.
      for (const source of bannerImageSources(
        resolveCtaBannerContent(mod.content)
      )) {
        urls.push(source.url);
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
    if (content.type === "hero") {
      if (content.variant === "slider") {
        const slider = resolveHeroSliderContent(content);
        const first = slider.slides[0];
        const slideText = first
          ? first.descriptionText.trim() || first.subtitleH2.trim()
          : "";
        if (slideText) return slideText;
      } else {
        const hero = resolveHeroContent(content);
        const text = hero.descriptionText.trim() || hero.subtitleH2.trim();
        if (text) {
          return text;
        }
      }
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
    if (content.type === "hero") {
      const sources =
        content.variant === "slider"
          ? heroSliderImageSources(resolveHeroSliderContent(content))
          : content.variant === "video"
            ? heroVideoImageSources(resolveHeroVideoContent(content))
            : content.variant === "parallax"
              ? heroParallaxImageSources(resolveHeroParallaxContent(content))
              : heroStaticArtSources(resolveHeroContent(content));
      const first = sources[0];
      if (first) return first.url;
    }
    if (content.type === "about" && content.media.url) return content.media.url;
    if (content.type === "cta-banner") {
      const first = bannerImageSources(resolveCtaBannerContent(content))[0];
      if (first) return first.url;
    }
    if (content.type === "gallery") {
      const first = galleryImageSources(resolveGalleryContent(content))[0];
      if (first) return first.url;
    }
  }
  return null;
}

/** Construit une `PublicPage` depuis le **seed** (mode démo / BDD injoignable). */
function seedPublicPage(slug: string): PublicPage | null {
  const seed = seedPages.find((page) => page.slug === slug);
  if (!seed || seed.status !== "published") {
    return null;
  }
  return {
    slug,
    title: seed.title,
    menuTitle: seed.menuTitle,
    modules: buildSeedModules(slug),
    exifByUrl: {},
  };
}

/**
 * Retourne la page publique publiée pour un slug, sinon `null`.
 *
 * Étape 10.1 : le **repli seed n'est utilisé que si la BDD est injoignable**
 * (mode démo). Si la BDD répond mais que la page n'existe pas → `null`
 * (plus de contenu fantôme inventé en mémoire).
 */
export async function getPublicPage(slug: string): Promise<PublicPage | null> {
  const photographerId = await resolvePublicPhotographerId();

  try {
    const data = await getPagesWithModules(photographerId);
    const target = data.pages.find((page) => page.slug === slug);
    if (!target) {
      // BDD disponible mais page absente → aucune invention (10.1).
      return null;
    }
    if (target.status !== "published") {
      // Page existante mais brouillon → non visible publiquement (404).
      return null;
    }
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
  } catch {
    // BDD indisponible → repli seed explicite (démo).
    const seeded = seedPublicPage(slug);
    if (seeded) {
      seeded.exifByUrl = await resolveMediaMetaByUrls(
        collectImageUrls(seeded.modules)
      );
    }
    return seeded;
  }
}

/* --------------------------------------------------------------------------
   PAGE D'ACCUEIL — état explicite (Étape 10.1)
   -------------------------------------------------------------------------- */

/** Résolution de la route `/` : accueil prêt, en brouillon, ou inexistant. */
export type HomepageState =
  | { state: "ready"; page: PublicPage }
  | { state: "draft" }
  | { state: "missing" };

/**
 * Détermine l'état de la **page d'accueil** (`is_home`) du photographe courant :
 *   - `ready`   : accueil publié → à rendre ;
 *   - `draft`   : accueil existant mais non publié → 404 / « bientôt » ;
 *   - `missing` : aucun accueil → **écran d'onboarding**.
 * Si la BDD est injoignable, retombe sur l'accueil **seed** (mode démo).
 */
export async function getHomepageState(): Promise<HomepageState> {
  const photographerId = await resolvePublicPhotographerId();
  try {
    const home = await getHomePage(photographerId);
    if (!home) {
      return { state: "missing" };
    }
    if (home.status !== "published") {
      return { state: "draft" };
    }
    const data = await getPagesWithModules(photographerId);
    const modules = data.modulesByPage[home.id] ?? [];
    const exifByUrl = await resolveMediaMetaByUrls(
      collectImageUrls(modules),
      photographerId
    );
    return {
      state: "ready",
      page: {
        slug: home.slug,
        title: home.title,
        menuTitle: home.menuTitle,
        modules,
        exifByUrl,
      },
    };
  } catch {
    // BDD indisponible → accueil seed explicite (démo), sinon onboarding.
    const seeded = seedPublicPage("");
    if (!seeded) {
      return { state: "missing" };
    }
    seeded.exifByUrl = await resolveMediaMetaByUrls(
      collectImageUrls(seeded.modules)
    );
    return { state: "ready", page: seeded };
  }
}
