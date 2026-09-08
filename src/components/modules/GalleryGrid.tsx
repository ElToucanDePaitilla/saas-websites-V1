"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight, Expand, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { MediaImage } from "@/components/common/MediaImage";
import { exifChipsFromData } from "@/lib/media-exif";
import {
  resolveGalleryLayout,
  type GalleryImage,
  type GalleryLayoutOptions,
} from "@/lib/pages";
import { cn } from "@/lib/utils";

/**
 * ============================================================================
 * GALERIE PUBLIQUE — grille (uniforme ou masonry) + Lightbox (Étape 6.2)
 * ----------------------------------------------------------------------------
 * Client Component. Mise en page pilotée par l'éditeur (`GalleryLayoutOptions`) :
 *   - variant : "uniform" (grille régulière) ou "masonry" (CSS columns,
 *     hauteurs naturelles) ;
 *   - clickable : true → un clic ouvre le diaporama plein écran ; false →
 *     exposition visuelle statique (aucune ouverture) ;
 *   - colonnes, écarts (px) et rayon des coins.
 * Effets au survol : zoom subtil de l'image (105 %), élévation + ombre douce
 * (nacre) sur la vignette, et voile d'overlay révélant le titre / l'icône
 * d'agrandissement. La Lightbox supporte le **double-clic pour zoomer**.
 * ============================================================================
 */

type GalleryGridProps = {
  images: GalleryImage[];
  /** EXIF résolus par URL d'image (facultatif). */
  exifByUrl?: Record<string, unknown>;
  /** LCP : passer true pour la première image. */
  priorityFirst?: boolean;
  /** Mise en page : type, colonnes, espacements (px), rayon, cliquable. */
  layout?: Partial<GalleryLayoutOptions>;
};

type TileProps = {
  image: GalleryImage;
  clickable: boolean;
  radius: number;
  chips: string[];
  priority: boolean;
  hoverActive: boolean;
  onOpen: () => void;
};

/** Corps visuel d'une vignette : image, zoom au survol, overlay, icône. */
function TileBody({
  image,
  chips,
  clickable,
  priority,
  hoverActive,
}: {
  image: GalleryImage;
  chips: string[];
  clickable: boolean;
  priority?: boolean;
  hoverActive: boolean;
}) {
  return (
    <div className="relative h-full w-full overflow-hidden">
      <MediaImage
        src={image.url}
        alt={image.alt}
        fill
        priority={priority}
        sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
        className={cn(
          "object-cover transition-transform duration-300 ease-out",
          hoverActive && "group-hover:scale-105"
        )}
      />

      {/* Voile d'overlay au survol : titre + description + informations. */}
      <div
        className={cn(
          "pointer-events-none absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/75 via-black/15 to-transparent p-3 transition-opacity duration-300",
          hoverActive ? "opacity-0 group-hover:opacity-100" : "opacity-0"
        )}
      >
        {image.title ? (
          <p className="text-sm font-medium text-white">{image.title}</p>
        ) : null}
        {image.description ? (
          <p className="mt-0.5 line-clamp-2 text-xs text-white/85">
            {image.description}
          </p>
        ) : null}
        {chips.length > 0 ? (
          <p className="mt-1 flex flex-wrap gap-1.5 text-[10px] text-white/85">
            {chips.join(" · ")}
          </p>
        ) : null}
      </div>

      {/* Icône d'agrandissement (uniquement si cliquable et survol animé). */}
      {clickable && hoverActive ? (
        <span className="pointer-events-none absolute right-2 top-2 rounded-md bg-white/15 p-1.5 text-white opacity-0 backdrop-blur-sm transition-opacity duration-300 group-hover:opacity-100">
          <Expand className="size-3.5" />
        </span>
      ) : null}
    </div>
  );
}

/** Vignette d'une galerie uniforme (grille régulière 4:3). */
function UniformTile({
  image,
  clickable,
  radius,
  chips,
  priority,
  hoverActive,
  onOpen,
}: TileProps) {
  const shared = cn(
    "group relative block aspect-[4/3] overflow-hidden bg-[var(--surface-color)] transition-all duration-300 ease-out",
    clickable && "cursor-pointer",
    !clickable && "cursor-default",
    hoverActive &&
      "hover:-translate-y-1 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.45)]"
  );
  const style: React.CSSProperties = { borderRadius: radius };

  if (clickable) {
    return (
      <button
        type="button"
        onClick={onOpen}
        aria-label={`Agrandir ${image.title || image.alt || image.url}`}
        className={shared}
        style={style}
      >
        <TileBody
          image={image}
          chips={chips}
          clickable
          priority={priority}
          hoverActive={hoverActive}
        />
      </button>
    );
  }
  return (
    <div className={shared} style={style} role="img" aria-label={image.alt}>
      <TileBody
        image={image}
        chips={chips}
        clickable={false}
        priority={priority}
        hoverActive={hoverActive}
      />
    </div>
  );
}

/** Mesure le ratio naturel (largeur/hauteur) d'une image distante. */
function useNaturalRatio(src: string): string | null {
  const [ratio, setRatio] = React.useState<string | null>(null);
  React.useEffect(() => {
    let active = true;
    const img = new window.Image();
    img.onload = () => {
      if (active && img.naturalWidth > 0 && img.naturalHeight > 0) {
        setRatio(`${img.naturalWidth}/${img.naturalHeight}`);
      }
    };
    img.src = src;
    return () => {
      active = false;
    };
  }, [src]);
  return ratio;
}

/** Vignette d'une galerie masonry (hauteur naturelle, colonnes CSS). */
function MasonryTile({
  image,
  clickable,
  radius,
  chips,
  priority,
  hoverActive,
  onOpen,
  gapVertical,
}: TileProps & { gapVertical: number }) {
  const natural = useNaturalRatio(image.url);
  const ratio =
    image.width && image.height
      ? `${image.width}/${image.height}`
      : (natural ?? "3/4");

  const shared = cn(
    "group relative block h-full w-full overflow-hidden transition-all duration-300 ease-out",
    clickable && "cursor-pointer",
    !clickable && "cursor-default",
    hoverActive &&
      "hover:-translate-y-1 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.45)]"
  );
  const body = (
    <TileBody
      image={image}
      chips={chips}
      clickable={clickable}
      priority={priority}
      hoverActive={hoverActive}
    />
  );

  return (
    <div
      className="w-full"
      style={{ marginBottom: gapVertical, breakInside: "avoid" }}
    >
      <div className="relative w-full" style={{ aspectRatio: ratio }}>
        {clickable ? (
          <button
            type="button"
            onClick={onOpen}
            aria-label={`Agrandir ${image.title || image.alt || image.url}`}
            className={shared}
            style={{ borderRadius: radius }}
          >
            {body}
          </button>
        ) : (
          <div
            className={shared}
            style={{ borderRadius: radius }}
            role="img"
            aria-label={image.alt}
          >
            {body}
          </div>
        )}
      </div>
    </div>
  );
}

export function GalleryGrid({
  images,
  exifByUrl,
  priorityFirst = false,
  layout,
}: GalleryGridProps) {
  const resolved = resolveGalleryLayout(layout);
  const clickable = resolved.clickable;

  // Ignore les images sans URL (placeholders vides des contenus seed) et les
  // photos masquées dans l'éditeur (toggle œil — GalleryImage.hidden).
  const items = images.filter(
    (image) => image.url !== "" && !image.hidden
  );

  const [activeIndex, setActiveIndex] = React.useState<number | null>(null);
  const [zoomed, setZoomed] = React.useState(false);

  const active = activeIndex !== null ? items[activeIndex] : null;
  const activeExif = active
    ? exifChipsFromData(active.url ? (exifByUrl?.[active.url] ?? null) : null)
    : [];

  function open(index: number) {
    setActiveIndex(index);
    setZoomed(false);
  }

  function close() {
    setActiveIndex(null);
    setZoomed(false);
  }

  function step(delta: number) {
    setActiveIndex((current) => {
      if (current === null) return current;
      setZoomed(false);
      return (current + delta + items.length) % items.length;
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
  }, [activeIndex, items.length]);

  if (items.length === 0) {
    return null;
  }

  const containerStyle: React.CSSProperties =
    resolved.variant === "masonry"
      ? { columnCount: resolved.columns, columnGap: resolved.gapHorizontal }
      : {
          display: "grid",
          gridTemplateColumns: `repeat(${resolved.columns}, minmax(0, 1fr))`,
          columnGap: resolved.gapHorizontal,
          rowGap: resolved.gapVertical,
        };

  const tiles = items.map((image, index) => {
    const chips = image.url
      ? exifChipsFromData(exifByUrl?.[image.url] ?? null)
      : [];
    const tileProps: TileProps = {
      image,
      clickable,
      radius: resolved.radius,
      chips,
      priority: priorityFirst && index === 0,
      hoverActive: resolved.hoverAnimation === "active",
      onOpen: () => open(index),
    };

    if (resolved.variant === "masonry") {
      return (
        <MasonryTile
          key={image.id}
          {...tileProps}
          gapVertical={resolved.gapVertical}
        />
      );
    }
    return <UniformTile key={image.id} {...tileProps} />;
  });

  return (
    <>
      <div style={containerStyle}>{tiles}</div>

      {/* Lightbox (diaporama) — uniquement si la galerie est cliquable. */}
      {clickable && active && activeIndex !== null ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={active.title || active.alt || active.url}
          className="fixed inset-0 z-50 flex flex-col bg-black/92 backdrop-blur-sm"
          onClick={close}
        >
          <div className="flex items-center justify-between p-3 text-white">
            <p className="truncate px-2 text-sm">
              {activeIndex + 1} / {items.length}
              {active.title ? ` — ${active.title}` : ""}
            </p>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/10 hover:text-white"
              onClick={close}
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

            {/* Zone image : double-clic pour zoomer / dézoomer. */}
            <div
              className="relative h-full max-h-full w-full max-w-4xl overflow-auto"
              onDoubleClick={() => setZoomed((value) => !value)}
              title={
                zoomed
                  ? "Double-cliquez pour dézoomer"
                  : "Double-cliquez pour zoomer"
              }
            >
              <div
                className={cn(
                  "relative flex h-full min-h-full w-full min-w-full items-center justify-center transition-transform duration-300 ease-out",
                  zoomed && "cursor-zoom-out scale-150"
                )}
              >
                <div className="relative aspect-auto h-full max-h-full w-full">
                  <MediaImage
                    src={active.url}
                    alt={active.alt}
                    fill
                    sizes="100vw"
                    className="object-contain"
                  />
                </div>
              </div>
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

          <div
            className="flex flex-col items-center gap-2 p-4 text-xs text-white"
            onClick={(event) => event.stopPropagation()}
          >
            {(active.title || active.description) && (
              <div className="max-w-2xl text-center">
                {active.title ? (
                  <p className="text-sm font-medium">{active.title}</p>
                ) : null}
                {active.description ? (
                  <p className="mt-0.5 text-white/80">{active.description}</p>
                ) : null}
              </div>
            )}
            <div className="flex flex-wrap items-center justify-center gap-2">
              <span className="text-white/60">
                {zoomed ? "Double-clic : dézoomer" : "Double-clic : zoomer"}
              </span>
              {activeExif.map((chip) => (
                <span key={chip} className="rounded-full bg-white/15 px-3 py-1">
                  {chip}
                </span>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
