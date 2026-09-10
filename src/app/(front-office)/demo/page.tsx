import type { Metadata } from "next";

import { PageModuleRenderer } from "@/components/modules/PublicModules";
import {
  createGalleryAlbum,
  createGalleryDynamicContent,
  createGalleryPortfolioContent,
  createGalleryStaticContent,
  createHeroStaticContent,
  createModule,
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

  // Gallery Portfolio — albums thématiques, clic simple → album exclusif.
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
    heading: "Gallery Portfolio — albums thématiques",
    subheading:
      "Chaque couverture ouvre le diaporama exclusif de son album (badge thème + nombre de photos).",
    albums,
    effect: { ...portfolioBase.effect, effect: "polaroid", intensity: "normal" },
  };

  const cta = createModule("cta-banner", 6);
  cta.content = {
    type: "cta-banner",
    heading: "Un projet photo ?",
    subheading: "Disponible pour vos événements et séances sur mesure.",
    ctaLabel: "Me contacter",
    ctaHref: "#contact",
  };

  // Démo HeroSlider (variante "slider") — 3 slides pré-chargées par défaut.
  // Placé EN PREMIER pour valider le héro plein écran (nav → bas de l'écran).
  const heroSlider = createModule("hero", 1, "slider");

  return [
    heroSlider,
    hero,
    about,
    galleryStatic,
    galleryDynamic,
    galleryPortfolio,
    cta,
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
      {modules.map((module) => (
        <PageModuleRenderer
          key={module.id}
          module={module}
          exifByUrl={DEMO_EXIF}
        />
      ))}
    </main>
  );
}
