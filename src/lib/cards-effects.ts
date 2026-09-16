/**
 * ============================================================================
 * EFFETS DES CARTES — survol → variables CSS (Étape 13.1)
 * ----------------------------------------------------------------------------
 * Les réglages de survol d'une carte deviennent des **variables CSS** posées sur
 * la carte, que la feuille de styles consomme (voir `globals.css` § Effets de
 * survol). Le détour est le même que pour la galerie et pour les mêmes raisons :
 *
 *   1. un style en ligne ne peut pas décrire un état de `:hover` ;
 *   2. la neutralisation sous `prefers-reduced-motion` reste en un seul endroit ;
 *   3. les valeurs sont **bornées ici** : aucune donnée héritée ne peut produire
 *      un rendu aberrant.
 *
 * Ce fichier est **séparé de `gallery-effects.ts`** à dessein. La carte n'a ni
 * élévation ni parallaxe (une carte non cliquable ne doit pas promettre un
 * clic), et surtout elle ne consomme pas `GalleryLayoutOptions` : elle n'a pas
 * d'effet de finition, ni de lightbox, ni de badge. Réutiliser la fonction de la
 * galerie aurait obligé à fabriquer une mise en page de galerie factice pour en
 * extraire trois valeurs — un objet de trente champs pour trois réglages.
 * ============================================================================
 */

import type { CardsHoverEffects } from "@/lib/pages";

/**
 * Réglages de survol → variables CSS lues par la feuille de styles.
 *
 * Ni `--hv-lift` ni `--hv-parallax` ne sont posées : les règles de `globals.css`
 * les lisent avec un repli (`var(--hv-lift, 0px)`), la carte reste donc
 * strictement immobile — seule la photo s'anime.
 */
export function cardsHoverCssVars(
  hover: CardsHoverEffects
): Record<`--${string}`, string> {
  // Mêmes bornes que le résolveur du domaine : la fonction reste sûre même
  // appelée directement sur un objet construit à la main.
  const boundedZoom = Math.min(Math.max(hover.zoom, 100), 118);

  return {
    // `scale()` attend un facteur, le réglage est un pourcentage lisible.
    "--hv-zoom": String(boundedZoom / 100),
    "--hv-filter": hover.saturate ? "saturate(1.12) contrast(1.04)" : "none",
    "--hv-glow": hover.glow
      ? "0 0 0 2px var(--accent-color-strong), 0 14px 32px -14px var(--accent-color-strong)"
      : "none",
  };
}
