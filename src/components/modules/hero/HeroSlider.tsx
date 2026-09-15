"use client";

import { SliderControls } from "@/components/modules/shared/SliderControls";
import { useSliderEngine } from "@/components/modules/shared/useSliderEngine";
import {
  HERO_OVERLAY_OPACITY,
  type HeroSliderContent,
  type PageModule,
} from "@/lib/pages";
import { cn } from "@/lib/utils";

import { HeroStaticBackground } from "./HeroStaticBackground";
import { HeroTextBlock } from "./HeroTextBlock";

/**
 * ============================================================================
 * HERO SLIDER — frame client de la variante "slider" (Étape 7.2)
 * ----------------------------------------------------------------------------
 * Ce composant ne porte plus la machine à états du carrousel : depuis l'Étape
 * 11.27, celle-ci vit dans `components/modules/shared/useSliderEngine`
 * (transition glissement / fondu, autoplay, pause au focus clavier, swipe
 * tactile, boucle transparente, `prefers-reduced-motion`) et les commandes dans
 * `shared/SliderControls` (flèches + puces).
 *
 * Raison de l'extraction : le « Bandeau message ou d'appel à l'action » a besoin
 * **du même** moteur pour son fond carrousel. Le dupliquer aurait reproduit le
 * défaut que les étapes 11.17 puis 11.26 ont combattu — et deux moteurs auraient
 * divergé à la première correction.
 *
 * Ici ne restent que ce qui est **propre au Héro** :
 *   - la composition d'une diapositive (fond art-direction + overlay + textes) ;
 *   - la disposition `bottom-left` des textes sur grand écran.
 * ============================================================================
 */

type HeroSliderProps = {
  /** Ancre HTML du module. */
  module: Pick<PageModule, "anchorId">;
  /** Contenu résolu (slides + réglages) — données sérialisables. */
  content: HeroSliderContent;
  /**
   * Niveau accordé au carrousel par la page ([`PublicModulesList`]).
   * **Toutes les diapositives sont dans le document** (piste glissante, fondu,
   * et doublon de la première pour la boucle) : un `h1` par diapositive ferait
   * quatre à cinq titres de niveau 1 sur une seule page. Seule la diapositive
   * **affichée** conserve donc le niveau reçu ; les autres passent en `h2` —
   * elles sont déjà `aria-hidden`, il ne leur manquait que le bon niveau.
   */
  titleTag?: "h1" | "h2";
};

export function HeroSlider({
  module,
  content,
  titleTag = "h1",
}: HeroSliderProps) {
  const slides = content.slides;

  // Moteur partagé : état, autoplay, gestes et boucle transparente (11.27).
  const engine = useSliderEngine(slides.length, {
    autoplay: content.settings.autoplay,
    autoplaySpeedMs: content.settings.autoplaySpeedMs,
    transition: content.settings.transition,
  });

  if (slides.length === 0) {
    return null;
  }

  // Position dans la piste : un clone de la 1re slide est ajouté en fin.
  const trackItems = engine.trackMode ? [...slides, slides[0]] : slides;

  const overlayOpacityFor = (
    overlayLevel: HeroSliderContent["slides"][number]["overlayLevel"]
  ) => HERO_OVERLAY_OPACITY[overlayLevel];

  /** Contenu d'une slide (fond + overlay + texte) — réutilisé stack & piste. */
  function renderSlideBody(
    slide: HeroSliderContent["slides"][number],
    isActive: boolean
  ) {
    const overlayRgb = slide.textTone === "dark" ? "255,255,255" : "0,0,0";
    return (
      <div className="relative h-full w-full">
        <HeroStaticBackground media={slide.media} priority={isActive} />
        {overlayOpacityFor(slide.overlayLevel) > 0 ? (
          <div
            aria-hidden="true"
            className="absolute inset-0 z-[2]"
            style={{
              backgroundColor: `rgba(${overlayRgb}, ${overlayOpacityFor(
                slide.overlayLevel
              )})`,
            }}
          />
        ) : null}
        <div className="relative z-10 flex h-full w-full items-center justify-center px-4 pb-14 sm:px-6 lg:items-end lg:justify-start lg:px-14 lg:pb-16">
          <HeroTextBlock
            titleH1={slide.titleH1}
            subtitleH2={slide.subtitleH2}
            descriptionText={slide.descriptionText}
            textTone={slide.textTone}
            weightH1={content.weightH1}
            weightH2={content.weightH2}
            weightText={content.weightText}
            ctaShow={slide.ctaShow}
            ctaLabel={slide.ctaLabel}
            ctaHref={slide.ctaHref}
            ctaStyle={slide.ctaStyle}
            align="bottom-left"
            titleTag={isActive ? titleTag : "h2"}
            className="max-w-xl"
          />
        </div>
      </div>
    );
  }

  return (
    <section
      id={module.anchorId}
      aria-roledescription="carrousel"
      aria-label="Diaporama de la section Héro"
      className="relative flex min-h-[calc(100svh-4rem)] w-full -mt-4 items-stretch justify-center overflow-hidden bg-background supports-[height:100dvh]:min-h-[calc(100dvh-4rem)]"
      style={{ touchAction: "pan-y" }}
      onPointerDown={engine.onPointerDown}
      onPointerUp={engine.onPointerUp}
      onPointerCancel={engine.onPointerCancel}
      onFocus={engine.onFocus}
      onBlur={engine.onBlur}
    >
      {/* ============ Piste « glissement » (boucle transparente) ============ */}
      {engine.trackMode ? (
        <div
          className={cn(
            // Piste positionnée en absolu inset-0 : elle occupe réellement toute
            // la hauteur de la section (>= min-h), donc chaque slide la remplit.
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
                {renderSlideBody(slide, isActive)}
              </div>
            );
          })}
        </div>
      ) : (
        /* ============ Superposition « fondu » (ou mono-slide / reduced) ============ */
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
                zIndex: isActive ? 2 : 1,
                pointerEvents: isActive ? "auto" : "none",
              }}
            >
              {renderSlideBody(slide, isActive)}
            </div>
          );
        })
      )}

      {/* ============ Flèches (desktop) & puces — commandes partagées ============ */}
      <SliderControls
        count={slides.length}
        active={engine.active}
        showArrows={content.settings.showArrows}
        showDots={content.settings.showDots}
        prevDisabled={engine.active === 0}
        // La boucle est continue (avant) : « suivante » jamais désactivée.
        nextDisabled={false}
        onPrev={engine.goPrev}
        onNext={engine.goNext}
        onDot={engine.goTo}
        label="Choisir une slide"
      />
    </section>
  );
}
