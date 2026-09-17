/**
 * ============================================================================
 * MODÈLE « PAGE » & HELPERS — Back-Office (Étapes 3.1, 3.2, 3.4 & 12.1)
 * ----------------------------------------------------------------------------
 * - Étape 3.1 : modèle métier `SitePage` + helpers de slug URL.
 * - Étape 3.2 : modèle `PageModule` (module de page), catalogue `moduleCatalog`,
 *   fabriques de modules par défaut et helper de réordonnancement (Drag & Drop).
 * - Étape 3.4 : contenu éditable typé par famille (`ModuleContent`, union
 *   discriminé), champ `layoutVariant` réservé et fabriques de contenu par défaut.
 * - Étape 12.1 : rubrique « Contenu » — section de contenu en colonnes
 *   (`ContentColumnsContent` : 1 à 4 conteneurs indépendants, texte riche
 *   ProseMirror, images et icônes, empilement responsive).
 * Conçu pour mapper 1:1 vers les futures tables `pages` et `page_modules`
 * (Supabase/Drizzle) — aucune dépendance externe, TypeScript strict, zéro `any`.
 *
 * Références : plans/ROADMAP-3.1-pagemetadata.md §1.4 —
 *              plans/ROADMAP-3.2-pagebuilder-dnd.md §1.2 —
 *              plans/ROADMAP-3.4-crud-expanded.md §1.1 —
 *              plans/ROADMAP-12.1-section-contenu-colonnes.md §3
 * ============================================================================
 */

/** Statut de publication d'une page. */
export type PageStatus = "draft" | "published";

/** Brouillon de création/édition (sans l'horodatage, recalculé à l'enregistrement). */
export type PageMetadataDraft = {
  title: string;
  menuTitle: string;
  slug: string;
  status: PageStatus;
  /** Vrai si la page doit apparaître automatiquement dans le menu principal (4.2). */
  inMenu: boolean;
};

/**
 * Modèle métier « Page » — mappe 1:1 vers la future table `pages` (Supabase).
 * `slug` est l'URL canonique sans "/" de tête (ex. "a-propos") ; la page
 * d'accueil utilise un slug vide (`""` → route racine `/`).
 */
export interface SitePage {
  id: string; // identifiant stable (mock : crypto.randomUUID())
  title: string; // Titre H1 / SEO (affiché en <h1> et balise <title>)
  menuTitle: string; // nom abrégé affiché dans la navigation
  slug: string; // URL canonique, ex. "a-propos" (sans "/" de tête)
  status: PageStatus;
  inMenu: boolean; // présence auto dans le menu principal (future colonne show_in_menu)
  /** Page d'accueil du site (Étape 10.1) — servie sur `/`. */
  isHome: boolean;
  updatedAt: string; // horodatage ISO de dernière modification
}

/** Construit l'URL publique absolue d'une page ("/" pour la page d'accueil). */
export function pageHref(slug: string): string {
  return slug === "" ? "/" : `/${slug}`;
}

/**
 * URL publique d'une page en tenant compte de l'**accueil explicite** (10.1) :
 * la page marquée `isHome` est toujours servie sur `/`, quel que soit son slug.
 */
export function pageHrefFor(page: Pick<SitePage, "slug" | "isHome">): string {
  return page.isHome ? "/" : pageHref(page.slug);
}

/**
 * Slug attribué à un **ancien accueil démis** (Étape 10.1) : libère le slug
 * vide (unique par photographe) sans perdre la page. Déterministe et identique
 * côté serveur (`setHomePage`) et côté store client (mise à jour optimiste).
 */
export function demotedHomeSlug(pageId: string): string {
  return `accueil-ancien-${pageId.slice(0, 8)}`;
}

/**
 * Normalise un intitulé en slug URL :
 * - retire les accents (NFD → suppression des diacritiques),
 * - passe en minuscules,
 * - remplace espaces / `_` / apostrophes par `-`,
 * - supprime tout caractère hors `[a-z0-9-]`,
 * - compresse les tirets multiples et retire les tirets de tête/queue.
 */
export function slugify(input: string): string {
  const normalized = input
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();

  return normalized
    .replace(/[\s_'’]+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Génère un slug de base à partir du titre de la page. */
export function slugFromTitle(title: string): string {
  return slugify(title);
}

/**
 * Garantit l'unicité d'un slug parmi une liste de slugs déjà occupés :
 * si `base` est pris, on ajoute un suffixe numérique `-2`, `-3`, … jusqu'à
 * trouver une valeur libre. L'appelant fournit `takenSlugs` = les slugs des
 * AUTRES pages (la page en cours d'édition en est exclue, ce qui permet de
 * conserver son slug inchangé).
 */
export function uniqueSlug(base: string, takenSlugs: Iterable<string>): string {
  if (base === "") return base;

  const used = new Set(takenSlugs);
  let slug = base;
  let counter = 2;

  while (used.has(slug)) {
    slug = `${base}-${counter}`;
    counter += 1;
  }

  return slug;
}

/**
 * Jeu de données initial — miroir de `mainNav` (src/lib/site.ts) : les pages
 * de contenu « vitrines » que le photographe retrouve en arrivant sur l'écran
 * de gestion des Pages. La page d'accueil porte un slug vide (`""`).
 */
export const seedPages: SitePage[] = [
  {
    id: "seed-home",
    title: "Accueil",
    menuTitle: "Accueil",
    slug: "",
    status: "published",
    inMenu: true,
    isHome: true,
    updatedAt: "2026-09-05T12:00:00.000Z",
  },
  {
    id: "seed-portfolio",
    title: "Portfolio",
    menuTitle: "Portfolio",
    slug: "portfolio",
    status: "published",
    inMenu: true,
    isHome: false,
    updatedAt: "2026-09-05T12:00:00.000Z",
  },
  {
    id: "seed-prestations",
    title: "Prestations & Tarifs",
    menuTitle: "Prestations",
    slug: "prestations",
    status: "published",
    inMenu: true,
    isHome: false,
    updatedAt: "2026-09-05T12:00:00.000Z",
  },
  {
    id: "seed-a-propos",
    title: "À propos du photographe",
    menuTitle: "À propos",
    slug: "a-propos",
    status: "published",
    inMenu: true,
    isHome: false,
    updatedAt: "2026-09-05T12:00:00.000Z",
  },
  {
    id: "seed-contact",
    title: "Contact",
    menuTitle: "Contact",
    slug: "contact",
    // Publiée : les presets de navigation incluent « Contact » (visible au menu) ;
    // un brouillon serait masqué du site public (entrée auto `hidden`).
    status: "published",
    inMenu: true,
    isHome: false,
    updatedAt: "2026-09-05T12:00:00.000Z",
  },
];

/* ==========================================================================
   MODULES DE PAGE (Étape 3.2 — Page Builder)
   ========================================================================== */

/** Identifiants stables des familles de modules (spec §8, sous-ensemble 3.2). */
export type PageModuleType =
  | "hero"
  | "about"
  | "services"
  | "cta-banner"
  | "gallery"
  | "faq"
  | "contact"
  | "content"
  // Étape 13.1 — « Cards ». Nouvelle famille (et non variante d'une famille
  // existante) : elle exige donc d'étendre l'enum Postgres `module_type` et le
  // schéma Zod, en plus de cette union.
  | "cards"
  // Étape 14.2 — « Contact Map ». Même conséquence qu'en 13.1 : nouvelle
  // famille, donc enum Postgres, schéma Zod, icône et deux `switch` à étendre.
  | "contact-map";

/** Animation d'entrée d'un module (spec §7.2-B ; sélecteur en 3.4). */
export type ModuleAnimation =
  | "default"
  | "fade-up"
  | "fade-in"
  | "scale-in"
  | "none";

/** Ordre d'affichage des animations dans le sélecteur (3.4). */
export const moduleAnimationOrder: ModuleAnimation[] = [
  "default",
  "fade-up",
  "fade-in",
  "scale-in",
  "none",
];

/** Libellés français des animations (spec §7.2-B). */
export const moduleAnimationLabels: Record<ModuleAnimation, string> = {
  default: "Par défaut du thème",
  "fade-up": "Fade-up",
  "fade-in": "Fade-in",
  "scale-in": "Scale-in",
  none: "Aucune",
};

/* ==========================================================================
   CONTENUS ÉDITABLES DES MODULES (Étape 3.4 — CRUD en vue dépliée)
   ========================================================================== */

/** Média simple : URL + texte alternatif (SEO, spec §7.2-B / §8). */
export interface MediaField {
  url: string;
  alt: string;
}

/* ==========================================================================
   RUBRIQUE « HÉRO » (Étape 7.1 — base commune `BaseHero` + variante static)
   --------------------------------------------------------------------------
   Une famille unique `type: "hero"` dont le contenu JSONB est discriminé par
   `variant`. `HeroBaseShared` est la « surface » commune consommée par le
   composant `BaseHero` (overlay, textes, graisses, CTA) ; chaque variante
   n'ajoute que son médium — HeroStatic : art-direction responsive `<picture>`.
   Les futurs modules HeroSlider / HeroVideo / HeroParallax étendront `HeroContent`
   sans toucher aux autres familles.

   Référence : plans/ROADMAP-7.1-hero-static-basehero.md
   ========================================================================== */

/** Variantes de la rubrique Héro (static / slider / video / parallax / curtain). */
export type HeroVariant = "static" | "slider" | "video" | "parallax" | "curtain";

/** Niveau d'assombrissement de l'overlay (contraste des textes sur la photo). */
export type HeroOverlayLevel = "none" | "light" | "medium" | "strong";

/** Ton du texte posé sur l'image — sémantique (mappé aux tokens du thème). */
export type HeroTextTone = "light" | "dark";

/** Graisses de police réglables par bloc (utilitaires Tailwind). */
export type FontWeightClass =
  | "font-normal"
  | "font-medium"
  | "font-semibold"
  | "font-bold";

/** Style visuel du bouton CTA du Héro. */
export type HeroCtaStyle = "primary" | "secondary" | "outline";

/** Image de fond d'un breakpoint : URL + texte alternatif (SEO). */
export type ArtSource = MediaField;

/** Médias art-direction du Hero STATIC — rendu `<picture>`. */
export interface HeroStaticMedia {
  /** Format paysage 16:9 — OBLIGATOIRE (source `min-width: 1024px`). */
  desktop: ArtSource;
  /** Format portrait 9:16 — OBLIGATOIRE (img de repli, mobile-first). */
  mobile: ArtSource;
  /** Format 4:3 — OPTIONNEL (source `min-width: 768px`) ; null ⇒ repli desktop. */
  tablet: ArtSource | null;
}

/**
 * Sources d'image non vides d'un média art-direction, dans l'ordre **desktop →
 * tablette → mobile** — l'ordre de déclaration du `<picture>`.
 *
 * Un **seul** exemplaire de cette extraction pour les trois variantes qui
 * partagent `HeroStaticMedia` (statique, parallaxe, rideau) : la liste alimente
 * aussi bien la collecte des images de la page que l'image de partage
 * OpenGraph, et trois copies auraient fini par diverger — un ordre de
 * chargement optimisé d'un côté, oublié de l'autre.
 */
export function heroStaticMediaArtSources(media: HeroStaticMedia): ArtSource[] {
  const sources: ArtSource[] = [media.desktop];
  if (media.tablet) {
    sources.push(media.tablet);
  }
  sources.push(media.mobile);
  return sources.filter((source) => source.url !== "");
}

/**
 * Champs PARTAGÉS par toutes les variantes Héro — c'est la surface consommée
 * par le composant `BaseHero` (les futurs HeroSlider/Video/Parallax étendront
 * ce bloc sans modifier le rendu commun).
 */
export interface HeroBaseShared {
  variant: HeroVariant;
  /** Assombrissement de l'image de fond (garantit la lisibilité des textes). */
  overlayLevel: HeroOverlayLevel;
  /** Couleur du texte (défaut : ton le plus clair du thème). */
  textTone: HeroTextTone;
  /**
   * Titre principal H1 de la page (balise `<h1>`) — typographie géante fluide
   * `clamp()` : la section Héro porte le titre de la page (SEO / accessibilité).
   */
  titleH1: string;
  /** Sous-titre H2 (balise `<h2>`), d'accroche sous le titre. */
  subtitleH2: string;
  /** Description (paragraphe `<p>`). */
  descriptionText: string;
  /** Graisse du titre H1. */
  weightH1: FontWeightClass;
  /** Graisse du sous-titre H2. */
  weightH2: FontWeightClass;
  /** Graisse de la description. */
  weightText: FontWeightClass;
  /** Affiche le bouton CTA (toggle On/Off). */
  ctaShow: boolean;
  /** Libellé du bouton CTA. */
  ctaLabel: string;
  /** Lien du bouton CTA (`/slug` ou URL externe `https://…`). */
  ctaHref: string;
  /** Style visuel du bouton CTA. */
  ctaStyle: HeroCtaStyle;
}

/** Contenu d'un Hero STATIQUE (image de fond adaptative `<picture>`). */
export interface HeroStaticContent extends HeroBaseShared {
  variant: "static";
  media: HeroStaticMedia;
}

/* ==========================================================================
   HERO SLIDER — variante "slider" (Étape 7.2, plans/ROADMAP-7.2)
   --------------------------------------------------------------------------
   Multi-slides : chaque slide porte son art-direction `<picture>` et son bloc
   texte/CTA ; les graisses et les réglages du moteur sont globaux au module.
   ========================================================================== */

/** Vitesses d'autoplay autorisées (ms). */
export type HeroAutoplaySpeed = 3000 | 5000 | 7000 | 10000;

/** Type de transition entre les slides. */
export type HeroSliderTransition = "slide" | "fade";

/** Slide d'un HeroSlider : art-direction + textes/CTA propres. */
export interface HeroSliderSlide {
  /** Identifiant stable (mock : crypto.randomUUID()). */
  id: string;
  /** Art-direction responsive — desktop 16:9 / mobile 9:16 / tablet 4:3. */
  media: HeroStaticMedia;
  /** Assombrissement de CE slide (lisibilité du texte). */
  overlayLevel: HeroOverlayLevel;
  /** Ton du texte de CE slide (défaut : "light"). */
  textTone: HeroTextTone;
  /** Grand titre `<h1>` (slide active seulement). */
  titleH1: string;
  /** Sous-titre `<h2>`. */
  subtitleH2: string;
  /** Description (paragraphe `<p>`). */
  descriptionText: string;
  ctaShow: boolean;
  ctaLabel: string;
  ctaHref: string;
  ctaStyle: HeroCtaStyle;
}

/** Réglages du moteur du slider (niveau module — Rubrique 3). */
export interface HeroSliderSettings {
  /** Défilement automatique (activé par défaut). */
  autoplay: boolean;
  /** Vitesse de défilement (défaut 5000 ms). */
  autoplaySpeedMs: HeroAutoplaySpeed;
  /** Transition entre les visuels (défaut "slide"). */
  transition: HeroSliderTransition;
  /** Flèches gauche/droite sur ordinateur (défaut true). */
  showArrows: boolean;
  /** Puces / pagination en bas (défaut true). */
  showDots: boolean;
}

/** Contenu d'un Hero SLIDER. */
export interface HeroSliderContent {
  variant: "slider";
  /** Slides (3 par défaut, pré-chargées avec placeholders). */
  slides: HeroSliderSlide[];
  /** Graisses de police globales au module. */
  weightH1: FontWeightClass;
  weightH2: FontWeightClass;
  weightText: FontWeightClass;
  settings: HeroSliderSettings;
}

/** Ordre des vitesses d'autoplay (Select éditeur). */
export const heroAutoplaySpeedOrder: HeroAutoplaySpeed[] = [
  3000,
  5000,
  7000,
  10000,
];

/** Libellés français des vitesses d'autoplay. */
export const heroAutoplaySpeedLabels: Record<HeroAutoplaySpeed, string> = {
  3000: "3 secondes",
  5000: "5 secondes (recommandé)",
  7000: "7 secondes",
  10000: "10 secondes",
};

/** Ordre des transitions (radio éditeur). */
export const heroSliderTransitionOrder: HeroSliderTransition[] = [
  "slide",
  "fade",
];

/** Libellés français des transitions. */
export const heroSliderTransitionLabels: Record<HeroSliderTransition, string> = {
  slide: "Glissement",
  fade: "Fondu",
};

/** Réglages du slider par défaut. */
export const DEFAULT_HERO_SLIDER_SETTINGS: HeroSliderSettings = {
  autoplay: true,
  autoplaySpeedMs: 5000,
  transition: "slide",
  showArrows: true,
  showDots: true,
};

/** Démos textuelles des 3 slides pré-chargées (seeds picsum stables). */
const HERO_SLIDER_DEMO = [
  {
    seed: "hero-slide-1",
    titleH1: "Bienvenue dans mon univers",
    subtitleH2: "L'émotion de vos plus beaux instants",
    descriptionText:
      "Photographe professionnel, je raconte votre histoire entre lumière et émotion.",
  },
  {
    seed: "hero-slide-2",
    titleH1: "Reportages & mariages",
    subtitleH2: "Une journée gravée pour toujours",
    descriptionText:
      "Couverture complète de votre événement, de la préparation à la soirée.",
  },
  {
    seed: "hero-slide-3",
    titleH1: "Portraits & corporate",
    subtitleH2: "Des images authentiques",
    descriptionText:
      "Séances sur mesure en extérieur ou en studio, adaptées à votre image.",
  },
] as const;

/** Fabrique une slide d'exemple (placeholders picsum + alt SEO renseignés). */
export function createHeroSliderSlide(demoIndex?: number): HeroSliderSlide {
  const demo = HERO_SLIDER_DEMO[demoIndex ?? 0] ?? HERO_SLIDER_DEMO[0];
  const media: HeroStaticMedia = {
    desktop: {
      url: `https://picsum.photos/seed/${demo.seed}-desktop/1920/1080`,
      alt: `${demo.titleH1} — grand format`,
    },
    mobile: {
      url: `https://picsum.photos/seed/${demo.seed}-mobile/720/1280`,
      alt: `${demo.titleH1} — mobile`,
    },
    tablet: {
      url: `https://picsum.photos/seed/${demo.seed}-tablet/1200/900`,
      alt: `${demo.titleH1} — tablette`,
    },
  };
  return {
    id: crypto.randomUUID(),
    media,
    overlayLevel: "medium",
    textTone: "light",
    titleH1: demo.titleH1,
    subtitleH2: demo.subtitleH2,
    descriptionText: demo.descriptionText,
    ctaShow: true,
    ctaLabel: "Découvrir mon portfolio",
    ctaHref: "/portfolio",
    ctaStyle: "primary",
  };
}

/** Fabrique un contenu HeroSlider complet : 3 slides pré-chargées. */
export function createHeroSliderContent(): HeroSliderContent {
  return {
    variant: "slider",
    slides: [
      createHeroSliderSlide(0),
      createHeroSliderSlide(1),
      createHeroSliderSlide(2),
    ],
    weightH1: "font-medium",
    weightH2: "font-normal",
    weightText: "font-normal",
    settings: { ...DEFAULT_HERO_SLIDER_SETTINGS },
  };
}

/** Normalise une slide brute (JSONB) — fusion avec la slide d'exemple. */
function resolveHeroSliderSlide(raw: unknown): HeroSliderSlide {
  const record = isRecord(raw) ? raw : {};
  const demo = createHeroSliderSlide();
  const mediaRaw = isRecord(record.media) ? record.media : {};
  const readSource = (key: "desktop" | "mobile" | "tablet") =>
    readArtSource(mediaRaw, key, demo.media[key] ?? { url: "", alt: "" });
  const isBool = (value: unknown): value is boolean => typeof value === "boolean";

  return {
    id: typeof record.id === "string" && record.id !== "" ? record.id : crypto.randomUUID(),
    media: {
      desktop: readSource("desktop"),
      mobile: readSource("mobile"),
      tablet: isRecord(mediaRaw.tablet) ? readSource("tablet") : null,
    },
    overlayLevel: isHeroOverlay(record.overlayLevel)
      ? record.overlayLevel
      : demo.overlayLevel,
    textTone: isHeroTextTone(record.textTone) ? record.textTone : demo.textTone,
    titleH1: readHeroText(record, "titleH1", demo.titleH1),
    subtitleH2: readHeroText(record, "subtitleH2", demo.subtitleH2),
    descriptionText: readHeroText(record, "descriptionText", demo.descriptionText),
    ctaShow: isBool(record.ctaShow) ? record.ctaShow : demo.ctaShow,
    ctaLabel: readHeroText(record, "ctaLabel", demo.ctaLabel),
    ctaHref: readHeroText(record, "ctaHref", demo.ctaHref),
    ctaStyle: isHeroCtaStyle(record.ctaStyle) ? record.ctaStyle : demo.ctaStyle,
  };
}

/**
 * Normalise un contenu Héro « slider » stocké (JSONB) vers un
 * `HeroSliderContent` complet (slides manquantes → 3 slides d'exemple ;
 * slides partielles complétées ; réglages fusionnés).
 */
export function resolveHeroSliderContent(raw: unknown): HeroSliderContent {
  const record = isRecord(raw) ? raw : {};
  const rawSlides = Array.isArray(record.slides)
    ? record.slides
    : [];
  const slides =
    rawSlides.length > 0
      ? rawSlides.map((slide) => resolveHeroSliderSlide(slide))
      : [createHeroSliderSlide(0), createHeroSliderSlide(1), createHeroSliderSlide(2)];
  const settingsRaw = isRecord(record.settings) ? record.settings : {};
  const isBool = (value: unknown): value is boolean => typeof value === "boolean";
  const isSpeed = (value: unknown): value is HeroAutoplaySpeed =>
    value === 3000 || value === 5000 || value === 7000 || value === 10000;
  const isTransition = (value: unknown): value is HeroSliderTransition =>
    value === "slide" || value === "fade";

  return {
    variant: "slider",
    slides,
    weightH1: isFontWeight(record.weightH1) ? record.weightH1 : "font-medium",
    weightH2: isFontWeight(record.weightH2) ? record.weightH2 : "font-normal",
    weightText: isFontWeight(record.weightText)
      ? record.weightText
      : "font-normal",
    settings: {
      autoplay: isBool(settingsRaw.autoplay)
        ? settingsRaw.autoplay
        : DEFAULT_HERO_SLIDER_SETTINGS.autoplay,
      autoplaySpeedMs: isSpeed(settingsRaw.autoplaySpeedMs)
        ? settingsRaw.autoplaySpeedMs
        : DEFAULT_HERO_SLIDER_SETTINGS.autoplaySpeedMs,
      transition: isTransition(settingsRaw.transition)
        ? settingsRaw.transition
        : DEFAULT_HERO_SLIDER_SETTINGS.transition,
      showArrows: isBool(settingsRaw.showArrows)
        ? settingsRaw.showArrows
        : DEFAULT_HERO_SLIDER_SETTINGS.showArrows,
      showDots: isBool(settingsRaw.showDots)
        ? settingsRaw.showDots
        : DEFAULT_HERO_SLIDER_SETTINGS.showDots,
    },
  };
}

/** Sources d'image non vides des slides d'un HeroSlider (ordre desktop → tablet → mobile). */
export function heroSliderImageSources(content: HeroSliderContent): ArtSource[] {
  const sources: ArtSource[] = [];
  for (const slide of content.slides) {
    sources.push(slide.media.desktop);
    if (slide.media.tablet) {
      sources.push(slide.media.tablet);
    }
    sources.push(slide.media.mobile);
  }
  return sources.filter((source) => source.url !== "");
}

/* ==========================================================================
   HERO VIDEO — variante "video" (Étape 7.3, plans/ROADMAP-7.3)
   --------------------------------------------------------------------------
   Hérite 100 % du bloc commun `BaseHero` (`HeroBaseShared`) et n'ajoute que le
   média vidéo : `<video>` desktop (autoplay/muted/loop/playsinline), image
   fallback mobile 9:16 OBLIGATOIRE (< 768px) et poster desktop 16:9 optionnel
   (affiché pendant le chargement de la vidéo).
   ========================================================================== */

/** Vidéo MP4 de démonstration (bucket public stable — à remplacer). */
export const DEMO_HERO_VIDEO_URL =
  "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4";

/** Médias vidéo d'un HeroVideo (fallback responsive). */
export interface HeroVideoMedia {
  /** URL ou fichier MP4/WebM (rendu vidéo sur desktop). */
  videoUrl: string;
  /** Lecture en boucle (défaut true). */
  loop: boolean;
  /** Poster desktop 16:9 — optionnel (affiché au chargement de la vidéo). */
  posterDesktop: ArtSource;
  /** Fallback mobile 9:16 — OBLIGATOIRE (affiché < 768px à la place de la vidéo). */
  fallbackMobile: ArtSource;
}

/** Contenu d'un Hero VIDÉO (hérite des champs partagés de BaseHero). */
export interface HeroVideoContent extends HeroBaseShared {
  variant: "video";
  media: HeroVideoMedia;
}

/** Fabrique un contenu HeroVideo complet (démo vidéo + images picsum). */
export function createHeroVideoContent(): HeroVideoContent {
  return {
    ...DEFAULT_HERO_SHARED,
    variant: "video",
    media: {
      videoUrl: DEMO_HERO_VIDEO_URL,
      loop: true,
      posterDesktop: {
        url: "https://picsum.photos/seed/hero-video-poster/1920/1080",
        alt: "Image de chargement de la vidéo — grand format",
      },
      fallbackMobile: {
        url: "https://picsum.photos/seed/hero-video-mobile/720/1280",
        alt: "Cadrage vertical (mobile) — univers du photographe",
      },
    },
  };
}

/** Résout un contenu Héro « video » stocké (JSONB) vers un complet. */
export function resolveHeroVideoContent(raw: unknown): HeroVideoContent {
  if (!isRecord(raw)) {
    return createHeroVideoContent();
  }
  const defaults = createHeroVideoContent();
  const mediaRaw = isRecord(raw.media) ? raw.media : {};

  return {
    variant: "video",
    overlayLevel: isHeroOverlay(raw.overlayLevel)
      ? raw.overlayLevel
      : defaults.overlayLevel,
    textTone: isHeroTextTone(raw.textTone) ? raw.textTone : defaults.textTone,
    titleH1: readHeroText(raw, "titleH1", defaults.titleH1),
    subtitleH2: readHeroText(raw, "subtitleH2", defaults.subtitleH2),
    descriptionText: readHeroText(raw, "descriptionText", defaults.descriptionText),
    weightH1: isFontWeight(raw.weightH1) ? raw.weightH1 : defaults.weightH1,
    weightH2: isFontWeight(raw.weightH2) ? raw.weightH2 : defaults.weightH2,
    weightText: isFontWeight(raw.weightText)
      ? raw.weightText
      : defaults.weightText,
    ctaShow: typeof raw.ctaShow === "boolean" ? raw.ctaShow : defaults.ctaShow,
    ctaLabel: readHeroText(raw, "ctaLabel", defaults.ctaLabel),
    ctaHref: readHeroText(raw, "ctaHref", defaults.ctaHref),
    ctaStyle: isHeroCtaStyle(raw.ctaStyle) ? raw.ctaStyle : defaults.ctaStyle,
    media: {
      videoUrl: readHeroText(mediaRaw, "videoUrl", defaults.media.videoUrl),
      loop: typeof mediaRaw.loop === "boolean" ? mediaRaw.loop : defaults.media.loop,
      posterDesktop: readArtSource(
        mediaRaw,
        "posterDesktop",
        defaults.media.posterDesktop
      ),
      fallbackMobile: readArtSource(
        mediaRaw,
        "fallbackMobile",
        defaults.media.fallbackMobile
      ),
    },
  };
}

/** Sources d'image non vides d'un HeroVideo (poster desktop + fallback mobile). */
export function heroVideoImageSources(content: HeroVideoContent): ArtSource[] {
  return [content.media.posterDesktop, content.media.fallbackMobile].filter(
    (source) => source.url !== ""
  );
}

/* ==========================================================================
   HERO PARALLAX — variante "parallax" (Étape 7.4, plans/ROADMAP-7.4)
   --------------------------------------------------------------------------
   Hérite 100 % du bloc commun `BaseHero` (`HeroBaseShared`). Le média réutilise
   `HeroStaticMedia` : image desktop 16:9 HD (effet parallaxe ≥1024px), image
   mobile 9:16 fixe obligatoire (<1024px, perf) et tablette 4:3 optionnelle.
   ========================================================================== */

/**
 * Intensité de l'effet parallaxe (desktop) — échelle « force » à 7 niveaux.
 * Backward-compat : l'ancien token `subtle` (Étape 7.4) est mappé en lecture
 * vers `very-light` ; `medium` et `strong` restent valides tels quels.
 */
export type ParallaxSpeed =
  | "very-light"
  | "light"
  | "medium"
  | "pronounced"
  | "strong"
  | "very-strong"
  | "extreme";

/** Contenu d'un Hero PARALLAXE. */
export interface HeroParallaxContent extends HeroBaseShared {
  variant: "parallax";
  media: HeroStaticMedia;
  /** Intensité du mouvement au défilement (défaut "medium"). */
  parallaxSpeed: ParallaxSpeed;
  /** Verrouillé à true — effet désactivé sur mobile (perf GPU 60 FPS). */
  disableOnMobile: true;
}

/** Ordre d'affichage des intensités parallaxe (Select éditeur). */
export const parallaxSpeedOrder: ParallaxSpeed[] = [
  "very-light",
  "light",
  "medium",
  "pronounced",
  "strong",
  "very-strong",
  "extreme",
];

/** Libellés français des intensités parallaxe, nommés par force d'intensité. */
export const parallaxSpeedLabels: Record<ParallaxSpeed, string> = {
  "very-light": "Très léger",
  light: "Léger",
  medium: "Modéré",
  pronounced: "Marqué",
  strong: "Fort",
  "very-strong": "Très fort",
  extreme: "Extrême",
};

/**
 * Facteurs d'amplitude (proportion de la distance de scroll) par intensité.
 * `medium` (0.15) conserve le ressenti de référence de l'Étape 7.4.
 */
export const PARALLAX_FACTOR: Record<ParallaxSpeed, number> = {
  "very-light": 0.07,
  light: 0.12,
  medium: 0.15,
  pronounced: 0.22,
  strong: 0.3,
  "very-strong": 0.42,
  extreme: 0.6,
};

/**
 * Débord (overscan) de l'image en fraction de la hauteur de section = à la fois
 * le « jeu » vertical disponible (`top`/`height` de l'image) et le plafond du
 * déplacement appliqué. Élevé pour les fortes intensités → effet bien visible.
 */
export const PARALLAX_OVERSCAN: Record<ParallaxSpeed, number> = {
  "very-light": 0.1,
  light: 0.12,
  medium: 0.16,
  pronounced: 0.2,
  strong: 0.26,
  "very-strong": 0.34,
  extreme: 0.44,
};

/** Fabrique un contenu HeroParallax complet (images picsum HD + seed stables). */
export function createHeroParallaxContent(): HeroParallaxContent {
  return {
    ...DEFAULT_HERO_SHARED,
    variant: "parallax",
    parallaxSpeed: "medium",
    disableOnMobile: true,
    media: {
      desktop: {
        url: "https://picsum.photos/seed/hero-parallax-desktop/1920/1080",
        alt: "Grand format — univers du photographe (parallaxe)",
      },
      mobile: {
        url: "https://picsum.photos/seed/hero-parallax-mobile/720/1280",
        alt: "Cadrage vertical (mobile) — univers du photographe",
      },
      tablet: {
        url: "https://picsum.photos/seed/hero-parallax-tablet/1200/900",
        alt: "Composition intermédiaire (tablette)",
      },
    },
  };
}

/** Résout un contenu Héro « parallax » stocké (JSONB) vers un complet. */
export function resolveHeroParallaxContent(raw: unknown): HeroParallaxContent {
  if (!isRecord(raw)) {
    return createHeroParallaxContent();
  }
  const defaults = createHeroParallaxContent();
  const mediaRaw = isRecord(raw.media) ? raw.media : {};
  // Lecture tolérante : accepte l'échelle 7 niveaux ET l'ancien token "subtle"
  // (Étape 7.4) qu'on mappe vers "very-light" (rétro-compatibilité JSONB).
  const readSpeed = (value: unknown): ParallaxSpeed => {
    if (value === "subtle") {
      return "very-light";
    }
    return parallaxSpeedOrder.includes(value as ParallaxSpeed)
      ? (value as ParallaxSpeed)
      : defaults.parallaxSpeed;
  };

  return {
    variant: "parallax",
    parallaxSpeed: readSpeed(raw.parallaxSpeed),
    disableOnMobile: true,
    overlayLevel: isHeroOverlay(raw.overlayLevel)
      ? raw.overlayLevel
      : defaults.overlayLevel,
    textTone: isHeroTextTone(raw.textTone) ? raw.textTone : defaults.textTone,
    titleH1: readHeroText(raw, "titleH1", defaults.titleH1),
    subtitleH2: readHeroText(raw, "subtitleH2", defaults.subtitleH2),
    descriptionText: readHeroText(raw, "descriptionText", defaults.descriptionText),
    weightH1: isFontWeight(raw.weightH1) ? raw.weightH1 : defaults.weightH1,
    weightH2: isFontWeight(raw.weightH2) ? raw.weightH2 : defaults.weightH2,
    weightText: isFontWeight(raw.weightText)
      ? raw.weightText
      : defaults.weightText,
    ctaShow: typeof raw.ctaShow === "boolean" ? raw.ctaShow : defaults.ctaShow,
    ctaLabel: readHeroText(raw, "ctaLabel", defaults.ctaLabel),
    ctaHref: readHeroText(raw, "ctaHref", defaults.ctaHref),
    ctaStyle: isHeroCtaStyle(raw.ctaStyle) ? raw.ctaStyle : defaults.ctaStyle,
    media: {
      desktop: readArtSource(mediaRaw, "desktop", defaults.media.desktop),
      mobile: readArtSource(mediaRaw, "mobile", defaults.media.mobile),
      tablet: isRecord(mediaRaw.tablet)
        ? readArtSource(mediaRaw, "tablet", defaults.media.tablet ?? { url: "", alt: "" })
        : null,
    },
  };
}

/** Sources d'image non vides d'un HeroParallax (desktop → tablette → mobile). */
export function heroParallaxImageSources(
  content: HeroParallaxContent
): ArtSource[] {
  return heroStaticMediaArtSources(content.media);
}

/* ==========================================================================
   HERO RIDEAU — variante "curtain"
   --------------------------------------------------------------------------
   Hérite 100 % du bloc commun `BaseHero` et réutilise `HeroStaticMedia` : les
   trois images d'art-direction du Héro statique (desktop 16:9, tablette 4:3,
   mobile 9:16), rendues par la **même** balise `<picture>`.

   Ce qui change n'est ni le média ni les textes, c'est la **position** : la
   section s'**épingle** sous le Header fixe et la section suivante monte
   par-dessus elle, opaque — « le rideau tombe ». La mécanique est
   entièrement en CSS (`globals.css`, classe `.hero-curtain`), sans JavaScript
   ni `transform` animé.

   D'où l'absence volontaire de tout réglage propre : ni `parallaxSpeed` (ce
   n'est pas une parallaxe) ni `disableOnMobile` (l'épinglage est du CSS natif,
   identique sur tous les écrans). La variante n'ajoute donc **que** le
   discriminant et son média ; tout le reste vient de `BaseHero`.
   ========================================================================== */

/** Contenu d'un Hero RIDEAU (fond statique + sections qui le recouvrent). */
export interface HeroCurtainContent extends HeroBaseShared {
  variant: "curtain";
  media: HeroStaticMedia;
}

/** Fabrique un contenu HeroRideau complet (images picsum HD + seed stables). */
export function createHeroCurtainContent(): HeroCurtainContent {
  return {
    ...DEFAULT_HERO_SHARED,
    variant: "curtain",
    media: {
      desktop: {
        url: "https://picsum.photos/seed/hero-curtain-desktop/1920/1080",
        alt: "Grand format — univers du photographe (rideau)",
      },
      mobile: {
        url: "https://picsum.photos/seed/hero-curtain-mobile/720/1280",
        alt: "Cadrage vertical (mobile) — univers du photographe",
      },
      tablet: {
        url: "https://picsum.photos/seed/hero-curtain-tablet/1200/900",
        alt: "Composition intermédiaire (tablette)",
      },
    },
  };
}

/** Résout un contenu Héro « curtain » stocké (JSONB) vers un complet. */
export function resolveHeroCurtainContent(raw: unknown): HeroCurtainContent {
  if (!isRecord(raw)) {
    return createHeroCurtainContent();
  }
  const defaults = createHeroCurtainContent();
  const mediaRaw = isRecord(raw.media) ? raw.media : {};

  return {
    variant: "curtain",
    overlayLevel: isHeroOverlay(raw.overlayLevel)
      ? raw.overlayLevel
      : defaults.overlayLevel,
    textTone: isHeroTextTone(raw.textTone) ? raw.textTone : defaults.textTone,
    titleH1: readHeroText(raw, "titleH1", defaults.titleH1),
    subtitleH2: readHeroText(raw, "subtitleH2", defaults.subtitleH2),
    descriptionText: readHeroText(raw, "descriptionText", defaults.descriptionText),
    weightH1: isFontWeight(raw.weightH1) ? raw.weightH1 : defaults.weightH1,
    weightH2: isFontWeight(raw.weightH2) ? raw.weightH2 : defaults.weightH2,
    weightText: isFontWeight(raw.weightText)
      ? raw.weightText
      : defaults.weightText,
    ctaShow: typeof raw.ctaShow === "boolean" ? raw.ctaShow : defaults.ctaShow,
    ctaLabel: readHeroText(raw, "ctaLabel", defaults.ctaLabel),
    ctaHref: readHeroText(raw, "ctaHref", defaults.ctaHref),
    ctaStyle: isHeroCtaStyle(raw.ctaStyle) ? raw.ctaStyle : defaults.ctaStyle,
    media: {
      desktop: readArtSource(mediaRaw, "desktop", defaults.media.desktop),
      mobile: readArtSource(mediaRaw, "mobile", defaults.media.mobile),
      tablet: isRecord(mediaRaw.tablet)
        ? readArtSource(mediaRaw, "tablet", defaults.media.tablet ?? { url: "", alt: "" })
        : null,
    },
  };
}

/** Sources d'image non vides d'un HeroRideau (desktop → tablette → mobile). */
export function heroCurtainImageSources(
  content: HeroCurtainContent
): ArtSource[] {
  return heroStaticMediaArtSources(content.media);
}

/** Union des contenus Héro (static / slider / video / parallax / curtain). */
export type HeroContent =
  | HeroStaticContent
  | HeroSliderContent
  | HeroVideoContent
  | HeroParallaxContent
  | HeroCurtainContent;

/**
 * Titre « principal » d'un Héro, quelle que soit sa variante — sert à décider
 * **quel module porte le `h1` de la page** (voir `PublicModulesList`).
 *
 * Prend le contenu **brut** (celui du JSONB, non résolu) et passe par le
 * résolveur de la variante : c'est la règle de lecture du projet (chaque
 * consommateur résout ce qu'il lit), et sans elle un contenu stocké avant
 * l'ajout d'un champ ferait échouer la lecture.
 *
 * Un slider en possède plusieurs (un par diapositive) : on retient le premier
 * titre **non vide**, parce que son `h1` suit la diapositive affichée — la
 * décision « ce Héro porte le titre de la page » doit donc se fonder sur la
 * première diapositive qui possède réellement un titre. Une chaîne vide
 * signifie : ce Héro ne peut pas porter le titre de la page ; la page retombe
 * alors sur son propre titre (repli invisible).
 */
export function heroH1Text(raw: unknown): string {
  if (!isRecord(raw)) {
    return "";
  }
  if (raw.variant === "slider") {
    const slide = resolveHeroSliderContent(raw).slides.find(
      (item) => item.titleH1.trim() !== ""
    );
    return slide?.titleH1 ?? "";
  }
  if (raw.variant === "video") {
    return resolveHeroVideoContent(raw).titleH1;
  }
  if (raw.variant === "parallax") {
    return resolveHeroParallaxContent(raw).titleH1;
  }
  if (raw.variant === "curtain") {
    return resolveHeroCurtainContent(raw).titleH1;
  }
  // "static" et contenus legacy (variante absente) : résolveur statique.
  return resolveHeroContent(raw).titleH1;
}

/** Opacité effective de l'overlay noir (rendu `rgba(0,0,0, <valeur>)`). */
export const HERO_OVERLAY_OPACITY: Record<HeroOverlayLevel, number> = {
  none: 0,
  light: 0.2,
  medium: 0.4,
  strong: 0.6,
};

/** Ordre d'affichage des overlays dans le Select (éditeur). */
export const heroOverlayOrder: HeroOverlayLevel[] = [
  "none",
  "light",
  "medium",
  "strong",
];

/** Libellés français des overlays (outils non-techniques). */
export const heroOverlayLabels: Record<HeroOverlayLevel, string> = {
  none: "Aucun",
  light: "Léger (20 %)",
  medium: "Moyen (40 %)",
  strong: "Fort (60 %)",
};

/** Ordre d'affichage des graisses de police dans les Selects. */
export const fontWeightOrder: FontWeightClass[] = [
  "font-normal",
  "font-medium",
  "font-semibold",
  "font-bold",
];

/** Libellés français des graisses de police. */
export const fontWeightLabels: Record<FontWeightClass, string> = {
  "font-normal": "Normal",
  "font-medium": "Moyen (500)",
  "font-semibold": "Demi-gras (600)",
  "font-bold": "Gras (700)",
};

/** Ordre d'affichage des styles de CTA. */
export const heroCtaStyleOrder: HeroCtaStyle[] = [
  "primary",
  "secondary",
  "outline",
];

/** Libellés français des styles de CTA. */
export const heroCtaStyleLabels: Record<HeroCtaStyle, string> = {
  primary: "Principal (accent)",
  secondary: "Secondaire",
  outline: "Contour",
};

/** Ordre d'affichage des tons de texte. */
export const heroTextToneOrder: HeroTextTone[] = ["light", "dark"];

/** Libellés français des tons de texte. */
export const heroTextToneLabels: Record<HeroTextTone, string> = {
  light: "Clair (recommandé sur photo)",
  dark: "Sombre",
};

/** Ordre d'affichage des variantes Héro (une seule implémentée pour l'instant). */
export const heroVariantOrder: HeroVariant[] = ["static"];

/** Libellés français des variantes Héro (catalogue / futur layout switcher). */
export const heroVariantLabels: Record<HeroVariant, string> = {
  static: "Hero Statique",
  slider: "Hero Slider",
  video: "Hero Vidéo",
  parallax: "Hero Parallax",
  curtain: "Hero Rideau",
};

/** Défauts du bloc textes/styles partagé (toutes variantes). */
export const DEFAULT_HERO_SHARED: Omit<HeroBaseShared, "variant"> = {
  overlayLevel: "medium",
  textTone: "light",
  titleH1: "Bienvenue dans mon univers",
  subtitleH2: "L'émotion de vos plus beaux instants",
  descriptionText:
    "Photographe professionnel, je capture l'émotion de vos plus beaux instants.",
  weightH1: "font-medium",
  weightH2: "font-normal",
  weightText: "font-normal",
  ctaShow: true,
  ctaLabel: "Découvrir mon portfolio",
  ctaHref: "/portfolio",
  ctaStyle: "primary",
};

/**
 * Images de démonstration (placeholders) du HeroStatic — picsum.photos
 * (hôte autorisé par `next.config`) avec seeds stables et bons ratios.
 * Une nouvelle copie est fournie à chaque fabrique (aucune référence partagée).
 */
export const DEFAULT_HERO_STATIC_MEDIA: HeroStaticMedia = {
  desktop: {
    url: "https://picsum.photos/seed/hero-desktop/1920/1080",
    alt: "Vue d'ensemble en grand format — univers du photographe",
  },
  mobile: {
    url: "https://picsum.photos/seed/hero-mobile/720/1280",
    alt: "Cadrage vertical (mobile)",
  },
  tablet: {
    url: "https://picsum.photos/seed/hero-tablet/1200/900",
    alt: "Composition intermédiaire (tablette)",
  },
};

/** Copie une source d'image (aucune référence partagée). */
export function cloneArtSource(source: ArtSource): ArtSource {
  return { url: source.url, alt: source.alt };
}

/** Copie les médias du HeroStatic (aucune référence partagée). */
export function cloneHeroStaticMedia(media: HeroStaticMedia): HeroStaticMedia {
  return {
    desktop: cloneArtSource(media.desktop),
    mobile: cloneArtSource(media.mobile),
    tablet: media.tablet ? cloneArtSource(media.tablet) : null,
  };
}

/** Fabrique un contenu HeroStatic complet (placeholders de démonstration). */
export function createHeroStaticContent(): HeroStaticContent {
  return {
    ...DEFAULT_HERO_SHARED,
    variant: "static",
    media: cloneHeroStaticMedia(DEFAULT_HERO_STATIC_MEDIA),
  };
}

/** Sources d'image non vides d'un HeroStatic, ordre desktop → tablet → mobile. */
export function heroStaticArtSources(content: HeroStaticContent): ArtSource[] {
  return heroStaticMediaArtSources(content.media);
}

/** Garde : objet simple non nul (pour le résolveur JSONB). */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isHeroOverlay(value: unknown): value is HeroOverlayLevel {
  return (
    value === "none" ||
    value === "light" ||
    value === "medium" ||
    value === "strong"
  );
}

function isHeroTextTone(value: unknown): value is HeroTextTone {
  return value === "light" || value === "dark";
}

function isFontWeight(value: unknown): value is FontWeightClass {
  return (
    value === "font-normal" ||
    value === "font-medium" ||
    value === "font-semibold" ||
    value === "font-bold"
  );
}

function isHeroCtaStyle(value: unknown): value is HeroCtaStyle {
  return value === "primary" || value === "secondary" || value === "outline";
}

function isCtaShow(value: unknown): value is boolean {
  return typeof value === "boolean";
}

/** Lit un champ texte (string) avec repli sur la valeur par défaut. */
function readHeroText(
  record: Record<string, unknown>,
  key: string,
  fallback: string
): string {
  const value = record[key];
  return typeof value === "string" ? value : fallback;
}

/** Lit une source d'image imbriquée avec repli (legacy ou défaut). */
function readArtSource(
  record: Record<string, unknown>,
  key: string,
  fallback: ArtSource
): ArtSource {
  const raw = record[key];
  if (isRecord(raw)) {
    const url = typeof raw.url === "string" ? raw.url : fallback.url;
    const alt = typeof raw.alt === "string" ? raw.alt : fallback.alt;
    return { url, alt };
  }
  return cloneArtSource(fallback);
}

/**
 * Normalise un contenu Héro stocké (JSONB) vers un `HeroStaticContent` complet :
 * - `upgrade` du legacy « hero simple » (heading/subheading/media unique) ;
 * - fusion des champs manquants avec les défauts (pattern `resolveGalleryLayout`).
 * Zéro `any`. Rend le Front-Office robuste aux JSONB anciens / partiels.
 */
export function resolveHeroContent(raw: unknown): HeroStaticContent {
  if (!isRecord(raw)) {
    return createHeroStaticContent();
  }

  // Legacy « hero simple » (Étape 3.4) : heading/subheading/media {url,alt}.
  const legacyHeading = readHeroText(raw, "heading", "");
  const legacySubheading = readHeroText(raw, "subheading", "");
  const legacyCtaLabel = readHeroText(raw, "ctaLabel", "");
  const legacyCtaHref = readHeroText(raw, "ctaHref", "");

  const legacyMediaRaw = isRecord(raw.media) ? raw.media : {};
  const legacyUrl = typeof legacyMediaRaw.url === "string" ? legacyMediaRaw.url : "";
  const legacyAlt = typeof legacyMediaRaw.alt === "string" ? legacyMediaRaw.alt : "";

  // Repli image : si un média legacy unique existe, il couvre desktop + mobile ;
  // sinon défaut = placeholders (seulement quand le champ est absent, jamais un
  // URL volontairement vidé — la valeur "" est conservée telle quelle).
  const desktopFallback: ArtSource =
    legacyUrl !== ""
      ? { url: legacyUrl, alt: legacyAlt }
      : cloneArtSource(DEFAULT_HERO_STATIC_MEDIA.desktop);
  const mobileFallback: ArtSource =
    legacyUrl !== ""
      ? { url: legacyUrl, alt: legacyAlt }
      : cloneArtSource(DEFAULT_HERO_STATIC_MEDIA.mobile);
  const defaultTablet: ArtSource =
    DEFAULT_HERO_STATIC_MEDIA.tablet ?? { url: "", alt: "" };
  const tabletFallback: ArtSource | null =
    legacyUrl !== "" ? null : cloneArtSource(defaultTablet);

  return {
    variant: "static",
    overlayLevel: isHeroOverlay(raw.overlayLevel)
      ? raw.overlayLevel
      : DEFAULT_HERO_SHARED.overlayLevel,
    textTone: isHeroTextTone(raw.textTone)
      ? raw.textTone
      : DEFAULT_HERO_SHARED.textTone,
    titleH1: readHeroText(
      raw,
      "titleH1",
      legacyHeading || DEFAULT_HERO_SHARED.titleH1
    ),
    subtitleH2: readHeroText(
      raw,
      "subtitleH2",
      legacySubheading || DEFAULT_HERO_SHARED.subtitleH2
    ),
    descriptionText: readHeroText(
      raw,
      "descriptionText",
      DEFAULT_HERO_SHARED.descriptionText
    ),
    weightH1: isFontWeight(raw.weightH1)
      ? raw.weightH1
      : DEFAULT_HERO_SHARED.weightH1,
    weightH2: isFontWeight(raw.weightH2)
      ? raw.weightH2
      : DEFAULT_HERO_SHARED.weightH2,
    weightText: isFontWeight(raw.weightText)
      ? raw.weightText
      : DEFAULT_HERO_SHARED.weightText,
    ctaShow: isCtaShow(raw.ctaShow)
      ? raw.ctaShow
      : legacyCtaLabel !== ""
        ? true
        : DEFAULT_HERO_SHARED.ctaShow,
    ctaLabel: readHeroText(
      raw,
      "ctaLabel",
      legacyCtaLabel || DEFAULT_HERO_SHARED.ctaLabel
    ),
    ctaHref: readHeroText(
      raw,
      "ctaHref",
      legacyCtaHref || DEFAULT_HERO_SHARED.ctaHref
    ),
    ctaStyle: isHeroCtaStyle(raw.ctaStyle)
      ? raw.ctaStyle
      : DEFAULT_HERO_SHARED.ctaStyle,
    media: {
      desktop: readArtSource(raw.media as Record<string, unknown>, "desktop", desktopFallback),
      mobile: readArtSource(raw.media as Record<string, unknown>, "mobile", mobileFallback),
      tablet: (() => {
        const media = isRecord(raw.media) ? raw.media : {};
        if (isRecord(media.tablet)) {
          return readArtSource(media, "tablet", defaultTablet);
        }
        return tabletFallback;
      })(),
    },
  };
}

/** Item de prestation / tarif (module `services`). */
export interface ServiceItem {
  id: string; // stable (mock : crypto.randomUUID())
  title: string;
  description: string;
  price: string; // ex. « à partir de 190 € »
}

/** Item de question / réponse (module `faq`). */
export interface FaqItem {
  id: string; // stable (mock : crypto.randomUUID())
  question: string;
  answer: string;
}

/** Visuel de galerie (module `gallery`) : URL + alt SEO. */
export interface GalleryImage {
  id: string; // stable (mock : crypto.randomUUID())
  url: string;
  alt: string;
  /** Nom du fichier source (informations d'édition, ex. « mariage-1.jpg »). */
  filename?: string;
  /** Titre court affiché sur l'overlay au survol (vide par défaut). */
  title?: string;
  /** Description libre affichée dans le diaporama (vide par défaut). */
  description?: string;
  /** Dimensions naturelles (px) — renseignées à l'upload (mode masonry). */
  width?: number;
  height?: number;
  /** Vrai si la photo est masquée du site public (toggle œil, 4.3). */
  hidden?: boolean;
}

/**
 * Mode d'affichage d'une galerie :
 * - `"uniform"` : grille régulière (toutes les vignettes au même format) ;
 * - `"masonry"` : colonnes à hauteurs libres (effet éditorial, type Pinterest).
 * (Anciennement `GalleryVariant` — renommé pour libérer le champ `variant` au
 * profit de la variante de module : static / dynamic / portfolio.)
 */
export type GalleryDisplayMode = "uniform" | "masonry";

/**
 * Variantes de la rubrique « Galeries & Portfolio » (famille `type: "gallery"`).
 * Le contenu JSONB est discriminé par `variant`, à l'image de la rubrique Héro.
 * Aucune migration BDD : l'enum `module_type` conserve la seule valeur `gallery`.
 */
export type GalleryModuleVariant = "static" | "dynamic" | "portfolio";

/**
 * Animation au survol des vignettes d'une galerie :
 * - `"active"` : zoom subtil + élévation/ombre + overlay titre au survol ;
 * - `"none"`   : aucune animation au survol (affichage statique des vignettes).
 */
export type GalleryHoverAnimation = "active" | "none";

/** Libellés français (Select, cf. design « Animation d’entrée »). */
export const galleryHoverAnimationLabels: Record<GalleryHoverAnimation, string> = {
  active: "Zoom et élévation douce",
  none: "Aucun effet",
};

/** Ordre d'affichage dans le sélecteur. */
export const galleryHoverAnimationOrder: GalleryHoverAnimation[] = [
  "none",
  "active",
];

/* ==========================================================================
   RUBRIQUE « GALERIES & PORTFOLIO » (Phase 11)
   --------------------------------------------------------------------------
   Famille unique `type: "gallery"` dont le contenu JSONB est discriminé par
   `variant` (comme la rubrique Héro) :
     - static    : décor / mosaïque fixe, aucune interactivité de clic ;
     - dynamic   : grille interactive, double-clic → diaporama complet ;
     - portfolio : couvertures d'albums, clic simple → album exclusif.
   Socle commun : mise en page, effet de finition (exclusif), ombre, bordure,
   CTA de pied de galerie et réglages de Lightbox. Zéro `any`.

   Référence : plans/ROADMAP-11.1-galleries-portfolio.md
   ========================================================================== */

/** Effets de finition exclusifs — un seul actif à la fois. */
export type GalleryEffectId = "none" | "museum-pass" | "glass" | "polaroid";

/** Intensité d'un effet de finition. */
export type GalleryEffectIntensity = "light" | "normal" | "strong";

/** Niveaux d'ombre portée (le cahier des charges ajoute `medium`). */
export type GalleryShadowLevel =
  | "none"
  | "light"
  | "medium"
  | "normal"
  | "strong";

/** Bordure optionnelle : épaisseur + couleur. */
export interface GalleryBorderSettings {
  enabled: boolean;
  /** Épaisseur du trait, en px. */
  width: number;
  /** Couleur CSS (hex). */
  color: string;
}

/** CTA de pied de galerie (mêmes conditions habituelles que le Héro). */
export interface GalleryCtaSettings {
  show: boolean;
  label: string;
  href: string;
  style: HeroCtaStyle;
}

/** Réglages de la Lightbox / diaporama (variantes dynamic & portfolio). */
export interface GalleryLightboxSettings {
  /** Active le zoom HD et le cycle de zoom au double-clic. */
  zoomEnabled: boolean;
  /** Facteur du niveau de zoom 1 (défaut 1,5×). */
  zoomLevel1: number;
  /** Facteur du niveau de zoom 2 (défaut 2,5×). */
  zoomLevel2: number;
  /** Affiche les informations EXIF (si disponibles). */
  showExif: boolean;
  /** Affiche le titre / la description dans le diaporama. */
  showCaption: boolean;
}

/** Position du badge de l'album sur la couverture (Portfolio). */
export type GalleryBadgePosition =
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right"
  | "center";

/** Style visuel du badge d'album. */
export type GalleryBadgeStyle = "solid" | "glass" | "outline";

/**
 * Moment d'affichage du texte de couverture (Portfolio) :
 *   - `always` : toujours visible (défaut — comportement historique) ;
 *   - `hover`  : révélé au survol de la couverture **et** au focus clavier ;
 *   - `none`   : aucun texte sur les couvertures.
 */
export type GalleryBadgeDisplay = "none" | "always" | "hover";

/**
 * Affichage sur les couvertures d'albums (Portfolio).
 *
 * Distinction volontaire entre **quoi** afficher (`showLabel` / `showCount`) et
 * **quand** l'afficher (`display`) : les deux réglages sont indépendants, ce qui
 * évite d'avoir à reconfigurer le contenu quand on change seulement le moment.
 */
export interface GalleryBadgeSettings {
  /** Moment d'affichage (voir `GalleryBadgeDisplay`). */
  display: GalleryBadgeDisplay;
  showLabel: boolean;
  showCount: boolean;
  position: GalleryBadgePosition;
  style: GalleryBadgeStyle;
}

/** Paramétrage contextuel de l'effet de finition sélectionné. */
export interface GalleryEffectSettings {
  effect: GalleryEffectId;
  intensity: GalleryEffectIntensity;
  /** Passe-partout : couleur de la marge nacre. */
  matColor: string;
  /** Passe-partout : biseau intérieur. */
  matBevel: boolean;
  /** Sous-verre : flou du verre, en px. */
  glassBlur: number;
  /** Sous-verre : teinte du voile translucide. */
  glassTint: string;
  /** Polaroid : légende sur la bande blanche. */
  polaroidCaptionShow: boolean;
  /** Polaroid : légère rotation aléatoire (aspect argentique). */
  polaroidRotation: boolean;
}

/** Mise en page d'une galerie (grille, espacements, finitions, survol). */
export interface GalleryLayoutOptions {
  /** Mode d'affichage : uniforme (grille) ou masonry (colonnes libres). */
  display: GalleryDisplayMode;
  /** Nombre de colonnes (desktop ; dégradé automatiquement sur petit écran). */
  columns: number;
  /** Espace horizontal entre deux photos, en px. */
  gapHorizontal: number;
  /** Espace vertical entre deux lignes de photos, en px. */
  gapVertical: number;
  /** Arrondi des coins des vignettes, en px. */
  radius: number;
  /** Ombre portée (activée par défaut : « normal »). */
  shadow: GalleryShadowLevel;
  /** Bordure optionnelle (épaisseur + couleur). */
  border: GalleryBorderSettings;
  /** Interrupteur **général** des effets de survol (« active » / « none »). */
  hoverAnimation: GalleryHoverAnimation;
  /**
   * « **Accentuation de la lisibilité** » (nommée ainsi en 11.23) : au survol,
   * assombrit l'image **depuis le bas de la vignette vers le haut**, pour que le
   * texte posé sur la couverture reste lisible. Indépendant des autres effets —
   * donc **cumulable** avec eux.
   */
  hoverOverlay: boolean;
  /** Effets de survol optionnels et **cumulables** (zoom, élévation, parallaxe…). */
  hoverEffects: GalleryHoverEffects;
}

/**
 * ----------------------------------------------------------------------------
 * EFFETS DE SURVOL — famille optionnelle et **cumulable** (Étape 11.23)
 * ----------------------------------------------------------------------------
 * Chaque effet est **indépendant** : on peut n'en activer qu'un, ou les
 * combiner librement. Tous reposent sur les seules propriétés composées par le
 * GPU — `transform`, `filter`, `box-shadow` — donc **aucun recalcul de mise en
 * page** et aucune dégradation de la fluidité du défilement.
 *
 * Conditions d'application :
 *   - l'interrupteur général `layout.hoverAnimation === "active"` ;
 *   - un appareil à **survol réel** (`hover: hover` et `pointer: fine`) — sur
 *     écran tactile, aucun effet ne se déclenche, l'affichage reste stable ;
 *   - le **focus clavier** de la vignette déclenche les mêmes effets que le
 *     survol : un utilisateur au clavier n'est pas privé du retour visuel.
 *
 * **Accessibilité** : sous `prefers-reduced-motion: reduce`, la feuille de
 * styles ne se contente pas d'accélérer ces effets, elle les **supprime**
 * (voir `globals.css` § Effets de survol) — un zoom instantané au survol reste
 * une variation brutale pour les personnes sensibles au mouvement.
 *
 * **Repli** : `hoverEffects` absent d'un contenu enregistré avant cette étape
 * ⇒ `DEFAULT_GALLERY_HOVER_EFFECTS`, dont les valeurs reproduisent **exactement**
 * le rendu historique (zoom 105 %, élévation 4 px, aucun effet d'ambiance).
 * **Aucune migration BDD** : le champ est optionnel dans le schéma zod.
 * ----------------------------------------------------------------------------
 */
export interface GalleryHoverEffects {
  /** Zoom de l'image au survol, en pourcentage (100 = aucun zoom). */
  zoom: number;
  /** Élévation de la vignette au survol, en px (0 = aucune). */
  lift: number;
  /** Parallaxe : déplacement vertical de l'image **dans** son cadre, en px. */
  parallax: number;
  /** Brillance : reflet diagonal discret qui traverse la vignette. */
  shine: boolean;
  /** Saturation et contraste progressifs. */
  saturate: boolean;
  /** Bordure lumineuse, à la couleur d'accent du thème. */
  glow: boolean;
}

/** Socle commun des trois variantes de galerie. */
export interface GalleryBaseShared {
  heading: string;
  subheading: string;
  layout: GalleryLayoutOptions;
  /** Effet de finition exclusif + son paramétrage contextuel. */
  effect: GalleryEffectSettings;
  /** CTA de pied de galerie (affiché selon les conditions habituelles). */
  cta: GalleryCtaSettings;
  /** Réglages du diaporama (zoom, EXIF, légendes). */
  lightbox: GalleryLightboxSettings;
  /** Badge d'album (exploité par la variante portfolio). */
  badge: GalleryBadgeSettings;
}

/** Galerie STATIC — décor / mosaïque fixe (aucune interactivité de clic). */
export interface GalleryStaticContent extends GalleryBaseShared {
  variant: "static";
  images: GalleryImage[];
}

/** Galerie DYNAMIC — double-clic → diaporama de toutes les images. */
export interface GalleryDynamicContent extends GalleryBaseShared {
  variant: "dynamic";
  images: GalleryImage[];
}

/** Album de la galerie PORTFOLIO. */
export interface GalleryAlbum {
  id: string;
  /** Nom de l'album (ex. « Mariage », « Portrait »). */
  label: string;
  description: string;
  /** Id de l'image de couverture (dans `images`) ; null ⇒ première image. */
  coverImageId: string | null;
  images: GalleryImage[];
  /**
   * Album **masqué du site public** (Étape 11.20). Champ absent des contenus
   * antérieurs ⇒ repli `false` à la lecture (les albums existants restent
   * visibles ; aucune migration BDD).
   */
  hidden: boolean;
}

/** Galerie PORTFOLIO — couvertures d'albums, clic simple → album. */
export interface GalleryPortfolioContent extends GalleryBaseShared {
  variant: "portfolio";
  albums: GalleryAlbum[];
}

/** Union des contenus galerie (les 3 variantes partagent le socle commun). */
export type GalleryContent =
  | GalleryStaticContent
  | GalleryDynamicContent
  | GalleryPortfolioContent;

/** Variantes de module (familles exposant plusieurs cartes au catalogue). */
export type ModuleVariant =
  | HeroVariant
  | GalleryModuleVariant
  | ContentVariant
  | CardsVariant;

/** Libellés français des variantes de galerie (catalogue / éditeur). */
export const galleryVariantLabels: Record<GalleryModuleVariant, string> = {
  static: "Galerie fixe",
  dynamic: "Galerie interactive",
  portfolio: "Galerie portfolio",
};

/**
 * Libellés français des modes d'affichage de la grille.
 *
 * Vocabulaire **neutre** (« format », « vignettes ») à dessein : ces libellés
 * sont **partagés par les trois variantes** — ils doivent rester vrais qu'il
 * s'agisse de photos (static / dynamic) ou de **couvertures d'albums**
 * (portfolio). « Grille régulière » et « Mosaïque » décrivaient la technique et
 * se sont révélés difficiles à comprendre : ils décrivent désormais le
 * **résultat visible**. Aucune valeur stockée ne change.
 */
export const galleryDisplayLabels: Record<GalleryDisplayMode, string> = {
  uniform: "Toutes au même format",
  masonry: "Chacune à son format",
};

/**
 * Explications des modes d'affichage, affichées **sous chaque option dans la
 * liste déroulante** (`SelectItem` → `description`) plutôt qu'en aide sous le
 * champ : la phrase ne redit pas le libellé, elle l'illustre, et elle reste au
 * contact de l'option concernée.
 */
export const galleryDisplayDescriptions: Record<GalleryDisplayMode, string> = {
  uniform: "Des vignettes de forme identique, alignées en lignes régulières.",
  masonry:
    "Chaque vignette garde ses proportions — portrait ou paysage — et les colonnes se décalent.",
};

/**
 * Vocabulaire de l'**objet** affiché dans une grille, selon la variante
 * (Étape 11.20.c).
 *
 * Les zones d'édition sont **partagées par les trois variantes** : écrire
 * « couvertures d'albums » en dur mentirait sur `static` et `dynamic`, qui
 * n'affichent que des photos. Chaque libellé dérivé de l'objet affiché passe
 * donc par ici — « Arrondi des couvertures d'albums » en portfolio, « Arrondi
 * des photos » ailleurs.
 */
export function galleryItemWording(variant: GalleryModuleVariant): {
  /** Singulier : « couverture d'album » / « photo ». */
  singular: string;
  /** Pluriel contracté, pour les libellés « … des X ». */
  plural: string;
} {
  return variant === "portfolio"
    ? { singular: "couverture d’album", plural: "couvertures d’albums" }
    : { singular: "photo", plural: "photos" };
}

/** Ordre d'affichage des modes d'affichage (Select éditeur). */
export const galleryDisplayOrder: GalleryDisplayMode[] = ["uniform", "masonry"];

/** Ordre d'affichage des effets de finition (Select éditeur). */
export const galleryEffectOrder: GalleryEffectId[] = [
  "none",
  "museum-pass",
  "glass",
  "polaroid",
];

/** Libellés français des effets de finition. */
export const galleryEffectLabels: Record<GalleryEffectId, string> = {
  none: "Aucun effet",
  "museum-pass": "Passe-partout de Musée",
  glass: "Sous-Verre",
  polaroid: "Polaroid (papier glacé)",
};

/** Ordre d'affichage des intensités d'effet. */
export const galleryEffectIntensityOrder: GalleryEffectIntensity[] = [
  "light",
  "normal",
  "strong",
];

/** Libellés français des intensités d'effet. */
export const galleryEffectIntensityLabels: Record<
  GalleryEffectIntensity,
  string
> = {
  light: "Légère",
  normal: "Normale",
  strong: "Marquée",
};

/** Ordre d'affichage des niveaux d'ombre. */
export const galleryShadowOrder: GalleryShadowLevel[] = [
  "none",
  "light",
  "medium",
  "normal",
  "strong",
];

/** Libellés français des niveaux d'ombre. */
export const galleryShadowLabels: Record<GalleryShadowLevel, string> = {
  none: "Aucune",
  light: "Très discrète",
  medium: "Discrète",
  normal: "Normale",
  strong: "Forte",
};

/** Ordre d'affichage des positions de badge. */
export const galleryBadgePositionOrder: GalleryBadgePosition[] = [
  "top-left",
  "top-right",
  "bottom-left",
  "bottom-right",
  "center",
];

/** Libellés français des positions de badge. */
export const galleryBadgePositionLabels: Record<GalleryBadgePosition, string> = {
  "top-left": "Haut gauche",
  "top-right": "Haut droite",
  "bottom-left": "Bas gauche",
  "bottom-right": "Bas droite",
  center: "Centré",
};

/** Ordre d'affichage des styles de badge. */
export const galleryBadgeStyleOrder: GalleryBadgeStyle[] = [
  "solid",
  "glass",
  "outline",
];

/** Libellés français des styles de badge. */
export const galleryBadgeStyleLabels: Record<GalleryBadgeStyle, string> = {
  solid: "Plein (foncé)",
  glass: "Sous-verre",
  outline: "Contour clair",
};

/** Ordre d'affichage des moments d'affichage du texte de couverture. */
export const galleryBadgeDisplayOrder: GalleryBadgeDisplay[] = [
  "always",
  "hover",
  "none",
];

/** Libellés français des moments d'affichage (formulés pour un non-technicien). */
export const galleryBadgeDisplayLabels: Record<GalleryBadgeDisplay, string> = {
  always: "Affiché en permanence",
  hover: "Affiché au survol de la photo",
  none: "Aucun affichage",
};

/**
 * Valeurs par défaut des effets de survol (Étape 11.23).
 *
 * Elles sont choisies pour reproduire **à l'identique** le rendu des galeries
 * antérieures à cette étape (zoom 105 %, élévation 4 px — valeurs qui étaient
 * alors écrites en dur dans `GalleryItem`), de sorte qu'activer l'interrupteur
 * général ne change rien pour un contenu existant. Les effets d'ambiance sont
 * **désactivés** par défaut : un site publié ne doit pas se mettre à scintiller
 * parce qu'une option a été ajoutée.
 */
export const DEFAULT_GALLERY_HOVER_EFFECTS: GalleryHoverEffects = {
  zoom: 105,
  lift: 4,
  parallax: 0,
  shine: false,
  saturate: false,
  glow: false,
};

/** Valeurs par défaut de la mise en page (toutes variantes). */
export const DEFAULT_GALLERY_LAYOUT: GalleryLayoutOptions = {
  display: "uniform",
  columns: 3,
  gapHorizontal: 16,
  gapVertical: 16,
  radius: 12,
  shadow: "normal",
  border: { enabled: false, width: 1, color: "#EAE5E5" },
  hoverAnimation: "none",
  hoverOverlay: false,
  hoverEffects: { ...DEFAULT_GALLERY_HOVER_EFFECTS },
};

/** Valeurs par défaut des effets de finition. */
export const DEFAULT_GALLERY_EFFECT: GalleryEffectSettings = {
  effect: "none",
  intensity: "normal",
  matColor: "#FAF8F8",
  matBevel: true,
  glassBlur: 12,
  glassTint: "#FFFFFF",
  polaroidCaptionShow: true,
  polaroidRotation: true,
};

/** Valeurs par défaut du CTA de pied de galerie (masqué par défaut). */
export const DEFAULT_GALLERY_CTA: GalleryCtaSettings = {
  show: false,
  label: "",
  href: "",
  style: "primary",
};

/** Valeurs par défaut de la Lightbox (zoom 1,5× / 2,5×, EXIF et légendes on). */
export const DEFAULT_GALLERY_LIGHTBOX: GalleryLightboxSettings = {
  zoomEnabled: true,
  zoomLevel1: 1.5,
  zoomLevel2: 2.5,
  showExif: true,
  showCaption: true,
};

/** Valeurs par défaut du badge d'album (Portfolio). */
export const DEFAULT_GALLERY_BADGE: GalleryBadgeSettings = {
  // « always » préserve le rendu des contenus enregistrés avant l'ajout du
  // réglage (aucun champ `display` persisté) : aucune migration nécessaire.
  display: "always",
  showLabel: true,
  showCount: true,
  position: "bottom-left",
  style: "glass",
};

/** Lit une chaîne avec repli sur une valeur par défaut. */
function readString(value: unknown, fallback: string): string {
  return typeof value === "string" ? value : fallback;
}

/** Lit un nombre borné avec repli sur une valeur par défaut. */
function readBoundedNumber(
  value: unknown,
  fallback: number,
  min: number,
  max: number
): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return fallback;
  }
  return Math.min(Math.max(value, min), max);
}

/** Lit une couleur CSS (hex) avec repli. */
function readColor(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() !== "" ? value : fallback;
}

/** Copie profonde d'une mise en page (aucune référence partagée). */
export function cloneGalleryLayout(
  layout: GalleryLayoutOptions
): GalleryLayoutOptions {
  return { ...layout, border: { ...layout.border } };
}

/**
 * Fusionne une mise en page partielle avec les défauts (+ lecture legacy).
 * `layout` est accepté en `unknown` : robuste aux JSONB anciens / partiels.
 */
export function resolveGalleryLayout(layout: unknown): GalleryLayoutOptions {
  const record = isRecord(layout) ? layout : {};
  // Legacy (Phase 6.2) : le mode d'affichage s'appelait `variant` (uniform/masonry).
  const legacy = record.variant;
  const display: GalleryDisplayMode =
    record.display === "uniform" || record.display === "masonry"
      ? record.display
      : legacy === "uniform" || legacy === "masonry"
        ? legacy
        : DEFAULT_GALLERY_LAYOUT.display;

  return {
    display,
    columns: readBoundedNumber(
      record.columns,
      DEFAULT_GALLERY_LAYOUT.columns,
      1,
      6
    ),
    gapHorizontal: readBoundedNumber(
      record.gapHorizontal,
      DEFAULT_GALLERY_LAYOUT.gapHorizontal,
      0,
      200
    ),
    gapVertical: readBoundedNumber(
      record.gapVertical,
      DEFAULT_GALLERY_LAYOUT.gapVertical,
      0,
      200
    ),
    radius: readBoundedNumber(
      record.radius,
      DEFAULT_GALLERY_LAYOUT.radius,
      0,
      200
    ),
    shadow: galleryShadowOrder.includes(record.shadow as GalleryShadowLevel)
      ? (record.shadow as GalleryShadowLevel)
      : DEFAULT_GALLERY_LAYOUT.shadow,
    border: resolveGalleryBorder(record.border),
    hoverAnimation:
      record.hoverAnimation === "active" || record.hoverAnimation === "none"
        ? record.hoverAnimation
        : DEFAULT_GALLERY_LAYOUT.hoverAnimation,
    hoverOverlay:
      typeof record.hoverOverlay === "boolean"
        ? record.hoverOverlay
        : DEFAULT_GALLERY_LAYOUT.hoverOverlay,
    // Repli champ par champ : un contenu enregistré avant la 11.23 n'a pas de
    // `hoverEffects` ; un contenu plus récent peut n'en avoir qu'une partie.
    hoverEffects: resolveGalleryHoverEffects(record.hoverEffects),
  };
}

/**
 * Normalise la famille d'effets de survol (Étape 11.23).
 *
 * **Repli champ par champ** plutôt que bloc par bloc : si un contenu ne porte
 * qu'une partie des réglages (version intermédiaire, saisie partielle), les
 * autres reprennent leur valeur par défaut au lieu d'être perdus. Les nombres
 * sont bornés aux mêmes plages que les contrôles de l'éditeur, pour qu'aucune
 * valeur héritée ne puisse produire un rendu aberrant.
 */
export function resolveGalleryHoverEffects(
  raw: unknown
): GalleryHoverEffects {
  const record = isRecord(raw) ? raw : {};
  const defaults = DEFAULT_GALLERY_HOVER_EFFECTS;
  return {
    zoom: readBoundedNumber(record.zoom, defaults.zoom, 100, 118),
    lift: readBoundedNumber(record.lift, defaults.lift, 0, 16),
    parallax: readBoundedNumber(record.parallax, defaults.parallax, 0, 12),
    shine:
      typeof record.shine === "boolean" ? record.shine : defaults.shine,
    saturate:
      typeof record.saturate === "boolean"
        ? record.saturate
        : defaults.saturate,
    glow: typeof record.glow === "boolean" ? record.glow : defaults.glow,
  };
}

/** Normalise la bordure (épaisseur + couleur). */
export function resolveGalleryBorder(raw: unknown): GalleryBorderSettings {
  const record = isRecord(raw) ? raw : {};
  return {
    enabled:
      typeof record.enabled === "boolean"
        ? record.enabled
        : DEFAULT_GALLERY_LAYOUT.border.enabled,
    width: readBoundedNumber(
      record.width,
      DEFAULT_GALLERY_LAYOUT.border.width,
      0,
      24
    ),
    color: readColor(record.color, DEFAULT_GALLERY_LAYOUT.border.color),
  };
}

/** Normalise l'effet de finition + son paramétrage contextuel. */
export function resolveGalleryEffect(raw: unknown): GalleryEffectSettings {
  const record = isRecord(raw) ? raw : {};
  return {
    effect: galleryEffectOrder.includes(record.effect as GalleryEffectId)
      ? (record.effect as GalleryEffectId)
      : DEFAULT_GALLERY_EFFECT.effect,
    intensity: galleryEffectIntensityOrder.includes(
      record.intensity as GalleryEffectIntensity
    )
      ? (record.intensity as GalleryEffectIntensity)
      : DEFAULT_GALLERY_EFFECT.intensity,
    matColor: readColor(record.matColor, DEFAULT_GALLERY_EFFECT.matColor),
    matBevel:
      typeof record.matBevel === "boolean"
        ? record.matBevel
        : DEFAULT_GALLERY_EFFECT.matBevel,
    glassBlur: readBoundedNumber(
      record.glassBlur,
      DEFAULT_GALLERY_EFFECT.glassBlur,
      0,
      40
    ),
    glassTint: readColor(record.glassTint, DEFAULT_GALLERY_EFFECT.glassTint),
    polaroidCaptionShow:
      typeof record.polaroidCaptionShow === "boolean"
        ? record.polaroidCaptionShow
        : DEFAULT_GALLERY_EFFECT.polaroidCaptionShow,
    polaroidRotation:
      typeof record.polaroidRotation === "boolean"
        ? record.polaroidRotation
        : DEFAULT_GALLERY_EFFECT.polaroidRotation,
  };
}

/** Normalise le CTA de pied de galerie. */
export function resolveGalleryCta(raw: unknown): GalleryCtaSettings {
  const record = isRecord(raw) ? raw : {};
  return {
    show:
      typeof record.show === "boolean"
        ? record.show
        : DEFAULT_GALLERY_CTA.show,
    label: readString(record.label, DEFAULT_GALLERY_CTA.label),
    href: readString(record.href, DEFAULT_GALLERY_CTA.href),
    style: isHeroCtaStyle(record.style)
      ? record.style
      : DEFAULT_GALLERY_CTA.style,
  };
}

/** Normalise les réglages de Lightbox (zoom / EXIF / légendes). */
export function resolveGalleryLightbox(raw: unknown): GalleryLightboxSettings {
  const record = isRecord(raw) ? raw : {};
  return {
    zoomEnabled:
      typeof record.zoomEnabled === "boolean"
        ? record.zoomEnabled
        : DEFAULT_GALLERY_LIGHTBOX.zoomEnabled,
    zoomLevel1: readBoundedNumber(
      record.zoomLevel1,
      DEFAULT_GALLERY_LIGHTBOX.zoomLevel1,
      1.1,
      4
    ),
    zoomLevel2: readBoundedNumber(
      record.zoomLevel2,
      DEFAULT_GALLERY_LIGHTBOX.zoomLevel2,
      1.1,
      8
    ),
    showExif:
      typeof record.showExif === "boolean"
        ? record.showExif
        : DEFAULT_GALLERY_LIGHTBOX.showExif,
    showCaption:
      typeof record.showCaption === "boolean"
        ? record.showCaption
        : DEFAULT_GALLERY_LIGHTBOX.showCaption,
  };
}

/** Normalise le badge d'album (moment, visibilité, style, position). */
export function resolveGalleryBadge(raw: unknown): GalleryBadgeSettings {
  const record = isRecord(raw) ? raw : {};
  return {
    display: galleryBadgeDisplayOrder.includes(
      record.display as GalleryBadgeDisplay
    )
      ? (record.display as GalleryBadgeDisplay)
      : DEFAULT_GALLERY_BADGE.display,
    showLabel:
      typeof record.showLabel === "boolean"
        ? record.showLabel
        : DEFAULT_GALLERY_BADGE.showLabel,
    showCount:
      typeof record.showCount === "boolean"
        ? record.showCount
        : DEFAULT_GALLERY_BADGE.showCount,
    position: galleryBadgePositionOrder.includes(
      record.position as GalleryBadgePosition
    )
      ? (record.position as GalleryBadgePosition)
      : DEFAULT_GALLERY_BADGE.position,
    style: galleryBadgeStyleOrder.includes(record.style as GalleryBadgeStyle)
      ? (record.style as GalleryBadgeStyle)
      : DEFAULT_GALLERY_BADGE.style,
  };
}

/** Lit une image de galerie stockée (JSONB) vers une image complète. */
function readGalleryImage(raw: unknown): GalleryImage | null {
  if (!isRecord(raw)) {
    return null;
  }
  const image: GalleryImage = {
    id: readString(raw.id, crypto.randomUUID()),
    url: readString(raw.url, ""),
    alt: readString(raw.alt, ""),
  };
  if (typeof raw.filename === "string") image.filename = raw.filename;
  if (typeof raw.title === "string") image.title = raw.title;
  if (typeof raw.description === "string") image.description = raw.description;
  if (typeof raw.width === "number") image.width = raw.width;
  if (typeof raw.height === "number") image.height = raw.height;
  if (raw.hidden === true) image.hidden = true;
  return image;
}

/** Lit un tableau d'images stockées (JSONB). */
function readGalleryImages(raw: unknown): GalleryImage[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw
    .map(readGalleryImage)
    .filter((image): image is GalleryImage => image !== null);
}

/** Normalise les albums d'une galerie portfolio. */
function resolveGalleryAlbums(raw: unknown): GalleryAlbum[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw.filter(isRecord).map((record) => {
    const images = readGalleryImages(record.images);
    const coverRaw = record.coverImageId;
    const coverImageId =
      typeof coverRaw === "string" &&
      images.some((image) => image.id === coverRaw)
        ? coverRaw
        : (images[0]?.id ?? null);
    return {
      id: readString(record.id, crypto.randomUUID()),
      label: readString(record.label, "Album"),
      description: readString(record.description, ""),
      coverImageId,
      images,
      // Repli `false` : les albums enregistrés avant la 11.20 restent visibles.
      hidden: record.hidden === true,
    };
  });
}

/** Fabrique une galerie statique (défauts : décor figé, ombre activée). */
export function createGalleryStaticContent(): GalleryStaticContent {
  return {
    variant: "static",
    heading: "Mes dernières réalisations",
    subheading: "",
    layout: cloneGalleryLayout({
      ...DEFAULT_GALLERY_LAYOUT,
      shadow: "normal",
      hoverAnimation: "none",
      hoverOverlay: false,
    }),
    effect: { ...DEFAULT_GALLERY_EFFECT },
    cta: { ...DEFAULT_GALLERY_CTA },
    lightbox: { ...DEFAULT_GALLERY_LIGHTBOX, zoomEnabled: false },
    badge: { ...DEFAULT_GALLERY_BADGE },
    // Départ vide : l'utilisateur importe ses propres photos (aucun masque à
    // compléter). Un message d'aide s'affiche tant que la galerie est vide.
    images: [],
  };
}

/** Fabrique une galerie dynamique (défauts : survol actif, double-clic). */
export function createGalleryDynamicContent(): GalleryDynamicContent {
  return {
    variant: "dynamic",
    heading: "Ma galerie",
    subheading: "",
    layout: cloneGalleryLayout({
      ...DEFAULT_GALLERY_LAYOUT,
      shadow: "normal",
      hoverAnimation: "active",
      hoverOverlay: false,
    }),
    effect: { ...DEFAULT_GALLERY_EFFECT },
    cta: { ...DEFAULT_GALLERY_CTA },
    lightbox: { ...DEFAULT_GALLERY_LIGHTBOX, zoomEnabled: true },
    badge: { ...DEFAULT_GALLERY_BADGE },
    images: [],
  };
}

/** Fabrique un album vide. */
export function createGalleryAlbum(label: string): GalleryAlbum {
  return {
    id: crypto.randomUUID(),
    label,
    description: "",
    coverImageId: null,
    images: [],
    hidden: false,
  };
}

/** Fabrique une galerie portfolio (aucun album pré-créé). */
export function createGalleryPortfolioContent(): GalleryPortfolioContent {
  return {
    variant: "portfolio",
    heading: "Portfolio",
    subheading: "",
    layout: cloneGalleryLayout({
      ...DEFAULT_GALLERY_LAYOUT,
      shadow: "normal",
      hoverAnimation: "active",
      hoverOverlay: false,
    }),
    effect: { ...DEFAULT_GALLERY_EFFECT },
    cta: { ...DEFAULT_GALLERY_CTA },
    lightbox: { ...DEFAULT_GALLERY_LIGHTBOX, zoomEnabled: true },
    badge: { ...DEFAULT_GALLERY_BADGE },
    // Aucun album pré-créé : les albums sont ajoutés dynamiquement
    // (autant que souhaité) depuis l'éditeur, chacun avec ses propres photos.
    albums: [],
  };
}

/** Fabrique un contenu galerie selon la variante demandée (défaut static). */
export function createGalleryContent(
  variant?: GalleryModuleVariant
): GalleryContent {
  if (variant === "dynamic") {
    return createGalleryDynamicContent();
  }
  if (variant === "portfolio") {
    return createGalleryPortfolioContent();
  }
  return createGalleryStaticContent();
}

/**
 * Normalise un contenu galerie stocké (JSONB) vers une variante complète :
 * - absence de `variant` → `"static"` (legacy « Galerie photo masonry ») ;
 * - `layout.variant` legacy → `layout.display` ;
 * - fusion des défauts manquants, copie sans référence partagée. Zéro `any`.
 */
export function resolveGalleryContent(raw: unknown): GalleryContent {
  const record = isRecord(raw) ? raw : {};
  const variant: GalleryModuleVariant =
    record.variant === "dynamic" || record.variant === "portfolio"
      ? record.variant
      : "static";

  const defaultHeading: Record<GalleryModuleVariant, string> = {
    static: "Mes dernières réalisations",
    dynamic: "Ma galerie",
    portfolio: "Portfolio",
  };

  const shared: GalleryBaseShared = {
    heading: readString(record.heading, defaultHeading[variant]),
    subheading: readString(record.subheading, ""),
    layout: resolveGalleryLayout(record.layout),
    effect: resolveGalleryEffect(record.effect),
    cta: resolveGalleryCta(record.cta),
    lightbox: resolveGalleryLightbox(record.lightbox),
    badge: resolveGalleryBadge(record.badge),
  };

  if (variant === "portfolio") {
    return { variant, ...shared, albums: resolveGalleryAlbums(record.albums) };
  }
  if (variant === "dynamic") {
    return {
      variant: "dynamic",
      ...shared,
      images: readGalleryImages(record.images),
    };
  }
  return {
    variant: "static",
    ...shared,
    images: readGalleryImages(record.images),
  };
}

/**
 * Toutes les images visibles d'un contenu galerie (SEO / OG / LCP).
 * Étape 11.20 : les images des **albums masqués** sont exclues (un album retiré
 * du site ne doit pas réapparaître dans les métadonnées de partage).
 */
export function galleryImageSources(content: GalleryContent): GalleryImage[] {
  const images =
    content.variant === "portfolio"
      ? content.albums
          .filter((album) => !album.hidden)
          .flatMap((album) => album.images)
      : content.images;
  return images.filter((image) => image.url !== "" && !image.hidden);
}

/** Couverture d'un album (image désignée, sinon première image disponible). */
export function galleryAlbumCover(album: GalleryAlbum): GalleryImage | null {
  if (album.coverImageId) {
    const designated = album.images.find(
      (image) => image.id === album.coverImageId
    );
    if (designated) {
      return designated;
    }
  }
  return (
    album.images.find((image) => image.url !== "") ?? album.images[0] ?? null
  );
}

/** Nombre de photos visibles d'un album (badge Portfolio). */
export function galleryAlbumPhotoCount(album: GalleryAlbum): number {
  return album.images.filter((image) => image.url !== "" && !image.hidden)
    .length;
}

/* ==========================================================================
   RUBRIQUE « CONTENU » — section de contenu en colonnes (Étape 12.1)
   --------------------------------------------------------------------------
   Nouvelle famille `type: "content"`, variante `"columns"` : l'utilisateur
   compose du contenu mis en forme (texte riche, images, icônes) et le répartit
   dans 1 à 4 colonnes — au sens des « colonnes » de Word, c'est-à-dire des
   **conteneurs indépendants** posés côte à côte, qui s'empilent sur mobile.

   Deux décisions structurantes sont **encodées par les types**, jamais laissées
   à la discipline du développeur :

   1. **Aucune dimension en pixels.** La répartition entre colonnes est un
      **poids relatif** (`weight`) normalisé au rendu ; la largeur d'ensemble est
      un **jeton** (`ContentMaxWidth`). Un `weight` en pixels casserait le
      responsive à la première rotation d'écran ou au premier zoom.
   2. **Le HTML n'est jamais stocké.** Le texte riche est un document
      ProseMirror (`RichTextDoc`) : l'arbre JSON est la source de vérité, le HTML
      n'en est qu'une projection produite au rendu (`RichTextRenderer`, lot F).
      Un JSONB contenant du HTML serait ingérable — styles sauvages, surface
      d'injection ouverte, impossible à restreindre a posteriori.

   Rétro-compatibilité : le résolveur `resolveContentColumnsContent()` (lot A2)
   applique les défauts aux contenus partiels, comme `resolveGalleryContent` et
   `resolveCtaBannerContent` avant lui. **Aucune migration BDD** : tout vit dans
   le JSONB `content` du module.

   Référence : plans/ROADMAP-12.1-section-contenu-colonnes.md
   ========================================================================== */

/** Variantes de la rubrique Contenu (extension future : « flow » à la Word). */
export type ContentVariant = "columns";

/** Alignement horizontal d'un bloc ou d'un texte (atout « traitement de texte »). */
export type ContentTextAlign = "left" | "center" | "right" | "justify";

/**
 * Niveaux de titre autorisés dans le contenu.
 *
 * **H1 est volontairement exclu** : le titre de la page appartient au Héro
 * (`BaseHero` rend le seul `<h1>` de la page). Un second H1 dans une section
 * casserait la hiérarchie sémantique et le SEO — c'est la même contrainte qui a
 * conduit le bandeau CTA à rendre un `<h2>` (étape 11.27).
 */
export type ContentHeadingLevel = 2 | 3 | 4;

/** Taille d'une icône insérée dans le contenu. */
export type ContentIconSize = "sm" | "md" | "lg";

/** Largeur totale de la section — jeton, jamais une valeur en pixels. */
export type ContentMaxWidth = "narrow" | "standard" | "wide" | "full";

/**
 * Espacement entre colonnes.
 * Le **même** jeton pilote l'écart horizontal (`column-gap`) en grand écran et
 * l'écart vertical (`row-gap`) lorsque les colonnes s'empilent : un seul
 * réglage à comprendre pour l'utilisateur.
 */
export type ContentGap = "sm" | "md" | "lg";

/**
 * Seuil sous lequel les colonnes s'empilent.
 * Il s'apprécie sur la **largeur du module** (container query), jamais sur celle
 * de la fenêtre : le module peut vivre dans une page pleine largeur ou dans un
 * conteneur étroit, c'est sa propre largeur qui doit décider.
 */
export type ContentStackAt = "sm" | "md" | "lg";

/**
 * Nœud d'un document ProseMirror (texte riche).
 *
 * Volontairement ouvert : le modèle documentaire appartient à l'éditeur, pas au
 * domaine. Le rendu public le rejoue à travers une **liste blanche
 * d'extensions** (`rich-text-config.ts`, lot G) — il ne lui fait jamais
 * confiance sur parole.
 */
export type RichTextNode = Record<string, unknown>;

/** Document ProseMirror — la seule forme sous laquelle le texte riche est stocké. */
export interface RichTextDoc {
  type: "doc";
  content?: RichTextNode[];
}

/** Bloc de texte riche : un document ProseMirror. */
export interface ContentRichTextBlock {
  id: string;
  kind: "rich-text";
  doc: RichTextDoc;
}

/** Bloc image inséré dans le flux (média + largeur + alignement). */
export interface ContentImageBlock {
  id: string;
  kind: "image";
  media: MediaField;
  /** `full` = occupe toute la largeur de la colonne ; `auto` = largeur naturelle. */
  width: "auto" | "full";
  align: ContentTextAlign;
}

/**
 * Bloc icône — **le nom est stocké, jamais le balisage SVG**.
 *
 * Le rendu instancie le composant (`lucide-react`, déjà en dépendance) : poids
 * minimal, recoloration par `currentColor` (une icône suit donc le thème) et
 * surface d'injection nulle. Stocker du SVG brut offrirait exactement ce que le
 * point 2 du préambule interdit.
 */
export interface ContentIconBlock {
  id: string;
  kind: "icon";
  name: string;
  size: ContentIconSize;
  align: ContentTextAlign;
}

/** Bloc espacement vertical (respiration entre deux blocs d'une colonne). */
export interface ContentSpacerBlock {
  id: string;
  kind: "spacer";
  size: ContentGap;
}

/** Union discriminée des blocs composant une colonne (narrowing exhaustif). */
export type ContentBlock =
  | ContentRichTextBlock
  | ContentImageBlock
  | ContentIconBlock
  | ContentSpacerBlock;

/**
 * Une colonne : un **conteneur indépendant**, empilé sur mobile.
 *
 * Indépendance assumée — ce n'est **pas** le flux continu des « colonnes » de
 * Word, où le texte déborde d'une colonne dans la suivante. Ce modèle est le
 * seul qui permette d'affecter une image ou une icône à une colonne précise.
 */
export interface ContentContainer {
  id: string;
  /**
   * Poids relatif de répartition (ex. `1` et `2` pour un tiers / deux tiers).
   * **Ignoré quand `layout.sameWidth` est vrai** (colonnes d'égale largeur).
   */
  weight: number;
  /**
   * Sous-rubriques de la colonne, dans l'ordre du document. Une colonne est
   * créée avec **un bloc de texte vide** : le type par défaut est le texte, et
   * écrire ne demande aucune manipulation préalable.
   */
  blocks: ContentBlock[];
}

/**
 * Réglages d'affichage de la **zone d'en-tête facultative** (Étape 12.2),
 * posée au-dessus de l'ensemble des colonnes et **coiffant leur largeur
 * cumulée**.
 *
 * Trois éléments, **indépendamment activables**, dans cet ordre imposé :
 * titre `H2`, sous-titre `H3`, texte d'introduction. Chacun peut être omis sans
 * laisser de conteneur vide, de marge résiduelle ni de décalage — c'est le
 * rendu qui n'émet rien, et non le CSS qui masque.
 *
 * Le **texte du H2 n'est pas dupliqué ici** : il reste
 * [`ContentColumnsContent.heading`], qui existait déjà et alimente la
 * description de partage. Cette zone n'ajoute donc que ce qui manquait — les
 * trois interrupteurs et les deux éléments suivants. Conséquence directe : un
 * contenu enregistré **avant** cette étape conserve exactement le même rendu
 * (voir `resolveContentHeader`).
 */
export interface ContentHeaderContent {
  /** Affiche le titre H2 — dont le texte est lu dans `heading`. */
  showH2: boolean;
  /** Affiche le sous-titre H3 — dont le texte est lu dans `h3`. */
  showH3: boolean;
  /** Texte du sous-titre H3. */
  h3: string;
  /** Affiche le paragraphe d'introduction — dont le texte est lu dans `text`. */
  showText: boolean;
  /** Texte du paragraphe d'introduction (les sauts de ligne sont préservés). */
  text: string;
  /**
   * Alignement horizontal de l'ensemble de la zone : les trois éléments
   * s'alignent d'un seul geste, à gauche (défaut) ou centrés.
   */
  align: ContentHeaderAlign;
}

/**
 * Alignement horizontal de la zone d'en-tête d'une section de contenu.
 *
 * Deux valeurs seulement, et dans le vocabulaire de l'utilisateur : « Aligné à
 * gauche » (défaut, lecture naturelle) ou « Centré » (mise en scène d'un
 * titre). Aucun alignement à droite ni justifié : un en-tête de section justifié
 * produirait des blancs entre les mots sur une seule ligne.
 */
export type ContentHeaderAlign = "left" | "center";

/** Réglages de mise en page de la section — tous des jetons, aucun pixel. */
export interface ContentColumnsLayout {
  maxWidth: ContentMaxWidth;
  gap: ContentGap;
  /**
   * Colonnes d'égale largeur — miroir de la case « Largeur identique » de Word,
   * **cochée par défaut** : l'utilisateur obtient un partage équilibré sans rien
   * régler, et ne voit les réglages individuels qu'après l'avoir décochée.
   */
  sameWidth: boolean;
  /** Trait vertical entre les colonnes (« Ligne entre les colonnes » de Word). */
  separator: boolean;
  stackAt: ContentStackAt;
  /**
   * `stretch` (défaut) étire les colonnes à la hauteur de la plus haute — c'est
   * le comportement natif de CSS Grid et ce que demande l'énoncé ; `start` et
   * `center` laissent au contraire chaque colonne à sa hauteur propre.
   */
  verticalAlign: "stretch" | "start" | "center";
}

/** Contenu du module `content` (variante `columns`) — Étape 12.1. */
export interface ContentColumnsContent {
  type: "content";
  variant: "columns";
  /**
   * Texte du **titre H2** de la zone d'en-tête — source unique (la description
   * de partage le lit déjà). Son affichage est commandé par `header.showH2`.
   */
  heading: string;
  /** Zone d'en-tête facultative, au-dessus de l'ensemble des colonnes. */
  header: ContentHeaderContent;
  /**
   * 1 à 4 colonnes. L'invariant est garanti par l'éditeur **et** par le schéma
   * Zod (`contentColumnsContentSchema`, lot B) — jamais par convention orale.
   */
  containers: ContentContainer[];
  layout: ContentColumnsLayout;
}

/** Nombre de colonnes proposé par l'éditeur (1 à 4). */
export const CONTENT_COLUMN_COUNTS = [1, 2, 3, 4] as const;

/** Nombre de colonnes — type dérivé de la liste ci-dessus. */
export type ContentColumnCount = (typeof CONTENT_COLUMN_COUNTS)[number];

/** Ordre d'affichage des largeurs totales (éditeur). */
export const contentMaxWidthOrder: ContentMaxWidth[] = [
  "narrow",
  "standard",
  "wide",
  "full",
];

/**
 * Libellés des largeurs — ils décrivent le **résultat** perçu, jamais la
 * technique (principe P4 : zéro jargon).
 */
export const contentMaxWidthLabels: Record<ContentMaxWidth, string> = {
  narrow: "Étroite — idéale pour un texte à lire",
  standard: "Standard — la largeur habituelle des sections",
  wide: "Large — pour un contenu dense",
  full: "Pleine largeur de l’écran",
};

/** Ordre d'affichage des espacements (éditeur). */
export const contentGapOrder: ContentGap[] = ["sm", "md", "lg"];

/** Libellés des espacements (décrivent l'écart, pas une valeur CSS). */
export const contentGapLabels: Record<ContentGap, string> = {
  sm: "Resserré",
  md: "Moyen",
  lg: "Large",
};

/** Ordre d'affichage des seuils d'empilement (éditeur). */
export const contentStackAtOrder: ContentStackAt[] = ["sm", "md", "lg"];

/**
 * Libellés des seuils d'empilement — formulés du point de vue du **visiteur**
 * (« Sur téléphone ») et non du développeur (« breakpoint md »).
 */
export const contentStackAtLabels: Record<ContentStackAt, string> = {
  sm: "Sur téléphone (le plus tôt)",
  md: "Sur téléphone et petite tablette",
  lg: "Seulement sur ordinateur",
};

/** Ordre d'affichage des tailles d'icône (éditeur). */
export const contentIconSizeOrder: ContentIconSize[] = ["sm", "md", "lg"];

/** Libellés des tailles d'icône. */
export const contentIconSizeLabels: Record<ContentIconSize, string> = {
  sm: "Petite",
  md: "Moyenne",
  lg: "Grande",
};

/** Ordre d'affichage des alignements (éditeur). */
export const contentTextAlignOrder: ContentTextAlign[] = [
  "left",
  "center",
  "right",
  "justify",
];

/** Libellés des alignements. */
export const contentTextAlignLabels: Record<ContentTextAlign, string> = {
  left: "À gauche",
  center: "Au centre",
  right: "À droite",
  justify: "Justifié",
};

/**
 * Réglages de mise en page par défaut : deux colonnes d'égale largeur, seuil
 * d'empilement « téléphone et petite tablette », colonnes étirées à la hauteur
 * de la plus haute. Aucun pixel, aucun séparateur — l'utilisateur part d'un
 * résultat propre et n'ajuste que ce qu'il souhaite.
 */
export const DEFAULT_CONTENT_COLUMNS_LAYOUT: ContentColumnsLayout = {
  maxWidth: "standard",
  gap: "md",
  sameWidth: true,
  separator: false,
  stackAt: "md",
  verticalAlign: "stretch",
};

/**
 * Plafonds de largeur des éléments de la zone d'en-tête, **en pourcentage de la
 * largeur cumulée des colonnes** — qui est aussi celle du conteneur partagé par
 * l'en-tête et la grille.
 *
 * Ce sont des **plafonds** : un élément peut être plus étroit, jamais plus
 * large. Un pourcentage ne peut donc pas excéder la largeur du parent : la
 * garantie est **structurelle**, pas déclarative, et elle tient quel que soit
 * le nombre de colonnes, leur répartition ou leur contenu.
 *
 * Ils ne s'appliquent **que lorsque les colonnes sont côte à côte** : sous le
 * seuil d'empilement, un texte plafonné à 60 % d'un écran de téléphone serait
 * illisible. La mécanique `@container` de [`globals.css`](../../app/globals.css)
 * arbitre, avec **le même seuil** que les colonnes — l'en-tête et la grille ne
 * peuvent donc pas se contredire. Ces valeurs y sont reprises à l'identique ;
 * l'éditeur les affiche comme repères (source unique).
 */
export const CONTENT_HEADER_WIDTH_CAP = {
  h2: 66,
  h3: 75,
  text: 60,
} as const;

/** Ordre d'affichage des alignements d'en-tête (éditeur). */
export const contentHeaderAlignOrder: ContentHeaderAlign[] = ["left", "center"];

/** Libellés des alignements d'en-tête — le résultat perçu, jamais la technique. */
export const contentHeaderAlignLabels: Record<ContentHeaderAlign, string> = {
  left: "Aligné à gauche",
  center: "Centré",
};

/** Nombre maximal de conteneurs — dérivé de la source unique ci-dessus. */
const MAX_CONTENT_CONTAINERS = CONTENT_COLUMN_COUNTS.length;

/** Fabrique un identifiant stable de conteneur ou de bloc (mock : UUID v4). */
function newContentId(): string {
  return crypto.randomUUID();
}

/** Document ProseMirror vide : un paragraphe vide (état initial d'un bloc texte). */
export function createEmptyRichTextDoc(): RichTextDoc {
  return { type: "doc", content: [{ type: "paragraph" }] };
}

/** Bloc de texte riche de démonstration (intertitre `h3` + paragraphe). */
function createDemoRichTextBlock(
  heading: string,
  text: string
): ContentRichTextBlock {
  return {
    id: newContentId(),
    kind: "rich-text",
    doc: {
      type: "doc",
      content: [
        {
          type: "heading",
          attrs: { level: 3 },
          content: [{ type: "text", text: heading }],
        },
        { type: "paragraph", content: [{ type: "text", text }] },
      ],
    },
  };
}

/**
 * Fabrique une colonne **prête à écrire** : un bloc de texte vide, et rien
 * d'autre.
 *
 * Le type par défaut d'une colonne est donc le **texte** : ajouter une colonne
 * ne demande aucun choix préalable, et supprimer tous ses blocs la laisse
 * repartir d'un champ de saisie (voir `ContentColumnsEditor`). C'est la raison
 * pour laquelle l'éditeur n'affiche plus de boutons « Texte / Photo / Icône ».
 */
export function createContentContainer(weight = 1): ContentContainer {
  return {
    id: newContentId(),
    weight,
    blocks: [createContentRichTextBlock()],
  };
}

/** Fabrique un bloc de texte riche vide (prêt à recevoir la saisie). */
export function createContentRichTextBlock(): ContentRichTextBlock {
  return { id: newContentId(), kind: "rich-text", doc: createEmptyRichTextDoc() };
}

/**
 * Fabrique un contenu « Contenu en colonnes » par défaut : **deux colonnes
 * d'égale largeur**, chacune amorcée par un intertitre et un paragraphe.
 *
 * La section n'est donc jamais vide à l'ajout : le photographe comprend
 * immédiatement *où* écrire. Retourne une **nouvelle instance** à chaque appel
 * (aucune référence partagée entre deux modules de la page — la même exigence
 * que `createModuleContent`).
 */
export function createContentColumnsContent(): ContentColumnsContent {
  return {
    type: "content",
    variant: "columns",
    heading: "",
    // Zone d'en-tête masquée par défaut : la section s'ajoute « nue », et le
    // photographe n'active que ce dont il a besoin.
    header: {
      showH2: false,
      showH3: false,
      h3: "",
      showText: false,
      text: "",
      align: "left",
    },
    containers: [
      {
        id: newContentId(),
        weight: 1,
        blocks: [
          createDemoRichTextBlock(
            "Votre titre",
            "Écrivez ici votre premier paragraphe…"
          ),
        ],
      },
      {
        id: newContentId(),
        weight: 1,
        blocks: [
          createDemoRichTextBlock(
            "Votre titre",
            "Écrivez ici votre second paragraphe…"
          ),
        ],
      },
    ],
    layout: { ...DEFAULT_CONTENT_COLUMNS_LAYOUT },
  };
}

/**
 * Répartition des conteneurs en **parts relatives** (fractions de 1).
 *
 * Source unique de la répartition : l'éditeur s'en sert pour annoncer les
 * pourcentages, le rendu public pour composer `grid-template-columns`. Quand
 * `sameWidth` est vrai, les poids sont **neutralisés** (parts égales) — c'est
 * exactement la case « Largeur identique » de Word.
 */
export function contentContainerFractions(
  containers: ContentContainer[],
  sameWidth: boolean
): number[] {
  if (containers.length === 0) {
    return [];
  }
  if (sameWidth) {
    return containers.map(() => 1 / containers.length);
  }
  const weights = containers.map((container) =>
    container.weight > 0 ? container.weight : 1
  );
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  return weights.map((weight) => weight / total);
}

/* --------------------------------------------------------------------------
   Résolveur — lecture tolérante du JSONB (aucune migration BDD)
   -------------------------------------------------------------------------- */

function isContentMaxWidth(value: unknown): value is ContentMaxWidth {
  return (
    value === "narrow" ||
    value === "standard" ||
    value === "wide" ||
    value === "full"
  );
}

function isContentGap(value: unknown): value is ContentGap {
  return value === "sm" || value === "md" || value === "lg";
}

function isContentStackAt(value: unknown): value is ContentStackAt {
  return value === "sm" || value === "md" || value === "lg";
}

function isContentTextAlign(value: unknown): value is ContentTextAlign {
  return (
    value === "left" ||
    value === "center" ||
    value === "right" ||
    value === "justify"
  );
}

function isContentIconSize(value: unknown): value is ContentIconSize {
  return value === "sm" || value === "md" || value === "lg";
}

function isContentVerticalAlign(
  value: unknown
): value is ContentColumnsLayout["verticalAlign"] {
  return value === "stretch" || value === "start" || value === "center";
}

function isContentHeaderAlign(value: unknown): value is ContentHeaderAlign {
  return value === "left" || value === "center";
}

/** Garde : tableau — évite tout `any` implicite d'`Array.isArray`. */
function isUnknownArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

/**
 * Résout la **zone d'en-tête**.
 *
 * **Rétrocompatibilité stricte** : sans objet `header` stocké — donc pour tout
 * contenu enregistré avant l'étape 12.2 — on reproduit le rendu précédent : le
 * H2 apparaissait si et seulement si `heading` était renseigné, et il n'existait
 * ni H3 ni texte. Aucune page existante ne change d'apparence.
 */
function resolveContentHeader(
  raw: unknown,
  heading: string
): ContentHeaderContent {
  const h2Fallback = heading.trim() !== "";
  if (!isRecord(raw)) {
    return {
      showH2: h2Fallback,
      showH3: false,
      h3: "",
      showText: false,
      text: "",
      // Absent sur un contenu antérieur : aligné à gauche, le rendu historique.
      align: "left",
    };
  }
  return {
    showH2: typeof raw.showH2 === "boolean" ? raw.showH2 : h2Fallback,
    showH3: typeof raw.showH3 === "boolean" ? raw.showH3 : false,
    h3: readString(raw.h3, ""),
    showText: typeof raw.showText === "boolean" ? raw.showText : false,
    text: readString(raw.text, ""),
    align: isContentHeaderAlign(raw.align) ? raw.align : "left",
  };
}

/** Normalise les réglages de mise en page, jeton par jeton. */
function resolveContentColumnsLayout(raw: unknown): ContentColumnsLayout {
  const record = isRecord(raw) ? raw : {};
  return {
    maxWidth: isContentMaxWidth(record.maxWidth)
      ? record.maxWidth
      : DEFAULT_CONTENT_COLUMNS_LAYOUT.maxWidth,
    gap: isContentGap(record.gap)
      ? record.gap
      : DEFAULT_CONTENT_COLUMNS_LAYOUT.gap,
    sameWidth:
      typeof record.sameWidth === "boolean"
        ? record.sameWidth
        : DEFAULT_CONTENT_COLUMNS_LAYOUT.sameWidth,
    separator:
      typeof record.separator === "boolean"
        ? record.separator
        : DEFAULT_CONTENT_COLUMNS_LAYOUT.separator,
    stackAt: isContentStackAt(record.stackAt)
      ? record.stackAt
      : DEFAULT_CONTENT_COLUMNS_LAYOUT.stackAt,
    verticalAlign: isContentVerticalAlign(record.verticalAlign)
      ? record.verticalAlign
      : DEFAULT_CONTENT_COLUMNS_LAYOUT.verticalAlign,
  };
}

/** Lit un document ProseMirror stocké, avec repli sur un document vide. */
function resolveRichTextDoc(raw: unknown): RichTextDoc {
  if (isRecord(raw) && raw.type === "doc") {
    const rawContent: unknown = raw.content;
    if (isUnknownArray(rawContent)) {
      const nodes: RichTextNode[] = [];
      for (const node of rawContent) {
        if (isRecord(node)) {
          nodes.push(node);
        }
      }
      return { type: "doc", content: nodes };
    }
  }
  return createEmptyRichTextDoc();
}

/** Lit un bloc, ou `null` si son `kind` est inconnu (bloc écarté). */
function resolveContentBlock(raw: unknown): ContentBlock | null {
  if (!isRecord(raw)) {
    return null;
  }
  const id =
    typeof raw.id === "string" && raw.id !== "" ? raw.id : newContentId();

  switch (raw.kind) {
    case "rich-text":
      return { id, kind: "rich-text", doc: resolveRichTextDoc(raw.doc) };
    case "image":
      return {
        id,
        kind: "image",
        media: readArtSource(raw, "media", { url: "", alt: "" }),
        width: raw.width === "full" ? "full" : "auto",
        align: isContentTextAlign(raw.align) ? raw.align : "left",
      };
    case "icon":
      return {
        id,
        kind: "icon",
        name: readString(raw.name, ""),
        size: isContentIconSize(raw.size) ? raw.size : "md",
        align: isContentTextAlign(raw.align) ? raw.align : "left",
      };
    case "spacer":
      return {
        id,
        kind: "spacer",
        size: isContentGap(raw.size) ? raw.size : "md",
      };
    default:
      return null;
  }
}

/** Lit la liste des blocs d'un conteneur (blocs illisibles écartés). */
function resolveContentBlocks(raw: unknown): ContentBlock[] {
  const list = isUnknownArray(raw) ? raw : [];
  const blocks: ContentBlock[] = [];
  for (const entry of list) {
    const block = resolveContentBlock(entry);
    if (block !== null) {
      blocks.push(block);
    }
  }
  return blocks;
}

/** Lit un conteneur, ou `null` s'il n'est pas exploitable. */
function resolveContentContainer(raw: unknown): ContentContainer | null {
  if (!isRecord(raw)) {
    return null;
  }
  const weight =
    typeof raw.weight === "number" &&
    Number.isFinite(raw.weight) &&
    raw.weight > 0
      ? raw.weight
      : 1;
  return {
    id: typeof raw.id === "string" && raw.id !== "" ? raw.id : newContentId(),
    weight,
    // Un éventuel `indentLeft` / `indentRight` stocké avant le retrait du
    // réglage est **ignoré** : la colonne reprend toute sa piste, sans que le
    // contenu ait à être migré.
    blocks: resolveContentBlocks(raw.blocks),
  };
}

/**
 * Lit la liste des conteneurs en rétablissant l'invariant **1 à 4**.
 *
 * Deux cas dégénérés sont réparés plutôt que propagés : un contenu sans
 * conteneur lisible repart sur **deux colonnes vides** (la section doit rester
 * éditable, jamais se présenter comme un bloc mort), et un contenu qui en
 * comporte davantage est **tronqué** au maximum autorisé.
 */
function resolveContentContainers(raw: unknown): ContentContainer[] {
  const list = isUnknownArray(raw) ? raw : [];
  const containers: ContentContainer[] = [];
  for (const entry of list) {
    const container = resolveContentContainer(entry);
    if (container !== null && containers.length < MAX_CONTENT_CONTAINERS) {
      containers.push(container);
    }
  }
  if (containers.length === 0) {
    return [createContentContainer(), createContentContainer()];
  }
  return containers;
}

/**
 * Résout un contenu « Contenu en colonnes » stocké (JSONB) vers une forme
 * **complète** — même patron que `resolveGalleryContent` et
 * `resolveCtaBannerContent` : un contenu partiel, ancien ou abîmé ne provoque
 * jamais d'erreur de rendu, chaque champ retombe sur son défaut.
 */
export function resolveContentColumnsContent(
  raw: unknown
): ContentColumnsContent {
  const record = isRecord(raw) ? raw : {};
  const heading = readString(record.heading, "");
  return {
    type: "content",
    variant: "columns",
    heading,
    header: resolveContentHeader(record.header, heading),
    containers: resolveContentContainers(record.containers),
    layout: resolveContentColumnsLayout(record.layout),
  };
}

/* --------------------------------------------------------------------------
   Lecture d'une section de contenu pour le SEO de partage
   --------------------------------------------------------------------------
   Une section de contenu peut être **le seul contenu** d'une page : sans ces
   deux extracteurs, une telle page n'aurait ni description ni image de
   prévisualisation sur les réseaux. Ils vivent dans le domaine (et non dans
   `public-page.ts`) parce qu'ils manipulent la structure du contenu ; le
   résolveur garantit les invariants avant lecture.
   -------------------------------------------------------------------------- */

/** Collecte le texte en ligne d'un nœud (texte, saut de ligne, liens imbriqués). */
function collectRichTextInline(node: RichTextNode, out: string[]): void {
  if (node.type === "text" && typeof node.text === "string") {
    out.push(node.text);
    return;
  }
  if (node.type === "hardBreak") {
    out.push(" ");
    return;
  }
  const content = node.content;
  if (isUnknownArray(content)) {
    for (const child of content) {
      if (isRecord(child)) {
        collectRichTextInline(child, out);
      }
    }
  }
}

/**
 * Texte brut d'un document ProseMirror (intertitres, paragraphes, listes).
 * Les blocs sont joints par une espace : le résultat est destiné à une
 * **description** (méta), jamais à un rendu — le HTML n'est pas consulté.
 */
export function richTextDocToPlainText(doc: RichTextDoc): string {
  const blocks: string[] = [];
  for (const node of doc.content ?? []) {
    const inline: string[] = [];
    collectRichTextInline(node, inline);
    const text = inline.join("").trim();
    if (text !== "") {
      blocks.push(text);
    }
  }
  return blocks.join(" ");
}

/** Images portées par une section de contenu (blocs photo non vides). */
export function contentSectionImageSources(
  content: ContentColumnsContent
): MediaField[] {
  const sources: MediaField[] = [];
  for (const container of content.containers) {
    for (const block of container.blocks) {
      if (block.kind === "image" && block.media.url !== "") {
        sources.push(block.media);
      }
    }
  }
  return sources;
}

/** Texte d'une section de contenu : titre éventuel, puis texte des blocs. */
export function contentSectionPlainText(
  content: ContentColumnsContent
): string {
  const parts: string[] = [];
  const heading = content.heading.trim();
  if (heading !== "") {
    parts.push(heading);
  }
  for (const container of content.containers) {
    for (const block of container.blocks) {
      if (block.kind === "rich-text") {
        const text = richTextDocToPlainText(block.doc);
        if (text !== "") {
          parts.push(text);
        }
      }
    }
  }
  return parts.join(" ");
}

/**
 * Contenu éditable d'un module, **discriminé par `type`** (mêmes valeurs que
 * `PageModuleType`). Chaque famille expose ses propres champs (spec §8).
 * Union typé — **zéro `any`** : narrowing complet dans les formulaires (3.4)
 * et le futur rendu public.
 */
export type ModuleContent =
  | ({ type: "hero" } & HeroContent)
  | {
      type: "about";
      heading: string;
      text: string;
      media: MediaField;
    }
  | {
      type: "services";
      heading: string;
      intro: string;
      items: ServiceItem[];
    }
  | CtaBannerContent
  | ContentColumnsContent
  | CardsContent
  | ({ type: "gallery" } & GalleryContent)
  | ({
      type: "faq";
      heading: string;
      items: FaqItem[];
    })
  | ContactContent
  | ContactMapContent;

/* ==========================================================================
   BANDEAU MESSAGE OU D'APPEL À L'ACTION — « cta-banner » (Étape 11.27)
   --------------------------------------------------------------------------
   Séparateur éditorial **pleine largeur** : un message (titre, sous-titre,
   paragraphe optionnel), un CTA optionnel et **quatre fonds** possibles
   (couleur du thème, carrousel, parallaxe, vidéo) sur **trois hauteurs**.

   Héritage : le bandeau reprend la surface texte/CTA du Héro (overlay, ton du
   texte, graisses, `cta*`) — c'est exactement ce que consomme `BaseHero`, qui
   sert donc de cadre. La **variante** diffère en revanche (`HeroVariant` ne
   connaît pas « color ») : le bandeau déclare la sienne et n'hérite donc pas de
   `HeroBaseShared.variant`.

   Aucune migration : tout vit dans le JSONB `content`, et le résolveur tolérant
   accepte les contenus enregistrés avant cette étape
   (`{ type, heading, subheading, ctaLabel, ctaHref }` → fond couleur unie).
   ========================================================================== */

/** Fond du bandeau : couleur unie, carrousel, parallaxe ou vidéo. */
export type BannerBackgroundKind = "color" | "slider" | "parallax" | "video";

/** Hauteur du bandeau, relative à l'espace compris sous le Header. */
export type BannerHeight = "small" | "standard" | "large";

/** Jetons produit de la direction artistique « Éclat Minéral & Nacre ». */
export type BannerThemeToken =
  | "accent-color"
  | "accent-color-strong"
  | "surface-color"
  | "surface-color-soft"
  | "bg-color"
  | "text-color"
  | "border-color";

/** Fond couleur : jeton du thème (suit le thème) ou valeur libre (pipette). */
export interface BannerColorSettings {
  /** `theme` → la couleur suit le thème ; `custom` → valeur figée. */
  source: "theme" | "custom";
  /** Jeton utilisé quand `source === "theme"`. */
  token: BannerThemeToken;
  /** Valeur hexadécimale utilisée quand `source === "custom"`. */
  value: string;
}

/** Une image du carrousel de fond. */
export interface BannerSlide {
  /** Identifiant stable (mock : crypto.randomUUID()). */
  id: string;
  /** Art-direction responsive de l'image. */
  media: HeroStaticMedia;
  /** Cadrage vertical de la photo, en % (0 = haut, 100 = bas). */
  focalY: number;
}

/** Contenu du module `cta-banner` (Étape 11.27). */
export interface CtaBannerContent extends Omit<HeroBaseShared, "variant"> {
  type: "cta-banner";
  variant: BannerBackgroundKind;
  height: BannerHeight;
  /** Titre du message (clé historique conservée — le SEO de partage la lit). */
  heading: string;
  /** Sous-titre du message (clé historique conservée). */
  subheading: string;
  color: BannerColorSettings;
  /** Photo du fond parallaxe. */
  media: HeroStaticMedia;
  /** Cadrage vertical du fond parallaxe, en %. */
  focalY: number;
  parallaxSpeed: ParallaxSpeed;
  /** Images du carrousel de fond (liste vide ⇒ repli sur le fond couleur). */
  slides: BannerSlide[];
  /** Réglages du carrousel — mêmes clés et bornes que le Héro. */
  settings: HeroSliderSettings;
  video: HeroVideoMedia;
}

/** Fraction de l'espace sous le Header occupée par chaque hauteur. */
export const BANNER_HEIGHT_RATIO: Record<BannerHeight, number> = {
  small: 1 / 3,
  standard: 1 / 2,
  large: 3 / 4,
};

/**
 * Classe CSS portant la hauteur (`min-height`), déclarée dans `globals.css`.
 *
 * La mécanique reste en CSS : le composant ne transmet qu'un **nom** de hauteur
 * (mêmes principes que les effets de galerie — `svh` avec repli `vh`,
 * neutralisation centralisée). `BANNER_HEIGHT_RATIO` sert uniquement au
 * **libellé** de l'éditeur (« environ 1/3 »), jamais au calcul de rendu.
 */
export const BANNER_HEIGHT_CLASS: Record<BannerHeight, string> = {
  small: "banner-h-small",
  standard: "banner-h-standard",
  large: "banner-h-large",
};

/** Ordre d'affichage des hauteurs (éditeur). */
export const bannerHeightOrder: BannerHeight[] = ["small", "standard", "large"];

/** Libellés des hauteurs — ils décrivent le **résultat**, pas la technique. */
export const bannerHeightLabels: Record<BannerHeight, string> = {
  small: "Petit — environ 1/3 de la zone visible",
  standard: "Standard — environ la moitié de la zone visible",
  large: "Grand — environ 3/4 de la zone visible",
};

/** Ordre des types de fond (éditeur). */
export const bannerBackgroundOrder: BannerBackgroundKind[] = [
  "color",
  "slider",
  "parallax",
  "video",
];

/** Libellés des fonds, nommés par ce que le visiteur verra. */
export const bannerBackgroundLabels: Record<BannerBackgroundKind, string> = {
  color: "Couleur unie",
  slider: "Carrousel de photos",
  parallax: "Photo en parallaxe",
  video: "Vidéo",
};

/** Jetons de thème proposés (la couleur suit alors le thème du site). */
export const bannerThemeTokenOrder: BannerThemeToken[] = [
  "accent-color",
  "accent-color-strong",
  "surface-color",
  "surface-color-soft",
  "bg-color",
  "text-color",
  "border-color",
];

export const bannerThemeTokenLabels: Record<BannerThemeToken, string> = {
  "accent-color": "Accent nacre (rose chaud)",
  "accent-color-strong": "Accent soutenu (bronze doux)",
  "surface-color": "Surface nacre (rose voilé)",
  "surface-color-soft": "Surface nacrée soutenue",
  "bg-color": "Fond du thème (blanc)",
  "text-color": "Anthracite (texte)",
  "border-color": "Perle irisée (bordures)",
};

/** Cadrages verticaux proposés — nommés plutôt que chiffrés. */
export const bannerFocalYOrder: number[] = [15, 35, 50, 65, 85];

/** Libellés des cadrages verticaux de la photo. */
export const bannerFocalYLabels: Record<number, string> = {
  15: "Haut",
  35: "Plutôt haut",
  50: "Centre",
  65: "Plutôt bas",
  85: "Bas",
};

/** Défauts du message — vocabulaire du bandeau, distinct de celui du Héro. */
const DEFAULT_BANNER_SHARED: Omit<HeroBaseShared, "variant"> = {
  overlayLevel: "medium",
  textTone: "light",
  titleH1: "Un projet photo ? Parlons-en !",
  subtitleH2: "Disponible pour vos événements et séances sur mesure.",
  descriptionText: "",
  weightH1: "font-medium",
  weightH2: "font-normal",
  weightText: "font-normal",
  ctaShow: true,
  ctaLabel: "Me contacter",
  ctaHref: "/contact",
  ctaStyle: "primary",
};

/** Fabrique une image de carrousel de démonstration (seeds stables). */
export function createBannerSlide(demoIndex = 0): BannerSlide {
  const seed = `banner-slide-${demoIndex + 1}`;
  return {
    id: crypto.randomUUID(),
    media: {
      desktop: {
        url: `https://picsum.photos/seed/${seed}/1920/1080`,
        alt: `Visuel ${demoIndex + 1} du bandeau — format paysage`,
      },
      mobile: {
        url: `https://picsum.photos/seed/${seed}-mobile/720/1280`,
        alt: `Visuel ${demoIndex + 1} du bandeau — format portrait`,
      },
      tablet: null,
    },
    focalY: 50,
  };
}

/**
 * Fabrique un contenu de bandeau complet.
 *
 * Défaut demandé : **fond parallaxe, hauteur standard, CTA activé** — c'est ce
 * que reçoivent le catalogue (« + Ajouter une section ») et le seed de l'Accueil.
 */
export function createCtaBannerContent(): CtaBannerContent {
  return {
    ...DEFAULT_BANNER_SHARED,
    type: "cta-banner",
    variant: "parallax",
    height: "standard",
    heading: DEFAULT_BANNER_SHARED.titleH1,
    subheading: DEFAULT_BANNER_SHARED.subtitleH2,
    color: { source: "theme", token: "accent-color", value: "#E8D8D7" },
    media: cloneHeroStaticMedia(DEFAULT_HERO_STATIC_MEDIA),
    focalY: 50,
    parallaxSpeed: "medium",
    slides: [createBannerSlide(0), createBannerSlide(1), createBannerSlide(2)],
    settings: {
      autoplay: true,
      autoplaySpeedMs: 5000,
      transition: "fade",
      showArrows: true,
      showDots: true,
    },
    video: createHeroVideoContent().media,
  };
}

function isBannerBackgroundKind(value: unknown): value is BannerBackgroundKind {
  return (
    value === "color" ||
    value === "slider" ||
    value === "parallax" ||
    value === "video"
  );
}

function isBannerHeight(value: unknown): value is BannerHeight {
  return value === "small" || value === "standard" || value === "large";
}

function isBannerThemeToken(value: unknown): value is BannerThemeToken {
  return (
    typeof value === "string" &&
    (bannerThemeTokenOrder as string[]).includes(value)
  );
}

function isBannerParallaxSpeed(value: unknown): value is ParallaxSpeed {
  return (
    typeof value === "string" &&
    (parallaxSpeedOrder as string[]).includes(value)
  );
}

function isBannerAutoplaySpeed(value: unknown): value is HeroAutoplaySpeed {
  return value === 3000 || value === 5000 || value === 7000 || value === 10000;
}

function isBannerTransition(value: unknown): value is HeroSliderTransition {
  return value === "slide" || value === "fade";
}

/** Lit un pourcentage borné (cadrage vertical) avec repli. */
function readPercent(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.max(0, Math.min(100, value))
    : fallback;
}

/** Lit un média art-direction imbriqué (desktop / mobile / tablette). */
function readHeroStaticMedia(
  record: Record<string, unknown>,
  key: string,
  fallback: HeroStaticMedia
): HeroStaticMedia {
  const raw = record[key];
  if (!isRecord(raw)) {
    return cloneHeroStaticMedia(fallback);
  }
  const tabletFallback = fallback.tablet ?? fallback.desktop;
  return {
    desktop: readArtSource(raw, "desktop", fallback.desktop),
    mobile: readArtSource(raw, "mobile", fallback.mobile),
    tablet: isRecord(raw.tablet)
      ? readArtSource(raw, "tablet", tabletFallback)
      : null,
  };
}

/**
 * Lit les images du carrousel.
 *
 * Un tableau **vide** est conservé tel quel : le rendu public retombe alors sur
 * le fond couleur (jamais un cadre noir). Un `slides` **absent** (contenu
 * enregistré avant l'Étape 11.27) reçoit les images de démonstration.
 */
function readBannerSlides(raw: unknown, fallback: BannerSlide[]): BannerSlide[] {
  if (!Array.isArray(raw)) {
    return fallback.map((slide) => ({
      id: slide.id,
      media: cloneHeroStaticMedia(slide.media),
      focalY: slide.focalY,
    }));
  }
  const slides: BannerSlide[] = [];
  raw.forEach((item, index) => {
    if (!isRecord(item)) {
      return;
    }
    slides.push({
      id: readHeroText(item, "id", `banner-slide-${index + 1}`),
      media: readHeroStaticMedia(item, "media", DEFAULT_HERO_STATIC_MEDIA),
      focalY: readPercent(item.focalY, 50),
    });
  });
  return slides;
}

/** Lit les réglages du carrousel (mêmes bornes que le Héro). */
function readBannerSettings(
  raw: Record<string, unknown>,
  fallback: HeroSliderSettings
): HeroSliderSettings {
  return {
    autoplay:
      typeof raw.autoplay === "boolean" ? raw.autoplay : fallback.autoplay,
    autoplaySpeedMs: isBannerAutoplaySpeed(raw.autoplaySpeedMs)
      ? raw.autoplaySpeedMs
      : fallback.autoplaySpeedMs,
    transition: isBannerTransition(raw.transition)
      ? raw.transition
      : fallback.transition,
    showArrows:
      typeof raw.showArrows === "boolean"
        ? raw.showArrows
        : fallback.showArrows,
    showDots:
      typeof raw.showDots === "boolean" ? raw.showDots : fallback.showDots,
  };
}

/**
 * Normalise un contenu `cta-banner` stocké (JSONB) vers une forme complète.
 *
 * Le repli diffère volontairement de celui de la fabrique : une variante
 * **absente** (contenu enregistré avant l'Étape 11.27) donne un fond **couleur
 * unie** — un bandeau ancien conserve ainsi son esprit d'aplat coloré et
 * n'invente **aucune** image à télécharger. Les clés `heading` / `subheading`
 * sont conservées (le SEO de partage les lit) et projetées sur
 * `titleH1` / `subtitleH2`, la surface consommée par `BaseHero`.
 */
export function resolveCtaBannerContent(raw: unknown): CtaBannerContent {
  const defaults = createCtaBannerContent();
  if (!isRecord(raw)) {
    return defaults;
  }
  const colorRaw = isRecord(raw.color) ? raw.color : {};
  const settingsRaw = isRecord(raw.settings) ? raw.settings : {};
  const videoRaw = isRecord(raw.video) ? raw.video : {};

  // `heading` / `subheading` sont la **source de vérité** du message (clés
  // historiques, celles qu'écrit l'éditeur) ; `titleH1` / `subtitleH2` en sont la
  // projection, seule surface lue par `BaseHero`. L'ordre est délibéré : un
  // contenu ancien (qui n'a que `heading`) et un contenu récent donnent le même
  // résultat, et il n'existe qu'un seul jeu de clés à écrire.
  const titleH1 = readHeroText(
    raw,
    "heading",
    readHeroText(raw, "titleH1", defaults.heading)
  );
  const subtitleH2 = readHeroText(
    raw,
    "subheading",
    readHeroText(raw, "subtitleH2", defaults.subheading)
  );

  return {
    type: "cta-banner",
    variant: isBannerBackgroundKind(raw.variant) ? raw.variant : "color",
    height: isBannerHeight(raw.height) ? raw.height : defaults.height,
    heading: titleH1,
    subheading: subtitleH2,
    overlayLevel: isHeroOverlay(raw.overlayLevel)
      ? raw.overlayLevel
      : defaults.overlayLevel,
    textTone: isHeroTextTone(raw.textTone) ? raw.textTone : defaults.textTone,
    titleH1,
    subtitleH2,
    descriptionText: readHeroText(
      raw,
      "descriptionText",
      defaults.descriptionText
    ),
    weightH1: isFontWeight(raw.weightH1) ? raw.weightH1 : defaults.weightH1,
    weightH2: isFontWeight(raw.weightH2) ? raw.weightH2 : defaults.weightH2,
    weightText: isFontWeight(raw.weightText)
      ? raw.weightText
      : defaults.weightText,
    ctaShow: isCtaShow(raw.ctaShow) ? raw.ctaShow : defaults.ctaShow,
    ctaLabel: readHeroText(raw, "ctaLabel", defaults.ctaLabel),
    ctaHref: readHeroText(raw, "ctaHref", defaults.ctaHref),
    ctaStyle: isHeroCtaStyle(raw.ctaStyle) ? raw.ctaStyle : defaults.ctaStyle,
    color: {
      source: colorRaw.source === "custom" ? "custom" : "theme",
      token: isBannerThemeToken(colorRaw.token)
        ? colorRaw.token
        : defaults.color.token,
      value: readHeroText(colorRaw, "value", defaults.color.value),
    },
    media: readHeroStaticMedia(raw, "media", defaults.media),
    focalY: readPercent(raw.focalY, defaults.focalY),
    parallaxSpeed: isBannerParallaxSpeed(raw.parallaxSpeed)
      ? raw.parallaxSpeed
      : defaults.parallaxSpeed,
    slides: readBannerSlides(raw.slides, defaults.slides),
    settings: readBannerSettings(settingsRaw, defaults.settings),
    video: {
      videoUrl: readHeroText(videoRaw, "videoUrl", defaults.video.videoUrl),
      loop:
        typeof videoRaw.loop === "boolean"
          ? videoRaw.loop
          : defaults.video.loop,
      posterDesktop: readArtSource(
        videoRaw,
        "posterDesktop",
        defaults.video.posterDesktop
      ),
      fallbackMobile: readArtSource(
        videoRaw,
        "fallbackMobile",
        defaults.video.fallbackMobile
      ),
    },
  };
}

/** Images non vides d'un bandeau — sert au SEO de partage et au préchargement. */
export function bannerImageSources(content: CtaBannerContent): ArtSource[] {
  if (content.variant === "video") {
    return [content.video.posterDesktop, content.video.fallbackMobile].filter(
      (source) => source.url !== ""
    );
  }
  if (content.variant === "slider") {
    return content.slides.flatMap((slide) =>
      [slide.media.desktop, slide.media.mobile].filter(
        (source) => source.url !== ""
      )
    );
  }
  if (content.variant === "parallax") {
    return [content.media.desktop, content.media.mobile].filter(
      (source) => source.url !== ""
    );
  }
  return [];
}

/* ==========================================================================
   RUBRIQUE « CARDS » (Étapes 13.1 & 13.2)
   --------------------------------------------------------------------------
   Une liste de cartes photo + titre + texte + bouton, présentée en 2, 3 ou 4
   colonnes (la ligne suivante se forme naturellement).

   Trois partis pris structurants :

   1. **La carte n'est jamais cliquable** — seul le bouton porte un lien. Une
      carte entièrement cliquable envelopperait le titre et le texte dans un
      lien unique, ce qui interdit tout autre élément interactif à l'intérieur
      et fait dépendre le clic de la zone la plus large de la page. Le bouton
      est une cible explicite, atteignable au clavier, et son libellé dit où
      l'on va.
   2. **Pas d'élévation au survol** : elle suggérait un clic qui n'existe pas.
      Les effets de survol retenus sont portés par l'**image** (zoom, brillance,
      saturation, liseré) — décoratifs, sans promesse d'interaction. `parallax`
      est également écarté : un déplacement vertical n'a pas de sens sur une
      vignette de cette taille.
   3. **Trois formats, une seule structure** (13.2) : portrait (4:5), carré
      (1:1) et paysage (3:2, 4:3 ou 16:9, **2 cartes par ligne**). Le format ne
      change que le ratio de la photo et la largeur de colonne ; le
      chevauchement du bloc clair sur la photo — la **signature** du module —
      reste identique dans les trois cas.

   Ce qui se règle : les arrondis et le filet des **deux** éléments (cadre de la
   photo, bloc de texte), l'ombre, la bordure du cadre et les effets de survol.
   Ce qui ne se règle pas : le chevauchement, et la **couleur** du filet du bloc,
   qui prend l'accent du thème — elle suit donc le mode sombre sans réglage.
   ========================================================================== */

/**
 * Formats **photo** d'une carte (Étape 13.2).
 *
 * Les trois diffèrent par le **ratio de la photo** et, pour le paysage, par le
 * **nombre de cartes par ligne** — jamais par la structure : le bloc clair qui
 * chevauche la photo reste la signature du module, identique dans les trois cas.
 *
 * C'est le **format** au sens où l'utilisateur l'entend, et non la variante : la
 * quatrième variante (`editorial`, étape 13.3) n'est pas un cadrage — elle porte
 * d'ailleurs le sien dans son `layout.editorialFormat`. Confondre les deux
 * notions était exactement ce qui empêchait de lire une section éditoriale comme
 * une carte : une variante n'est pas un format.
 */
export type CardsPhotoFormat = "portrait" | "square" | "landscape";

/**
 * Variantes de la rubrique Cards.
 *
 * Les trois formats historiques portent leur cadrage **dans leur `variant`**
 * (les contenus déjà enregistrés n'ont donc rien à changer) ; `editorial` est la
 * seule dont le corps est un document de texte riche et dont le cadrage photo se
 * règle à part (`layout.editorialFormat`).
 */
export type CardsVariant = CardsPhotoFormat | "editorial";

/**
 * Variante par défaut — c'est aussi le format historique, celui du gabarit
 * d'origine (photo 4:5).
 */
export const DEFAULT_CARDS_VARIANT: CardsVariant = "portrait";

/**
 * Cadrage photo par défaut.
 *
 * Sert aux contenus dont la variante est `editorial` (le cadrage y est un
 * réglage de layout, pas la variante) et aux cartes d'exemple : la photo reste
 * verticale 4:5 tant que l'utilisateur n'en décide pas autrement.
 */
export const DEFAULT_CARDS_PHOTO_FORMAT: CardsPhotoFormat = "portrait";

/**
 * Alias de lecture du format historique.
 *
 * La rubrique n'exposait qu'un format, stocké `"classic"`. Plutôt que de
 * réécrire les contenus déjà enregistrés — une migration de données pour un
 * simple changement de vocabulaire —, le résolveur traduit `"classic"` en
 * `"portrait"`. Même technique que « masonry » → « static » (11.1).
 */
const CARDS_LEGACY_VARIANTS: Record<string, CardsVariant> = {
  classic: "portrait",
};

/** Garde : cadrage photo valide. */
export function isCardsPhotoFormat(value: unknown): value is CardsPhotoFormat {
  return value === "portrait" || value === "square" || value === "landscape";
}

/** Garde : variante de carte valide (les trois cadrages, plus `editorial`). */
export function isCardsVariant(value: unknown): value is CardsVariant {
  return isCardsPhotoFormat(value) || value === "editorial";
}

/**
 * Lit la variante d'un contenu stocké, alias historique compris.
 * Toute valeur inconnue retombe sur `portrait` — l'ancien comportement.
 */
export function readCardsVariant(value: unknown): CardsVariant {
  const legacy =
    typeof value === "string" ? CARDS_LEGACY_VARIANTS[value] : undefined;
  if (legacy !== undefined) {
    return legacy;
  }
  return isCardsVariant(value) ? value : DEFAULT_CARDS_VARIANT;
}

/**
 * Cadrage photo réellement appliqué à une section.
 *
 * C'est la fonction pivot de l'étape 13.3 : les trois formats historiques ont
 * leur cadrage dans la variante, `editorial` dans son layout. Tout le rendu
 * (ratio de la photo, verrouillage des colonnes) passe par ici — jamais par un
 * test direct sur la variante, qui confondrait « éditorial » et « paysage ».
 */
export function cardsPhotoFormat(
  variant: CardsVariant,
  editorialFormat: CardsPhotoFormat
): CardsPhotoFormat {
  return variant === "editorial" ? editorialFormat : variant;
}

/**
 * Ordre d'affichage des **formats photo** (sélecteur de l'éditeur).
 *
 * `editorial` en est volontairement absent : la variante éditoriale se choisit
 * **au catalogue**, comme on ajoute une section. Changer de variante depuis
 * l'éditeur détruirait les corps de texte riche (la forme des cartes change) —
 * un réglage destructif n'a rien à faire dans une liste déroulante.
 */
export const cardsPhotoFormatOrder: CardsPhotoFormat[] = [
  "portrait",
  "square",
  "landscape",
];

/**
 * Ordre complet des variantes (libellés, catalogue, documentation).
 * Il contient les trois cadrages **et** `editorial`.
 */
export const cardsVariantOrder: CardsVariant[] = [
  "portrait",
  "square",
  "landscape",
  "editorial",
];

/** Libellés français des variantes. */
export const cardsVariantLabels: Record<CardsVariant, string> = {
  portrait: "Portrait",
  square: "Carré",
  landscape: "Paysage",
  editorial: "Texte structuré",
};

/** Explications affichées sous chaque option du sélecteur de format. */
export const cardsVariantDescriptions: Record<CardsVariant, string> = {
  portrait: "Photos verticales (4:5) : le format du gabarit d’origine.",
  square: "Photos carrées (1:1) : portraits serrés, détails, objets.",
  landscape:
    "Photos horizontales, 2 cartes par ligne : chaque image garde de la présence.",
  editorial:
    "Le corps de la carte est un texte mis en forme : sous-titres, listes, gras, liens.",
};

/**
 * Proportions proposées pour le format paysage.
 *
 * Stockées sous la forme lisible « 3:2 » — celle des libellés et des ratios
 * d'appareil photo — puis converties en syntaxe CSS par `CARDS_RATIO_CSS` :
 * `aspect-ratio` n'accepte pas les deux-points.
 */
export const CARDS_LANDSCAPE_RATIOS = ["3:2", "4:3", "16:9"] as const;

/** Proportion de photo du format paysage — dérivée de la liste ci-dessus. */
export type CardsLandscapeRatio = (typeof CARDS_LANDSCAPE_RATIOS)[number];

/** Proportion par défaut du paysage : le format d'appareil photo. */
export const DEFAULT_CARDS_LANDSCAPE_RATIO: CardsLandscapeRatio = "3:2";

/** Libellés français des proportions paysage. */
export const cardsLandscapeRatioLabels: Record<CardsLandscapeRatio, string> = {
  "3:2": "3:2 — appareil photo (défaut)",
  "4:3": "4:3 — quatre tiers",
  "16:9": "16:9 — panoramique",
};

/** Garde : proportion paysage valide. */
export function isCardsLandscapeRatio(
  value: unknown
): value is CardsLandscapeRatio {
  return value === "3:2" || value === "4:3" || value === "16:9";
}

/** Ratio stocké (« 3:2 ») → valeur CSS de `aspect-ratio` (« 3 / 2 »). */
const CARDS_RATIO_CSS: Record<string, string> = {
  "4:5": "4 / 5",
  "1:1": "1 / 1",
  "3:2": "3 / 2",
  "4:3": "4 / 3",
  "16:9": "16 / 9",
};

/** Ratios fixes des formats qui n'en proposent qu'un. */
const CARDS_FIXED_RATIOS: Record<"portrait" | "square", string> = {
  portrait: "4:5",
  square: "1:1",
};

/**
 * Ratio de la photo d'un **format**, en **valeur CSS** — c'est ce que le rendu
 * pose dans `aspect-ratio`. Le paysage lit son réglage, les deux autres ont un
 * ratio fixe.
 *
 * La signature prend le cadrage (`CardsPhotoFormat`) et non la variante : une
 * section `editorial` a, elle aussi, une photo — le cadrage vient alors de
 * `cardsPhotoFormat(...)`. L'ancienne signature « variante = format » rendait
 * cette lecture impossible.
 */
export function cardsMediaRatio(
  photoFormat: CardsPhotoFormat,
  landscapeRatio: CardsLandscapeRatio
): string {
  const label = cardsEditorRatio(photoFormat, landscapeRatio);
  return CARDS_RATIO_CSS[label] ?? CARDS_RATIO_CSS["4:5"];
}

/**
 * Ratio d'un format **dans la notation des libellés** (« 4:5 », « 3:2 ») :
 * c'est la forme attendue par `ArtSourceField` pour sa vignette d'aperçu et par
 * le sélecteur de proportions.
 */
export function cardsEditorRatio(
  photoFormat: CardsPhotoFormat,
  landscapeRatio: CardsLandscapeRatio
): string {
  return photoFormat === "landscape"
    ? landscapeRatio
    : CARDS_FIXED_RATIOS[photoFormat];
}

/**
 * Nombres de cartes par ligne **proposés** pour une section.
 *
 * Le paysage n'en accepte qu'un (2) ; les trois autres variantes en proposent
 * de 2 à 4, et `editorial` monte à 6 — un corps de texte structuré se lit bien
 * dans une colonne étroite, contrairement à une photo 4:5 qui n'y serait plus
 * une photo. C'est donc la liste des valeurs que l'éditeur affiche.
 */
export function cardsColumnOptions(
  variant: CardsVariant,
  photoFormat: CardsPhotoFormat
): CardsColumns[] {
  if (photoFormat === "landscape") {
    return [2];
  }
  return variant === "editorial" ? [...CARDS_COLUMN_COUNTS] : [2, 3, 4];
}

/**
 * Nombre de cartes par ligne réellement appliqué.
 *
 * Le **paysage** impose 2 colonnes : à 3 ou 4, une photo horizontale surmontée
 * d'un bloc de texte devient une vignette trop étroite pour que le titre et le
 * bouton respirent. La contrainte est appliquée à la lecture **et** à
 * l'écriture : un contenu réglé sur 4 puis passé en paysage revient à 2, sans
 * que l'utilisateur ait à y penser.
 *
 * Les trois formats photo sont également plafonnés à 4, y compris si une valeur
 * supérieure a été écrite à la main : seules les sections `editorial` montent à
 * 6. Le cadrage se lit désormais via `cardsPhotoFormat(...)`, jamais dans la
 * variante — `editorial` n'est pas un format de photo.
 */
export function cardsColumnsFor(
  variant: CardsVariant,
  photoFormat: CardsPhotoFormat,
  requested: CardsColumns
): CardsColumns {
  const options = cardsColumnOptions(variant, photoFormat);
  // Borne par la liste des valeurs permises (aucun `cast` : on ne choisit que
  // dans une liste déjà typée).
  let applied: CardsColumns = options[0];
  for (const option of options) {
    if (option <= requested) {
      applied = option;
    }
  }
  return applied;
}

/**
 * Vrai si le **cadrage** impose son nombre de colonnes.
 * L'éditeur masque alors le réglage — un contrôle sans effet serait un piège.
 */
export function cardsColumnsLocked(photoFormat: CardsPhotoFormat): boolean {
  return photoFormat === "landscape";
}

/** Nombres de cartes par ligne proposés par l'éditeur (desktop). */
export const CARDS_COLUMN_COUNTS = [2, 3, 4, 5, 6] as const;

/** Nombre de cartes par ligne — type dérivé de la liste ci-dessus. */
export type CardsColumns = (typeof CARDS_COLUMN_COUNTS)[number];

/**
 * Alignement horizontal de l'en-tête de section.
 * Mêmes deux valeurs, et dans le même vocabulaire, que l'en-tête de la section
 * « Contenu en colonnes » (`ContentHeaderAlign`, étape 12.2) : deux réglages
 * identiques dans deux sections ne doivent pas se nommer différemment.
 */
export type CardsAlign = "left" | "center";

/**
 * Bouton d'une carte.
 *
 * Il ne porte **que son contenu** : libellé et destination, qui appartiennent à
 * la carte. Le **style** (`primary` / `secondary` / `outline`) est un réglage de
 * la **section** (`CardsStyleSettings.ctaStyle`) : dans une même rangée, trois
 * boutons d'aspects différents se liraient comme trois éléments de nature
 * différente, alors qu'ils ont le même rôle.
 */
export interface CardCta {
  /** Libellé du bouton. */
  label: string;
  /** Destination : interne (`/page`, `#ancre`), absolue ou protocole d'action. */
  href: string;
}

/** Une carte : photo, titre, texte, bouton. */
export interface CardItem {
  id: string;
  media: ArtSource;
  /** Titre de la carte — rendu en `<h3>` (jamais un `h2` : l'en-tête le porte). */
  title: string;
  /** Texte simple : les sauts de ligne sont préservés au rendu. */
  text: string;
  cta: CardCta;
}

/**
 * Une carte **éditoriale** : photo, corps en texte riche, bouton (Étape 13.3).
 *
 * Ni titre ni texte séparés : le corps est **un seul document** (option validée
 * en planification), où l'utilisateur met lui-même sous-titres, paragraphes et
 * listes. Deux conséquences assumées :
 *   - le **libellé d'accordéon** et le **`alt` de repli** de la photo se
 *     déduisent du document (`richTextDocToPlainText`) — il n'y a rien d'autre
 *     à lire ;
 *   - `cta` reste identique à celui des cartes photo : libellé et destination,
 *     sans style (le style est un réglage de section, cf. `ctaStyle`).
 */
export interface EditorialCardItem {
  id: string;
  media: ArtSource;
  /** Corps de la carte : document ProseMirror (jamais du HTML). */
  body: RichTextDoc;
  cta: CardCta;
}

/**
 * Effets de survol d'une carte — sous-ensemble **volontairement réduit** de
 * `GalleryHoverEffects` : ni `lift` (l'élévation suggérait un clic inexistant),
 * ni `parallax` (sans objet sur une vignette). Les valeurs sont bornées au
 * domaine, comme pour la galerie, pour qu'aucun contenu hérité ne produise un
 * rendu aberrant.
 */
export interface CardsHoverEffects {
  /** Zoom de l'image au survol, en pourcentage (100 = aucun zoom). */
  zoom: number;
  /** Brillance : reflet diagonal discret qui traverse la photo. */
  shine: boolean;
  /** Saturation et contraste progressifs. */
  saturate: boolean;
  /** Liseré lumineux, à la couleur d'accent du thème. */
  glow: boolean;
}

/** Réglages de mise en page de la section. */
export interface CardsLayoutSettings {
  /** Cartes par ligne sur grand écran (2 à 4, jusqu'à 6 en `editorial`). */
  columns: CardsColumns;
  /** Alignement de l'en-tête (titre, sous-titre, introduction). */
  align: CardsAlign;
  /**
   * Proportions de la photo du format **paysage** (3:2, 4:3 ou 16:9).
   * Sans objet pour les deux autres formats photo, qui ont un ratio fixe — le
   * champ est conservé quand on change de format, pour ne pas perdre le réglage.
   */
  landscapeRatio: CardsLandscapeRatio;
  /**
   * Cadrage photo de la variante `editorial` (Étape 13.3).
   *
   * La variante éditoriale est la seule dont le **corps** n'est pas une photo :
   * son cadrage ne peut donc pas être porté par `variant` comme celui des trois
   * formats historiques. Sans objet pour eux (même statut que `landscapeRatio`
   * hors paysage) — le champ est conservé pour ne pas perdre le réglage.
   */
  editorialFormat: CardsPhotoFormat;
}

/** Apparence des cartes — les mêmes réglages que les vignettes de galerie. */
export interface CardsStyleSettings {
  /** Arrondi du **cadre de la photo**, en px. */
  radius: number;
  /** Ombre portée (cadre de la photo). */
  shadow: GalleryShadowLevel;
  /** Bordure optionnelle du cadre de la photo (épaisseur + couleur). */
  border: GalleryBorderSettings;
  /**
   * Arrondi du **bloc de texte** (le pied de carte), en px.
   * Réglage distinct de `radius` : ce sont deux éléments, et le gabarit leur
   * donne deux arrondis différents (12 px pour la photo, 2 px pour le bloc).
   */
  bodyRadius: number;
  /**
   * Style du filet du bloc de texte, épaisseur réglable.
   *
   * Le filet est **toujours présent** (minimum 1 px) et sa couleur est celle de
   * l'accent du thème : seul ce qui se voit franchement — l'épaisseur — se
   * règle. La couleur, elle, suit le thème clair/sombre sans intervention.
   */
  bodyBorderWidth: number;
  /**
   * Style des boutons de **toute la section** (mêmes trois valeurs que le CTA
   * du Héro). Réglage de section, et non de carte : dans une rangée, trois
   * boutons d'aspects différents se liraient comme trois éléments de nature
   * différente, alors qu'ils ont le même rôle.
   */
  ctaStyle: HeroCtaStyle;
  /**
   * Affichage des boutons de **toute la section** (défaut : affichés).
   *
   * Deux raisons d'en faire un interrupteur de section plutôt qu'un champ vide
   * par carte :
   *   - une section sans bouton est un choix éditorial légitime (des cartes qui
   *     présentent, sans renvoyer ailleurs) ;
   *   - masquer ne **supprime pas** les libellés et destinations, qui restent
   *     enregistrés : réactiver l'interrupteur les fait réapparaître tels quels.
   *     C'est un réglage d'affichage, pas un effacement de données.
   */
  ctaShow: boolean;
  /** Effets de survol, portés par la photo. */
  hover: CardsHoverEffects;
}

/**
 * Socle commun aux quatre variantes de cards.
 *
 * L'en-tête de section, la mise en page et l'apparence ne dépendent pas de la
 * nature du corps des cartes : ils sont donc décrits une seule fois, et chaque
 * variante n'ajoute que ce qui lui est propre (le cadrage, ou le corps riche).
 */
interface CardsContentBase {
  type: "cards";
  /** Titre de la section — rendu en `<h2>`. */
  heading: string;
  /** Sous-titre affiché sous le titre. */
  subtitle: string;
  /** Paragraphe d'introduction (sauts de ligne préservés). */
  intro: string;
  layout: CardsLayoutSettings;
  style: CardsStyleSettings;
}

/** Contenu Cards des trois formats **photo** — le cadrage EST la variante. */
export interface CardsPhotoContent extends CardsContentBase {
  variant: CardsPhotoFormat;
  /**
   * Les cartes, dans l'ordre d'affichage. Aucun plafond : au-delà du nombre de
   * colonnes, la ligne suivante se forme d'elle-même.
   */
  cards: CardItem[];
}

/** Contenu Cards **éditorial** — le cadrage vit dans `layout.editorialFormat`. */
export interface CardsEditorialContent extends CardsContentBase {
  variant: "editorial";
  /** Idem : aucun plafond de nombre, seule la grille est bornée. */
  cards: EditorialCardItem[];
}

/**
 * Contenu du module `cards`, toutes variantes confondues.
 * Union discriminée par `variant` : un `cards[0].title` sur une section
 * éditoriale ne compile pas, ce qui est exactement la garantie recherchée.
 */
export type CardsContent = CardsPhotoContent | CardsEditorialContent;

/** Effets de survol par défaut : sobres (un site publié ne scintille pas tout seul). */
export const DEFAULT_CARDS_HOVER_EFFECTS: CardsHoverEffects = {
  zoom: 104,
  shine: false,
  saturate: false,
  glow: false,
};

/** Mise en page par défaut : 3 colonnes, en-tête centré, paysage en 3:2. */
export const DEFAULT_CARDS_LAYOUT: CardsLayoutSettings = {
  columns: 3,
  align: "center",
  landscapeRatio: DEFAULT_CARDS_LANDSCAPE_RATIO,
  editorialFormat: DEFAULT_CARDS_PHOTO_FORMAT,
};

/**
 * Apparence par défaut : mêmes valeurs de départ que les vignettes de galerie,
 * plus les deux réglages du bloc de texte, qui reprennent **exactement** le
 * gabarit d'origine (arrondi 2 px, filet 2 px).
 */
export const DEFAULT_CARDS_STYLE: CardsStyleSettings = {
  radius: 12,
  shadow: "normal",
  border: { enabled: false, width: 1, color: "#EAE5E5" },
  bodyRadius: 2,
  bodyBorderWidth: 2,
  ctaStyle: "primary",
  ctaShow: true,
  hover: { ...DEFAULT_CARDS_HOVER_EFFECTS },
};

/** Ordre d'affichage des nombres de colonnes (éditeur). */
export const cardsColumnOrder: CardsColumns[] = [2, 3, 4, 5, 6];

/** Libellés français des nombres de colonnes. */
export const cardsColumnLabels: Record<CardsColumns, string> = {
  2: "2 par ligne",
  3: "3 par ligne",
  4: "4 par ligne",
  5: "5 par ligne",
  6: "6 par ligne",
};

/** Ordre d'affichage des alignements d'en-tête (éditeur). */
export const cardsAlignOrder: CardsAlign[] = ["center", "left"];

/** Libellés français des alignements d'en-tête. */
export const cardsAlignLabels: Record<CardsAlign, string> = {
  center: "Centré",
  left: "Aligné à gauche",
};

/**
 * Dimensions des visuels de démonstration, par **cadrage**.
 * Un carré ne se montre pas avec une photo 4:5 : la démonstration doit illustrer
 * le cadrage choisi, sinon on juge un format que le module ne produira jamais.
 */
const CARDS_DEMO_MEDIA: Record<
  CardsPhotoFormat,
  { width: number; height: number }
> = {
  portrait: { width: 800, height: 1000 },
  square: { width: 900, height: 900 },
  landscape: { width: 1200, height: 800 },
};

/** Fabrique une carte d'exemple (placeholders picsum, seed stable, bon ratio). */
export function createCardItem(
  demoIndex = 0,
  photoFormat: CardsPhotoFormat = DEFAULT_CARDS_PHOTO_FORMAT
): CardItem {
  const demo = CARDS_DEMO[demoIndex] ?? CARDS_DEMO[0];
  const size = CARDS_DEMO_MEDIA[photoFormat];
  return {
    id: crypto.randomUUID(),
    media: {
      url: `https://picsum.photos/seed/${demo.seed}-${photoFormat}/${size.width}/${size.height}`,
      alt: `${demo.title} — visuel de la carte`,
    },
    title: demo.title,
    text: demo.text,
    // Le style du bouton n'est pas porté par la carte : il se règle pour la
    // section entière (`style.ctaStyle`).
    cta: { label: demo.ctaLabel, href: demo.href },
  };
}

/**
 * Textes des cartes d'exemple (seeds picsum stables, aucun document partagé).
 *
 * `bullets` et `steps` n'alimentent que les cartes **éditoriales** (étape 13.3) :
 * le corps d'exemple doit montrer les deux natures de liste que la barre d'outils
 * propose, sans quoi la démonstration ne prouverait rien.
 */
const CARDS_DEMO = [
  {
    seed: "cards-mariage",
    title: "Mariage",
    text: "Des images sincères, de la préparation à la soirée, pour raconter votre journée telle qu’elle s’est vécue.",
    ctaLabel: "Voir les mariages",
    href: "/portfolio",
    bullets: [
      "Préparatifs, cérémonie et soirée couverts",
      "Galerie privée livrée en ligne",
    ],
    steps: [
      "Rendez-vous pour parler de votre journée",
      "Reportage le jour J",
      "Sélection et retouches des images",
    ],
  },
  {
    seed: "cards-portrait",
    title: "Portrait",
    text: "Une séance en extérieur ou en studio, pour un portrait qui vous ressemble — seul, en couple ou en famille.",
    ctaLabel: "Voir les portraits",
    href: "/prestations",
    bullets: [
      "Extérieur ou studio, au choix",
      "Conseils de tenue avant la séance",
    ],
    steps: [
      "Échange sur le style recherché",
      "Séance d’une heure environ",
      "Livraison des images retouchées",
    ],
  },
  {
    seed: "cards-entreprise",
    title: "Entreprise",
    text: "Portraits d’équipe, reportages et images de marque, pensés pour vos supports de communication.",
    ctaLabel: "Découvrir l’accompagnement",
    href: "/a-propos",
    bullets: [
      "Sur site ou dans vos locaux",
      "Cession de droits adaptée à vos supports",
    ],
    steps: [
      "Cadrage du besoin avec vos équipes",
      "Prise de vue sur une ou deux journées",
      "Banque d’images prête à publier",
    ],
  },
] as const;

/** Bloc de liste d'exemple (à puces ou numérotée) : une liste de paragraphes. */
function editorialList(
  kind: "bulletList" | "orderedList",
  items: readonly string[]
): RichTextNode {
  return {
    type: kind,
    content: items.map((item) => ({
      type: "listItem",
      content: [{ type: "paragraph", content: [{ type: "text", text: item }] }],
    })),
  };
}

/**
 * Corps d'exemple d'une carte éditoriale : sous-titre H3, paragraphe, liste à
 * puces et liste numérotée.
 *
 * Un **document neuf** est construit à chaque appel (aucun objet partagé entre
 * deux cartes) : c'est ce qui garantit qu'éditer une carte, ou la dupliquer, ne
 * modifie jamais le corps d'une autre.
 */
function createEditorialBody(
  demo: (typeof CARDS_DEMO)[number]
): RichTextDoc {
  return {
    type: "doc",
    content: [
      {
        type: "heading",
        attrs: { level: 3 },
        content: [{ type: "text", text: demo.title }],
      },
      {
        type: "paragraph",
        content: [{ type: "text", text: demo.text }],
      },
      editorialList("bulletList", demo.bullets),
      editorialList("orderedList", demo.steps),
    ],
  };
}

/**
 * Fabrique une carte **éditoriale** d'exemple (photo + corps riche + bouton).
 * Le cadrage de la photo suit `layout.editorialFormat`, comme au rendu.
 */
export function createEditorialCardItem(
  demoIndex = 0,
  photoFormat: CardsPhotoFormat = DEFAULT_CARDS_PHOTO_FORMAT
): EditorialCardItem {
  const demo = CARDS_DEMO[demoIndex] ?? CARDS_DEMO[0];
  const size = CARDS_DEMO_MEDIA[photoFormat];
  return {
    id: crypto.randomUUID(),
    media: {
      url: `https://picsum.photos/seed/${demo.seed}-${photoFormat}/${size.width}/${size.height}`,
      alt: `${demo.title} — visuel de la carte`,
    },
    body: createEditorialBody(demo),
    cta: { label: demo.ctaLabel, href: demo.href },
  };
}

/**
 * Fabrique un contenu Cards complet (3 cartes d'exemple) pour une variante.
 *
 * Le cadrage décide du ratio des visuels **et** du nombre de colonnes : le
 * paysage, qui n'en accepte que deux, produit donc un contenu déjà conforme à
 * ce que la grille appliquera. La variante `editorial` suit la même règle, mais
 * construit ses cartes avec un **corps riche** au lieu d'un titre et d'un texte.
 */
export function createCardsContent(
  variant: CardsVariant = DEFAULT_CARDS_VARIANT
): CardsContent {
  const photoFormat = cardsPhotoFormat(variant, DEFAULT_CARDS_PHOTO_FORMAT);
  const layout: CardsLayoutSettings = {
    ...DEFAULT_CARDS_LAYOUT,
    columns: cardsColumnsFor(
      variant,
      photoFormat,
      DEFAULT_CARDS_LAYOUT.columns
    ),
  };
  const style: CardsStyleSettings = {
    ...DEFAULT_CARDS_STYLE,
    border: { ...DEFAULT_CARDS_STYLE.border },
    hover: { ...DEFAULT_CARDS_STYLE.hover },
  };
  const heading = "Mes univers";
  const subtitle = "Trois façons de travailler ensemble";
  const intro =
    "Chaque projet commence par une rencontre. Voici les trois terrains sur lesquels je vous accompagne le plus souvent.";

  if (variant === "editorial") {
    return {
      type: "cards",
      variant: "editorial",
      heading,
      subtitle,
      intro,
      layout,
      style,
      cards: CARDS_DEMO.map((_, index) =>
        createEditorialCardItem(index, photoFormat)
      ),
    };
  }
  return {
    type: "cards",
    variant,
    heading,
    subtitle,
    intro,
    layout,
    style,
    cards: CARDS_DEMO.map((_, index) => createCardItem(index, photoFormat)),
  };
}

/** Garde : nombre de colonnes valide (2 à 6, le maximum d'`editorial`). */
function isCardsColumns(value: unknown): value is CardsColumns {
  return (
    value === 2 || value === 3 || value === 4 || value === 5 || value === 6
  );
}

/**
 * Garde : niveau d'ombre valide.
 * Les niveaux sont ceux de la galerie — la carte en réutilise l'échelle, il n'y
 * a donc pas de seconde liste à tenir à jour.
 */
function isGalleryShadowLevel(value: unknown): value is GalleryShadowLevel {
  return (
    value === "none" ||
    value === "light" ||
    value === "medium" ||
    value === "normal" ||
    value === "strong"
  );
}

/**
 * Résout une carte stockée (JSONB) vers une carte complète.
 *
 * **Ne ressuscite jamais un texte de démonstration** : un champ vidé par
 * l'utilisateur doit rester vide. La tolérance porte sur la *forme* (champ
 * absent, mauvais type), jamais sur le *contenu*.
 */
function resolveCardItem(
  raw: unknown,
  photoFormat: CardsPhotoFormat = DEFAULT_CARDS_PHOTO_FORMAT
): CardItem {
  if (!isRecord(raw)) {
    return createCardItem(0, photoFormat);
  }
  const ctaRaw = isRecord(raw.cta) ? raw.cta : {};
  return {
    id: readString(raw.id, crypto.randomUUID()),
    media: readArtSource(raw, "media", { url: "", alt: "" }),
    title: readString(raw.title, ""),
    text: readString(raw.text, ""),
    cta: resolveCardCta(ctaRaw),
  };
}

/** Lit le bouton d'une carte (commun aux deux formes de carte). */
function resolveCardCta(ctaRaw: Record<string, unknown>): CardCta {
  return {
    label: readString(ctaRaw.label, ""),
    href: readString(ctaRaw.href, ""),
    // `ctaRaw.style` (contenus de 13.1) n'est plus lu : le style est devenu un
    // réglage de section. Le champ reste dans le JSONB sans être interprété —
    // aucune migration, et le rendu est identique puisque tous les boutons
    // enregistrés étaient en `primary`.
  };
}

/**
 * Lit un corps de carte éditoriale stocké.
 *
 * Un corps absent ou mal formé rend un document **vide sans paragraphe**
 * (`content: []`) et non le document à un paragraphe vide de
 * `createEmptyRichTextDoc()` : un paragraphe vide produirait un `<p><br></p>` de
 * hauteur résiduelle dans une carte qui n'a rien à dire. `RichTextRenderer`
 * n'émet rien pour un document sans nœuds — c'est exactement le comportement
 * voulu ici.
 */
function resolveEditorialBody(raw: unknown): RichTextDoc {
  if (isRecord(raw) && raw.type === "doc" && isUnknownArray(raw.content)) {
    const nodes: RichTextNode[] = [];
    for (const node of raw.content) {
      if (isRecord(node)) {
        nodes.push(node);
      }
    }
    return { type: "doc", content: nodes };
  }
  return { type: "doc", content: [] };
}

/**
 * Résout une carte éditoriale stockée : photo, corps riche, bouton.
 *
 * Comme pour les cartes photo, **aucun texte de démonstration n'est
 * ressuscité** : un corps vidé reste vide.
 */
function resolveEditorialCardItem(raw: unknown): EditorialCardItem {
  if (!isRecord(raw)) {
    return createEditorialCardItem();
  }
  const ctaRaw = isRecord(raw.cta) ? raw.cta : {};
  return {
    id: readString(raw.id, crypto.randomUUID()),
    media: readArtSource(raw, "media", { url: "", alt: "" }),
    body: resolveEditorialBody(raw.body),
    cta: resolveCardCta(ctaRaw),
  };
}

/** Normalise les effets de survol d'une carte (repli champ par champ). */
function resolveCardsHoverEffects(raw: unknown): CardsHoverEffects {
  const record = isRecord(raw) ? raw : {};
  const defaults = DEFAULT_CARDS_HOVER_EFFECTS;
  return {
    zoom: readBoundedNumber(record.zoom, defaults.zoom, 100, 118),
    shine: typeof record.shine === "boolean" ? record.shine : defaults.shine,
    saturate:
      typeof record.saturate === "boolean"
        ? record.saturate
        : defaults.saturate,
    glow: typeof record.glow === "boolean" ? record.glow : defaults.glow,
  };
}

/**
 * Résout un contenu Cards stocké (JSONB) vers un contenu complet.
 *
 * Aucune donnée héritée ne peut produire d'exception : un contenu tronqué,
 * d'un ancien format ou même un `null` rend un objet lisible — le rendu décide
 * ensuite de ne rien afficher s'il n'y a rien à afficher.
 *
 * Normalisations à connaître :
 *   - **le format** : `"classic"` (contenus de l'étape 13.1) devient
 *     `"portrait"`, et toute valeur inconnue retombe sur le format par défaut ;
 *   - **le cadrage** : les trois formats photo le portent dans `variant`,
 *     `editorial` dans `layout.editorialFormat` — `cardsPhotoFormat()` réunit
 *     les deux, et tout le reste du résolveur raisonne sur le cadrage ;
 *   - **les colonnes** : le paysage n'en accepte que deux, et les formats photo
 *     plafonnent à quatre, quelle que soit la valeur stockée — la contrainte est
 *     appliquée ici, pas seulement dans l'éditeur, pour qu'un contenu écrit
 *     avant le changement de variante reste cohérent ;
 *   - **les réglages du bloc de texte** (arrondi, épaisseur du filet), absents
 *     des contenus de 13.1, prennent leurs valeurs de gabarit (2 px / 2 px)
 *     sans migration de données ;
 *   - **`ctaShow` et `editorialFormat`** sont apparus en 13.3 : absents des
 *     contenus antérieurs, ils prennent leurs défauts (boutons affichés, photo
 *     portrait) — champs **optionnels** dans le schéma Zod, donc aucun contenu
 *     existant n'est invalidé (même technique que `hoverEffects` en 11.23).
 */
export function resolveCardsContent(raw: unknown): CardsContent {
  if (!isRecord(raw)) {
    return createCardsContent();
  }
  const layoutRaw = isRecord(raw.layout) ? raw.layout : {};
  const styleRaw = isRecord(raw.style) ? raw.style : {};
  const cardsRaw = Array.isArray(raw.cards) ? raw.cards : [];
  const variant = readCardsVariant(raw.variant);
  const editorialFormat = isCardsPhotoFormat(layoutRaw.editorialFormat)
    ? layoutRaw.editorialFormat
    : DEFAULT_CARDS_LAYOUT.editorialFormat;
  const photoFormat = cardsPhotoFormat(variant, editorialFormat);

  const heading = readString(raw.heading, "");
  const subtitle = readString(raw.subtitle, "");
  const intro = readString(raw.intro, "");
  const layout: CardsLayoutSettings = {
    columns: cardsColumnsFor(
      variant,
      photoFormat,
      isCardsColumns(layoutRaw.columns)
        ? layoutRaw.columns
        : DEFAULT_CARDS_LAYOUT.columns
    ),
    align: layoutRaw.align === "left" ? "left" : DEFAULT_CARDS_LAYOUT.align,
    landscapeRatio: isCardsLandscapeRatio(layoutRaw.landscapeRatio)
      ? layoutRaw.landscapeRatio
      : DEFAULT_CARDS_LAYOUT.landscapeRatio,
    editorialFormat,
  };
  const style: CardsStyleSettings = {
    radius: readBoundedNumber(styleRaw.radius, DEFAULT_CARDS_STYLE.radius, 0, 40),
    shadow: isGalleryShadowLevel(styleRaw.shadow)
      ? styleRaw.shadow
      : DEFAULT_CARDS_STYLE.shadow,
    border: resolveGalleryBorder(styleRaw.border),
    bodyRadius: readBoundedNumber(
      styleRaw.bodyRadius,
      DEFAULT_CARDS_STYLE.bodyRadius,
      0,
      200
    ),
    bodyBorderWidth: readBoundedNumber(
      styleRaw.bodyBorderWidth,
      DEFAULT_CARDS_STYLE.bodyBorderWidth,
      1,
      24
    ),
    ctaStyle: isHeroCtaStyle(styleRaw.ctaStyle)
      ? styleRaw.ctaStyle
      : DEFAULT_CARDS_STYLE.ctaStyle,
    // Un contenu antérieur à 13.3 n'a pas la clé : les boutons restaient
    // affichés, le défaut préserve exactement le rendu existant.
    ctaShow:
      typeof styleRaw.ctaShow === "boolean"
        ? styleRaw.ctaShow
        : DEFAULT_CARDS_STYLE.ctaShow,
    hover: resolveCardsHoverEffects(styleRaw.hover),
  };

  if (variant === "editorial") {
    return {
      type: "cards",
      variant: "editorial",
      heading,
      subtitle,
      intro,
      layout,
      style,
      cards: cardsRaw.map((card) => resolveEditorialCardItem(card)),
    };
  }
  return {
    type: "cards",
    variant,
    heading,
    subtitle,
    intro,
    layout,
    style,
    cards: cardsRaw.map((card) => resolveCardItem(card, photoFormat)),
  };
}

/**
 * Images non vides portées par la section — sert à la collecte des images d'une
 * page (métadonnées EXIF) et à l'image de partage OpenGraph : une page peut
 * n'être faite que de cartes, leurs photos comptent donc autant que les autres.
 */
export function cardsImageSources(content: CardsContent): ArtSource[] {
  // Vue commune aux deux formes de carte : seule la photo compte ici.
  const cards: ReadonlyArray<{ media: ArtSource }> = content.cards;
  return cards.map((card) => card.media).filter((source) => source.url !== "");
}

/* ==========================================================================
   RUBRIQUE « CONTACT » — coordonnées, formulaire, réseaux sociaux (Étape 14.1)
   --------------------------------------------------------------------------
   Le module contact historique ne portait que trois champs à plat (titre,
   introduction, coordonnées) et aucune écriture visiteur. La refonte le
   structure en **quatre containers** :

     1. le chapeau (titre `h2`, sous-titre, paragraphe) ;
     2. les coordonnées, masquables ligne par ligne ;
     3. le formulaire, seul chemin d'écriture **non authentifié** du projet ;
     4. les réseaux sociaux, liste ordonnée.

   Trois partis pris structurants :

   1. **Aucune donnée sensible ne vient du contenu de module.** Le destinataire
      du message, le `photographer_id` et la légitimité de la pièce jointe sont
      résolus côté serveur (XML 14.1 D12/D13) : le JSONB ne décrit que ce que le
      visiteur voit.
   2. **La tolérance vit dans `resolveContactContent`**, jamais dans le schéma.
      Le contenu de module est persisté en `z.unknown()`
      (`src/lib/schemas/persistence.ts`) : le schéma Zod est un **miroir
      documentaire**, pas un garde d'enregistrement. Un contenu tronqué ou
      hérité doit rester lisible — jamais lever.
   3. **Le résolveur ne ressuscite aucun exemple.** Un champ vidé par
      l'utilisateur reste vide ; seule la *forme* manquante est complétée
      (même règle que les Cards, étape 13.3).
   ========================================================================== */

/** Alignement du chapeau (mêmes deux valeurs que les autres en-têtes). */
export type ContactAlign = "left" | "center";

/** Alignement horizontal de la rangée de réseaux sociaux. */
export type ContactSocialAlignment = "left" | "center" | "right";

/**
 * Habillage d'une icône de réseau.
 *
 * C'est un habillage **neutre** : `--surface-color` et filet `--border-color`,
 * jamais la couleur officielle de la marque. Un fond à la couleur officielle
 * avec l'icône officielle serait illisible par construction — les deux se
 * confondraient. La couleur de l'icône est réglée **séparément** par le mode
 * couleur (cf. `ContactSocialColorMode`).
 */
export type ContactSocialShape = "minimal" | "circle" | "square" | "rounded";

/**
 * Mode couleur des icônes.
 *   - `theme`    : la couleur d'accent du thème (`currentColor`, déjà alias de
 *                  `--accent-color`) ;
 *   - `official` : la couleur officielle de la marque (fournie par la
 *                  bibliothèque d'icônes) ;
 *   - `custom`   : une couleur figée choisie par le photographe.
 */
export type ContactSocialColorMode = "theme" | "official" | "custom";

/** Réseaux proposés — catalogue **fermé** (une entrée = une icône). */
export const CONTACT_SOCIAL_NETWORKS = [
  "instagram",
  "facebook",
  "linkedin",
  "youtube",
  "tiktok",
  "x",
  "pinterest",
  "vimeo",
  "behance",
  "flickr",
] as const;

/** Réseau social — type dérivé du catalogue ci-dessus. */
export type ContactSocialNetwork = (typeof CONTACT_SOCIAL_NETWORKS)[number];

/** Garde : réseau du catalogue fermé. */
export function isContactSocialNetwork(
  value: unknown
): value is ContactSocialNetwork {
  return (
    typeof value === "string" &&
    (CONTACT_SOCIAL_NETWORKS as readonly string[]).includes(value)
  );
}

/** Ordre d'affichage des réseaux (sélecteur de l'éditeur). */
export const contactSocialNetworkOrder: ContactSocialNetwork[] = [
  ...CONTACT_SOCIAL_NETWORKS,
];

/** Libellés français des réseaux. */
export const contactSocialNetworkLabels: Record<ContactSocialNetwork, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  linkedin: "LinkedIn",
  youtube: "YouTube",
  tiktok: "TikTok",
  x: "X (Twitter)",
  pinterest: "Pinterest",
  vimeo: "Vimeo",
  behance: "Behance",
  flickr: "Flickr",
};

/** Adresse postale structurée (6 lignes masquables d'un bloc). */
export interface ContactAddressSettings {
  proName: string;
  address1: string;
  address2: string;
  postalCode: string;
  city: string;
  country: string;
}

/** Coordonnées du container 2. */
export interface ContactInfoSettings {
  name: string;
  slogan: string;
  address: ContactAddressSettings;
  landline: string;
  mobile: string;
  email: string;
  /** Horaires — texte libre multiligne (`white-space: pre-line`). */
  hours: string;
  /** Zone d'intervention — texte libre multiligne. */
  serviceArea: string;
}

/**
 * Visibilité du container 2 : un interrupteur **maître** et huit champs.
 *
 * Tous affichés par défaut (D14) : la refonte ne doit pas faire disparaître
 * des coordonnées d'un site existant. Le maître masque le container entier ;
 * les huit autres ne masquent que leur ligne.
 */
export interface ContactVisibilitySettings {
  showContainer2: boolean;
  showName: boolean;
  showSlogan: boolean;
  showAddressGroup: boolean;
  showLandline: boolean;
  showMobile: boolean;
  showEmail: boolean;
  showHours: boolean;
  showServiceArea: boolean;
}

/**
 * `false` : la rubrique « Informations pratiques » (horaires, zone
 * d'intervention) est retirée de l'éditeur **et** du rendu public de ce module,
 * son code restant en place pour un réemploi prévu dans un autre module.
 *
 * Décision D6 de la refonte 14.1.c : le bloc est jugé hors sujet dans le
 * parcours de contact (il occupait la moitié du bloc C2 sans y répondre), mais
 * son contenu et sa mécanique de masquage restent utiles. On ne **supprime**
 * donc rien : on coupe la vue. Rallumer ce seul booléen restitue l'édition et
 * l'affichage, sans ressusciter une donnée effacée (les champs restent en JSONB).
 *
 * Typé `boolean` **explicitement** : sans l'annotation, TS infère le littéral
 * `false` et toute condition `if (CONTACT_PRACTICAL_INFO_ENABLED)` devient
 * « toujours fausse » — avertissement lint, et le code conservé paraîtrait mort
 * alors qu'il est réactivable.
 */
export const CONTACT_PRACTICAL_INFO_ENABLED: boolean = false;

/** Réglages du formulaire (container 3). */
export interface ContactFormSettings {
  /** Taille maximale d'une pièce jointe, en Mo (borné 1..10, domaine **et** serveur). */
  maxFileSizeMB: number;
  /** Extensions acceptées — sous-ensemble du catalogue fermé ci-dessous. */
  allowedExtensions: string[];
  /** Case CGU obligatoire (défaut `true`). */
  requireCGU: boolean;
  /** Texte du lien CGU. */
  cguLinkText: string;
  /** URL du lien CGU — repli `/confidentialite`. */
  cguLinkUrl: string;
}

/** Un réseau social affiché (container 4) — liste ordonnée. */
export interface ContactSocialLink {
  id: string;
  network: ContactSocialNetwork;
  url: string;
}

/** Apparence de la rangée de réseaux. */
export interface ContactSocialStyle {
  colorMode: ContactSocialColorMode;
  /** Couleur utilisée quand `colorMode === "custom"`. */
  customColor: string;
  shape: ContactSocialShape;
  alignment: ContactSocialAlignment;
}

/**
 * Jeton de thème proposé pour le trait des cadres (D2).
 *
 * Un **jeton**, jamais une couleur choisie au hexadécimal : le cadre suit alors
 * le mode clair/sombre du site, comme le reste de la palette. C'est exactement
 * la contrainte du catalogue de bandeau (`BannerThemeToken`).
 */
export type ContactFrameColorToken =
  | "border-color"
  | "accent-color"
  | "accent-color-strong"
  | "text-color"
  | "surface-color";

/**
 * Cadre des conteneurs 2 (coordonnées) et 3 (formulaire) — un **seul** réglage
 * partagé (D7), pour que les deux blocs « se fassent écho ».
 *
 * Le même objet vit dans le JSONB du module (`content.style.frame`) : aucune
 * migration, aucun réglage global — il n'existe pas de store de design system
 * dans ce projet (D1). C'est le modèle de `CardsStyleSettings.bodyBorderWidth` /
 * `bodyRadius`, à ceci près que la couleur est un jeton de thème et non un hex.
 */
export interface ContactFrameSettings {
  /** Épaisseur du trait en px. `0` = **pas de cadre**. Borné 0..8. */
  borderWidth: number;
  borderColorToken: ContactFrameColorToken;
  /** Arrondi des angles en px. Borné 0..24. */
  borderRadius: number;
}

/** Mise en page du module. */
export interface ContactLayoutSettings {
  /** Alignement du chapeau (C1). */
  align: ContactAlign;
  visibility: ContactVisibilitySettings;
}

/** Apparence du module. */
export interface ContactStyleSettings {
  social: ContactSocialStyle;
  /** Cadre partagé des conteneurs 2 et 3 (D7). */
  frame: ContactFrameSettings;
}

/** Contenu du module `contact` — les quatre containers de la refonte 14.1. */
export interface ContactContent {
  type: "contact";
  /** Chapeau (C1) : titre rendu en `<h2>`, jamais un `h1` (invariant de titrage). */
  heading: string;
  subtitle: string;
  intro: string;
  info: ContactInfoSettings;
  form: ContactFormSettings;
  social: ContactSocialLink[];
  layout: ContactLayoutSettings;
  style: ContactStyleSettings;
}

/**
 * Objet **pur** de préremplissage du module contact (invariant A1).
 *
 * Il est construit au point d'appel **client** (l'éditeur, qui a le profil sous
 * la main) et descendu dans `createContactContent`. `pages.ts` n'importe donc
 * jamais `owner-profile.ts`, qui est un module `"use client"` — l'importer
 * depuis du code serveur casserait le build.
 */
export interface ContactPrefill {
  name?: string;
  slogan?: string;
  email?: string;
  serviceArea?: string;
  address?: Partial<ContactAddressSettings>;
  socialLinks?: ContactSocialLink[];
}

/* --------------------------------------------------------------------------
   FORMATS DE PIÈCE JOINTE — catalogue fermé, signature binaire (D6)
   --------------------------------------------------------------------------
   La validation de type ne fait **jamais** confiance à `file.type` (fourni par
   le navigateur, donc falsifiable). Le serveur relit les premiers octets du
   fichier et les compare à la signature du format attendu, sur ce catalogue
   fermé. Le client se contente d'un confort (taille + extension) : il ne
   protège rien.
   -------------------------------------------------------------------------- */

/** Un format accepté en pièce jointe. */
export interface ContactAttachmentFormat {
  /** Extension sans point, en minuscules (clé du réglage `allowedExtensions`). */
  extension: string;
  /** Libellé affiché dans l'éditeur. */
  label: string;
  /** Type MIME canonique (jamais lu depuis le navigateur). */
  mime: string;
  /** Octets d'en-tête attendus, à l'offset 0. */
  signature: number[];
  /** Octets attendus à l'offset 8 — conteneurs RIFF/ZIP (`webp`, `docx`). */
  signatureAt8?: number[];
}

/** Catalogue **fermé** des pièces jointes acceptées. */
export const CONTACT_ATTACHMENT_FORMATS: ContactAttachmentFormat[] = [
  {
    extension: "pdf",
    label: "PDF (.pdf)",
    mime: "application/pdf",
    signature: [0x25, 0x50, 0x44, 0x46],
  },
  {
    extension: "png",
    label: "Image PNG (.png)",
    mime: "image/png",
    signature: [0x89, 0x50, 0x4e, 0x47],
  },
  {
    extension: "jpg",
    label: "Image JPEG (.jpg)",
    mime: "image/jpeg",
    signature: [0xff, 0xd8, 0xff],
  },
  {
    extension: "jpeg",
    label: "Image JPEG (.jpeg)",
    mime: "image/jpeg",
    signature: [0xff, 0xd8, 0xff],
  },
  {
    extension: "webp",
    label: "Image WebP (.webp)",
    mime: "image/webp",
    // Conteneur RIFF : « RIFF » à l'offset 0, « WEBP » à l'offset 8.
    signature: [0x52, 0x49, 0x46, 0x46],
    signatureAt8: [0x57, 0x45, 0x42, 0x50],
  },
  {
    extension: "docx",
    label: "Document Word (.docx)",
    mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    // Tout `.docx` est une archive ZIP (PK\x03\x04).
    signature: [0x50, 0x4b, 0x03, 0x04],
  },
];

/** Extensions par défaut : tout le catalogue. */
export const contactDefaultExtensions: string[] = CONTACT_ATTACHMENT_FORMATS.map(
  (format) => format.extension
);

/** Taille par défaut d'une pièce jointe (Mo). */
export const CONTACT_DEFAULT_FILE_SIZE_MB = 5;

/** Plafond du réglage — et plafond serveur, identiques par construction. */
export const CONTACT_MAX_FILE_SIZE_MB = 10;

/** Fenêtre et plafond de la limitation de débit (cf. route `/api/contact`). */
export const CONTACT_RATE_LIMIT_WINDOW_MINUTES = 10;
export const CONTACT_RATE_LIMIT_MAX = 5;

/** Garde : extension de pièce jointe du catalogue fermé. */
export function isContactAttachmentExtension(
  value: unknown
): value is string {
  return (
    typeof value === "string" &&
    CONTACT_ATTACHMENT_FORMATS.some((format) => format.extension === value)
  );
}

/** Retourne le format du catalogue pour une extension, sinon `null`. */
export function contactAttachmentFormat(
  extension: string
): ContactAttachmentFormat | null {
  return (
    CONTACT_ATTACHMENT_FORMATS.find(
      (format) => format.extension === extension
    ) ?? null
  );
}

/** Extension (minuscule, sans point) d'un nom de fichier — `""` si absente. */
export function contactFileExtension(fileName: string): string {
  const lastDot = fileName.lastIndexOf(".");
  if (lastDot <= 0 || lastDot === fileName.length - 1) {
    return "";
  }
  return fileName.slice(lastDot + 1).toLowerCase();
}

/**
 * Vrai si les premiers octets d'un fichier correspondent à la signature du
 * format attendu. Fonction **pure** : le serveur lui passe le début du fichier.
 */
export function matchesContactAttachmentSignature(
  format: ContactAttachmentFormat,
  bytes: Uint8Array
): boolean {
  if (bytes.length < format.signature.length) {
    return false;
  }
  for (let index = 0; index < format.signature.length; index += 1) {
    if (bytes[index] !== format.signature[index]) {
      return false;
    }
  }
  if (format.signatureAt8) {
    const offset = 8;
    if (bytes.length < offset + format.signatureAt8.length) {
      return false;
    }
    for (let index = 0; index < format.signatureAt8.length; index += 1) {
      if (bytes[offset + index] !== format.signatureAt8[index]) {
        return false;
      }
    }
  }
  return true;
}

/** Motif de refus d'une pièce jointe (l'UI en tire un message). */
export type ContactFileRejection = "size" | "extension" | "signature";

/**
 * Contrôle **de confort** d'une pièce jointe (taille + extension).
 *
 * Partagé client/serveur : le client évite un aller-retour inutile, le serveur
 * **revalide** et ajoute la signature binaire (`matchesContactAttachmentSignature`),
 * que le client ne peut pas vérifier de façon fiable.
 */
export function contactAttachmentRejection(
  file: { name: string; size: number },
  settings: ContactFormSettings
): ContactFileRejection | null {
  const maxBytes = settings.maxFileSizeMB * 1024 * 1024;
  if (file.size <= 0 || file.size > maxBytes) {
    return "size";
  }
  const extension = contactFileExtension(file.name);
  if (extension === "" || !settings.allowedExtensions.includes(extension)) {
    return "extension";
  }
  return null;
}

/** Vrai si la pièce jointe passe le contrôle de confort (taille + extension). */
export function isContactFormFileAllowed(
  file: { name: string; size: number },
  settings: ContactFormSettings
): boolean {
  return contactAttachmentRejection(file, settings) === null;
}

/* --------------------------------------------------------------------------
   ORDRES ET LIBELLÉS
   -------------------------------------------------------------------------- */

/** Ordre d'affichage des habillages d'icône. */
export const contactSocialShapeOrder: ContactSocialShape[] = [
  "minimal",
  "circle",
  "square",
  "rounded",
];

/** Libellés français des habillages. */
export const contactSocialShapeLabels: Record<ContactSocialShape, string> = {
  minimal: "Sans habillage",
  circle: "Rond",
  square: "Carré",
  rounded: "Arrondi",
};

/** Garde : habillage valide. */
export function isContactSocialShape(
  value: unknown
): value is ContactSocialShape {
  return (
    value === "minimal" ||
    value === "circle" ||
    value === "square" ||
    value === "rounded"
  );
}

/** Ordre d'affichage des modes couleur. */
export const contactSocialColorModeOrder: ContactSocialColorMode[] = [
  "theme",
  "official",
  "custom",
];

/** Libellés français des modes couleur. */
export const contactSocialColorModeLabels: Record<
  ContactSocialColorMode,
  string
> = {
  theme: "Couleur du thème",
  official: "Couleur officielle de la marque",
  custom: "Couleur personnalisée",
};

/** Garde : mode couleur valide. */
export function isContactSocialColorMode(
  value: unknown
): value is ContactSocialColorMode {
  return value === "theme" || value === "official" || value === "custom";
}

/** Ordre d'affichage des alignements de réseaux. */
export const contactSocialAlignmentOrder: ContactSocialAlignment[] = [
  "left",
  "center",
  "right",
];

/** Libellés français des alignements de réseaux. */
export const contactSocialAlignmentLabels: Record<
  ContactSocialAlignment,
  string
> = {
  left: "À gauche",
  center: "Centré",
  right: "À droite",
};

/** Ordre d'affichage des alignements de chapeau. */
export const contactAlignOrder: ContactAlign[] = ["center", "left"];

/** Libellés français des alignements de chapeau. */
export const contactAlignLabels: Record<ContactAlign, string> = {
  center: "Centré",
  left: "Aligné à gauche",
};

/** Garde : alignement de chapeau valide. */
export function isContactAlign(value: unknown): value is ContactAlign {
  return value === "left" || value === "center";
}

/** Ordre d'affichage des jetons de couleur du cadre (D2). */
export const contactFrameColorTokenOrder: ContactFrameColorToken[] = [
  "border-color",
  "accent-color",
  "accent-color-strong",
  "text-color",
  "surface-color",
];

/**
 * Libellés des jetons de couleur du cadre, nommés par la teinte perçue.
 *
 * Même parti pris que `bannerThemeTokenLabels` : on décrit ce que le visiteur
 * verra (« Perle irisée »), pas le nom technique du jeton — le photographe
 * choisit une couleur, pas une variable CSS.
 */
export const contactFrameColorTokenLabels: Record<
  ContactFrameColorToken,
  string
> = {
  "border-color": "Perle irisée (bordures)",
  "accent-color": "Rose nacré chaud (accent)",
  "accent-color-strong": "Bronze doux (survol)",
  "text-color": "Anthracite (texte)",
  "surface-color": "Blanc nacré (surface)",
};

/** Garde : jeton de couleur de cadre valide. */
export function isContactFrameColorToken(
  value: unknown
): value is ContactFrameColorToken {
  return (
    value === "border-color" ||
    value === "accent-color" ||
    value === "accent-color-strong" ||
    value === "text-color" ||
    value === "surface-color"
  );
}

/* --------------------------------------------------------------------------
   DÉFAUTS
   -------------------------------------------------------------------------- */

/** Coordonnées vides. */
export const DEFAULT_CONTACT_ADDRESS: ContactAddressSettings = {
  proName: "",
  address1: "",
  address2: "",
  postalCode: "",
  city: "",
  country: "",
};

/** Les neuf booléens de visibilité, tous à `true` (D14). */
export const DEFAULT_CONTACT_VISIBILITY: ContactVisibilitySettings = {
  showContainer2: true,
  showName: true,
  showSlogan: true,
  showAddressGroup: true,
  showLandline: true,
  showMobile: true,
  showEmail: true,
  showHours: true,
  showServiceArea: true,
};

/** Réglages de formulaire par défaut (5 Mo, tout le catalogue, CGU requises). */
export const DEFAULT_CONTACT_FORM: ContactFormSettings = {
  maxFileSizeMB: CONTACT_DEFAULT_FILE_SIZE_MB,
  allowedExtensions: [...contactDefaultExtensions],
  requireCGU: true,
  cguLinkText: "Politique de confidentialité",
  cguLinkUrl: "/confidentialite",
};

/** Apparence par défaut des réseaux : thème, rond, à gauche. */
export const DEFAULT_CONTACT_SOCIAL_STYLE: ContactSocialStyle = {
  colorMode: "theme",
  customColor: "#1a1a1a",
  shape: "circle",
  alignment: "left",
};

/**
 * Cadre par défaut (D3) : filet de 1 px, jeton de bordure du thème, 2 px
 * d'arrondi. Le défaut **pose** un cadre (effet voulu de la refonte) : les pages
 * déjà publiées en gagnent un après mise à jour, sans aucune perte de donnée.
 */
export const DEFAULT_CONTACT_FRAME: ContactFrameSettings = {
  borderWidth: 1,
  borderColorToken: "border-color",
  borderRadius: 2,
};

/** Mise en page par défaut : chapeau centré, tout visible. */
export const DEFAULT_CONTACT_LAYOUT: ContactLayoutSettings = {
  align: "center",
  visibility: { ...DEFAULT_CONTACT_VISIBILITY },
};

/* --------------------------------------------------------------------------
   FABRIQUES ET RÉSOLVEUR
   -------------------------------------------------------------------------- */

/** Fabrique un réseau social (identifiant stable). */
export function createContactSocialLink(
  network: ContactSocialNetwork,
  url = ""
): ContactSocialLink {
  return { id: crypto.randomUUID(), network, url };
}

/**
 * Contenu contact par défaut.
 *
 * `prefill` (objet pur, invariant A1) remplit les coordonnées issues du profil.
 * **Trois réseaux d'exemple ne sont posés que si aucun préremplissage de
 * réseaux n'est fourni** : un profil réel sans réseaux ne doit pas hériter de
 * faux comptes, alors qu'une démonstration a besoin de montrer le rendu.
 */
export function createContactContent(prefill?: ContactPrefill): ContactContent {
  const address: ContactAddressSettings = {
    ...DEFAULT_CONTACT_ADDRESS,
    ...(prefill?.address ?? {}),
  };

  const info: ContactInfoSettings = prefill
    ? {
        name: prefill.name ?? "",
        slogan: prefill.slogan ?? "",
        address,
        landline: "",
        mobile: "",
        email: prefill.email ?? "",
        hours: "",
        serviceArea: prefill.serviceArea ?? "",
      }
    : {
        name: "Studio Lumière",
        slogan: "Photographe portrait & mariage",
        address: {
          proName: "Studio Lumière",
          address1: "12 rue des Lilas",
          address2: "Atelier 3",
          postalCode: "75011",
          city: "Paris",
          country: "France",
        },
        landline: "01 23 45 67 89",
        mobile: "06 12 34 56 78",
        email: "bonjour@exemple.fr",
        hours: "Du mardi au samedi\n10 h – 19 h",
        serviceArea: "Île-de-France",
      };

  const social: ContactSocialLink[] =
    prefill?.socialLinks !== undefined
      ? prefill.socialLinks
      : [
          createContactSocialLink(
            "instagram",
            "https://www.instagram.com/"
          ),
          createContactSocialLink("facebook", "https://www.facebook.com/"),
          createContactSocialLink("linkedin", "https://www.linkedin.com/"),
        ];

  return {
    type: "contact",
    heading: prefill ? "Contact" : "Contactez-moi",
    subtitle: "Une question, un projet ?",
    intro: "Écrivez-moi : je vous réponds sous 24 h.",
    info,
    form: { ...DEFAULT_CONTACT_FORM, allowedExtensions: [...contactDefaultExtensions] },
    social,
    layout: { ...DEFAULT_CONTACT_LAYOUT, visibility: { ...DEFAULT_CONTACT_VISIBILITY } },
    style: {
      social: { ...DEFAULT_CONTACT_SOCIAL_STYLE },
      frame: { ...DEFAULT_CONTACT_FRAME },
    },
  };
}

/** Lit une adresse stockée (repli champ par champ sur la valeur vide). */
function resolveContactAddress(raw: unknown): ContactAddressSettings {
  if (!isRecord(raw)) {
    return { ...DEFAULT_CONTACT_ADDRESS };
  }
  return {
    proName: readString(raw.proName, ""),
    address1: readString(raw.address1, ""),
    address2: readString(raw.address2, ""),
    postalCode: readString(raw.postalCode, ""),
    city: readString(raw.city, ""),
    country: readString(raw.country, ""),
  };
}

/** Lit les neuf booléens de visibilité (défaut : `true`). */
function resolveContactVisibility(raw: unknown): ContactVisibilitySettings {
  const record = isRecord(raw) ? raw : {};
  const read = (key: keyof ContactVisibilitySettings): boolean =>
    typeof record[key] === "boolean"
      ? (record[key] as boolean)
      : DEFAULT_CONTACT_VISIBILITY[key];
  return {
    showContainer2: read("showContainer2"),
    showName: read("showName"),
    showSlogan: read("showSlogan"),
    showAddressGroup: read("showAddressGroup"),
    showLandline: read("showLandline"),
    showMobile: read("showMobile"),
    showEmail: read("showEmail"),
    showHours: read("showHours"),
    showServiceArea: read("showServiceArea"),
  };
}

/** Lit les réglages du formulaire (bornage taille, catalogue fermé). */
function resolveContactForm(raw: unknown): ContactFormSettings {
  const record = isRecord(raw) ? raw : {};
  const rawExtensions = isUnknownArray(record.allowedExtensions)
    ? record.allowedExtensions
    : contactDefaultExtensions;
  const allowedExtensions: string[] = [];
  for (const extension of rawExtensions) {
    if (
      isContactAttachmentExtension(extension) &&
      !allowedExtensions.includes(extension)
    ) {
      allowedExtensions.push(extension);
    }
  }
  return {
    maxFileSizeMB: readBoundedNumber(
      record.maxFileSizeMB,
      DEFAULT_CONTACT_FORM.maxFileSizeMB,
      1,
      CONTACT_MAX_FILE_SIZE_MB
    ),
    // Une liste vidée par l'utilisateur reste vide : on ne ressuscite pas le
    // catalogue complet, sans quoi décocher tout ressemblerait à un bug.
    allowedExtensions,
    requireCGU:
      typeof record.requireCGU === "boolean"
        ? record.requireCGU
        : DEFAULT_CONTACT_FORM.requireCGU,
    cguLinkText: readString(record.cguLinkText, DEFAULT_CONTACT_FORM.cguLinkText),
    cguLinkUrl: readString(record.cguLinkUrl, DEFAULT_CONTACT_FORM.cguLinkUrl),
  };
}

/**
 * Lit le cadre des conteneurs 2 et 3.
 *
 * Tolérant par construction : un contenu sans `frame` (tout l'existant) reçoit
 * les défauts, un nombre hors bornes est ramené dans la plage (0..8 / 0..24) et
 * un jeton inconnu retombe sur `borderColorToken` par défaut. On ne ressuscite
 * jamais un texte : seule la *forme* est complétée.
 */
function resolveContactFrame(raw: unknown): ContactFrameSettings {
  const record = isRecord(raw) ? raw : {};
  return {
    borderWidth: readBoundedNumber(
      record.borderWidth,
      DEFAULT_CONTACT_FRAME.borderWidth,
      0,
      8
    ),
    borderColorToken: isContactFrameColorToken(record.borderColorToken)
      ? record.borderColorToken
      : DEFAULT_CONTACT_FRAME.borderColorToken,
    borderRadius: readBoundedNumber(
      record.borderRadius,
      DEFAULT_CONTACT_FRAME.borderRadius,
      0,
      24
    ),
  };
}

/** Lit l'apparence des réseaux (mode, couleur, forme, alignement). */
function resolveContactSocialStyle(raw: unknown): ContactSocialStyle {
  const record = isRecord(raw) ? raw : {};
  return {
    colorMode: isContactSocialColorMode(record.colorMode)
      ? record.colorMode
      : DEFAULT_CONTACT_SOCIAL_STYLE.colorMode,
    customColor: readString(
      record.customColor,
      DEFAULT_CONTACT_SOCIAL_STYLE.customColor
    ),
    shape: isContactSocialShape(record.shape)
      ? record.shape
      : DEFAULT_CONTACT_SOCIAL_STYLE.shape,
    alignment:
      record.alignment === "left" ||
      record.alignment === "center" ||
      record.alignment === "right"
        ? record.alignment
        : DEFAULT_CONTACT_SOCIAL_STYLE.alignment,
  };
}

/**
 * Lit la liste des réseaux : entrées invalides écartées, et — sauf en édition —
 * entrées sans URL écartées.
 *
 * `keepEmpty` existe pour l'**éditeur** : un réseau qu'on vient d'ajouter n'a pas
 * encore d'adresse. Si le résolveur l'écartait, le contenu commité serait
 * immédiatement filtré au rendu suivant et le bouton « Ajouter un réseau »
 * semblerait inerte. Le rendu public, lui, garde le défaut : un lien sans
 * destination n'a rien à afficher.
 */
function resolveContactSocial(
  raw: unknown,
  keepEmpty: boolean
): ContactSocialLink[] {
  if (!isUnknownArray(raw)) {
    return [];
  }
  const links: ContactSocialLink[] = [];
  for (const entry of raw) {
    if (!isRecord(entry) || !isContactSocialNetwork(entry.network)) {
      continue;
    }
    const url = readString(entry.url, "").trim();
    if (url === "" && !keepEmpty) {
      continue;
    }
    links.push({
      id: readString(entry.id, crypto.randomUUID()),
      network: entry.network,
      url,
    });
  }
  return links;
}

/**
 * Options de résolution d'un contenu contact.
 *
 * `keepEmptySocialNetworks` est **réservé à l'édition** (cf.
 * `resolveContactSocial`) : jamais posé par le rendu public, qui doit ignorer un
 * lien sans adresse.
 */
export interface ResolveContactContentOptions {
  keepEmptySocialNetworks?: boolean;
}

/**
 * Résout un contenu contact stocké (JSONB) vers un contenu **complet**.
 *
 * Total : `null`, un nombre ou un objet tronqué produisent un contenu lisible.
 * Aucun texte de démonstration n'est ressuscité (la *forme* est complétée, pas
 * le *contenu*).
 *
 * Rétro-compatibilité avec le module historique
 * (`{ heading, intro, email, phone, address }`) :
 *   - `email` → `info.email` ;
 *   - `phone` → `info.landline` (assumption assumée : le champ historique ne
 *     distinguait pas fixe et mobile, on le range au fixe) ;
 *   - `address` (ligne unique) → `info.address.address1`.
 */
export function resolveContactContent(
  raw: unknown,
  options?: ResolveContactContentOptions
): ContactContent {
  if (!isRecord(raw)) {
    return createContactContent();
  }

  const infoRaw = isRecord(raw.info) ? raw.info : {};
  const addressRaw = isRecord(infoRaw.address) ? infoRaw.address : {};
  const legacyAddress = readString(raw.address, "");
  const address: ContactAddressSettings = {
    ...resolveContactAddress(addressRaw),
  };
  // Ligne unique historique : elle n'a de sens que si rien de structuré n'est
  // déjà présent (un contenu moderne ne peut pas avoir les deux).
  if (address.address1 === "" && legacyAddress !== "") {
    address.address1 = legacyAddress;
  }

  const info: ContactInfoSettings = {
    name: readString(infoRaw.name, ""),
    slogan: readString(infoRaw.slogan, ""),
    address,
    landline: readString(infoRaw.landline, readString(raw.phone, "")),
    mobile: readString(infoRaw.mobile, ""),
    email: readString(infoRaw.email, readString(raw.email, "")),
    hours: readString(infoRaw.hours, ""),
    serviceArea: readString(infoRaw.serviceArea, ""),
  };

  const layoutRaw = isRecord(raw.layout) ? raw.layout : {};
  const styleRaw = isRecord(raw.style) ? raw.style : {};

  return {
    type: "contact",
    heading: readString(raw.heading, ""),
    subtitle: readString(raw.subtitle, ""),
    intro: readString(raw.intro, ""),
    info,
    form: resolveContactForm(raw.form),
    social: resolveContactSocial(
      raw.social,
      options?.keepEmptySocialNetworks === true
    ),
    layout: {
      align: isContactAlign(layoutRaw.align)
        ? layoutRaw.align
        : DEFAULT_CONTACT_LAYOUT.align,
      visibility: resolveContactVisibility(layoutRaw.visibility),
    },
    style: {
      social: resolveContactSocialStyle(styleRaw.social),
      frame: resolveContactFrame(styleRaw.frame),
    },
  };
}

/* ==========================================================================
   MODULE « CONTACT MAP » — plan d'accès & informations pratiques (Étape 14.2)
   --------------------------------------------------------------------------
   Nouvelle **famille** (D1) : contrairement aux variantes d'une famille
   existante, elle exige d'étendre l'enum Postgres `module_type` (migration
   `ALTER TYPE … ADD VALUE`) et le schéma Zod — comme `content` (12.1) et
   `cards` (13.1) avant elle.

   Le module réunit un chapeau (H2/H3/paragraphe) et **deux conteneurs de hauteur
   égale** : une carte Google Maps embarquée et des informations pratiques
   (adresse, parking, horaires, zone, bouton d'itinéraire). Leur ordre est
   permutable (`mapPosition`) — la disposition est un réglage de module, pas une
   variante de contenu.

   Décisions structurantes :
     · D2 — l'adresse est le **seul** contact : pas de téléphone ni d'e-mail,
       absents du besoin et déjà couverts par le module `contact` ;
     · D5 — l'iframe Maps est un **embed sans clé** (`output=embed`), aucune
       variable d'environnement à provisionner ;
     · D6 — le cadre réutilise `ContactFrameSettings` et le résolveur privé
       `resolveContactFrame` de 14.1.c : mêmes bornes (0..8 / 0..24), même jeton
       de thème, un seul réglage partagé par les deux conteneurs.

   Résolution de l'adresse du profil (D3) : elle se fait **au rendu**, jamais à
   l'édition. Le domaine ignore donc `owner-profile.ts` (module `"use client"`)
   et se contente de porter `useOwnerAddress` / `customAddress` ; le repli est
   appliqué par `contactMapAddress` (`src/lib/contact-map.ts`).
   ========================================================================== */

/** Côté de la grille où la carte est posée — l'ordre des conteneurs est permutable. */
export type ContactMapPosition = "container2" | "container3";

/** Fond de la carte : plan routier ou vue satellite. */
export type ContactMapType = "roadmap" | "satellite";

/** Fond de section — couleur unie uniquement (D7), aucun média, aucun survol. */
export type ContactMapBgVariant = "default" | "surface" | "contrast" | "custom";

/** Filtre CSS appliqué à l'iframe, pour fondre la carte dans la charte. */
export type ContactMapFilterStyle = "standard" | "grayscale" | "theme-blend";

/** Intensité du voile posé sur la carte (lisibilité du cadre, D7). */
export type ContactMapOverlayIntensity = "none" | "light" | "medium" | "strong";

/** Ordre d'affichage des positions (sélecteur de l'éditeur). */
export const contactMapPositionOrder: ContactMapPosition[] = [
  "container2",
  "container3",
];

/** Libellés français des positions. */
export const contactMapPositionLabels: Record<ContactMapPosition, string> = {
  container2: "Carte à gauche (conteneur 2)",
  container3: "Carte à droite (conteneur 3)",
};

/** Garde : position de carte valide. */
export function isContactMapPosition(
  value: unknown
): value is ContactMapPosition {
  return value === "container2" || value === "container3";
}

/** Ordre d'affichage des types de carte. */
export const contactMapTypeOrder: ContactMapType[] = ["roadmap", "satellite"];

/** Libellés français des types de carte. */
export const contactMapTypeLabels: Record<ContactMapType, string> = {
  roadmap: "Plan (routier)",
  satellite: "Satellite (vue aérienne)",
};

/** Garde : type de carte valide. */
export function isContactMapType(value: unknown): value is ContactMapType {
  return value === "roadmap" || value === "satellite";
}

/** Ordre d'affichage des fonds de section. */
export const contactMapBgVariantOrder: ContactMapBgVariant[] = [
  "default",
  "surface",
  "contrast",
  "custom",
];

/** Libellés français des fonds de section. */
export const contactMapBgVariantLabels: Record<ContactMapBgVariant, string> = {
  default: "Fond de la page",
  surface: "Surface nacrée",
  contrast: "Encre du thème (contraste)",
  custom: "Couleur personnalisée",
};

/** Garde : fond de section valide. */
export function isContactMapBgVariant(
  value: unknown
): value is ContactMapBgVariant {
  return (
    value === "default" ||
    value === "surface" ||
    value === "contrast" ||
    value === "custom"
  );
}

/** Ordre d'affichage des filtres de carte. */
export const contactMapFilterStyleOrder: ContactMapFilterStyle[] = [
  "standard",
  "grayscale",
  "theme-blend",
];

/** Libellés français des filtres de carte. */
export const contactMapFilterStyleLabels: Record<ContactMapFilterStyle, string> =
  {
    standard: "Couleurs d’origine",
    grayscale: "Noir et blanc",
    "theme-blend": "Noir et blanc fondu au fond",
  };

/** Garde : filtre de carte valide. */
export function isContactMapFilterStyle(
  value: unknown
): value is ContactMapFilterStyle {
  return (
    value === "standard" || value === "grayscale" || value === "theme-blend"
  );
}

/** Ordre d'affichage des intensités de voile. */
export const contactMapOverlayIntensityOrder: ContactMapOverlayIntensity[] = [
  "none",
  "light",
  "medium",
  "strong",
];

/** Libellés français des intensités de voile. */
export const contactMapOverlayIntensityLabels: Record<
  ContactMapOverlayIntensity,
  string
> = {
  none: "Aucun voile",
  light: "Léger",
  medium: "Moyen",
  strong: "Fort",
};

/** Garde : intensité de voile valide. */
export function isContactMapOverlayIntensity(
  value: unknown
): value is ContactMapOverlayIntensity {
  return (
    value === "none" ||
    value === "light" ||
    value === "medium" ||
    value === "strong"
  );
}

/** Apparence du module (D6 : un seul cadre partagé par les deux conteneurs). */
export interface ContactMapStyleSettings {
  bgVariant: ContactMapBgVariant;
  /** Utilisée quand `bgVariant === "custom"` (sinon conservée sans effet). */
  customBgColor: string;
  /** Cadre partagé carte + informations — réutilise le modèle du module contact. */
  frame: ContactFrameSettings;
  mapFilterStyle: ContactMapFilterStyle;
  overlayIntensity: ContactMapOverlayIntensity;
}

/** Contenu du module `contact-map` (D8 : h2 titre, h3 sous-titre, `<p>` description). */
export interface ContactMapContent {
  type: "contact-map";
  title: string;
  subtitle: string;
  description: string;
  /** Réutilise `ContactAlign` et ses libellés (14.1.c). */
  headerAlignment: ContactAlign;
  /** Carte en conteneur 2 (gauche) ou 3 (droite). */
  mapPosition: ContactMapPosition;
  /** Adresse du profil si demandée et renseignée, sinon `customAddress` (D3). */
  useOwnerAddress: boolean;
  customAddress: string;
  /** Niveau de zoom Google Maps — borné 1..20 (domaine ET éditeur). */
  zoom: number;
  mapType: ContactMapType;
  showAddressGroup: boolean;
  showParking: boolean;
  parkingText: string;
  showHoraires: boolean;
  horairesText: string;
  showZoneIntervention: boolean;
  zoneInterventionText: string;
  showDirectionsButton: boolean;
  style: ContactMapStyleSettings;
}

/** Réglages d'apparence par défaut : fond de page, cadre du thème, N&B léger. */
export const DEFAULT_CONTACT_MAP_STYLE: ContactMapStyleSettings = {
  bgVariant: "default",
  customBgColor: "#faf8f8",
  frame: { ...DEFAULT_CONTACT_FRAME },
  mapFilterStyle: "grayscale",
  overlayIntensity: "light",
};

/**
 * Forme par défaut **sans texte** (la *forme*, jamais le *contenu*).
 *
 * Le résolveur s'appuie sur cet objet pour compléter booléens, nombres et
 * énumérations : il ne ressuscite aucun texte de démonstration, ce que ferait
 * `createContactMapContent()`. C'est la distinction posée pour tous les
 * modules : un JSONB tronqué doit rester lisible sans réinventer un contenu.
 */
export const DEFAULT_CONTACT_MAP_CONTENT: ContactMapContent = {
  type: "contact-map",
  title: "",
  subtitle: "",
  description: "",
  headerAlignment: "center",
  mapPosition: "container2",
  useOwnerAddress: true,
  customAddress: "",
  zoom: 15,
  mapType: "roadmap",
  showAddressGroup: true,
  showParking: true,
  parkingText: "",
  showHoraires: true,
  horairesText: "",
  showZoneIntervention: true,
  zoneInterventionText: "",
  showDirectionsButton: true,
  style: DEFAULT_CONTACT_MAP_STYLE,
};

/**
 * Contenu « contact-map » d'exemple (mode démonstration).
 *
 * Aucun paramètre de préremplissage : l'adresse du profil est résolue **au
 * rendu** (D3), la fabrique ignore donc `owner-profile.ts`. `customAddress`
 * reste renseignée comme **repli** — un profil sans adresse doit tout de même
 * montrer une carte lisible. Chaque appel retourne une instance neuve (aucune
 * référence partagée).
 */
export function createContactMapContent(): ContactMapContent {
  return {
    ...DEFAULT_CONTACT_MAP_CONTENT,
    title: "Nous trouver",
    subtitle: "Le studio, le parking et les horaires",
    description:
      "Tout ce qu’il faut pour préparer votre visite : l’adresse, où stationner et quand passer.",
    customAddress: "12 rue des Lilas, 75011 Paris",
    parkingText:
      "Parking Indigo Voltaire, à 150 mètres du studio (sortie rue des Lilas).",
    horairesText: "Du mardi au samedi\n10 h – 19 h",
    zoneInterventionText: "Île-de-France et régions limitrophes",
    style: {
      ...DEFAULT_CONTACT_MAP_STYLE,
      frame: { ...DEFAULT_CONTACT_FRAME },
    },
  };
}

/**
 * Résout un contenu `contact-map` stocké (JSONB) vers un contenu **complet**.
 *
 * Tolérant par construction : `null`, un objet tronqué ou un JSONB ancien
 * produisent une forme lisible. Aucun texte de démonstration n'est ressuscité
 * (la *forme* est complétée, pas le *contenu*) : les champs texte retombent sur
 * la chaîne vide, jamais sur l'exemple de la fabrique.
 */
export function resolveContactMapContent(raw: unknown): ContactMapContent {
  if (!isRecord(raw)) {
    return createContactMapContent();
  }
  const styleRaw = isRecord(raw.style) ? raw.style : {};
  const defaults = DEFAULT_CONTACT_MAP_CONTENT;

  return {
    type: "contact-map",
    title: readString(raw.title, ""),
    subtitle: readString(raw.subtitle, ""),
    description: readString(raw.description, ""),
    headerAlignment: isContactAlign(raw.headerAlignment)
      ? raw.headerAlignment
      : defaults.headerAlignment,
    mapPosition: isContactMapPosition(raw.mapPosition)
      ? raw.mapPosition
      : defaults.mapPosition,
    useOwnerAddress:
      typeof raw.useOwnerAddress === "boolean"
        ? raw.useOwnerAddress
        : defaults.useOwnerAddress,
    customAddress: readString(raw.customAddress, ""),
    zoom: readBoundedNumber(raw.zoom, defaults.zoom, 1, 20),
    mapType: isContactMapType(raw.mapType) ? raw.mapType : defaults.mapType,
    showAddressGroup:
      typeof raw.showAddressGroup === "boolean"
        ? raw.showAddressGroup
        : defaults.showAddressGroup,
    showParking:
      typeof raw.showParking === "boolean"
        ? raw.showParking
        : defaults.showParking,
    parkingText: readString(raw.parkingText, ""),
    showHoraires:
      typeof raw.showHoraires === "boolean"
        ? raw.showHoraires
        : defaults.showHoraires,
    horairesText: readString(raw.horairesText, ""),
    showZoneIntervention:
      typeof raw.showZoneIntervention === "boolean"
        ? raw.showZoneIntervention
        : defaults.showZoneIntervention,
    zoneInterventionText: readString(raw.zoneInterventionText, ""),
    showDirectionsButton:
      typeof raw.showDirectionsButton === "boolean"
        ? raw.showDirectionsButton
        : defaults.showDirectionsButton,
    style: {
      bgVariant: isContactMapBgVariant(styleRaw.bgVariant)
        ? styleRaw.bgVariant
        : DEFAULT_CONTACT_MAP_STYLE.bgVariant,
      customBgColor: readColor(
        styleRaw.customBgColor,
        DEFAULT_CONTACT_MAP_STYLE.customBgColor
      ),
      frame: resolveContactFrame(styleRaw.frame),
      mapFilterStyle: isContactMapFilterStyle(styleRaw.mapFilterStyle)
        ? styleRaw.mapFilterStyle
        : DEFAULT_CONTACT_MAP_STYLE.mapFilterStyle,
      overlayIntensity: isContactMapOverlayIntensity(styleRaw.overlayIntensity)
        ? styleRaw.overlayIntensity
        : DEFAULT_CONTACT_MAP_STYLE.overlayIntensity,
    },
  };
}

/**
 * Module de page — mappe 1:1 vers la future table `page_modules`
 * (la position dans le tableau = ordre vertical = colonne `position` ;
 * le `content` = future colonne JSONB ; les autres champs = colonnes scalaires).
 */
export interface PageModule {
  id: string; // identifiant stable (mock : crypto.randomUUID())
  type: PageModuleType;
  title: string; // libellé court du bandeau (éditable en 3.4)
  hidden: boolean; // Toggle Eye (visibilité, exploité en 3.3)
  animation: ModuleAnimation;
  anchorId: string; // ancre HTML générée, ex. "hero-1" (éditable en 3.4)
  layoutVariant?: string; // RÉSERVÉ — Layout Switcher ultérieur (non édité en 3.4)
  content: ModuleContent; // contenu éditable, discriminé par type (invariant : type === content.type)
}

/** Méta statique d'un type de module (label/catégorie/description). */
export interface ModuleMeta {
  type: PageModuleType;
  label: string; // ex. « Hero Statique »
  category: string; // groupe d'affichage dans le catalogue
  description: string; // phrase d'aide pour le photographe
}

/**
 * Entrée du catalogue « + Ajouter une section » (Étape 7.1).
 * Une même famille peut exposer plusieurs cartes (ex. les variantes de la
 * rubrique Héro) : `id` est la clé unique du bouton, `variant` préconfigure le
 * contenu ajouté (ex. type `hero` + variant `static`). Une entrée sans
 * `variant` utilise le contenu par défaut de son type.
 */
export interface ModuleCatalogEntry extends ModuleMeta {
  /** Clé unique d'entrée (ex. "hero-static", "about") — clé React du bouton. */
  id: string;
  /** Variante de contenu pré-configurée à l'ajout (familles à variantes). */
  variant?: ModuleVariant;
}

/** Catalogue ordonné des modules proposés dans « + Ajouter une section ». */
export const moduleCatalog: ModuleCatalogEntry[] = [
  {
    id: "hero-static",
    type: "hero",
    variant: "static",
    label: "Hero Statique",
    category: "Héro & accroche",
    description:
      "Image de fond adaptative (mobile/tablette/desktop) avec titre et appel à l'action.",
  },
  {
    id: "hero-slider",
    type: "hero",
    variant: "slider",
    label: "Hero Slider",
    category: "Héro & accroche",
    description:
      "Plusieurs visuels qui défilent automatiquement, avec titre et appel à l'action sur chaque image.",
  },
  {
    id: "hero-video",
    type: "hero",
    variant: "video",
    label: "Hero Vidéo",
    category: "Héro & accroche",
    description:
      "Vidéo d'arrière-plan avec photo de secours sur mobile et appel à l'action.",
  },
  {
    id: "hero-parallax",
    type: "hero",
    variant: "parallax",
    label: "Hero Parallaxe",
    category: "Héro & accroche",
    description:
      "Image en profondeur qui défile plus lentement (figée sur mobile pour la performance).",
  },
  {
    id: "hero-curtain",
    type: "hero",
    variant: "curtain",
    label: "Hero Rideau",
    category: "Héro & accroche",
    description:
      "La photo reste en place et la section suivante vient la recouvrir au défilement, comme un rideau qui tombe.",
  },
  {
    id: "about",
    type: "about",
    label: "À propos (image + texte)",
    category: "Présentation",
    description: "Présentez le photographe avec une photo et un texte.",
  },
  {
    id: "cards",
    type: "cards",
    variant: "portrait",
    label: "Cards — portrait",
    category: "Présentation",
    description:
      "Cartes à photos verticales (4:5), de 2 à 4 par ligne. Seul le bouton est cliquable.",
  },
  {
    id: "cards-square",
    type: "cards",
    variant: "square",
    label: "Cards — carré",
    category: "Présentation",
    description:
      "Cartes à photos carrées (1:1), de 2 à 4 par ligne : portraits serrés, détails, objets.",
  },
  {
    id: "cards-landscape",
    type: "cards",
    variant: "landscape",
    label: "Cards — paysage",
    category: "Présentation",
    description:
      "Cartes à photos horizontales, 2 par ligne, en 3:2, 4:3 ou 16:9. Chaque image garde de la présence.",
  },
  {
    // Étape 13.3 — la seule entrée par laquelle on entre dans la variante
    // `editorial`. Elle n'est pas proposée dans le sélecteur de format de
    // l'éditeur : changer de variante détruirait les corps de texte riche, un
    // réglage destructif n'a donc rien à faire dans une liste déroulante.
    id: "cards-editorial",
    type: "cards",
    variant: "editorial",
    label: "Cards — texte structuré",
    category: "Présentation",
    description:
      "Cartes dont le corps est un texte mis en forme (sous-titres, listes, gras, liens), de 2 à 6 par ligne.",
  },
  {
    id: "content-columns",
    type: "content",
    variant: "columns",
    label: "Contenu en colonnes",
    category: "Contenu libre",
    description:
      "Écrivez et mettez en forme votre contenu — titres, gras, listes, liens, images et icônes — réparti en 1 à 4 colonnes qui s’empilent sur téléphone.",
  },
  {
    id: "services",
    type: "services",
    label: "Cartes de prestations",
    category: "Services & tarifs",
    description: "Mettez en avant vos prestations sous forme de cartes.",
  },
  {
    id: "gallery-static",
    type: "gallery",
    variant: "static",
    label: "Gallery Static",
    category: "Galeries & Portfolio",
    description:
      "Mosaïque fixe ou masonry, sans interaction : un décor élégant pour vos pages.",
  },
  {
    id: "gallery-dynamic",
    type: "gallery",
    variant: "dynamic",
    label: "Gallery Dynamic",
    category: "Galeries & Portfolio",
    description:
      "Grille interactive : un double-clic ouvre le diaporama complet de la galerie.",
  },
  {
    id: "gallery-portfolio",
    type: "gallery",
    variant: "portfolio",
    label: "Gallery Portfolio",
    category: "Galeries & Portfolio",
    description:
      "Couvertures d'albums : chaque album ouvre son propre diaporama.",
  },
  {
    id: "cta-banner",
    type: "cta-banner",
    label: "Bandeau message ou d'appel à l'action",
    category: "Bannières & réassurance",
    description:
      "Un séparateur pleine largeur : message d'appel à l'action, slogan ou respiration éditoriale, sur photo, vidéo, carrousel ou couleur unie.",
  },
  {
    id: "faq",
    type: "faq",
    label: "Foire aux questions",
    category: "Bannières & réassurance",
    description: "Une FAQ en accordéon pour répondre à vos clients.",
  },
  {
    id: "contact",
    type: "contact",
    label: "Contact & localisation",
    category: "Contact & cartographie",
    description:
      "Coordonnées masquables, formulaire de contact sécurisé avec pièce jointe, et réseaux sociaux.",
  },
  {
    id: "contact-map",
    type: "contact-map",
    label: "Plan d'accès & informations",
    category: "Contact & cartographie",
    description:
      "Une carte Google Maps encadrée et des informations pratiques (adresse, parking, horaires, zone), permutables et réglables.",
  },
];

/**
 * Crée un contenu par défaut **riche** pour un type de module donné (Étape 3.4).
 * Retourne une **nouvelle instance** à chaque appel (aucune référence partagée).
 * `switch` exhaustif sur les familles (le TS interdit toute branche manquante).
 *
 * Rubrique Héro (7.1) : la famille `hero` produit ici sa variante `static`
 * (seule implémentée) ; les futures variantes étendront ce point sans modifier
 * les autres familles.
 */
export function createModuleContent(
  type: PageModuleType,
  variant?: ModuleVariant
): ModuleContent {
  if (type === "hero") {
    if (variant === "slider") {
      return { type: "hero", ...createHeroSliderContent() };
    }
    if (variant === "video") {
      return { type: "hero", ...createHeroVideoContent() };
    }
    if (variant === "parallax") {
      return { type: "hero", ...createHeroParallaxContent() };
    }
    if (variant === "curtain") {
      return { type: "hero", ...createHeroCurtainContent() };
    }
    // Défaut (et variante "static") : HeroStatic — rubrique 7.1.
    return { type: "hero", ...createHeroStaticContent() };
  }
  switch (type) {
    case "about":
      return {
        type: "about",
        heading: "À propos de moi",
        text: "Passionné par la lumière et les rencontres, j’accompagne particuliers et entreprises pour des photos authentiques et intemporelles.",
        media: { url: "", alt: "Portrait du photographe" },
      };
    case "services":
      return {
        type: "services",
        heading: "Mes prestations",
        intro: "Des formules pensées pour chaque moment, du portrait au mariage.",
        items: [
          {
            id: crypto.randomUUID(),
            title: "Séance portrait",
            description: "Portrait individuel ou en famille, en extérieur ou en studio.",
            price: "à partir de 190 €",
          },
          {
            id: crypto.randomUUID(),
            title: "Reportage mariage",
            description: "Couverture complète de votre journée, de la préparation à la soirée.",
            price: "sur devis",
          },
        ],
      };
    case "cta-banner":
      // Étape 11.27 — défaut demandé : parallaxe, hauteur standard, CTA activé.
      return createCtaBannerContent();
    case "cards":
      // Étape 13.2 — trois formats (portrait / carré / paysage) : la fabrique
      // pose le ratio des visuels d'exemple et le nombre de colonnes du format.
      return createCardsContent(
        isCardsVariant(variant) ? variant : DEFAULT_CARDS_VARIANT
      );
    case "gallery":
      return {
        type: "gallery",
        ...createGalleryContent(
          variant === "static" ||
            variant === "dynamic" ||
            variant === "portfolio"
            ? variant
            : undefined
        ),
      };
    case "faq":
      return {
        type: "faq",
        heading: "Questions fréquentes",
        items: [
          {
            id: crypto.randomUUID(),
            question: "Comment se déroule une séance ?",
            answer: "Nous échangeons en amont pour définir vos envies, puis je vous guide pendant toute la séance.",
          },
          {
            id: crypto.randomUUID(),
            question: "Sous quel délai recevons-nous les photos ?",
            answer: "Les photos retouchées sont livrées sous 2 à 3 semaines via une galerie en ligne privée.",
          },
          {
            id: crypto.randomUUID(),
            question: "Quel matériel utilisez-vous ?",
            answer: "Je travaille en plein format avec des optiques lumineuses, et chaque prise de vue est enregistrée sur deux cartes mémoire pour plus de sécurité.",
          },
          {
            id: crypto.randomUUID(),
            question: "Qui détient les droits sur les photos ?",
            answer: "Je conserve les droits d’auteur et vous recevez un droit d’usage privé illimité ; toute utilisation commerciale fait l’objet d’un accord écrit.",
          },
          {
            id: crypto.randomUUID(),
            question: "Proposez-vous des tirages papier ?",
            answer: "Oui : des tirages d’art sur papier fine art sont disponibles en plusieurs formats, avec encadrement sur demande.",
          },
        ],
      };
    case "contact":
      // Étape 14.1 — quatre containers ; sans préremplissage (mode démo), la
      // fabrique pose des coordonnées et trois réseaux d'exemple.
      return createContactContent();
    case "contact-map":
      // Étape 14.2 — aucune variante : la disposition (carte à gauche/droite)
      // est un réglage de contenu (`mapPosition`), pas une variante de famille.
      return createContactMapContent();
    case "content":
      return createContentColumnsContent();
  }
}

/**
 * Crée un module par défaut pour un type donné.
 * - `title` = label de l'entrée catalogue (éditable en 3.4) ;
 * - `anchorId` = `${type}-${sequence}` (ancre HTML, modifiable en 3.4) ;
 * - `content` = contenu par défaut riche via `createModuleContent` ;
 * - `variant` = variante pré-configurée (rubrique Héro — ex. "static").
 */
export function createModule(
  type: PageModuleType,
  sequence: number,
  variant?: ModuleVariant
): PageModule {
  // Entrée catalogue correspondant à la variante demandée (ex. "hero-static"),
  // sinon première entrée du type (label générique de la famille).
  const meta =
    moduleCatalog.find(
      (entry) => entry.type === type && entry.variant === variant
    ) ??
    moduleCatalog.find((entry) => entry.type === type) ??
    moduleCatalog[0];
  return {
    id: crypto.randomUUID(),
    type,
    title: meta.label,
    hidden: false,
    animation: "default",
    anchorId: `${type}-${sequence}`,
    content: createModuleContent(type, variant),
  };
}

/**
 * Surcharge le contenu du premier module d'un type donné (helper interne de seed).
 * Retourne une copie du tableau (aucune mutation directe).
 */
function withContentOverride(
  modules: PageModule[],
  predicate: (module: PageModule) => boolean,
  content: ModuleContent
): PageModule[] {
  return modules.map((module) =>
    predicate(module) ? { ...module, content } : module
  );
}

/**
 * Modules de départ d'une page seed (fonction déterministe par slug).
 * Les contenus par défaut sont enrichis pour les modules « vitrine » de chaque
 * page (ex. Hero de l'Accueil aligné sur la marque). Les nouvelles pages créées
 * via le formulaire (3.1) démarrent sans module.
 */
export function buildSeedModules(slug: string): PageModule[] {
  switch (slug) {
    case "":
      // Accueil (racine)
      return withContentOverride(
        [
          createModule("hero", 1),
          createModule("cta-banner", 2),
        ],
        (module) => module.type === "hero",
        {
          type: "hero",
          ...createHeroStaticContent(),
          titleH1: "Photographe professionnel",
          subtitleH2:
            "Des images qui racontent votre histoire, entre lumière et émotion.",
          ctaLabel: "Voir le portfolio",
          ctaHref: "/portfolio",
        }
      );
    case "portfolio":
      return [
        createModule("hero", 1),
        createModule("contact", 2),
      ];
    case "prestations":
      return [
        createModule("hero", 1),
        createModule("services", 2),
        createModule("cta-banner", 3),
      ];
    case "a-propos":
      return [
        createModule("hero", 1),
        createModule("about", 2),
        createModule("cta-banner", 3),
      ];
    case "contact":
      return [createModule("contact", 1)];
    default:
      return [createModule("hero", 1), createModule("about", 2)];
  }
}

/**
 * Réordonne un tableau générique en déplaçant l'élément `from` vers `to`
 * (helper pur utilisé par le Drag & Drop — ne mute pas la liste source).
 */
export function reorderModules<T>(list: T[], from: number, to: number): T[] {
  if (
    from < 0 ||
    from >= list.length ||
    to < 0 ||
    to >= list.length ||
    from === to
  ) {
    return list;
  }
  const next = Array.from(list);
  const [moved] = next.splice(from, 1);
  if (moved === undefined) {
    return list;
  }
  next.splice(to, 0, moved);
  return next;
}
