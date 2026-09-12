import type { BannerColorSettings, CtaBannerContent } from "@/lib/pages";

/**
 * ============================================================================
 * BANDEAU MESSAGE / CTA — helpers purs de rendu (Étape 11.27)
 * ----------------------------------------------------------------------------
 * Même rôle que `gallery-effects.ts` : ce fichier ne contient **que** du calcul
 * testable, sans React ni DOM, partagé par le rendu public (Server Components)
 * et par l'éditeur Back-Office (Client Component). C'est ce qui évite de
 * dupliquer la règle de repli entre les deux, où elle aurait divergé.
 * ============================================================================
 */

/**
 * Valeur CSS d'un fond couleur.
 *
 * Deux sources, deux comportements volontairement différents :
 *   - `theme`  → `var(--accent-color)` : la couleur **suit le thème** (clair /
 *     sombre, futurs presets) sans qu'aucune valeur ne soit figée en base ;
 *   - `custom` → la valeur hexadécimale choisie (pastille ou pipette).
 */
export function bannerColorCssValue(color: BannerColorSettings): string {
  return color.source === "theme" ? "var(--" + color.token + ")" : color.value;
}

/**
 * true si le fond choisi s'appuie réellement sur un média **renseigné**.
 *
 * Sert à deux décisions identiques côté public et côté éditeur :
 *   - activer l'overlay d'assombrissement (inutile sur un aplat de couleur) ;
 *   - retomber sur le fond couleur quand aucun média n'est disponible, plutôt
 *     que d'afficher un cadre noir (voir `bannerEffectiveVariant`).
 */
export function bannerHasMediaBackground(content: CtaBannerContent): boolean {
  switch (content.variant) {
    case "parallax":
      return (
        content.media.desktop.url !== "" ||
        content.media.mobile.url !== "" ||
        Boolean(content.media.tablet?.url)
      );
    case "slider":
      return content.slides.some(
        (slide) =>
          slide.media.desktop.url !== "" || slide.media.mobile.url !== ""
      );
    case "video":
      return (
        content.video.videoUrl.trim() !== "" ||
        content.video.posterDesktop.url !== "" ||
        content.video.fallbackMobile.url !== ""
      );
    case "color":
      return false;
  }
}

/**
 * Variante de fond **réellement rendue** : la variante choisie, sauf si elle
 * dépend d'un média absent — le fond couleur prend alors le relais. Le
 * photographe conserve son choix (rien n'est effacé), seul l'affichage s'adapte.
 */
export function bannerEffectiveVariant(
  content: CtaBannerContent
): CtaBannerContent["variant"] {
  if (content.variant === "color") {
    return "color";
  }
  return bannerHasMediaBackground(content) ? content.variant : "color";
}
