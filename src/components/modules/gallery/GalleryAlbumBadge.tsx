import type { GalleryBadgeSettings } from "@/lib/pages";
import { cn } from "@/lib/utils";

/**
 * ============================================================================
 * TEXTE DE COUVERTURE D'ALBUM — surimpression Portfolio (Phase 11 / 11.16)
 * ----------------------------------------------------------------------------
 * Affiche le nom de l'album et/ou le nombre de photos contenues, en
 * surimpression de la photo de couverture. Trois réglages indépendants :
 *   - QUAND   : `display` = `none` (rien) / `always` (permanent) / `hover` ;
 *   - QUOI    : `showLabel` (nom) et `showCount` (nombre de photos) ;
 *   - COMMENT : `style` et `position`.
 *
 * Mode « au survol » : l'opacité est pilotée par l'utilitaire CSS
 * `cover-text-hover` (voir `globals.css`), qui repasse AUTOMATIQUEMENT en
 * affichage permanent sur les appareils sans survol réel (tactile) — sinon le
 * nom de l'album serait invisible au doigt. Le focus clavier le révèle aussi.
 *
 * Typographie fluide (`clamp()`) pour rester lisible de < 350 px à 4K.
 * ============================================================================
 */

type GalleryAlbumBadgeProps = {
  settings: GalleryBadgeSettings;
  label: string;
  count: number;
};

/** Position du badge sur la couverture. */
const POSITION_CLASSES: Record<GalleryBadgeSettings["position"], string> = {
  "top-left": "left-3 top-3",
  "top-right": "right-3 top-3",
  "bottom-left": "bottom-3 left-3",
  "bottom-right": "bottom-3 right-3",
  center: "left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2",
};

/** Style visuel du badge (plein, sous-verre ou contour). */
const STYLE_CLASSES: Record<GalleryBadgeSettings["style"], string> = {
  solid: "bg-black/70 text-white",
  glass: "glass text-[var(--text-color)]",
  outline: "border border-white/70 bg-black/25 text-white backdrop-blur-sm",
};

export function GalleryAlbumBadge({
  settings,
  label,
  count,
}: GalleryAlbumBadgeProps) {
  // « Aucun affichage » : rien du tout, indépendamment de la sélection de contenu.
  if (settings.display === "none") {
    return null;
  }
  // Rien à montrer (nom et nombre désactivés) : aucun cadre vide n'est rendu.
  if (!settings.showLabel && !settings.showCount) {
    return null;
  }

  return (
    <span
      className={cn(
        "pointer-events-none absolute z-10 flex max-w-[85%] items-center gap-2 rounded-full px-3 py-1 shadow-sm",
        // `display` absent (contenu antérieur) → aucune classe : rendu permanent.
        settings.display === "hover" && "cover-text-hover",
        STYLE_CLASSES[settings.style],
        POSITION_CLASSES[settings.position]
      )}
    >
      {settings.showLabel ? (
        <span
          className="truncate"
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: "clamp(0.8rem, 2.4vw, 1.05rem)",
            letterSpacing: "0.02em",
          }}
        >
          {label}
        </span>
      ) : null}
      {settings.showCount ? (
        <span
          className="shrink-0 whitespace-nowrap opacity-80"
          style={{ fontSize: "clamp(0.68rem, 2vw, 0.8rem)" }}
        >
          {count} photo{count > 1 ? "s" : ""}
        </span>
      ) : null}
    </span>
  );
}
