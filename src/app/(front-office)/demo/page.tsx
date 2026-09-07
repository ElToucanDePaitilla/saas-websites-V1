import type { Metadata } from "next";

import { PageModuleRenderer } from "@/components/modules/PublicModules";
import {
  createModule,
  type GalleryImage,
  type PageModule,
} from "@/lib/pages";

export const metadata: Metadata = {
  title: "Démo — Rendu des modules",
};

/** Images d'exemple (mode démo — picsum). */
const HERO_IMAGE = "https://picsum.photos/seed/demo-hero/1600/900";
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

function buildDemoModules(): PageModule[] {
  const hero = createModule("hero", 1);
  hero.content = {
    type: "hero",
    heading: "Lumière & Émotion",
    subheading:
      "Photographe professionnel — portraits, mariages et corporate en lumière naturelle.",
    ctaLabel: "Voir la galerie",
    ctaHref: "#galerie",
    media: { url: HERO_IMAGE, alt: "Portfolio du photographe" },
  };

  const about = createModule("about", 2);
  about.content = {
    type: "about",
    heading: "À propos",
    text: "Passionné par la lumière et les rencontres, je capture des images authentiques et intemporelles, du portrait au reportage.",
    media: { url: ABOUT_IMAGE, alt: "Portrait du photographe" },
  };

  const gallery = createModule("gallery", 3);
  const images: GalleryImage[] = GALLERY_URLS.map((url, index) => ({
    id: crypto.randomUUID(),
    url,
    alt: `Photo ${index + 1} de la galerie`,
  }));
  gallery.content = {
    type: "gallery",
    heading: "Mes dernières réalisations",
    images,
  };

  const cta = createModule("cta-banner", 4);
  cta.content = {
    type: "cta-banner",
    heading: "Un projet photo ?",
    subheading: "Disponible pour vos événements et séances sur mesure.",
    ctaLabel: "Me contacter",
    ctaHref: "#contact",
  };

  return [hero, about, gallery, cta];
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
