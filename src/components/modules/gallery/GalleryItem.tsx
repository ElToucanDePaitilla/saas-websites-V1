import * as React from "react";
import { Expand } from "lucide-react";

import { MediaImage } from "@/components/common/MediaImage";
import {
  galleryBorderStyle,
  galleryConcentricRadius,
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
  /** Badge d'album (Portfolio). */
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
  // Les effets de survol (Étape 11.23) ne sont **posés** que si l'interrupteur
  // général est actif et que la vignette réagit : leurs règles vivent derrière
  // `:hover` sur `.group/media`, mais autant ne pas monter de couches inutiles
  // dans le DOM pour un effet qui ne se déclenchera jamais.
  const hoverEffects = hoverActive && interactive;

  const frameStyle: React.CSSProperties = {
    ...galleryEffectFrameStyle(effect),
    ...galleryBorderStyle(layout.border),
    ...galleryShadowStyle(layout.shadow),
    borderRadius: layout.radius,
  };

  // Rayons **concentriques** (11.20.c) : l'image est enchâssée de l'épaisseur
  // de l'encadrement **et** de la marge de l'effet. En donnant le même rayon
  // aux deux, chaque coin montrait deux arcs décalés et la couleur de fond
  // affleurait entre eux : l'arrondi semblait alors cassé, voire incompatible
  // avec l'encadrement (constat de recette).
  const innerRadius = galleryConcentricRadius(
    layout.radius,
    layout.border,
    effect
  );

  const mediaStyle: React.CSSProperties = {
    ...galleryEffectMediaStyle(effect),
    borderRadius: innerRadius,
  };

  const glossStyle = galleryEffectGlossStyle(effect);
  const showCaption =
    effect.effect === "polaroid" &&
    effect.polaroidCaptionShow &&
    caption !== undefined &&
    caption.trim() !== "";

  const visual = (
    // `hv-frame` / `hv-media` : transitions ET transformations vivent dans
    // `globals.css` (§ Effets de survol), pilotées par des variables CSS. Motif :
    // un style en ligne ne peut pas décrire un état `:hover`, et la neutralisation
    // sous `prefers-reduced-motion` se fait ainsi en un seul endroit.
    <div className="hv-frame w-full" style={frameStyle}>
      <div
        className={cn(
          "relative overflow-hidden bg-[var(--surface-color)]",
          !interactive && "pointer-events-none"
        )}
        style={{ aspectRatio: ratio, borderRadius: innerRadius }}
      >
        {/* Image (lazy) — le filtre/biseau de l'effet s'applique au conteneur. */}
        <div className="hv-media absolute inset-0" style={mediaStyle}>
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

        {/* Brillance discrète (11.23) : reflet diagonal qui traverse la vignette.
            Clippé par l'`overflow-hidden` du conteneur. */}
        {hoverEffects && layout.hoverEffects.shine ? (
          <span aria-hidden="true" className="hv-shine" />
        ) : null}

        {/* « Accentuation de la lisibilité » (11.23 — ex-« voile dégradé ») :
            au survol, assombrit l'image **depuis le bas vers le haut** pour que
            le texte posé sur la couverture reste lisible. Volontairement
            **découplée** de `hoverAnimation` : elle se cumule avec les autres
            effets et peut aussi être utilisée seule. */}
        {layout.hoverOverlay && interactive ? (
          <span
            aria-hidden="true"
            className="hv-overlay pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent"
          />
        ) : null}

        {/* Badge d'album (Portfolio). */}
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
