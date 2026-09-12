import { NavLink } from "@/components/common/NavLink";
import { Button } from "@/components/ui/button";
import type {
  FontWeightClass,
  HeroCtaStyle,
  HeroTextTone,
} from "@/lib/pages";
import { cn } from "@/lib/utils";

/**
 * ============================================================================
 * HERO TEXT BLOCK — bloc texte/CTA partagé de la rubrique Héro (7.1 & 7.2)
 * ----------------------------------------------------------------------------
 * Composant présentational « écrit une seule fois » :
 *   - titre principal `<h1>` (géant fluide `clamp()`) ;
 *   - sous-titre `<h2>` ;
 *   - description `<p>` ;
 *   - CTA optionnel (`ctaShow`) avec `ctaStyle` → variante Button ;
 *   - graisses réglables (`weightH1/H2/Text`) ;
 *   - `textTone` → couleur du texte.
 * Réutilisé par :
 *   - `BaseHero` (HeroStatic) : alignement `center` ;
 *   - `HeroSlider` (slide) : alignement `bottom-left` sur desktop (centré sur
 *     mobile via les classes `lg:*`).
 * Zéro duplication de la typographie Héro.
 *
 * Cible du CTA (Étape 11.21-D5) : la même discrimination qu'au CTA de galerie
 * (`CTAButton`) — URL absolue en nouvel onglet, protocole d'action en même
 * onglet, **destination interne/ancre via `NavLink`** (défilement lissé avec
 * compensation du Header fixe). Sans cela, un CTA de Héro pointant une section
 * sautait sous la barre de navigation.
 * ============================================================================
 */

export type HeroTextAlign = "center" | "bottom-left";

type HeroTextBlockProps = {
  titleH1: string;
  subtitleH2: string;
  descriptionText: string;
  textTone: HeroTextTone;
  weightH1: FontWeightClass;
  weightH2: FontWeightClass;
  weightText: FontWeightClass;
  ctaShow: boolean;
  ctaLabel: string;
  ctaHref: string;
  ctaStyle: HeroCtaStyle;
  /** "center" (static / mobile) | "bottom-left" (desktop du slider). */
  align?: HeroTextAlign;
  /**
   * Balise du titre principal (Étape 11.27) : `h1` par défaut — c'est le Héro,
   * qui porte le titre de la page. Un **séparateur** inséré au milieu du contenu
   * passe `h2` : deux `h1` concurrents casseraient la hiérarchie du document
   * (SEO et lecteurs d'écran).
   */
  titleTag?: "h1" | "h2";
  className?: string;
};

/** Mappe un style de CTA Héro vers une variante du composant Button shadcn. */
function heroCtaButtonVariant(
  style: HeroCtaStyle
): "default" | "secondary" | "outline" {
  switch (style) {
    case "primary":
      return "default";
    case "secondary":
      return "secondary";
    case "outline":
      return "outline";
  }
}

export function HeroTextBlock({
  titleH1,
  subtitleH2,
  descriptionText,
  textTone,
  weightH1,
  weightH2,
  weightText,
  ctaShow,
  ctaLabel,
  ctaHref,
  ctaStyle,
  align = "center",
  titleTag = "h1",
  className,
}: HeroTextBlockProps) {
  const TitleTag = titleTag;
  const headingClass =
    textTone === "light" ? "text-white" : "text-foreground";
  const mutedClass =
    textTone === "light" ? "text-white/85" : "text-foreground/70";
  const bottomLeft = align === "bottom-left";

  const showCta =
    ctaShow &&
    ctaLabel.trim() !== "" &&
    ctaHref.trim() !== "";

  // Même discrimination que `CTAButton` (cf. en-tête) : un seul endroit décide
  // de la nature du lien, le rendu public reste cohérent entre les modules.
  const isAbsoluteUrl = /^https?:\/\//i.test(ctaHref.trim());
  const isActionProtocol = /^(mailto|tel):/i.test(ctaHref.trim());

  return (
    <div
      className={cn(
        "flex w-full flex-col",
        // Bottom-left : aligné à gauche sur grand écran, centré en mobile.
        bottomLeft
          ? "items-center text-center lg:items-start lg:text-left"
          : "items-center text-center",
        className
      )}
    >
      <TitleTag
        className={cn(
          "text-balance text-[clamp(2.4rem,7vw,5rem)] leading-[1.06] tracking-wide",
          weightH1,
          headingClass
        )}
      >
        {titleH1}
      </TitleTag>

      {subtitleH2.trim() !== "" ? (
        <h2
          className={cn(
            "mt-4 text-balance text-[clamp(1.25rem,2.8vw,1.75rem)] tracking-wide",
            weightH2,
            headingClass
          )}
        >
          {subtitleH2}
        </h2>
      ) : null}

      {descriptionText.trim() !== "" ? (
        <p
          className={cn(
            "mt-5 max-w-2xl text-base leading-relaxed sm:text-lg",
            weightText,
            mutedClass
          )}
        >
          {descriptionText}
        </p>
      ) : null}

      {showCta ? (
        <div className="mt-8">
          <Button asChild size="lg" variant={heroCtaButtonVariant(ctaStyle)}>
            {isAbsoluteUrl ? (
              <a href={ctaHref} target="_blank" rel="noopener noreferrer">
                {ctaLabel}
              </a>
            ) : isActionProtocol ? (
              <a href={ctaHref}>{ctaLabel}</a>
            ) : (
              <NavLink href={ctaHref}>{ctaLabel}</NavLink>
            )}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
