import type { ReactNode } from "react";

import {
  HERO_OVERLAY_OPACITY,
  type HeroBaseShared,
  type PageModule,
} from "@/lib/pages";
import { cn } from "@/lib/utils";

import { HeroTextBlock } from "./HeroTextBlock";
import { RevealHero } from "./RevealHero";

/**
 * ============================================================================
 * BASE HERO — structure commune de la rubrique Héro (Étape 7.1)
 * ----------------------------------------------------------------------------
 * Server Component « présentational » : consomme UNIQUEMENT la surface partagée
 * `HeroBaseShared` (overlay, textes, graisses, tone, CTA, ancre, animation) et
 * reçoit le calque de fond en `children` (injecté par la variante). La
 * typographie commune (h1 géant/h2/p + CTA) est déléguée à `HeroTextBlock`
 * (réutilisé par le HeroSlider 7.2 — aucune duplication).
 *
 * Rendu :
 *   - section fluide (aucune largeur fixe en px), paddings de sécurité px-4 ;
 *   - overlay d'assombrissement `overlayLevel` (noir si tone light, blanc si
 *     tone dark — il garantit le contraste) ;
 *   - bloc textes/CTA centré (`HeroTextBlock` alignement `center`) ;
 *   - animation d'entrée branchée sur `module.animation` (source unique — D-3).
 * ============================================================================
 */

type BaseHeroProps = {
  /** Ancre & animation d'entrée (champs scalaires partagés du module). */
  module: Pick<PageModule, "anchorId" | "animation">;
  /**
   * Surface texte/CTA rendue. Seuls les champs de `HeroBaseShared` sont lus : la
   * **variante** en est exclue, ce qui permet au « Bandeau message ou d'appel à
   * l'action » (Étape 11.27), dont la variante désigne le type de fond, de
   * réutiliser ce cadre sans conversion.
   */
  content: Omit<HeroBaseShared, "variant">;
  /** true si un fond image est réellement présent (sinon overlay désactivé). */
  hasImage: boolean;
  /**
   * Classe de hauteur de la section. Omise, le Héro occupe la hauteur d'écran
   * disponible sous le Header ; le bandeau transmet la sienne (`banner-h-*`).
   */
  minHeightClass?: string;
  /**
   * Remonte la section sous le Header fixe (`-mt-4`) : vrai pour un Héro placé
   * en tête de page, **faux** pour un séparateur inséré au milieu du contenu.
   */
  pullUp?: boolean;
  /**
   * Balise du titre du message : `h1` par défaut (le Héro porte le titre de la
   * page), `h2` pour un **séparateur** inséré au milieu du contenu — deux `h1`
   * concurrents casseraient la hiérarchie du document.
   */
  titleTag?: "h1" | "h2";
  /** Calque de fond injecté par la variante (ex. HeroStaticBackground). */
  children: ReactNode;
};

export function BaseHero({
  module,
  content,
  hasImage,
  minHeightClass,
  pullUp = true,
  titleTag = "h1",
  children,
}: BaseHeroProps) {
  const overlayOpacity = hasImage
    ? HERO_OVERLAY_OPACITY[content.overlayLevel]
    : 0;
  const overlayRgb = content.textTone === "dark" ? "255,255,255" : "0,0,0";

  return (
    <section
      id={module.anchorId}
      className={cn(
        "relative flex w-full items-center justify-center overflow-hidden bg-background px-4 sm:px-6",
        pullUp && "-mt-4",
        minHeightClass ??
          "min-h-[calc(100svh-4rem)] supports-[height:100dvh]:min-h-[calc(100dvh-4rem)]"
      )}
    >
      {/* Calque de fond (variante) */}
      {children}

      {/* Overlay d'assombrissement (contraste / lisibilité) */}
      {overlayOpacity > 0 ? (
        <div
          aria-hidden="true"
          className="absolute inset-0 z-[2]"
          style={{
            backgroundColor: `rgba(${overlayRgb}, ${overlayOpacity})`,
          }}
        />
      ) : null}

      {/* Bloc textes + CTA (commun) — animation d'entrée module.animation */}
      <div className="relative z-10 mx-auto flex w-full max-w-3xl flex-col items-center text-center px-2">
        <RevealHero animation={module.animation}>
          <HeroTextBlock
            titleH1={content.titleH1}
            subtitleH2={content.subtitleH2}
            descriptionText={content.descriptionText}
            textTone={content.textTone}
            weightH1={content.weightH1}
            weightH2={content.weightH2}
            weightText={content.weightText}
            ctaShow={content.ctaShow}
            ctaLabel={content.ctaLabel}
            ctaHref={content.ctaHref}
            ctaStyle={content.ctaStyle}
            align="center"
            titleTag={titleTag}
          />
        </RevealHero>
      </div>
    </section>
  );
}
