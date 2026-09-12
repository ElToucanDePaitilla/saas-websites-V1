/**
 * ============================================================================
 * EFFETS DE FINITION GALERIE — mapping pur vers styles inline (Phase 11)
 * ----------------------------------------------------------------------------
 * Source unique des styles des trois effets exclusifs du cahier des charges :
 *   1. Passe-partout de Musée  (marge nacre + biseau intérieur)
 *   2. Sous-Verre / glassmorphism (flou + voile translucide)
 *   3. Polaroid finition papier glacé (bande blanche + reflet diagonal)
 * Déclinés en light / normal / strong (reprise de l'exemple HTML fourni).
 *
 * L'ombre, le radius et la bordure restent des réglages INDÉPENDANTS
 * (`galleryShadowStyle` / `galleryBorderStyle`) cumulables avec l'effet.
 * Aucun composant, aucun état — testable et réutilisable côté client.
 * ============================================================================
 */

import type { CSSProperties } from "react";

import type {
  GalleryBorderSettings,
  GalleryEffectSettings,
  GalleryLayoutOptions,
  GalleryShadowLevel,
} from "@/lib/pages";

/** Ombre portée nacre selon le niveau (aucune → strong). */
export function galleryShadowStyle(level: GalleryShadowLevel): CSSProperties {
  switch (level) {
    case "none":
      return { boxShadow: "none" };
    case "light":
      return { boxShadow: "0 8px 16px -6px rgba(0, 0, 0, 0.06)" };
    case "medium":
      return { boxShadow: "0 14px 28px -10px rgba(0, 0, 0, 0.1)" };
    case "normal":
      return {
        boxShadow:
          "0 20px 40px -15px rgba(220, 200, 200, 0.45), 0 6px 16px -8px rgba(0, 0, 0, 0.1)",
      };
    case "strong":
      return {
        boxShadow:
          "0 28px 55px -12px rgba(0, 0, 0, 0.22), 0 10px 24px -10px rgba(0, 0, 0, 0.18)",
      };
  }
}

/** Bordure optionnelle (épaisseur + couleur) — appliquée sur le conteneur. */
export function galleryBorderStyle(border: GalleryBorderSettings): CSSProperties {
  if (!border.enabled || border.width <= 0) {
    return {};
  }
  return { border: `${border.width}px solid ${border.color}` };
}

/**
 * Marge intérieure (px) creusée par l'effet de finition autour de l'image.
 * Rend la valeur **mesurable** au lieu de la dupliquer dans le calcul des
 * rayons (voir `galleryConcentricRadius`).
 */
export function galleryEffectPadding(effect: GalleryEffectSettings): number {
  switch (effect.effect) {
    case "museum-pass":
      return effect.intensity === "light"
        ? 10
        : effect.intensity === "normal"
          ? 18
          : 28;
    case "glass":
      return 15;
    case "polaroid":
      return effect.intensity === "light"
        ? 10
        : effect.intensity === "normal"
          ? 14
          : 18;
    default:
      return 0;
  }
}

/**
 * ----------------------------------------------------------------------------
 * RAYONS CONCENTRIQUES — correctif Étape 11.20.c
 * ----------------------------------------------------------------------------
 * Le cadre et l'image qu'il contient n'ont pas le même rayon **visuel** :
 * l'image est enchâssée de l'épaisseur de la bordure **et** de la marge de
 * l'effet. En donnant aux deux le même rayon, on obtenait deux arcs décalés
 * dans chaque coin — la couleur de fond affleurait entre eux et l'arrondi
 * *paraissait* cassé, voire incompatible avec l'encadrement. C'est le défaut
 * constaté en recette.
 *
 * Un cadre imbriqué appelle donc un **rayon concentrique** :
 * `rayon intérieur = max(0, rayon extérieur − épaisseur enchâssée)`.
 */
export function galleryConcentricRadius(
  radius: number,
  border: GalleryBorderSettings,
  effect: GalleryEffectSettings
): number {
  if (radius <= 0) {
    return 0;
  }
  const inset =
    galleryEffectPadding(effect) + (border.enabled ? border.width : 0);
  return Math.max(0, radius - inset);
}

/**
 * ----------------------------------------------------------------------------
 * EFFETS DE SURVOL → VARIABLES CSS (Étape 11.23)
 * ----------------------------------------------------------------------------
 * Les réglages deviennent des **variables CSS** posées sur le conteneur de la
 * grille, que la feuille de styles consomme (voir `globals.css` § Effets de
 * survol). Trois raisons à ce détour plutôt qu'un style en ligne :
 *
 *   1. un style en ligne ne peut pas décrire un **état de survol** ; les
 *      variables, elles, sont lues par les règles `:hover` / `:focus-within` ;
 *   2. la neutralisation sous `prefers-reduced-motion` se fait **en un seul
 *      endroit**, au lieu d'être réécrite dans chaque composant ;
 *   3. les valeurs sont **bornées ici** : aucune donnée héritée ne peut produire
 *      un rendu aberrant.
 */
export function galleryHoverCssVars(
  layout: GalleryLayoutOptions
): Record<`--${string}`, string> {
  const { zoom, lift, parallax, saturate, glow } = layout.hoverEffects;
  const boundedZoom = Math.min(Math.max(zoom, 100), 118);
  const boundedLift = Math.min(Math.max(lift, 0), 16);
  const boundedParallax = Math.min(Math.max(parallax, 0), 12);

  return {
    // `scale()` attend un facteur, le réglage est un pourcentage lisible.
    "--hv-zoom": String(boundedZoom / 100),
    "--hv-lift": `${boundedLift}px`,
    "--hv-parallax": `${boundedParallax}px`,
    "--hv-filter": saturate ? "saturate(1.12) contrast(1.04)" : "none",
    "--hv-glow": glow
      ? "0 0 0 2px var(--accent-color-strong), 0 14px 32px -14px var(--accent-color-strong)"
      : "none",
  };
}

/** Convertit une couleur hexadécimale en `rgba(..., alpha)`. */
function hexToRgba(hex: string, alpha: number): string {
  const normalized = hex.replace("#", "").trim();
  const full =
    normalized.length === 3
      ? normalized
          .split("")
          .map((char) => char + char)
          .join("")
      : normalized;
  if (full.length !== 6) {
    return `rgba(255, 255, 255, ${alpha})`;
  }
  const r = Number.parseInt(full.slice(0, 2), 16);
  const g = Number.parseInt(full.slice(2, 4), 16);
  const b = Number.parseInt(full.slice(4, 6), 16);
  if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) {
    return `rgba(255, 255, 255, ${alpha})`;
  }
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Style du **cadre** (conteneur de la photo) selon l'effet et l'intensité :
 * marges (padding), fond, flou de verre, rotation Polaroid.
 */
export function galleryEffectFrameStyle(
  effect: GalleryEffectSettings
): CSSProperties {
  const base: CSSProperties = { position: "relative" };

  switch (effect.effect) {
    case "museum-pass": {
      const padding =
        effect.intensity === "light"
          ? 10
          : effect.intensity === "normal"
            ? 18
            : 28;
      return {
        ...base,
        padding,
        background: effect.matColor,
        overflow: "hidden",
      };
    }
    case "glass": {
      const alpha =
        effect.intensity === "light"
          ? 0.85
          : effect.intensity === "normal"
            ? 0.75
            : 0.5;
      const blur = effect.glassBlur;
      return {
        ...base,
        padding: 15,
        background: hexToRgba(effect.glassTint, alpha),
        backdropFilter: `blur(${blur}px)`,
        WebkitBackdropFilter: `blur(${blur}px)`,
        overflow: "hidden",
      };
    }
    case "polaroid": {
      const padding =
        effect.intensity === "light"
          ? "10px 10px 40px"
          : effect.intensity === "normal"
            ? "14px 14px 55px"
            : "18px 18px 75px";
      const rotation = effect.polaroidRotation
        ? effect.intensity === "light"
          ? 0.8
          : effect.intensity === "normal"
            ? -1.2
            : 2
        : 0;
      return {
        ...base,
        padding,
        background: effect.intensity === "strong" ? "#F8F5F2" : "#FAF8F6",
        transform: rotation !== 0 ? `rotate(${rotation}deg)` : undefined,
        overflow: "hidden",
      };
    }
    default:
      return base;
  }
}

/**
 * Style de l'**image** à l'intérieur du cadre : biseau intérieur (passe-partout)
 * ou rehaussement de contraste (papier glacé Polaroid).
 */
export function galleryEffectMediaStyle(
  effect: GalleryEffectSettings
): CSSProperties {
  switch (effect.effect) {
    case "museum-pass": {
      if (!effect.matBevel) {
        return {};
      }
      const bevel =
        effect.intensity === "light"
          ? "rgba(0, 0, 0, 0.03)"
          : effect.intensity === "normal"
            ? "rgba(0, 0, 0, 0.06)"
            : "rgba(0, 0, 0, 0.12)";
      return { border: `1px solid ${bevel}` };
    }
    case "polaroid": {
      const filter =
        effect.intensity === "light"
          ? "contrast(102%) brightness(101%)"
          : effect.intensity === "normal"
            ? "contrast(105%) brightness(102%)"
            : "contrast(108%) brightness(103%) sepia(5%)";
      return { filter };
    }
    case "glass":
      return {};
    default:
      return {};
  }
}

/**
 * Reflet diagonal du papier glacé Polaroid (calque absolu, `pointer-events`
 * neutralisés par le composant parent). `null` pour les autres effets.
 */
export function galleryEffectGlossStyle(
  effect: GalleryEffectSettings
): CSSProperties | null {
  if (effect.effect !== "polaroid") {
    return null;
  }
  const background =
    effect.intensity === "light"
      ? "linear-gradient(125deg, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0.15) 30%, rgba(255,255,255,0) 45%, rgba(255,255,255,0.05) 100%)"
      : effect.intensity === "normal"
        ? "linear-gradient(125deg, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.2) 32%, rgba(255,255,255,0) 48%, rgba(255,255,255,0.08) 100%)"
        : "linear-gradient(120deg, rgba(255,255,255,0.65) 0%, rgba(255,255,255,0.25) 35%, rgba(255,255,255,0) 50%, rgba(255,255,255,0.15) 100%)";
  return {
    background,
    position: "absolute",
    inset: 0,
    pointerEvents: "none",
  };
}

/** Style de la légende Polaroid (bande blanche inférieure) — police fluide. */
export function galleryEffectCaptionStyle(
  effect: GalleryEffectSettings
): CSSProperties {
  const size = effect.intensity === "light" ? 1 : effect.intensity === "normal" ? 1.15 : 1.25;
  const marginTop = effect.intensity === "light" ? 10 : effect.intensity === "normal" ? 14 : 20;
  return {
    marginTop,
    fontFamily: "var(--font-heading)",
    fontStyle: "italic",
    color: "#333333",
    textAlign: "center",
    width: "100%",
    letterSpacing: effect.intensity === "strong" ? "0.05em" : undefined,
    fontSize: `clamp(0.85rem, 2.6vw, ${size}rem)`,
  };
}
