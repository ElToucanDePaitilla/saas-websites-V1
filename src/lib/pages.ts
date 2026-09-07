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
  updatedAt: string; // horodatage ISO de dernière modification
}

/** Construit l'URL publique absolue d'une page ("/" pour la page d'accueil). */
export function pageHref(slug: string): string {
  return slug === "" ? "/" : `/${slug}`;
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
    updatedAt: "2026-09-05T12:00:00.000Z",
  },
  {
    id: "seed-portfolio",
    title: "Portfolio",
    menuTitle: "Portfolio",
    slug: "portfolio",
    status: "published",
    inMenu: true,
    updatedAt: "2026-09-05T12:00:00.000Z",
  },
  {
    id: "seed-prestations",
    title: "Prestations & Tarifs",
    menuTitle: "Prestations",
    slug: "prestations",
    status: "published",
    inMenu: true,
    updatedAt: "2026-09-05T12:00:00.000Z",
  },
  {
    id: "seed-a-propos",
    title: "À propos du photographe",
    menuTitle: "À propos",
    slug: "a-propos",
    status: "published",
    inMenu: true,
    updatedAt: "2026-09-05T12:00:00.000Z",
  },
  {
    id: "seed-contact",
    title: "Contact",
    menuTitle: "Contact",
    slug: "contact",
    status: "draft",
    inMenu: true,
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
}

/**
 * Contenu éditable d'un module, **discriminé par `type`** (mêmes valeurs que
 * `PageModuleType`). Chaque famille expose ses propres champs (spec §8).
 * Union typé — **zéro `any`** : narrowing complet dans les formulaires (3.4)
 * et le futur rendu public.
 */
export type ModuleContent =
  | {
      type: "hero";
      heading: string;
      subheading: string;
      ctaLabel: string;
      ctaHref: string;
      media: MediaField;
    }
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
  | {
      type: "gallery";
      heading: string;
      images: GalleryImage[];
    }
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

/** Entrée du catalogue : méta statique d'un type de module. */
export interface ModuleMeta {
  type: PageModuleType;
  label: string; // ex. « Héro plein écran »
  category: string; // groupe d'affichage dans le catalogue
  description: string; // phrase d'aide pour le photographe
}

/** Catalogue ordonné des modules proposés dans « + Ajouter une section ». */
export const moduleCatalog: ModuleMeta[] = [
  {
    type: "hero",
    label: "Héro plein écran",
    category: "Héro & accroche",
    description: "Titre percutant et appel à l'action en haut de page.",
  },
  {
    type: "about",
    label: "À propos (image + texte)",
    category: "Présentation",
    description: "Présentez le photographe avec une photo et un texte.",
  },
  {
    type: "services",
    label: "Cartes de prestations",
    category: "Services & tarifs",
    description: "Mettez en avant vos prestations sous forme de cartes.",
  },
  {
    type: "gallery",
    label: "Galerie photo masonry",
    category: "Galeries & visuel",
    description: "Affichez vos photos dans une galerie élégante.",
  },
  {
    type: "cta-banner",
    label: "Bandeau d'appel à l'action",
    category: "Bannières & réassurance",
    description: "Un bandeau CTA pour convertir vos visiteurs.",
  },
  {
    type: "faq",
    label: "Foire aux questions",
    category: "Bannières & réassurance",
    description: "Une FAQ en accordéon pour répondre à vos clients.",
  },
  {
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
 */
export function createModuleContent(type: PageModuleType): ModuleContent {
  switch (type) {
    case "hero":
      return {
        type: "hero",
        heading: "Bienvenue dans mon univers",
        subheading:
          "Photographe professionnel, je capture l’émotion de vos plus beaux instants.",
        ctaLabel: "Découvrir mon portfolio",
        ctaHref: "/portfolio",
        media: { url: "", alt: "" },
      };
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
        heading: "Mes dernières réalisations",
        images: [
          { id: crypto.randomUUID(), url: "", alt: "Photo 1 de la galerie" },
          { id: crypto.randomUUID(), url: "", alt: "Photo 2 de la galerie" },
        ],
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
 * - `title` = label du type (éditable en 3.4) ;
 * - `anchorId` = `${type}-${sequence}` (ancre HTML, modifiable en 3.4) ;
 * - `content` = contenu par défaut riche via `createModuleContent`.
 */
export function createModule(type: PageModuleType, sequence: number): PageModule {
  const meta =
    moduleCatalog.find((entry) => entry.type === type) ?? moduleCatalog[0];
  return {
    id: crypto.randomUUID(),
    type,
    title: meta.label,
    hidden: false,
    animation: "default",
    anchorId: `${type}-${sequence}`,
    content: createModuleContent(type),
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
          createModule("gallery", 2),
          createModule("cta-banner", 3),
        ],
        (module) => module.type === "hero",
        {
          type: "hero",
          heading: "Photographe professionnel",
          subheading:
            "Des images qui racontent votre histoire, entre lumière et émotion.",
          ctaLabel: "Voir le portfolio",
          ctaHref: "/portfolio",
          media: { url: "", alt: "" },
        }
      );
    case "portfolio":
      return [
        createModule("hero", 1),
        createModule("gallery", 2),
        createModule("contact", 3),
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
