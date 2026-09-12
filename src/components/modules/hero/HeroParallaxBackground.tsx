"use client";

import * as React from "react";

import {
  PARALLAX_FACTOR,
  PARALLAX_OVERSCAN,
  type HeroStaticMedia,
  type ParallaxSpeed,
} from "@/lib/pages";

import { HeroStaticBackground } from "./HeroStaticBackground";

/**
 * ============================================================================
 * HERO PARALLAX BACKGROUND — couche image « profondeur » (Étape 7.4)
 * ----------------------------------------------------------------------------
 * Client Component branché en `children` de `BaseHero` :
 *   - Desktop (≥ 1024px) : image surdimensionnée translatée en Y via
 *     `transform: translate3d` (GPU) pilotée au scroll dans un
 *     `requestAnimationFrame` (amplitude `PARALLAX_FACTOR[speed]`), rendu
 *     interrompu dès que la section sort du viewport (IntersectionObserver) ;
 *   - Mobile (< 1024px) / reduced-motion : **aucun** transform animé → image
 *     fixe `<picture>` `object-cover` (perf GPU mobile 60 FPS).
 * ============================================================================
 */

const DESKTOP_MEDIA = "(min-width: 1024px)";
const REDUCED_MEDIA = "(prefers-reduced-motion: reduce)";

type HeroParallaxBackgroundProps = {
  media: HeroStaticMedia;
  parallaxSpeed: ParallaxSpeed;
  priority?: boolean;
  /**
   * Cadrage **vertical** de la photo, en % (Étape 11.27) : `0` = haut de
   * l'image, `100` = bas. Appliqué à l'image animée **et** à son repli mobile
   * (sans quoi le cadrage changerait d'un écran à l'autre). Omis, le rendu
   * historique est strictement conservé.
   */
  focalY?: number;
};

export function HeroParallaxBackground({
  media,
  parallaxSpeed,
  priority = false,
  focalY,
}: HeroParallaxBackgroundProps) {
  const [isDesktop, setIsDesktop] = React.useState(true);
  const [reduced, setReduced] = React.useState(false);
  const imageRef = React.useRef<HTMLImageElement>(null);
  const sectionRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const mqDesktop = window.matchMedia(DESKTOP_MEDIA);
    const mqReduced = window.matchMedia(REDUCED_MEDIA);
    const apply = () => {
      setIsDesktop(mqDesktop.matches);
      setReduced(mqReduced.matches);
    };
    const frame = requestAnimationFrame(apply);
    mqDesktop.addEventListener("change", apply);
    mqReduced.addEventListener("change", apply);
    return () => {
      cancelAnimationFrame(frame);
      mqDesktop.removeEventListener("change", apply);
      mqReduced.removeEventListener("change", apply);
    };
  }, []);

  const enabled = isDesktop && !reduced && media.desktop.url !== "";

  // Overscan (fraction de hauteur) : jeu vertical laissé autour de l'image ET
  // plafond du déplacement — évolue selon l'intensité (plus elle est forte,
  // plus l'image est surdimensionnée et plus elle peut « voyager »).
  const overscan = PARALLAX_OVERSCAN[parallaxSpeed];

  // Boucle d'animation parallaxe — pilotée par rAF (aucun setState au scroll).
  React.useEffect(() => {
    if (!enabled) {
      return;
    }
    const section = sectionRef.current;
    const image = imageRef.current;
    if (!section || !image) {
      return;
    }
    const factor = PARALLAX_FACTOR[parallaxSpeed];
    let frame = 0;
    let visible = false;

    const update = () => {
      frame = 0;
      const rect = section.getBoundingClientRect();
      const viewportCenter = window.innerHeight / 2;
      const sectionCenter = rect.top + rect.height / 2;
      // Distance (px) du centre de la section au centre de l'écran, pondérée.
      let offset = (sectionCenter - viewportCenter) * factor;
      const max = rect.height * overscan;
      offset = Math.max(-max, Math.min(max, offset));
      image.style.transform = `translate3d(0, ${offset}px, 0)`;
    };

    const onScroll = () => {
      // rAF-throttle : une seule mise à jour par frame, uniquement si la
      // section est visible (sinon l'IntersectionObserver la relancera).
      if (visible && frame === 0) {
        frame = requestAnimationFrame(update);
      }
    };

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          visible = entry.isIntersecting;
          if (visible && frame === 0) {
            frame = requestAnimationFrame(update);
          }
        }
      },
      { threshold: 0.01 }
    );
    observer.observe(section);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    update();
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame !== 0) {
        cancelAnimationFrame(frame);
      }
    };
  }, [enabled, parallaxSpeed, overscan]);

  // Mobile / reduced-motion : image fixe (aucune animation).
  if (!enabled) {
    return (
      <div className="absolute inset-0" aria-hidden="true">
        <HeroStaticBackground
          media={media}
          priority={priority}
          focalY={focalY}
        />
      </div>
    );
  }

  return (
    <div
      ref={sectionRef}
      aria-hidden="true"
      className="absolute inset-0 overflow-hidden bg-neutral-900"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={imageRef}
        src={media.desktop.url}
        alt={media.desktop.alt}
        // Overscan proportionnel à l'intensité : l'image dépasse d'autant plus
        // du cadre (haut + bas) que l'effet est fort, offrant la course utile.
        style={{
          top: `${-overscan * 100}%`,
          height: `${(1 + overscan * 2) * 100}%`,
          objectPosition: focalY === undefined ? undefined : `50% ${focalY}%`,
        }}
        className="absolute left-0 w-full object-cover will-change-transform"
        loading={priority ? "eager" : "lazy"}
        decoding="async"
      />
    </div>
  );
}
