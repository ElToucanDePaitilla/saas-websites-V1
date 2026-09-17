import type { Metadata } from "next";

import { PublicModulesList } from "@/components/modules/PublicModules";
import {
  createCardsContent,
  createContactContent,
  createContactMapContent,
  createCtaBannerContent,
  createGalleryAlbum,
  createGalleryDynamicContent,
  createGalleryPortfolioContent,
  createGalleryStaticContent,
  createHeroStaticContent,
  createModule,
  type CardsColumns,
  type CardsLayoutSettings,
  type CardsStyleSettings,
  type CardsVariant,
  type ContactFrameSettings,
  type ContactSocialAlignment,
  type ContactSocialShape,
  type GalleryImage,
  type PageModule,
} from "@/lib/pages";

export const metadata: Metadata = {
  title: "Démo — Rendu des modules",
};

/** Images d'exemple (mode démo — picsum). */
const HERO_IMAGE_DESKTOP = "https://picsum.photos/seed/demo-hero/1920/1080";
const HERO_IMAGE_MOBILE = "https://picsum.photos/seed/demo-hero-mobile/720/1280";
const HERO_IMAGE_TABLET = "https://picsum.photos/seed/demo-hero-tablet/1200/900";
const ABOUT_IMAGE = "https://picsum.photos/seed/demo-about/1200/900";
const GALLERY_URLS = [
  "https://picsum.photos/seed/demo-gallery-1/900/700",
  "https://picsum.photos/seed/demo-gallery-2/900/700",
  "https://picsum.photos/seed/demo-gallery-3/900/700",
];

/** EXIF de démonstration (clés exifr) par URL — rendu des puces/Lightbox. */
const DEMO_EXIF: Record<string, unknown> = {
  [GALLERY_URLS[0]]: {
    FocalLength: 50,
    FNumber: 1.8,
    ExposureTime: 1 / 200,
    ISO: 100,
    Make: "Canon",
    Model: "EOS R6",
    LensModel: "RF 50mm F1.8",
  },
  [GALLERY_URLS[1]]: {
    FocalLength: 85,
    FNumber: 2.0,
    ExposureTime: 1 / 250,
    ISO: 200,
    Make: "Canon",
    Model: "EOS R6",
  },
  [GALLERY_URLS[2]]: {
    FocalLength: 35,
    FNumber: 4,
    ExposureTime: 1 / 125,
    ISO: 400,
    Make: "Sony",
    Model: "A7 IV",
  },
};

/** Génère un jeu d'images picsum déterministe (albums de démonstration). */
function makeDemoImages(seed: string, count: number): GalleryImage[] {
  return Array.from({ length: count }, (_, index) => ({
    id: crypto.randomUUID(),
    url: `https://picsum.photos/seed/${seed}-${index + 1}/900/700`,
    alt: `Album ${seed} — photo ${index + 1}`,
    title: `${seed} ${index + 1}`,
    width: 900,
    height: 700,
  }));
}

/**
 * Un module Cards de démonstration, pour une variante donnée.
 *
 * Quatre détails sont **volontaires** :
 *   - le paysage est enregistré avec `columns: 4` : c'est la démonstration que
 *     la normalisation du domaine (2 colonnes en paysage) s'applique aussi à un
 *     contenu écrit à la main, et pas seulement à ce que produit l'éditeur ;
 *   - ce même module reçoit un arrondi et un filet de bloc nettement marqués
 *     (18 px / 4 px) et un style de bouton **différent** (« contours ») : les
 *     réglages ajoutés en 13.2 se voient à l'œil nu, et le fait que les trois
 *     boutons de la section changent **ensemble** démontre que le style est bien
 *     un réglage de section, et non de carte ;
 *   - avec `longFirstCta`, la première carte reçoit un libellé à rallonge : c'est
 *     le cas qui éprouve le retour à la ligne du bouton et l'alignement bas des
 *     boutons quand les libellés n'ont pas le même nombre de lignes ;
 *   - avec `ctaShow: false` (section carrée), la section ne contient **aucun**
 *     bouton alors que les libellés et destinations sont bien enregistrés :
 *     l'interrupteur de 13.3 est donc démontré, et il l'est sur une section qui
 *     n'est pas celle du nouveau contenu éditorial.
 */
function demoCardsModule(
  sequence: number,
  variant: CardsVariant,
  heading: string,
  subtitle: string,
  longFirstCta = false,
  ctaShow = true,
  columns?: CardsColumns
): PageModule {
  const base = createCardsContent(variant);
  const entry = createModule("cards", sequence, variant);
  // En paysage, la valeur `4` est écrite **exprès** : le résolveur doit la
  // ramener à 2. Ailleurs, la colonne demandée prime, sinon celle de la fabrique.
  const layout: CardsLayoutSettings = {
    ...base.layout,
    columns: variant === "landscape" ? 4 : (columns ?? base.layout.columns),
  };
  const style: CardsStyleSettings = {
    ...base.style,
    border: { enabled: true, width: 2, color: "#EAE5E5" },
    hover: { ...base.style.hover, zoom: 106, shine: true, saturate: true },
    ctaShow,
    ...(variant === "landscape"
      ? { bodyRadius: 18, bodyBorderWidth: 4, ctaStyle: "outline" }
      : {}),
  };

  // Le corps d'une carte diffère selon la variante : on branche sur `base`
  // (union discriminée) plutôt que de forcer un type commun.
  if (base.variant === "editorial") {
    entry.content = {
      ...base,
      heading,
      subtitle,
      layout,
      style,
      cards: base.cards,
    };
    return entry;
  }

  entry.content = {
    ...base,
    heading,
    subtitle,
    layout,
    style,
    cards: longFirstCta
      ? base.cards.map((card, index) =>
          index === 0
            ? {
                ...card,
                cta: {
                  ...card.cta,
                  label: "Découvrir l’accompagnement des mariages et des portraits",
                },
              }
            : card
        )
      : base.cards,
  };
  return entry;
}

/**
 * Un module Contact de démonstration.
 *
 * Quatre détails sont **volontaires** :
 *   - la fabrique complète est conservée : chapeau, coordonnées, formulaire et
 *     trois réseaux d'exemple — c'est la démonstration du chemin nominal ;
 *   - `hideContainer2` masque le bloc coordonnées : la preuve visuelle que le
 *     formulaire occupe alors seul la largeur, centré (`max-w-2xl mx-auto`) ;
 *   - `shape` et `alignment` diffèrent entre les deux instances pour montrer
 *     que ces réglages sont bien **de section** (ils changent toute la rangée) ;
 *   - `frame` diffère aussi : la seconde instance porte un cadre
 *     `accent-color` / 12 px d'arrondi. Les deux modules partageant la fabrique,
 *     un cadre distinct **prouve** que le réglage est porté par le module — et
 *     qu'il s'applique au formulaire même quand C2 est masqué.
 */
function demoContactModule(
  sequence: number,
  {
    hideContainer2,
    shape,
    alignment,
    frame,
  }: {
    hideContainer2: boolean;
    shape: ContactSocialShape;
    alignment: ContactSocialAlignment;
    frame?: Partial<ContactFrameSettings>;
  }
): PageModule {
  const base = createContactContent();
  const entry = createModule("contact", sequence);
  entry.content = {
    ...base,
    layout: {
      ...base.layout,
      visibility: {
        ...base.layout.visibility,
        showContainer2: !hideContainer2,
      },
    },
    style: {
      social: { ...base.style.social, shape, alignment },
      frame: { ...base.style.frame, ...frame },
    },
  };
  return entry;
}

function buildDemoModules(): PageModule[] {
  const hero = createModule("hero", 2);
  hero.content = {
    type: "hero",
    ...createHeroStaticContent(),
    titleH1: "Lumière & Émotion",
    subtitleH2:
      "Portraits, mariages et corporate en lumière naturelle.",
    ctaLabel: "Voir la galerie",
    ctaHref: "#galerie",
    ctaStyle: "primary",
    media: {
      desktop: {
        url: HERO_IMAGE_DESKTOP,
        alt: "Portfolio du photographe — grand format",
      },
      tablet: {
        url: HERO_IMAGE_TABLET,
        alt: "Portfolio du photographe — tablette",
      },
      mobile: {
        url: HERO_IMAGE_MOBILE,
        alt: "Portfolio du photographe — mobile",
      },
    },
  };

  const about = createModule("about", 2);
  about.content = {
    type: "about",
    heading: "À propos",
    text: "Passionné par la lumière et les rencontres, je capture des images authentiques et intemporelles, du portrait au reportage.",
    media: { url: ABOUT_IMAGE, alt: "Portrait du photographe" },
  };

  // ---- Galeries (Phase 11) : static / dynamic / portfolio ----
  const galleryImages: GalleryImage[] = GALLERY_URLS.map((url, index) => ({
    id: crypto.randomUUID(),
    url,
    alt: `Photo ${index + 1} de la galerie`,
    title: `Éclat Minéral N°0${index + 1}`,
    width: 900,
    height: 700,
  }));

  // Gallery Static — décor figé, effet Passe-partout de Musée + CTA.
  const staticBase = createGalleryStaticContent();
  const galleryStatic = createModule("gallery", 3, "static");
  galleryStatic.content = {
    type: "gallery",
    ...staticBase,
    heading: "Gallery Static — Passe-partout de Musée",
    subheading:
      "Mosaïque fixe sans interaction : un décor élégant, aucune ouverture au clic.",
    images: galleryImages,
    effect: { ...staticBase.effect, effect: "museum-pass", intensity: "normal" },
    cta: {
      show: true,
      label: "Voir tout le portfolio",
      href: "/portfolio",
      style: "outline",
    },
  };

  // Gallery Dynamic — double-clic → diaporama de toutes les images.
  const dynamicBase = createGalleryDynamicContent();
  const galleryDynamic = createModule("gallery", 4, "dynamic");
  galleryDynamic.content = {
    type: "gallery",
    ...dynamicBase,
    heading: "Gallery Dynamic — double-clic pour le diaporama",
    subheading:
      "Au survol, aucun titre ni voile sombre. Double-cliquez une photo pour ouvrir le diaporama.",
    images: galleryImages,
    effect: { ...dynamicBase.effect, effect: "glass", intensity: "normal" },
  };

  // Gallery Portfolio — albums, clic simple → album exclusif.
  const portfolioBase = createGalleryPortfolioContent();
  const albums = ["Mariage", "Portrait", "Corporate"].map((label, index) => {
    const album = {
      ...createGalleryAlbum(label),
      images: makeDemoImages(`demo-${index}-${label}`, 4),
    };
    album.coverImageId = album.images[0]?.id ?? null;
    return album;
  });
  const galleryPortfolio = createModule("gallery", 5, "portfolio");
  galleryPortfolio.content = {
    type: "gallery",
    ...portfolioBase,
    heading: "Gallery Portfolio — albums",
    subheading:
      "Chaque couverture ouvre le diaporama exclusif de son album (badge album + nombre de photos).",
    albums,
    effect: { ...portfolioBase.effect, effect: "polaroid", intensity: "normal" },
  };

  const cta = createModule("cta-banner", 6);
  // Étape 11.27 — le contenu complet vient de la fabrique (fond parallaxe,
  // hauteur standard, CTA activé) ; seuls le message et la destination sont
  // adaptés à la démonstration (ancre locale, pour éprouver le défilement
  // compensant le Header fixe).
  cta.content = {
    ...createCtaBannerContent(),
    heading: "Un projet photo ?",
    subheading: "Disponible pour vos événements et séances sur mesure.",
    ctaLabel: "Me contacter",
    ctaHref: "#contact",
  };

  // ---- Contact (Étape 14.1) : deux instances ----
  // La première est complète (coordonnées + formulaire) et garde le **cadre par
  // défaut** (1 px, jeton de bordure, 2 px) : c'est le chemin nominal. La seconde
  // masque son bloc coordonnées pour prouver la mise en page `max-w-2xl mx-auto`,
  // porte un autre habillage d'icônes et un cadre distinct (accent, 12 px
  // d'arrondi) : la forme et le cadre sont des réglages **de module**.
  const contactFull = demoContactModule(11, {
    hideContainer2: false,
    shape: "circle",
    alignment: "left",
  });
  const contactNoInfo = demoContactModule(12, {
    hideContainer2: true,
    shape: "rounded",
    // Alignement à gauche pour les deux instances : la barre vit désormais dans
    // C2, sous des coordonnées alignées à gauche — un centrage y flotterait.
    alignment: "left",
    frame: { borderColorToken: "accent-color", borderRadius: 12 },
  });

  // ---- Contact Map (Étape 14.2) : deux instances permutées ----
  // La première suit la fabrique (carte à gauche, fond de page, N&B léger) et
  // tire son adresse du profil de démonstration (`ownerAddress` de la page) :
  // c'est le chemin nominal de D3. La seconde **permute** les conteneurs
  // (`mapPosition: "container3"`), force une adresse libre (pour prouver le
  // repli), masque le parking et cumule fond de surface + fondu au thème +
  // voile moyen — la preuve visuelle que chaque réglage est porté par le module.
  const contactMapDefault = createModule("contact-map", 13);
  const contactMapBase = createContactMapContent();
  const contactMapPermuted = createModule("contact-map", 14);
  contactMapPermuted.content = {
    ...contactMapBase,
    headerAlignment: "left",
    mapPosition: "container3",
    useOwnerAddress: false,
    customAddress: "12 rue des Lilas, 75011 Paris",
    showParking: false,
    style: {
      ...contactMapBase.style,
      bgVariant: "surface",
      mapFilterStyle: "theme-blend",
      overlayIntensity: "medium",
    },
  };

  // ---- Cards (Étapes 13.1 → 13.3) : un module par variante ----
  // Seul le bouton est cliquable : la démo le montre avec une bordure de cadre
  // activée et des effets de survol poussés (brillance + saturation), c'est-à-
  // dire le maximum de ce que le module sait faire. Les visuels de chaque format
  // viennent de la fabrique, au bon ratio : la démonstration doit montrer le
  // cadrage que le module produira réellement.
  const cardsPortrait = demoCardsModule(
    7,
    "portrait",
    "Cards — portrait (4:5)",
    "Trois par ligne, photos verticales : le format du gabarit d’origine."
  );
  const cardsSquare = demoCardsModule(
    8,
    "square",
    "Cards — carré (1:1), boutons masqués",
    "Photos carrées, trois par ligne : portraits serrés, détails, objets.",
    // `longFirstCta` sans objet ici ; `ctaShow: false` : la section présente ses
    // cartes sans bouton, alors que libellés et destinations restent enregistrés.
    false,
    false
  );
  const cardsLandscape = demoCardsModule(
    9,
    "landscape",
    "Cards — paysage (3:2, deux par ligne)",
    "Photos horizontales ; l’arrondi et le filet du bloc ont été augmentés pour être visibles.",
    // Un premier libellé volontairement long : il passe sur deux lignes, et son
    // bouton reste aligné par le bas sur ceux des autres cartes de la ligne.
    true
  );
  // 4ᵉ variante (13.3) : le corps de chaque carte est un document de texte
  // riche (sous-titre H3, paragraphe, liste à puces, liste numérotée — fournis
  // par la fabrique). Six colonnes **exprès** : c'est le seul réglage qui prouve
  // le palier `xl` des classes de grille et le `sizes` multi-paliers, et c'est
  // aussi le cas le plus étroit pour juger de la lisibilité d'un texte structuré.
  const cardsEditorial = demoCardsModule(
    10,
    "editorial",
    "Cards — texte structuré (6 par ligne)",
    "Le corps de chaque carte est un texte mis en forme ; le cadre photo se règle à part, sans toucher aux textes.",
    false,
    true,
    6
  );

  // Démo HeroSlider (variante "slider") — 3 slides pré-chargées par défaut.
  // Placé EN PREMIER pour valider le héro plein écran (nav → bas de l'écran).
  const heroSlider = createModule("hero", 1, "slider");

  return [
    heroSlider,
    hero,
    about,
    cardsPortrait,
    cardsSquare,
    cardsLandscape,
    cardsEditorial,
    galleryStatic,
    galleryDynamic,
    galleryPortfolio,
    cta,
    contactFull,
    contactNoInfo,
    contactMapDefault,
    contactMapPermuted,
  ];
}

/**
 * ============================================================================
 * PAGE DE DÉMONSTRATION — Rendu public optimisé des modules (Étape 6.2)
 * ----------------------------------------------------------------------------
 * Valide : MediaImage (Hero priority / lazy), galerie avec EXIF au survol &
 * Lightbox, rendu des autres modules — sans dépendance BDD (images démo).
 * ============================================================================
 */
export default function DemoPage() {
  const modules = buildDemoModules();

  return (
    <main className="flex-1">
      <PublicModulesList
        modules={modules}
        pageTitle="Démo — Rendu des modules"
        exifByUrl={DEMO_EXIF}
        // Page de démonstration : aucune écriture n'y est possible (le slug
        // « demo » ne correspond à aucune page publiée), ce qui est le but.
        pageSlug="demo"
        // Adresse du profil simulée : le premier module `contact-map` l'utilise
        // (`useOwnerAddress: true`), le second l'ignore (adresse libre).
        ownerAddress="8 avenue de l’Opéra, 75001 Paris"
      />
    </main>
  );
}
