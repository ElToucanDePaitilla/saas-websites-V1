import { Button } from "@/components/ui/button";
import type { GalleryCtaSettings } from "@/lib/pages";

/**
 * ============================================================================
 * CTA DE GALERIE — bouton de pied réutilisable (Phase 11)
 * ----------------------------------------------------------------------------
 * Affiche un bouton d'appel à l'action sous une galerie, selon les **conditions
 * habituelles de l'application** (identiques à la rubrique Héro) :
 *   `show === true` ET `label` non vide ET `href` non vide.
 * Styles : primary (accent), secondary, outline. Les liens externes sont
 * ouverts dans un nouvel onglet avec `rel="noopener noreferrer"`.
 * Server Component (aucun état).
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
  const isExternal = /^https?:\/\//i.test(href);

  return (
    <div className={className}>
      <Button asChild size="lg" variant={variant}>
        {isExternal ? (
          <a href={href} target="_blank" rel="noopener noreferrer">
            {label}
          </a>
        ) : (
          <a href={href}>{label}</a>
        )}
      </Button>
    </div>
  );
}
