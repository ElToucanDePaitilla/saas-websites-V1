"use client";

import * as React from "react";

import { galleryHoverCssVars } from "@/lib/gallery-effects";
import type {
  GalleryEffectSettings,
  GalleryImage,
  GalleryLayoutOptions,
} from "@/lib/pages";

import { GalleryItem, type GalleryTrigger } from "./GalleryItem";

/**
 * ============================================================================
 * GRILLE DE GALERIE — `GalleryGrid` (Phase 11)
 * ----------------------------------------------------------------------------
 * Client Component. Rend la grille d'une variante de galerie :
 *   - `display: "uniform"` → grille régulière (ratio 4/3) ;
 *   - `display: "masonry"` → colonnes CSS à hauteurs naturelles (les
 *     dimensions `width`/`height` de l'image sont utilisées à l'upload ; à
 *     défaut le ratio est mesuré côté client).
 * Les colonnes configurées s'appliquent au desktop puis se dégradent
 * automatiquement (variables CSS `--gallery-cols*`, voir `globals.css`).
 * Le calcul Masonry hérite du composant historique « Galerie photo masonry ».
 * ============================================================================
 */

/** Une cellule de grille (image + habillage facultatif). */
export type GalleryGridItem = {
  image: GalleryImage;
  /** Légende Polaroid éventuelle. */
  caption?: string;
  /** Badge d'album (Portfolio). */
  badge?: React.ReactNode;
};

type GalleryGridProps = {
  items: GalleryGridItem[];
  layout: GalleryLayoutOptions;
  effect: GalleryEffectSettings;
  trigger: GalleryTrigger;
  priorityFirst?: boolean;
  /** Active une vignette ; `keyboard` indique une ouverture clavier. */
  onActivate: (index: number, keyboard: boolean) => void;
};

/** Variables CSS personnalisées posées en style inline (grille responsive). */
type CSSVars = React.CSSProperties & Record<`--${string}`, string>;

/** Mesure le ratio naturel (largeur/hauteur) d'une image, si non connu. */
function useNaturalRatio(image: GalleryImage): string {
  const fallback =
    image.width && image.height ? `${image.width} / ${image.height}` : null;
  const [ratio, setRatio] = React.useState<string | null>(fallback);

  React.useEffect(() => {
    if (fallback || image.url === "") {
      return;
    }
    let active = true;
    const probe = new window.Image();
    probe.onload = () => {
      if (active && probe.naturalWidth > 0 && probe.naturalHeight > 0) {
        setRatio(`${probe.naturalWidth} / ${probe.naturalHeight}`);
      }
    };
    probe.src = image.url;
    return () => {
      active = false;
    };
  }, [image.url, fallback]);

  return ratio ?? "3 / 4";
}

/** Cellule de grille : résout le ratio (masonry) puis délègue à `GalleryItem`. */
function GalleryCell({
  item,
  index,
  layout,
  effect,
  trigger,
  priority,
  sizes,
  masonry,
  actionLabel,
  onActivate,
}: {
  item: GalleryGridItem;
  index: number;
  layout: GalleryLayoutOptions;
  effect: GalleryEffectSettings;
  trigger: GalleryTrigger;
  priority: boolean;
  sizes: string;
  masonry: boolean;
  actionLabel: string;
  onActivate: (index: number, keyboard: boolean) => void;
}) {
  const natural = useNaturalRatio(item.image);
  const ratio = masonry ? natural : "4 / 3";

  return (
    <GalleryItem
      image={item.image}
      alt={`Photo ${index + 1}`}
      ratio={ratio}
      layout={layout}
      effect={effect}
      trigger={trigger}
      priority={priority}
      sizes={sizes}
      masonryGap={masonry ? layout.gapVertical : undefined}
      caption={item.caption}
      badge={item.badge}
      actionLabel={actionLabel}
      onActivate={(keyboard) => onActivate(index, keyboard)}
    />
  );
}

export function GalleryGrid({
  items,
  layout,
  effect,
  trigger,
  priorityFirst = false,
  onActivate,
}: GalleryGridProps) {
  if (items.length === 0) {
    return null;
  }

  const masonry = layout.display === "masonry";
  const desktopVw = Math.max(Math.round(100 / layout.columns), 10);
  const sizes = `(min-width: 1024px) ${desktopVw}vw, (min-width: 640px) 50vw, 100vw`;

  const containerStyle: CSSVars = {
    // Effets de survol (11.23) : les valeurs deviennent des variables CSS lues
    // par `globals.css`, seul endroit capable de décrire un état `:hover` et de
    // tout neutraliser sous `prefers-reduced-motion`.
    ...galleryHoverCssVars(layout),
    "--gallery-cols": String(layout.columns),
    "--gallery-cols-md": String(Math.min(layout.columns, 3)),
    "--gallery-cols-sm": String(Math.min(layout.columns, 2)),
    "--gallery-cols-xs": "1",
    "--gallery-gap-x": `${layout.gapHorizontal}px`,
    "--gallery-gap-y": `${layout.gapVertical}px`,
  };

  return (
    <div
      className={masonry ? "gallery-grid-masonry" : "gallery-grid-uniform"}
      style={containerStyle}
    >
      {items.map((item, index) => (
        <GalleryCell
          key={item.image.id ?? index}
          item={item}
          index={index}
          layout={layout}
          effect={effect}
          trigger={trigger}
          priority={priorityFirst && index === 0}
          sizes={sizes}
          masonry={masonry}
          actionLabel={
            trigger === "double"
              ? `Ouvrir le diaporama sur la photo ${index + 1}`
              : `Ouvrir l'album sur la photo ${index + 1}`
          }
          onActivate={onActivate}
        />
      ))}
    </div>
  );
}
