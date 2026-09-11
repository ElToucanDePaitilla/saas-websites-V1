/**
 * ============================================================================
 * MODÈLE « PAGE » & HELPERS — Back-Office (Étapes 3.1, 3.2 & 3.4)
 * ----------------------------------------------------------------------------
 * - Étape 3.1 : modèle métier `SitePage` + helpers de slug URL.
 * - Étape 3.2 : modèle `PageModule` (module de page), catalogue `moduleCatalog`,
 *   fabriques de modules par défaut et helper de réordonnancement (Drag & Drop).
 * - Étape 3.4 : contenu éditable typé par famille (`ModuleContent`, union
 *   discriminé), champ `layoutVariant` réservé et fabriques de contenu par défaut.
 * Conçu pour mapper 1:1 vers les futures tables `pages` et `page_modules`
 * (Supabase/Drizzle) — aucune dépendance externe, TypeScript strict, zéro `any`.
 *
 * Références : plans/ROADMAP-3.1-pagemetadata.md §1.4 —
 *              plans/ROADMAP-3.2-pagebuilder-dnd.md §1.2 —
 *              plans/ROADMAP-3.4-crud-expanded.md §1.1
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
  | "contact";

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

/** Variantes de la rubrique Héro (extension future : slider/video/parallax). */
export type HeroVariant = "static" | "slider" | "video" | "parallax";

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
  const sources: ArtSource[] = [content.media.desktop];
  if (content.media.tablet) {
    sources.push(content.media.tablet);
  }
  sources.push(content.media.mobile);
  return sources.filter((source) => source.url !== "");
}

/** Union des contenus Héro (static / slider / video / parallax). */
export type HeroContent =
  | HeroStaticContent
  | HeroSliderContent
  | HeroVideoContent
  | HeroParallaxContent;

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
  const sources: ArtSource[] = [content.media.desktop];
  if (content.media.tablet) {
    sources.push(content.media.tablet);
  }
  sources.push(content.media.mobile);
  return sources.filter((source) => source.url !== "");
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
  /** Animation au survol des vignettes (zoom / élévation / overlay). */
  hoverAnimation: GalleryHoverAnimation;
  /** Voile dégradé sombre au survol (désactivé par défaut sur la Dynamic). */
  hoverOverlay: boolean;
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
export type ModuleVariant = HeroVariant | GalleryModuleVariant;

/** Libellés français des variantes de galerie (catalogue / éditeur). */
export const galleryVariantLabels: Record<GalleryModuleVariant, string> = {
  static: "Galerie fixe",
  dynamic: "Galerie interactive",
  portfolio: "Galerie portfolio",
};

/** Libellés français des modes d'affichage de la grille. */
export const galleryDisplayLabels: Record<GalleryDisplayMode, string> = {
  uniform: "Grille régulière",
  masonry: "Mosaïque (hauteurs libres)",
};

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

/** Toutes les images visibles d'un contenu galerie (SEO / OG / LCP). */
export function galleryImageSources(content: GalleryContent): GalleryImage[] {
  const images =
    content.variant === "portfolio"
      ? content.albums.flatMap((album) => album.images)
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
  | {
      type: "cta-banner";
      heading: string;
      subheading: string;
      ctaLabel: string;
      ctaHref: string;
    }
  | ({ type: "gallery" } & GalleryContent)
  | {
      type: "faq";
      heading: string;
      items: FaqItem[];
    }
  | {
      type: "contact";
      heading: string;
      intro: string;
      email: string;
      phone: string;
      address: string;
    };

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
    id: "about",
    type: "about",
    label: "À propos (image + texte)",
    category: "Présentation",
    description: "Présentez le photographe avec une photo et un texte.",
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
    label: "Bandeau d'appel à l'action",
    category: "Bannières & réassurance",
    description: "Un bandeau CTA pour convertir vos visiteurs.",
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
    label: "Bloc contact",
    category: "Contact & cartographie",
    description: "Coordonnées ou formulaire de contact.",
  },
];

/**
 * Crée un contenu par défaut **riche** pour un type de module donné (Étape 3.4).
 * Retourne une **nouvelle instance** à chaque appel (aucune référence partagée).
 * `switch` exhaustif sur les 7 familles (le TS interdit toute branche manquante).
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
      return {
        type: "cta-banner",
        heading: "Un projet photo ? Parlons-en !",
        subheading: "Disponible pour vos événements et séances sur mesure.",
        ctaLabel: "Me contacter",
        ctaHref: "/contact",
      };
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
        ],
      };
    case "contact":
      return {
        type: "contact",
        heading: "Contactez-moi",
        intro: "Une question, un devis ? Écrivez-moi, je réponds sous 24 h.",
        email: "bonjour@exemple.fr",
        phone: "+33 6 00 00 00 00",
        address: "Paris, France",
      };
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
