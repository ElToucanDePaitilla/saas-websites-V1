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
import { getOwnerProfile } from "@/db/repositories/owner-profile.repository";
import { resolvePublicPhotographerId } from "@/lib/supabase/session";
import {
  bannerImageSources,
  buildSeedModules,
  cardsImageSources,
  contentSectionImageSources,
  contentSectionPlainText,
  galleryImageSources,
  heroCurtainImageSources,
  heroParallaxImageSources,
  heroSliderImageSources,
  heroStaticArtSources,
  heroVideoImageSources,
  resolveCardsContent,
  resolveContactContent,
  resolveContactMapContent,
  resolveContentColumnsContent,
  resolveCtaBannerContent,
  resolveGalleryContent,
  resolveHeroContent,
  resolveHeroCurtainContent,
  resolveHeroParallaxContent,
  resolveHeroSliderContent,
  resolveHeroVideoContent,
  resolveMarqueeContent,
  resolveReviewsContent,
  richTextDocToPlainText,
  seedPages,
  type ArtSource,
  type HeroContent,
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
  /**
   * Adresse du profil propriétaire, résolue **uniquement** si un module
   * `contact-map` la demande (D3). Chaîne vide dans tous les autres cas — les
   * modules consommateurs retombent alors sur leur adresse libre.
   */
  ownerAddress: string;
}

/**
 * Adresse du profil, lue **conditionnellement** (D3).
 *
 * Aucune lecture BDD quand la page n'utilise pas de module `contact-map` : le
 * rendu d'une page ne doit pas payer une requête dont il n'a pas besoin. Toute
 * erreur (BDD absente, profil illisible) retombe sur `""` — un profil manquant
 * ne doit jamais faire échouer le rendu, c'est le repli de `contactMapAddress`
 * qui prend le relais.
 */
async function resolveOwnerAddress(
  modules: PageModule[],
  photographerId: string
): Promise<string> {
  const needed = modules.some(
    (module) =>
      module.content.type === "contact-map" && module.content.useOwnerAddress
  );
  if (!needed) {
    return "";
  }
  try {
    const profile = await getOwnerProfile(photographerId);
    return profile?.address.trim() ?? "";
  } catch {
    return "";
  }
}

/**
 * Sources d'images d'un Héro, **toutes variantes confondues** — centralisé ici
 * parce que chaque variante a son média et son résolveur, et que deux
 * consommateurs en dépendent (la collecte des images de la page et l'image
 * OpenGraph) : sans ce point unique, ajouter une variante se ferait en deux
 * endroits, avec le risque d'en oublier un.
 */
function heroImageSources(content: HeroContent): ArtSource[] {
  if (content.variant === "slider") {
    return heroSliderImageSources(resolveHeroSliderContent(content));
  }
  if (content.variant === "video") {
    return heroVideoImageSources(resolveHeroVideoContent(content));
  }
  if (content.variant === "parallax") {
    return heroParallaxImageSources(resolveHeroParallaxContent(content));
  }
  if (content.variant === "curtain") {
    return heroCurtainImageSources(resolveHeroCurtainContent(content));
  }
  // "static" (défaut / contenu legacy) : le résolveur statique lit `media`.
  return heroStaticArtSources(resolveHeroContent(content));
}

/** Collecte les URLs d'images portées par des modules (hero/about/gallery). */
function collectImageUrls(modules: PageModule[]): string[] {
  const urls: string[] = [];
  for (const mod of modules) {
    if (mod.content.type === "hero") {
      // Héro : sources art-direction selon la variante (static/slider/vidéo/
      // parallaxe/rideau), sélection centralisée ci-dessus.
      for (const source of heroImageSources(mod.content)) {
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
    if (mod.content.type === "content") {
      // Section de contenu (Étape 12.1) : les photos insérées dans les colonnes
      // comptent autant que les autres — une page peut n'être faite que de cela.
      for (const source of contentSectionImageSources(
        resolveContentColumnsContent(mod.content)
      )) {
        urls.push(source.url);
      }
    }
    if (mod.content.type === "cards") {
      // Section de cartes (Étape 13.1) : même raison que pour le contenu en
      // colonnes — une page peut n'être faite que de cartes, et leurs photos
      // méritent alors les mêmes métadonnées EXIF que les autres.
      for (const source of cardsImageSources(resolveCardsContent(mod.content))) {
        urls.push(source.url);
      }
    }
    if (mod.content.type === "marquee") {
      // Bandeau défilant (14.3) : seules les photos **rendues** comptent (une
      // photo masquée ou sans URL n'apparaît pas sur la page, elle n'a donc rien
      // à faire dans les métadonnées résolues).
      for (const image of resolveMarqueeContent(mod.content).images) {
        if (image.url !== "" && image.hidden !== true) {
          urls.push(image.url);
        }
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
    if (content.type === "content") {
      // Une section de contenu peut être le seul texte de la page : son titre
      // et le texte de ses blocs fournissent alors la description de partage.
      const text = contentSectionPlainText(
        resolveContentColumnsContent(content)
      );
      if (text.trim()) {
        return text;
      }
    }
    if (content.type === "cta-banner" && content.subheading.trim()) {
      return content.subheading;
    }
    if (content.type === "contact") {
      // Une section contact peut être le seul texte de la page : son **chapeau**
      // (sous-titre, à défaut titre) alimente alors le partage. Jamais les
      // données du formulaire : elles n'appartiennent pas au contenu éditorial.
      const contact = resolveContactContent(content);
      const text = contact.subtitle.trim() || contact.heading.trim();
      if (text) {
        return text;
      }
    }
    if (content.type === "contact-map") {
      // Une section « plan d'accès » peut être le seul texte de la page : son
      // sous-titre, à défaut son titre, alimente le partage. Jamais les
      // informations pratiques : ce sont des données d'usage, pas un résumé.
      const map = resolveContactMapContent(content);
      const text = map.subtitle.trim() || map.title.trim();
      if (text) {
        return text;
      }
    }
    if (content.type === "reviews") {
      // Une section d'avis peut être le seul texte de la page : son titre, à
      // défaut le mot d'accroche (« EXCELLENT »), alimente alors le partage.
      // Jamais les commentaires d'avis : ils appartiennent à leurs auteurs.
      const reviews = resolveReviewsContent(content);
      const text = reviews.heading.trim() || reviews.summaryWord.trim();
      if (text) {
        return text;
      }
    }
    if (content.type === "cards") {
      // Une section de cartes peut être le seul texte de la page : son
      // introduction, à défaut son sous-titre, alimente alors le partage.
      const cards = resolveCardsContent(content);
      const text = cards.intro.trim() || cards.subtitle.trim();
      if (text) {
        return text;
      }
      // Cartes éditoriales (13.3) : leur contenu vit dans les **corps**, pas
      // dans l'en-tête. Sans cette lecture, une page faite uniquement de ces
      // cartes n'aurait aucune description de partage. On prend le premier
      // corps non vide, dans l'ordre d'affichage.
      if (cards.variant === "editorial") {
        for (const card of cards.cards) {
          const body = richTextDocToPlainText(card.body).trim();
          if (body) {
            return body;
          }
        }
      }
    }
  }
  return "Portfolio photographe professionnel.";
}

/** Image OpenGraph : 1re image hero/about/galerie/cartes. */
export function publicOgImage(modules: PageModule[]): string | null {
  for (const mod of modules) {
    const content = mod.content;
    if (content.type === "hero") {
      const first = heroImageSources(content)[0];
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
    if (content.type === "content") {
      const first = contentSectionImageSources(
        resolveContentColumnsContent(content)
      )[0];
      if (first) return first.url;
    }
    if (content.type === "cards") {
      const first = cardsImageSources(resolveCardsContent(content))[0];
      if (first) return first.url;
    }
    if (content.type === "marquee") {
      // Le ruban peut être le seul visuel de la page : sa première photo rendue
      // devient alors l'image de partage, mêmes règles d'exclusion qu'au rendu.
      const first = resolveMarqueeContent(content).images.find(
        (image) => image.url !== "" && image.hidden !== true
      );
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
    // Aucun seed ne contient de module `contact-map` : pas de lecture profil.
    ownerAddress: "",
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
      ownerAddress: await resolveOwnerAddress(modules, photographerId),
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
        ownerAddress: await resolveOwnerAddress(modules, photographerId),
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
