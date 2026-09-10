"use client";

import * as React from "react";

import {
  galleryAlbumCover,
  galleryAlbumPhotoCount,
  type GalleryContent,
  type GalleryImage,
} from "@/lib/pages";

import { CTAButton } from "./CTAButton";
import { GalleryAlbumBadge } from "./GalleryAlbumBadge";
import { GalleryGrid, type GalleryGridItem } from "./GalleryGrid";
import type { GalleryTrigger } from "./GalleryItem";
import { LightboxModal } from "./LightboxModal";

/**
 * ============================================================================
 * GESTIONNAIRE DE GALERIE — `GalleryManager` (Phase 11)
 * ----------------------------------------------------------------------------
 * Orchestrateur unique des trois variantes :
 *   - **static**    : grille figée, aucun déclencheur (`trigger: "none"`) ;
 *   - **dynamic**   : double-clic → Lightbox de **toutes** les images de la
 *                     galerie, ouverte sur l'image cliquée ;
 *   - **portfolio** : couvertures d'albums (badge thème + nombre), clic simple
 *                     → Lightbox **exclusive à l'album** de la thématique.
 *
 * La `LightboxModal` est **montée à l'ouverture** (état local) : son index
 * initial est ainsi fixé sans synchronisation d'effet.
 * ============================================================================
 */

type GalleryManagerProps = {
  content: GalleryContent;
  exifByUrl?: Record<string, unknown>;
  priorityFirst?: boolean;
};

type LightboxState = {
  images: GalleryImage[];
  index: number;
  title?: string;
  /** Restaure le focus sur la vignette à la fermeture (ouverture clavier). */
  restoreFocus: boolean;
};

/** Images réellement affichables (URL non vide, non masquées). */
function visibleImages(images: GalleryImage[]): GalleryImage[] {
  return images.filter((image) => image.url !== "" && !image.hidden);
}

export function GalleryManager({
  content,
  exifByUrl,
  priorityFirst = false,
}: GalleryManagerProps) {
  const [lightbox, setLightbox] = React.useState<LightboxState | null>(null);

  // Dynamic et Portfolio s'ouvrent au **clic simple** ; la variante static est
  // purement décorative. (Le double-clic reste dédié au cycle de zoom DANS la
  // Lightbox, une fois le diaporama ouvert.)
  const trigger: GalleryTrigger =
    content.variant === "static" ? "none" : "single";

  let items: GalleryGridItem[] = [];
  let onActivate: (index: number, keyboard: boolean) => void = () => {
    // Variante static : aucune interactivité.
  };

  if (content.variant === "portfolio") {
    const albums = content.albums;
    const covers: { albumIndex: number; item: GalleryGridItem }[] = [];
    albums.forEach((album, albumIndex) => {
      const cover = galleryAlbumCover(album);
      if (!cover || cover.url === "" || cover.hidden) {
        return;
      }
      covers.push({
        albumIndex,
        item: {
          image: cover,
          badge: (
            <GalleryAlbumBadge
              settings={content.badge}
              label={album.label}
              count={galleryAlbumPhotoCount(album)}
            />
          ),
        },
      });
    });

    items = covers.map((cover) => cover.item);
    onActivate = (index, keyboard) => {
      const target = covers[index];
      if (!target) {
        return;
      }
      const album = albums[target.albumIndex];
      const images = visibleImages(album.images);
      if (images.length === 0) {
        return;
      }
      const start = images.findIndex(
        (image) => image.id === target.item.image.id
      );
      setLightbox({
        images,
        index: start >= 0 ? start : 0,
        title: album.label,
        restoreFocus: keyboard,
      });
    };
  } else {
    const images = visibleImages(content.images);
    items = images.map((image) => ({ image }));
    onActivate = (index, keyboard) => {
      if (images.length === 0) {
        return;
      }
      setLightbox({ images, index, restoreFocus: keyboard });
    };
  }

  return (
    <div>
      {content.heading ? (
        <h2
          className="font-light tracking-wide"
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: "clamp(1.6rem, 4vw, 2.5rem)",
          }}
        >
          {content.heading}
        </h2>
      ) : null}
      {content.subheading ? (
        <p
          className="mt-2 max-w-2xl text-[var(--text-muted)]"
          style={{ fontSize: "clamp(0.9rem, 2.2vw, 1.05rem)" }}
        >
          {content.subheading}
        </p>
      ) : null}

      <div className={content.heading || content.subheading ? "mt-8" : ""}>
        <GalleryGrid
          items={items}
          layout={content.layout}
          effect={content.effect}
          trigger={trigger}
          priorityFirst={priorityFirst}
          onActivate={onActivate}
        />
      </div>

      <CTAButton cta={content.cta} className="mt-10 flex justify-center" />

      {lightbox ? (
        <LightboxModal
          open
          images={lightbox.images}
          initialIndex={lightbox.index}
          settings={content.lightbox}
          title={lightbox.title}
          exifByUrl={exifByUrl}
          restoreFocus={lightbox.restoreFocus}
          onClose={() => setLightbox(null)}
        />
      ) : null}
    </div>
  );
}
