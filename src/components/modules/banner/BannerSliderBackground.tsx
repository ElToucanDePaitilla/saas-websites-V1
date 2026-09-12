"use client";

import { HeroStaticBackground } from "@/components/modules/hero/HeroStaticBackground";
import { SliderControls } from "@/components/modules/shared/SliderControls";
import { useSliderEngine } from "@/components/modules/shared/useSliderEngine";
import type { BannerSlide, HeroSliderSettings } from "@/lib/pages";
import { cn } from "@/lib/utils";

/**
 * ============================================================================
 * FOND CARROUSEL DU BANDEAU — Étape 11.27
 * ----------------------------------------------------------------------------
 * Client Component branché en `children` de `BaseHero`. Il **réutilise le moteur
 * du Héro** (`shared/useSliderEngine` + `shared/SliderControls`) : piste
 * glissante en boucle transparente ou fondu croisé, autoplay, pause au focus
 * clavier et pendant le geste, swipe tactile, `prefers-reduced-motion`.
 *
 * Différence avec le `HeroSlider` : ici, pas de texte par image. Chaque élément
 * n'est qu'une **couche photo** (`HeroStaticBackground`, art-direction
 * `<picture>` + cadrage vertical `focalY`) ; le message du bandeau reste unique,
 * affiché par-dessus par `BaseHero`.
 *
 * Les commandes sont de taille `sm` (le bandeau est plus court qu'un Héro) et la
 * couche n'est **pas** marquée `aria-hidden` : les flèches et les puces sont de
 * vraies commandes, elles doivent rester dans l'ordre de tabulation. Les images,
 * elles, sont décoratives (`HeroStaticBackground` porte l'`aria-hidden`).
 * ============================================================================
 */

type BannerSliderBackgroundProps = {
  slides: BannerSlide[];
  settings: HeroSliderSettings;
};

export function BannerSliderBackground({
  slides,
  settings,
}: BannerSliderBackgroundProps) {
  const engine = useSliderEngine(slides.length, {
    autoplay: settings.autoplay,
    autoplaySpeedMs: settings.autoplaySpeedMs,
    transition: settings.transition,
  });

  if (slides.length === 0) {
    return null;
  }

  // Piste : un clone du 1er visuel est ajouté en fin (boucle transparente).
  const trackItems = engine.trackMode ? [...slides, slides[0]] : slides;

  return (
    <div
      className="absolute inset-0 overflow-hidden bg-neutral-900"
      style={{ touchAction: "pan-y" }}
      onPointerDown={engine.onPointerDown}
      onPointerUp={engine.onPointerUp}
      onPointerCancel={engine.onPointerCancel}
      onFocus={engine.onFocus}
      onBlur={engine.onBlur}
    >
      {engine.trackMode ? (
        <div
          className={cn(
            "absolute inset-0 flex w-full",
            engine.smooth
              ? "transition-transform duration-700 ease-silk"
              : "transition-none"
          )}
          style={{ transform: `translateX(-${engine.pos * 100}%)` }}
        >
          {trackItems.map((slide, itemIndex) => {
            const isActive = itemIndex === engine.pos;
            return (
              <div
                key={`${slide.id}-${itemIndex}`}
                aria-hidden={!isActive}
                className="relative h-full w-full shrink-0"
                style={{ pointerEvents: isActive ? "auto" : "none" }}
              >
                <HeroStaticBackground
                  media={slide.media}
                  focalY={slide.focalY}
                />
              </div>
            );
          })}
        </div>
      ) : (
        slides.map((slide, slideIndex) => {
          const isActive = slideIndex === engine.active;
          return (
            <div
              key={slide.id}
              aria-hidden={!isActive}
              className={cn(
                "absolute inset-0",
                !engine.smooth || engine.reduced
                  ? "transition-none"
                  : "transition-opacity duration-700 ease-silk"
              )}
              style={{
                opacity: isActive ? 1 : 0,
                zIndex: isActive ? 1 : 0,
                pointerEvents: isActive ? "auto" : "none",
              }}
            >
              <HeroStaticBackground media={slide.media} focalY={slide.focalY} />
            </div>
          );
        })
      )}

      <SliderControls
        count={slides.length}
        active={engine.active}
        showArrows={settings.showArrows}
        showDots={settings.showDots}
        prevDisabled={engine.active === 0}
        nextDisabled={false}
        onPrev={engine.goPrev}
        onNext={engine.goNext}
        onDot={engine.goTo}
        size="sm"
        label="Choisir une photo du bandeau"
        itemNoun="Visuel"
      />
    </div>
  );
}
