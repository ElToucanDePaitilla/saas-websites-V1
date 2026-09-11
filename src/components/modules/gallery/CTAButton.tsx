import { NavLink } from "@/components/common/NavLink";
import { Button } from "@/components/ui/button";
import type { GalleryCtaSettings } from "@/lib/pages";

/**
 * ============================================================================
 * CTA DE GALERIE — bouton de pied réutilisable (Phase 11)
 * ----------------------------------------------------------------------------
 * Affiche un bouton d'appel à l'action sous une galerie, selon les **conditions
 * habituelles de l'application** (identiques à la rubrique Héro) :
 *   `show === true` ET `label` non vide ET `href` non vide.
 * Styles : primary (accent), secondary, outline.
 *
 * Cibles (Étape 11.2) :
 *   - URL absolue (`https://…`) → `<a target="_blank" rel="noopener noreferrer">` ;
 *   - protocole d'action (`mailto:`, `tel:`) → `<a>` simple (même onglet) ;
 *   - destination interne (`/page`, `#ancre`, `/page#ancre`) → **`NavLink`**, qui
 *     apporte le défilement lissé **avec compensation du Header fixe** — sans lui,
 *     un lien vers une ancre sautait sous la barre de navigation.
 * Server Component (aucun état) : `NavLink` étant un Client Component, il forme
 * une frontière client locale, sans coût pour le reste de la page.
 * ============================================================================
 */

type CTAButtonProps = {
  cta: GalleryCtaSettings;
  className?: string;
};

export function CTAButton({ cta, className }: CTAButtonProps) {
  const label = cta.label.trim();
  const href = cta.href.trim();
  if (!cta.show || label === "" || href === "") {
    return null;
  }

  const variant =
    cta.style === "secondary"
      ? "secondary"
      : cta.style === "outline"
        ? "outline"
        : "default";
  const isAbsoluteUrl = /^https?:\/\//i.test(href);
  const isActionProtocol = /^(mailto|tel):/i.test(href);

  return (
    <div className={className}>
      <Button asChild size="lg" variant={variant}>
        {isAbsoluteUrl ? (
          <a href={href} target="_blank" rel="noopener noreferrer">
            {label}
          </a>
        ) : isActionProtocol ? (
          <a href={href}>{label}</a>
        ) : (
          <NavLink href={href}>{label}</NavLink>
        )}
      </Button>
    </div>
  );
}
