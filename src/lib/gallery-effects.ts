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
