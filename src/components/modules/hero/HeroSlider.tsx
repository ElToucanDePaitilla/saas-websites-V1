"use client";

import * as React from "react";

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
 * Moteur du slider « prêt à l'emploi » :
 *   - transition `slide` : **piste fluide** en boucle transparente (un clone de
 *     la 1re slide est ajouté en fin ; au retour sur le clone, la position est
 *     ramenée à la vraie 1re slide SANS transition — visuellement identique,
 *     donc aucun saut brutal en fin de cycle) ;
 *   - transition `fade` : slides superposées en opacité croisée (GPU) ;
 *   - autoplay (vitesse réglable) ; pause UNIQUEMENT au focus clavier et
 *     pendant le geste (plus au simple survol → démarrage stable) ;
 *   - flèches desktop, puces, **swipe tactile** (pointer events,
 *     `touch-action: pan-y`) ;
 *   - `prefers-reduced-motion` : transitions désactivées + autoplay coupé.
 * ============================================================================
 */

type HeroSliderProps = {
  /** Ancre HTML du module. */
  module: Pick<PageModule, "anchorId">;
  /** Contenu résolu (slides + réglages) — données sérialisables. */
  content: HeroSliderContent;
};

const REDUCED_MEDIA = "(prefers-reduced-motion: reduce)";
/** Durée de transition (doit suivre la classe duration-700). */
const TRANSITION_MS = 700;

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }
  return window.matchMedia(REDUCED_MEDIA).matches;
}

export function HeroSlider({ module, content }: HeroSliderProps) {
  const slides = content.slides;
  const count = slides.length;
  const hasMany = count > 1;

  const [reduced, setReduced] = React.useState(false);
  const [pos, setPos] = React.useState(0); // position (piste ou stack)
  const [smooth, setSmooth] = React.useState(true); // autorise l'animation
  const [paused, setPaused] = React.useState(false);

  const posRef = React.useRef(0);
  const pointerStartX = React.useRef<number | null>(null);

  const trackMode = content.settings.transition === "slide" && hasMany && !reduced;
  // Position dans la piste : un clone de la 1re slide est ajouté en fin.
  const trackItems = trackMode ? [...slides, slides[0]] : slides;
  const trackLast = count; // index du clone (== slide 0)

  // Slide logiquement active (pour aria / puces / flèches).
  const active =
    trackMode
      ? pos >= trackLast ? 0 : pos
      : hasMany ? pos % count : 0;

  React.useEffect(() => {
    posRef.current = pos;
  }, [pos]);

  // Détection reduced-motion différée (aucun setState synchrone dans l'effet).
  React.useEffect(() => {
    const frame = requestAnimationFrame(() => setReduced(prefersReducedMotion()));
    return () => cancelAnimationFrame(frame);
  }, []);

  /** Autoplay — off si : réglage off, reduced-motion, pause, mono-slide. */
  React.useEffect(() => {
    if (!content.settings.autoplay || reduced || paused || !hasMany) {
      return;
    }
    const id = window.setInterval(() => {
      setPos((current) =>
        trackMode ? Math.min(current + 1, trackLast) : current + 1
      );
    }, content.settings.autoplaySpeedMs);
    return () => window.clearInterval(id);
  }, [content.settings.autoplay, content.settings.autoplaySpeedMs, reduced, paused, hasMany, trackMode, trackLast]);

  /**
   * Boucle transparente (track) : arrivé sur le clone de la 1re slide, on
   * attend la fin de l'animation puis on ramène la piste sur la vraie 1re
   * slide SANS transition (les deux visuels sont identiques → aucun saut).
   */
  React.useEffect(() => {
    // Le clone occupe la même position visuelle que la vraie 1re slide : le
    // retour se fait sans transition une fois l'animation terminée (aucun
    // saut). Aucun `setState` synchrone ici — le tout est planifié en timeout.
    if (!trackMode || pos !== trackLast) {
      return;
    }
    const timer = window.setTimeout(() => {
      setSmooth(false);
      setPos(0);
      requestAnimationFrame(() => requestAnimationFrame(() => setSmooth(true)));
    }, TRANSITION_MS + 40);
    return () => window.clearTimeout(timer);
  }, [pos, trackMode, trackLast]);

  if (count === 0) {
    return null;
  }

  function goNext() {
    if (trackMode) {
      setSmooth(true);
      setPos((current) => Math.min(current + 1, trackLast));
      return;
    }
    setPos((current) => current + 1);
  }

  function goPrev() {
    if (trackMode) {
      setSmooth(true);
      setPos((current) => Math.max(0, current - 1));
      return;
    }
    setPos((current) => {
      const currentActive = current % count;
      if (currentActive === 0) {
        return current; // pas de retour en arrière au-delà de la 1re
      }
      return current - 1;
    });
  }

  function goToDot(target: number) {
    const targetSlide = Math.max(0, Math.min(target, count - 1));
    if (trackMode) {
      setSmooth(true);
      setPos(targetSlide);
      return;
    }
    setPos((current) => {
      const currentActive = current % count;
      const forward = (targetSlide - currentActive + count) % count;
      return current + forward;
    });
  }

  function handlePointerDown(event: React.PointerEvent) {
    if (event.button !== 0) {
      return;
    }
    pointerStartX.current = event.clientX;
    setPaused(true); // pas de bascule pendant le geste
  }

  function handlePointerUp(event: React.PointerEvent) {
    setPaused(false);
    const startX = pointerStartX.current;
    pointerStartX.current = null;
    if (startX === null) {
      return;
    }
    const delta = event.clientX - startX;
    if (Math.abs(delta) < 48) {
      return;
    }
    if (delta < 0) {
      goNext();
    } else {
      goPrev();
    }
  }

  const overlayOpacityFor = (overlayLevel: HeroSliderContent["slides"][number]["overlayLevel"]) =>
    HERO_OVERLAY_OPACITY[overlayLevel];

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
            className="max-w-xl"
          />
        </div>
      </div>
    );
  }

  // La boucle est continue (avant) : « suivante » jamais désactivée.
  const nextDisabled = false;
  const prevDisabled = active === 0;

  return (
    <section
      id={module.anchorId}
      aria-roledescription="carrousel"
      aria-label="Diaporama de la section Héro"
      className="relative flex min-h-[calc(100svh-4rem)] w-full -mt-4 items-stretch justify-center overflow-hidden bg-background supports-[height:100dvh]:min-h-[calc(100dvh-4rem)]"
      style={{ touchAction: "pan-y" }}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={() => {
        setPaused(false);
        pointerStartX.current = null;
      }}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      {/* ============ Piste « glissement » (boucle transparente) ============ */}
      {trackMode ? (
        <div
          className={cn(
            // Piste positionnée en absolu inset-0 : elle occupe réellement toute
            // la hauteur de la section (>= min-h), donc chaque slide la remplit.
            "absolute inset-0 flex w-full",
            smooth ? "transition-transform duration-700 ease-silk" : "transition-none"
          )}
          style={{ transform: `translateX(-${pos * 100}%)` }}
        >
          {trackItems.map((slide, itemIndex) => {
            const isActive = itemIndex === pos;
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
          const isActive = slideIndex === active;
          return (
            <div
              key={slide.id}
              aria-hidden={!isActive}
              className={cn(
                "absolute inset-0",
                !smooth || reduced
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

      {/* ============ Flèches (desktop) ============ */}
      {content.settings.showArrows && hasMany ? (
        <>
          <button
            type="button"
            aria-label="Slide précédente"
            onClick={goPrev}
            disabled={prevDisabled}
            className="absolute top-1/2 left-3 z-20 hidden size-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-black/25 text-2xl text-white transition-colors hover:bg-black/50 disabled:pointer-events-none disabled:opacity-30 lg:inline-flex"
          >
            ‹
          </button>
          <button
            type="button"
            aria-label="Slide suivante"
            onClick={goNext}
            disabled={nextDisabled}
            className="absolute top-1/2 right-3 z-20 hidden size-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-black/25 text-2xl text-white transition-colors hover:bg-black/50 disabled:pointer-events-none disabled:opacity-30 lg:inline-flex"
          >
            ›
          </button>
        </>
      ) : null}

      {/* ============ Puces ============ */}
      {content.settings.showDots && hasMany ? (
        <div
          role="tablist"
          aria-label="Choisir une slide"
          className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2"
        >
          {slides.map((slide, slideIndex) => (
            <button
              key={slide.id}
              type="button"
              role="tab"
              aria-selected={slideIndex === active}
              aria-label={`Aller à la slide ${slideIndex + 1}`}
              onClick={() => goToDot(slideIndex)}
              className={cn(
                "h-2.5 rounded-full bg-white/50 transition-all duration-300 hover:bg-white",
                slideIndex === active ? "w-6 bg-white" : "w-2.5"
              )}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}
