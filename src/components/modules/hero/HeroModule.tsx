import {
  resolveHeroContent,
  resolveHeroParallaxContent,
  resolveHeroSliderContent,
  resolveHeroVideoContent,
  type PageModule,
} from "@/lib/pages";

import { BaseHero } from "./BaseHero";
import { HeroParallaxBackground } from "./HeroParallaxBackground";
import { HeroSlider } from "./HeroSlider";
import { HeroStaticBackground } from "./HeroStaticBackground";
import { HeroVideoBackground } from "./HeroVideoBackground";

/**
 * ============================================================================
 * HERO MODULE — orchestrateur public de la famille « Héro » (Étapes 7.1 & 7.2)
 * ----------------------------------------------------------------------------
 * Server Component. Reçoit un `PageModule` de type `hero`, **normalise** son
 * contenu (`resolveHeroContent` / `resolveHeroSliderContent` : upgrade legacy
 * JSONB + fusion des défauts) puis aiguille le rendu selon `content.variant` :
 *   - `static`  → `BaseHero` + `HeroStaticBackground` (bloc texte centré) ;
 *   - `slider`  → `HeroSlider` (frame client : autoplay, transition, flèches,
 *     puces, swipe tactile).
 * Le bloc texte commun est partagé via `HeroTextBlock` (aucune duplication).
 * ============================================================================
 */

type HeroModuleProps = {
  module: PageModule;
};

export function HeroModule({ module }: HeroModuleProps) {
  const content = module.content.type === "hero" ? module.content : null;
  if (!content) {
    return null;
  }

  // Variante "slider" : frame client multi-slides.
  if (content.variant === "slider") {
    const slider = resolveHeroSliderContent(content);
    if (slider.slides.length === 0) {
      return null;
    }
    return <HeroSlider module={module} content={slider} />;
  }

  // Variante "video" : BaseHero + média vidéo (fallback mobile / poster).
  if (content.variant === "video") {
    const video = resolveHeroVideoContent(content);
    const hasMedia =
      video.media.videoUrl.trim() !== "" ||
      video.media.posterDesktop.url !== "" ||
      video.media.fallbackMobile.url !== "";
    return (
      <BaseHero module={module} content={video} hasImage={hasMedia}>
        <HeroVideoBackground media={video.media} />
      </BaseHero>
    );
  }

  // Variante "parallax" : BaseHero + image en profondeur (figée sur mobile).
  if (content.variant === "parallax") {
    const parallax = resolveHeroParallaxContent(content);
    const hasImage =
      parallax.media.desktop.url !== "" ||
      parallax.media.mobile.url !== "" ||
      Boolean(parallax.media.tablet?.url);
    return (
      <BaseHero module={module} content={parallax} hasImage={hasImage}>
        <HeroParallaxBackground
          media={parallax.media}
          parallaxSpeed={parallax.parallaxSpeed}
          priority={hasImage}
        />
      </BaseHero>
    );
  }

  // Variante "static" (défaut / legacy) : image de fond + BaseHero.
  const hero = resolveHeroContent(content);
  const hasImage =
    hero.media.desktop.url !== "" ||
    hero.media.mobile.url !== "" ||
    Boolean(hero.media.tablet?.url);

  return (
    <BaseHero module={module} content={hero} hasImage={hasImage}>
      <HeroStaticBackground media={hero.media} priority={hasImage} />
    </BaseHero>
  );
}
