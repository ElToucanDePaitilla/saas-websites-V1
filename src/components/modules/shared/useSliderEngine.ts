"use client";

import * as React from "react";

/**
 * ============================================================================
 * MOTEUR DE CARROUSEL — machine à états partagée (Étape 11.27)
 * ----------------------------------------------------------------------------
 * Extraction **à l'identique** du moteur du Héro (`HeroSlider`, Étape 7.2) pour
 * que le « Bandeau message ou d'appel à l'action » réutilise le même
 * comportement au lieu de le réécrire :
 *
 *   - transition `slide` : **piste fluide en boucle transparente** (un clone du
 *     premier élément est ajouté en fin ; au retour sur le clone, la position
 *     est ramenée à la vraie première position SANS transition — visuellement
 *     identique, donc aucun saut brutal en fin de cycle) ;
 *   - transition `fade` : éléments superposés en opacité croisée (GPU) ;
 *   - autoplay (vitesse réglable) ; pause **uniquement** au focus clavier et
 *     pendant le geste (pas au simple survol → démarrage stable) ;
 *   - **swipe tactile** (pointer events, `touch-action: pan-y` côté conteneur) ;
 *   - `prefers-reduced-motion` : transitions coupées et autoplay arrêté.
 *
 * Vit dans `components/modules/shared/` et non dans `hero/` : le `.kilorules`
 * interdit les importations croisées entre modules. `shared/` est neutre, donc
 * consommable par la famille Héro **et** par la famille Bandeau.
 *
 * Le moteur ne rend **rien** : il ne connaît ni image, ni texte (le Héro affiche
 * des diapositives complètes, le bandeau de simples calques photo). Les vues
 * fournissent leur propre rendu et posent `SliderControls` pour les commandes.
 * ============================================================================
 */

/** Durée de la transition — doit suivre la classe `duration-700` des vues. */
export const SLIDER_TRANSITION_MS = 700;

const REDUCED_MEDIA = "(prefers-reduced-motion: reduce)";

/** Réglages consommés par le moteur (sous-ensemble de `HeroSliderSettings`). */
export type SliderEngineSettings = {
  /** Défilement automatique. */
  autoplay: boolean;
  /** Intervalle entre deux bascules (ms). */
  autoplaySpeedMs: number;
  /** Transition entre les éléments : glissement ou fondu. */
  transition: "slide" | "fade";
};

/** État et commandes exposés par `useSliderEngine`. */
export type SliderEngine = {
  /** Nombre d'éléments. */
  count: number;
  /** true si plusieurs éléments (autoplay et commandes n'ont alors de sens). */
  hasMany: boolean;
  /** Position courante (index de piste, ou compteur de fondu). */
  pos: number;
  /** Position logiquement active — puces, `aria` et flèches s'y réfèrent. */
  active: number;
  /** true = piste glissante ; false = superposition / fondu (ou reduced-motion). */
  trackMode: boolean;
  /** Index du clone de boucle (`== count`) : à répliquer dans la piste. */
  trackLast: number;
  /** true tant que l'animation de transition est autorisée. */
  smooth: boolean;
  /** true pendant un geste ou un focus clavier (autoplay suspendu). */
  paused: boolean;
  /** true si l'utilisateur préfère limiter les animations. */
  reduced: boolean;
  goNext: () => void;
  goPrev: () => void;
  goTo: (index: number) => void;
  /** À poser sur le conteneur, avec `touch-action: pan-y`. */
  onPointerDown: (event: React.PointerEvent) => void;
  onPointerUp: (event: React.PointerEvent) => void;
  onPointerCancel: () => void;
  onFocus: () => void;
  onBlur: () => void;
};

/** true si l'utilisateur demande des animations réduites (accessibilité). */
function prefersReducedMotion(): boolean {
  if (
    typeof window === "undefined" ||
    typeof window.matchMedia !== "function"
  ) {
    return false;
  }
  return window.matchMedia(REDUCED_MEDIA).matches;
}

/**
 * Machine à états du carrousel.
 *
 * `count` est le nombre d'éléments réels ; la piste glissante en affiche un de
 * plus (le clone de boucle), d'où `trackLast`.
 */
export function useSliderEngine(
  count: number,
  settings: SliderEngineSettings
): SliderEngine {
  const hasMany = count > 1;

  const [reduced, setReduced] = React.useState(false);
  const [pos, setPos] = React.useState(0); // position (piste ou superposition)
  const [smooth, setSmooth] = React.useState(true); // autorise l'animation
  const [paused, setPaused] = React.useState(false);

  const pointerStartX = React.useRef<number | null>(null);

  const trackMode = settings.transition === "slide" && hasMany && !reduced;
  const trackLast = count; // index du clone (== élément 0)

  // Élément logiquement actif (pour aria / puces / flèches).
  const active = trackMode
    ? pos >= trackLast
      ? 0
      : pos
    : hasMany
      ? pos % count
      : 0;

  // Détection reduced-motion différée (aucun setState synchrone dans l'effet).
  React.useEffect(() => {
    const frame = requestAnimationFrame(() => setReduced(prefersReducedMotion()));
    return () => cancelAnimationFrame(frame);
  }, []);

  /** Autoplay — off si : réglage off, reduced-motion, pause, élément unique. */
  React.useEffect(() => {
    if (!settings.autoplay || reduced || paused || !hasMany) {
      return;
    }
    const id = window.setInterval(() => {
      setPos((current) =>
        trackMode ? Math.min(current + 1, trackLast) : current + 1
      );
    }, settings.autoplaySpeedMs);
    return () => window.clearInterval(id);
  }, [
    settings.autoplay,
    settings.autoplaySpeedMs,
    reduced,
    paused,
    hasMany,
    trackMode,
    trackLast,
  ]);

  /**
   * Boucle transparente (piste) : arrivé sur le clone du premier élément, on
   * attend la fin de l'animation puis on ramène la piste sur la vraie première
   * position SANS transition (les deux visuels sont identiques → aucun saut).
   */
  React.useEffect(() => {
    if (!trackMode || pos !== trackLast) {
      return;
    }
    const timer = window.setTimeout(() => {
      setSmooth(false);
      setPos(0);
      requestAnimationFrame(() => requestAnimationFrame(() => setSmooth(true)));
    }, SLIDER_TRANSITION_MS + 40);
    return () => window.clearTimeout(timer);
  }, [pos, trackMode, trackLast]);

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
        return current; // pas de retour en arrière au-delà du premier élément
      }
      return current - 1;
    });
  }

  function goTo(target: number) {
    const targetIndex = Math.max(0, Math.min(target, count - 1));
    if (trackMode) {
      setSmooth(true);
      setPos(targetIndex);
      return;
    }
    setPos((current) => {
      const currentActive = current % count;
      const forward = (targetIndex - currentActive + count) % count;
      return current + forward;
    });
  }

  function onPointerDown(event: React.PointerEvent) {
    if (event.button !== 0) {
      return;
    }
    pointerStartX.current = event.clientX;
    setPaused(true); // pas de bascule pendant le geste
  }

  function onPointerUp(event: React.PointerEvent) {
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

  function onPointerCancel() {
    setPaused(false);
    pointerStartX.current = null;
  }

  return {
    count,
    hasMany,
    pos,
    active,
    trackMode,
    trackLast,
    smooth,
    paused,
    reduced,
    goNext,
    goPrev,
    goTo,
    onPointerDown,
    onPointerUp,
    onPointerCancel,
    onFocus: () => setPaused(true),
    onBlur: () => setPaused(false),
  };
}
