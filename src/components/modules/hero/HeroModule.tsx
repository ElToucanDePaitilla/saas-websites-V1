import {
  resolveHeroContent,
  resolveHeroCurtainContent,
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
 * contenu (le résolveur de la variante : upgrade legacy JSONB + fusion des
 * défauts) puis aiguille le rendu selon `content.variant` :
 *   - `static`   → `BaseHero` + `HeroStaticBackground` (bloc texte centré) ;
 *   - `slider`   → `HeroSlider` (frame client : autoplay, transition, flèches,
 *     puces, swipe tactile) ;
 *   - `video`    → `BaseHero` + `HeroVideoBackground` (repli mobile / poster) ;
 *   - `parallax` → `BaseHero` + `HeroParallaxBackground` (profondeur au scroll,
 *     figée sur mobile) ;
 *   - `curtain`  → `BaseHero` épinglé (`.hero-curtain`) que la section suivante
 *     recouvre au défilement, avec le fond `<picture>` statique.
 * Le bloc texte commun est partagé via `HeroTextBlock` (aucune duplication).
 *
 * Le **niveau du titre** (`titleTag`) ne se décide pas ici et vaut pour **une
 * page entière** : la page n'accorde le `h1` qu'à un seul module — le Héro de
 * tête, si son titre est renseigné — et transmet `h2` à tous les autres (voir
 * `PublicModulesList`). Un Héro reste donc un titre de page quand il ouvre la
 * page, et un simple séparateur partout ailleurs.
 * ============================================================================
 */

type HeroModuleProps = {
  module: PageModule;
  /**
   * Niveau du titre porté par ce Héro. Accordé par la page à **un seul** module
   * ([`PublicModulesList`](../PublicModules.tsx)) : `h1` pour le Héro de tête qui
   * porte le titre de la page, `h2` partout ailleurs (Héro séparateur, Héro
   * ajouté en fin de page). Défaut `h1` : un Héro rendu seul reste le titre.
   */
  titleTag?: "h1" | "h2";
};

export function HeroModule({ module, titleTag = "h1" }: HeroModuleProps) {
  const content = module.content.type === "hero" ? module.content : null;
  if (!content) {
    return null;
  }

  // Variante "slider" : frame client multi-slides. Le carrousel ne garde le
  // titre qu'il reçoit que pour la diapositive **affichée** (cf. HeroSlider).
  if (content.variant === "slider") {
    const slider = resolveHeroSliderContent(content);
    if (slider.slides.length === 0) {
      return null;
    }
    return <HeroSlider module={module} content={slider} titleTag={titleTag} />;
  }

  // Variante "video" : BaseHero + média vidéo (fallback mobile / poster).
  if (content.variant === "video") {
    const video = resolveHeroVideoContent(content);
    const hasMedia =
      video.media.videoUrl.trim() !== "" ||
      video.media.posterDesktop.url !== "" ||
      video.media.fallbackMobile.url !== "";
    return (
      <BaseHero
        module={module}
        content={video}
        hasImage={hasMedia}
        titleTag={titleTag}
      >
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
      <BaseHero
        module={module}
        content={parallax}
        hasImage={hasImage}
        titleTag={titleTag}
      >
        <HeroParallaxBackground
          media={parallax.media}
          parallaxSpeed={parallax.parallaxSpeed}
          priority={hasImage}
        />
      </BaseHero>
    );
  }

  // Variante "curtain" : BaseHero épinglé (`.hero-curtain`) que la section
  // suivante recouvre — même image art-direction `<picture>` que le statique.
  if (content.variant === "curtain") {
    const curtain = resolveHeroCurtainContent(content);
    const hasImage =
      curtain.media.desktop.url !== "" ||
      curtain.media.mobile.url !== "" ||
      Boolean(curtain.media.tablet?.url);
    return (
      <BaseHero
        module={module}
        content={curtain}
        hasImage={hasImage}
        className="hero-curtain"
        titleTag={titleTag}
      >
        <HeroStaticBackground media={curtain.media} priority={hasImage} />
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
    <BaseHero
      module={module}
      content={hero}
      hasImage={hasImage}
      titleTag={titleTag}
    >
      <HeroStaticBackground media={hero.media} priority={hasImage} />
    </BaseHero>
  );
}
