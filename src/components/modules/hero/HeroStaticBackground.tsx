import type { HeroStaticMedia } from "@/lib/pages";

/**
 * ============================================================================
 * HERO STATIC BACKGROUND — fond art-direction responsive (Étape 7.1)
 * ----------------------------------------------------------------------------
 * Server Component. Rend l'image de fond du Hero STATIC via la balise native
 * `<picture>` (l'optimisation `next/image` ne produit pas `<picture>`) :
 *   - `<source media="(min-width: 1024px)">`  → desktop 16:9 ;
 *   - `<source media="(min-width: 768px)">`   → tablette 4:3 si renseignée,
 *     sinon **repli automatique sur l'image desktop** (spéc. fiche) ;
 *   - `<img>` portrait mobile 9:16 (repli mobile-first, < 768px).
 * Le texte alternatif SEO est porté par la balise `<img>` (seule balise
 * « image » indexée par le moteur).
 * Si aucune source n'est renseignée, un fond neutre sombre est affiché (le
 * texte clair du Héro reste lisible).
 * ============================================================================
 */

type HeroStaticBackgroundProps = {
  media: HeroStaticMedia;
  /** true quand le Héro est l'image LCP de la page (fetchpriority="high"). */
  priority?: boolean;
};

export function HeroStaticBackground({
  media,
  priority = false,
}: HeroStaticBackgroundProps) {
  const desktopUrl = media.desktop.url;
  const mobileUrl = media.mobile.url;
  const tabletUrl = media.tablet?.url ?? "";
  const hasDesktop = desktopUrl !== "";
  const hasTablet = tabletUrl !== "";
  const hasMobile = mobileUrl !== "";
  const hasImage = hasDesktop || hasMobile || hasTablet;

  if (!hasImage) {
    return (
      <div aria-hidden="true" className="absolute inset-0 bg-neutral-900" />
    );
  }

  // Alt du <img> : priorité au format principal (desktop), repli mobile.
  const imgAlt =
    media.desktop.alt || media.mobile.alt || "Image de fond du Héro";
  const fallbackUrl = hasMobile ? mobileUrl : desktopUrl;

  return (
    <div aria-hidden="true" className="absolute inset-0">
      <picture className="absolute inset-0">
        {hasDesktop ? (
          <source media="(min-width: 1024px)" srcSet={desktopUrl} />
        ) : null}
        {/* Tablette 4:3 — repli auto sur desktop si non renseignée. */}
        {hasTablet ? (
          <source media="(min-width: 768px)" srcSet={tabletUrl} />
        ) : hasDesktop ? (
          <source media="(min-width: 768px)" srcSet={desktopUrl} />
        ) : null}
        <img
          src={fallbackUrl}
          alt={imgAlt}
          className="absolute inset-0 h-full w-full object-cover"
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          fetchPriority={priority ? "high" : "auto"}
        />
      </picture>
    </div>
  );
}
