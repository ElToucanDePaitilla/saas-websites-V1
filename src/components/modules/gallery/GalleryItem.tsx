import * as React from "react";
import { Expand } from "lucide-react";

import { MediaImage } from "@/components/common/MediaImage";
import {
  galleryBorderStyle,
  galleryEffectCaptionStyle,
  galleryEffectFrameStyle,
  galleryEffectGlossStyle,
  galleryEffectMediaStyle,
  galleryShadowStyle,
} from "@/lib/gallery-effects";
import type {
  GalleryEffectSettings,
  GalleryImage,
  GalleryLayoutOptions,
} from "@/lib/pages";
import { cn } from "@/lib/utils";

/**
 * ============================================================================
 * VIGNETTE DE GALERIE — `GalleryItem` (Phase 11)
 * ----------------------------------------------------------------------------
 * Une photo d'une grille galerie. Rend :
 *   - l'image `MediaImage` (lazy, `sizes`, `blur`) dans un conteneur à ratio
 *     réservé (`aspect-ratio`) → **zéro saut de mise en page (CLS)** ;
 *   - l'effet de finition exclusif (Passe-partout / Sous-Verre / Polaroid) via
 *     `src/lib/gallery-effects.ts` ;
 *   - l'ombre, la bordure et le radius (réglages indépendants cumulables) ;
 *   - le survol (zoom + élévation) et le voile dégradé optionnel ;
 *   - l'interaction selon la variante : aucune (static), **double-clic**
 *     (dynamic) ou **clic simple** (portfolio). Le déclencheur clavier
 *     (Entrée/Espace → `click` avec `detail === 0`) reste supporté.
 * ============================================================================
 */

/** Déclencheur d'ouverture d'une vignette. */
export type GalleryTrigger = "none" | "double" | "single";

type GalleryItemProps = {
  image: GalleryImage;
  /** Texte alternatif de repli (si `image.alt` est vide). */
  alt: string;
  /** Ratio CSS `largeur / hauteur` réservé (anti-CLS). */
  ratio: string;
  layout: GalleryLayoutOptions;
  effect: GalleryEffectSettings;
  trigger: GalleryTrigger;
  priority?: boolean;
  sizes: string;
  /** Espace vertical inter-vignettes (uniquement en masonry). */
  masonryGap?: number;
  /** Légende de la carte Polaroid (facultative). */
  caption?: string;
  /** Badge de thématique (Portfolio). */
  badge?: React.ReactNode;
  /** Libellé d'action (aria-label du bouton interactif). */
  actionLabel: string;
  /** Active la vignette ; `keyboard` indique une ouverture clavier (Entrée). */
  onActivate: (keyboard: boolean) => void;
};

export function GalleryItem({
  image,
  alt,
  ratio,
  layout,
  effect,
  trigger,
  priority = false,
  sizes,
  masonryGap,
  caption,
  badge,
  actionLabel,
  onActivate,
}: GalleryItemProps) {
  const hoverActive = layout.hoverAnimation === "active";
  const interactive = trigger !== "none";
  const label = image.alt || alt;

  const frameStyle: React.CSSProperties = {
    ...galleryEffectFrameStyle(effect),
    ...galleryBorderStyle(layout.border),
    ...galleryShadowStyle(layout.shadow),
    borderRadius: layout.radius,
  };

  const mediaStyle: React.CSSProperties = {
    ...galleryEffectMediaStyle(effect),
    borderRadius: layout.radius,
  };

  const glossStyle = galleryEffectGlossStyle(effect);
  const showCaption =
    effect.effect === "polaroid" &&
    effect.polaroidCaptionShow &&
    caption !== undefined &&
    caption.trim() !== "";

  const visual = (
    <div
      className={cn(
        "w-full transition-transform duration-300 ease-out",
        hoverActive && interactive && "group-hover/media:-translate-y-1"
      )}
      style={frameStyle}
    >
      <div
        className={cn(
          "relative overflow-hidden bg-[var(--surface-color)]",
          !interactive && "pointer-events-none"
        )}
        style={{ aspectRatio: ratio, borderRadius: layout.radius }}
      >
        {/* Image (lazy) — le filtre/biseau de l'effet s'applique au conteneur. */}
        <div
          className={cn(
            "absolute inset-0 transition-transform duration-500 ease-silk",
            hoverActive && interactive && "group-hover/media:scale-105"
          )}
          style={mediaStyle}
        >
          <MediaImage
            src={image.url}
            alt={label}
            fill
            priority={priority}
            quality={80}
            sizes={sizes}
            className="object-cover"
          />
        </div>

        {/* Reflet du papier glacé (Polaroid). */}
        {glossStyle ? <span aria-hidden="true" style={glossStyle} /> : null}

        {/* Voile dégradé sombre au survol (optionnel, désactivé par défaut). */}
        {layout.hoverOverlay && hoverActive && interactive ? (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-0 transition-opacity duration-300 group-hover/media:opacity-100"
          />
        ) : null}

        {/* Badge de thématique (Portfolio). */}
        {badge}

        {/* Indicateur d'agrandissement (vignette interactive survolée). */}
        {interactive && hoverActive ? (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute right-2 top-2 rounded-md bg-white/15 p-1.5 text-white opacity-0 backdrop-blur-sm transition-opacity duration-300 group-hover/media:opacity-100"
          >
            <Expand className="size-3.5" />
          </span>
        ) : null}
      </div>

      {/* Légende Polaroid (bande blanche inférieure). */}
      {showCaption ? <div style={galleryEffectCaptionStyle(effect)}>{caption}</div> : null}
    </div>
  );

  function handleClick(event: React.MouseEvent<HTMLButtonElement>) {
    // `detail === 0` ⇒ activation clavier (Entrée / Espace) : c'est cette
    // modalité qui autorise la restauration du focus à la fermeture.
    const keyboard = event.detail === 0;
    if (trigger === "single") {
      onActivate(keyboard);
      return;
    }
    // Variante double-clic : seule l'activation clavier ouvre.
    if (keyboard) {
      onActivate(true);
    }
  }

  function handleDoubleClick() {
    if (trigger === "double") {
      onActivate(false);
    }
  }

  return (
    <div
      className="w-full"
      style={masonryGap !== undefined ? { marginBottom: masonryGap } : undefined}
    >
      {interactive ? (
        <button
          type="button"
          onClick={handleClick}
          onDoubleClick={handleDoubleClick}
          aria-label={actionLabel}
          className="group/media block w-full cursor-pointer rounded-[inherit] text-left outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-color-strong)]/60"
        >
          {visual}
        </button>
      ) : (
        <div className="group/media block w-full cursor-default" role="img" aria-label={label}>
          {visual}
        </div>
      )}
    </div>
  );
}
