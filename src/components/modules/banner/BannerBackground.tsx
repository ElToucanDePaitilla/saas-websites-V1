import { HeroParallaxBackground } from "@/components/modules/hero/HeroParallaxBackground";
import { HeroVideoBackground } from "@/components/modules/hero/HeroVideoBackground";
import { bannerEffectiveVariant } from "@/lib/banner-effects";
import type { CtaBannerContent } from "@/lib/pages";

import { BannerColorBackground } from "./BannerColorBackground";
import { BannerSliderBackground } from "./BannerSliderBackground";

/**
 * ============================================================================
 * FOND DU BANDEAU — aiguillage (Étape 11.27)
 * ----------------------------------------------------------------------------
 * Server Component qui choisit le calque de fond et **réutilise les briques
 * Héro existantes** plutôt que de les réimplémenter :
 *
 *   | Variante   | Calque                                                |
 *   |------------|-------------------------------------------------------|
 *   | `color`    | `BannerColorBackground` (jeton du thème ou couleur)   |
 *   | `parallax` | `HeroParallaxBackground` (+ cadrage vertical)         |
 *   | `slider`   | `BannerSliderBackground` (moteur du Héro, commandes)  |
 *   | `video`    | `HeroVideoBackground` (rôles des médias — révision 11.19) |
 *
 * Le passage par `bannerEffectiveVariant` évite le seul cas dégradé possible :
 * une variante média **sans aucun visuel renseigné** afficherait un cadre noir.
 * Elle retombe alors sur le fond couleur, sans rien modifier au choix du
 * photographe (dès qu'un média est renseigné, le fond média revient).
 * ============================================================================
 */

type BannerBackgroundProps = {
  content: CtaBannerContent;
};

export function BannerBackground({ content }: BannerBackgroundProps) {
  switch (bannerEffectiveVariant(content)) {
    case "slider":
      return (
        <BannerSliderBackground
          slides={content.slides}
          settings={content.settings}
        />
      );
    case "parallax":
      return (
        <HeroParallaxBackground
          media={content.media}
          parallaxSpeed={content.parallaxSpeed}
          focalY={content.focalY}
        />
      );
    case "video":
      return <HeroVideoBackground media={content.video} />;
    case "color":
      return <BannerColorBackground color={content.color} />;
  }
}
