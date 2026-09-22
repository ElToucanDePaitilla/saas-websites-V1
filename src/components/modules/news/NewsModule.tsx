import { RevealHero } from "@/components/modules/hero/RevealHero";
import {
  resolveNewsContent,
  type GalleryImage,
  type PageModule,
} from "@/lib/pages";

import { NewsCard } from "./NewsCard";
import { NewsLightbox } from "./NewsLightbox";

/**
 * ============================================================================
 * MODULE « ACTUALITÉS & EXPOSITIONS » — rendu public (Étape 14.5)
 * ----------------------------------------------------------------------------
 * Server Component : le contenu JSONB est normalisé (`resolveNewsContent`) puis
 * rendu en une **colonne unique** de cartes empilées. Une section sans item
 * affichable disparaît — comme la galerie et les avis, on ne rend pas un bloc
 * vide.
 *
 * Un item **sans affiche** est écarté au rendu : sa carte serait un cadre
 * presque vide. Le filtrage vit ici (et non dans le résolveur) pour que
 * l'éditeur, lui, continue de montrer tous les items enregistrés.
 *
 * `heading` est optionnel : vide, aucun `h2` n'est posé. Le chapeau est centré
 * (la colonne l'est aussi, D3) et le module ne porte jamais de `h1` — l'unique
 * titre de niveau 1 appartient à la page (`PublicModulesList`).
 * ============================================================================
 */
export function NewsModule({ module }: { module: PageModule }) {
  const raw = module.content.type === "news" ? module.content : null;
  if (raw === null) {
    return null;
  }

  const content = resolveNewsContent(raw);
  const items = content.items.filter((item) => item.media.url !== "");
  if (items.length === 0) {
    return null;
  }

  // Liste d'affiches alignée sur les cartes RENDUES (donc construite **après** le
  // filtre) : `data-news-open` désigne un index positionnel, un décalage ferait
  // ouvrir la mauvaise affiche.
  const images: GalleryImage[] = items.map((item) => ({
    id: item.id,
    url: item.media.url,
    alt: item.media.alt || item.title || "Affiche de l’actualité",
    title: item.title,
    description: item.text,
  }));

  const hasHeader =
    content.heading.trim() !== "" ||
    content.subtitle.trim() !== "" ||
    content.intro.trim() !== "";

  return (
    <section
      id={module.anchorId}
      className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8"
    >
      <RevealHero animation={module.animation}>
        {hasHeader ? (
          <div className="mx-auto max-w-3xl text-center">
            {content.heading.trim() !== "" ? (
              <h2 className="module-h2">{content.heading}</h2>
            ) : null}
            {content.subtitle.trim() !== "" ? (
              <p className="news-section__subtitle">{content.subtitle}</p>
            ) : null}
            {content.intro.trim() !== "" ? (
              <p className="news-section__intro">{content.intro}</p>
            ) : null}
          </div>
        ) : null}

        <NewsLightbox images={images} title={content.heading}>
          {/* `priority` sur la première carte seulement : c'est le LCP de la
              section, les suivantes restent en chargement différé. */}
          {items.map((item, index) => (
            <NewsCard
              key={item.id}
              item={item}
              style={content.style}
              priority={index === 0}
              index={index}
            />
          ))}
        </NewsLightbox>
      </RevealHero>
    </section>
  );
}
