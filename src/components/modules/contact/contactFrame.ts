import type { CSSProperties } from "react";

import type { ContactFrameSettings } from "@/lib/pages";

/**
 * ============================================================================
 * CONTACT — CADRE DES CONTENEURS 2 ET 3 (Étape 14.1.c)
 * ----------------------------------------------------------------------------
 * Le cadre est un réglage **par module** (`content.style.frame`) : le composant
 * le traduit en **variables CSS** posées en style inline, et `globals.css`
 * garde la règle et ses replis — exactement l'idiome des cartes
 * (`CardItem.tsx` / `--cards-body-radius`).
 *
 * Pourquoi des variables plutôt que des propriétés directes ? Parce que la
 * feuille de styles reste alors la source de la géométrie : les replis
 * (`--contact-frame-border-width, 1px`) et le commentaire qui explique la
 * mécanique vivent au même endroit, et poser un second cadre (le formulaire)
 * revient à réutiliser la même classe.
 *
 * `0` est une valeur **légitime** : elle veut dire « sans cadre », pas
 * « réglage absent ». Le repli `1px` de la feuille ne s'applique donc qu'à une
 * variable non posée, jamais à un zéro explicite.
 * ============================================================================
 */

/** Variables CSS personnalisées posées en style inline (même idiome que CardItem). */
type CSSVars = CSSProperties & Record<`--${string}`, string>;

/** Traduit le cadre du module en variables CSS consommées par `globals.css`. */
export function contactFrameCssVars(frame: ContactFrameSettings): CSSVars {
  return {
    "--contact-frame-border-width": `${frame.borderWidth}px`,
    "--contact-frame-color": `var(--${frame.borderColorToken})`,
    "--contact-frame-radius": `${frame.borderRadius}px`,
  };
}
