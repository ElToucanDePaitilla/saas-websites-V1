"use client";

import { cn } from "@/lib/utils";

/**
 * ============================================================================
 * COMMANDES DE CARROUSEL — flèches + puces (Étape 11.27)
 * ----------------------------------------------------------------------------
 * Extraction de la partie purement **visuelle** du moteur du Héro : flèches
 * (desktop) et puces de pagination, avec les mêmes repères d'accessibilité
 * (`aria-label` explicites, `role="tablist"` / `role="tab"` / `aria-selected`).
 *
 * Pourquoi un composant et non du JSX dupliqué : le Héro plein écran et le
 * « Bandeau message ou d'appel à l'action » affichent les mêmes commandes, mais
 * pas à la même échelle ni sur le même fond — deux **paramètres** suffisent
 * (`tone`, `size`) là où une copie aurait divergé.
 *
 * Vit dans `components/modules/shared/` (neutre) : le `.kilorules` interdit les
 * importations croisées entre modules.
 * ============================================================================
 */

type SliderControlsProps = {
  /** Nombre d'éléments réels (les commandes n'ont de sens qu'au-delà de 1). */
  count: number;
  /** Index de l'élément actif. */
  active: number;
  showArrows: boolean;
  showDots: boolean;
  prevDisabled: boolean;
  nextDisabled: boolean;
  onPrev: () => void;
  onNext: () => void;
  onDot: (index: number) => void;
  /** Teinte des commandes : `light` = blanches, pour un fond média sombre. */
  tone?: "light" | "dark";
  /** Échelle : `md` (Héro plein écran) ou `sm` (bandeau court). */
  size?: "md" | "sm";
  /** Libellé du groupe de puces (accessibilité). */
  label: string;
  /** Nom d'un élément, utilisé dans les libellés (« Slide précédente »). */
  itemNoun?: string;
};

const ARROW_TONE: Record<"light" | "dark", string> = {
  light: "border-white/30 bg-black/25 text-white hover:bg-black/50",
  dark: "border-black/15 bg-white/70 text-foreground hover:bg-white",
};

const ARROW_SIZE: Record<"md" | "sm", string> = {
  md: "size-11 text-2xl",
  sm: "size-9 text-xl",
};

const DOT_TONE: Record<"light" | "dark", { idle: string; active: string }> = {
  light: { idle: "bg-white/50 hover:bg-white", active: "bg-white" },
  dark: { idle: "bg-black/25 hover:bg-black/40", active: "bg-black/60" },
};

export function SliderControls({
  count,
  active,
  showArrows,
  showDots,
  prevDisabled,
  nextDisabled,
  onPrev,
  onNext,
  onDot,
  tone = "light",
  size = "md",
  label,
  itemNoun = "slide",
}: SliderControlsProps) {
  if (count <= 1) {
    return null;
  }

  const arrowClass = cn(
    "absolute top-1/2 z-20 hidden -translate-y-1/2 items-center justify-center rounded-full border transition-colors disabled:pointer-events-none disabled:opacity-30 lg:inline-flex",
    ARROW_TONE[tone],
    ARROW_SIZE[size]
  );
  const dotTone = DOT_TONE[tone];

  return (
    <>
      {showArrows ? (
        <>
          <button
            type="button"
            aria-label={`${itemNoun} précédente`}
            onClick={onPrev}
            disabled={prevDisabled}
            className={cn(arrowClass, "left-3")}
          >
            ‹
          </button>
          <button
            type="button"
            aria-label={`${itemNoun} suivante`}
            onClick={onNext}
            disabled={nextDisabled}
            className={cn(arrowClass, "right-3")}
          >
            ›
          </button>
        </>
      ) : null}

      {showDots ? (
        <div
          role="tablist"
          aria-label={label}
          className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2"
        >
          {Array.from({ length: count }, (_, index) => (
            <button
              key={`dot-${index}`}
              type="button"
              role="tab"
              aria-selected={index === active}
              aria-label={`Aller à : ${itemNoun} ${index + 1}`}
              onClick={() => onDot(index)}
              className={cn(
                "h-2.5 rounded-full transition-all duration-300",
                dotTone.idle,
                index === active ? cn("w-6", dotTone.active) : "w-2.5"
              )}
            />
          ))}
        </div>
      ) : null}
    </>
  );
}
