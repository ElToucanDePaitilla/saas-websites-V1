"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight, Expand, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { MediaImage } from "@/components/common/MediaImage";
import { exifChipsFromData } from "@/lib/media-exif";
import type { GalleryImage } from "@/lib/pages";

/**
 * ============================================================================
 * GALERIE PUBLIQUE — grille + Lightbox EXIF (Étape 6.2)
 * ----------------------------------------------------------------------------
 * Client Component : grille responsive (MediaImage lazy, WebP/AVIF, blur),
 * survol avec EXIF optionnel, et **Lightbox** (Dialog) plein écran : grande
 * image + navigation précédent/suivant (boutons + clavier ←/→/Échap) + puces
 * EXIF. `exifByUrl` : map URL → données EXIF (résolues via la table `media`).
 * ============================================================================
 */

type GalleryGridProps = {
  images: GalleryImage[];
  /** EXIF résolus par URL d'image (facultatif). */
  exifByUrl?: Record<string, unknown>;
  /** LCP : passer true pour la première image. */
  priorityFirst?: boolean;
};

export function GalleryGrid({
  images,
  exifByUrl,
  priorityFirst = false,
}: GalleryGridProps) {
  const [activeIndex, setActiveIndex] = React.useState<number | null>(null);

  const active = activeIndex !== null ? images[activeIndex] : null;
  const activeExif = active
    ? exifChipsFromData(active.url ? (exifByUrl?.[active.url] ?? null) : null)
    : [];

  function step(delta: number) {
    setActiveIndex((current) => {
      if (current === null) return current;
      return (current + delta + images.length) % images.length;
    });
  }

  React.useEffect(() => {
    if (activeIndex === null) {
      return;
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "ArrowRight") step(1);
      if (event.key === "ArrowLeft") step(-1);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex, images.length]);

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {images.map((image, index) => {
          const chips = image.url
            ? exifChipsFromData(exifByUrl?.[image.url] ?? null)
            : [];
          return (
            <button
              key={image.id}
              type="button"
              onClick={() => setActiveIndex(index)}
              aria-label={`Agrandir ${image.alt || image.url}`}
              className="group relative aspect-[4/3] overflow-hidden rounded-lg bg-[var(--surface-color)]"
            >
              <MediaImage
                src={image.url}
                alt={image.alt}
                fill
                priority={priorityFirst && index === 0}
                sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <span className="pointer-events-none absolute right-2 top-2 rounded-md bg-background/70 p-1 text-foreground opacity-0 backdrop-blur transition group-hover:opacity-100">
                <Expand className="size-3.5" />
              </span>
              {chips.length > 0 ? (
                <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent px-2 pb-1 pt-4 text-left text-[10px] text-white opacity-0 transition group-hover:opacity-100">
                  {chips.join(" · ")}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {/* Lightbox */}
      {active && activeIndex !== null ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={active.alt || active.url}
          className="fixed inset-0 z-50 flex flex-col bg-black/90"
          onClick={() => setActiveIndex(null)}
        >
          <div className="flex items-center justify-between p-3 text-white">
            <p className="truncate px-2 text-sm">
              {activeIndex + 1} / {images.length}
            </p>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/10 hover:text-white"
              onClick={() => setActiveIndex(null)}
              aria-label="Fermer"
            >
              <X className="size-5" />
            </Button>
          </div>

          <div
            className="relative flex min-h-0 flex-1 items-center justify-center px-12"
            onClick={(event) => event.stopPropagation()}
          >
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-white hover:bg-white/10 hover:text-white"
              onClick={() => step(-1)}
              aria-label="Image précédente"
            >
              <ChevronLeft className="size-8" />
            </Button>
            <div className="relative h-full max-h-full w-full max-w-4xl">
              <MediaImage
                src={active.url}
                alt={active.alt}
                fill
                sizes="100vw"
                className="object-contain"
              />
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white hover:bg-white/10 hover:text-white"
              onClick={() => step(1)}
              aria-label="Image suivante"
            >
              <ChevronRight className="size-8" />
            </Button>
          </div>

          {activeExif.length > 0 ? (
            <div
              className="flex flex-wrap justify-center gap-2 p-4 text-xs text-white"
              onClick={(event) => event.stopPropagation()}
            >
              {activeExif.map((chip) => (
                <span
                  key={chip}
                  className="rounded-full bg-white/15 px-3 py-1"
                >
                  {chip}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
