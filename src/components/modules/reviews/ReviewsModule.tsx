import { RevealHero } from "@/components/modules/hero/RevealHero";
import { resolveReviewsContent, type PageModule } from "@/lib/pages";

import { ReviewsCarousel } from "./ReviewsCarousel";

/**
 * ============================================================================
 * MODULE « AVIS CLIENTS » — rendu public (Étape 14.4)
 * ----------------------------------------------------------------------------
 * Server Component : le contenu JSONB est normalisé (`resolveReviewsContent`)
 * puis confié au carrousel client, qui ne reçoit que des props. Une liste
 * d'avis vide fait disparaître la section — comme la galerie et le ruban, on
 * ne rend pas de bloc de réassurance sans avis.
 *
 * `heading` est optionnel : vide, aucun `h2` n'est posé. Le module ne porte
 * jamais de `h1` (l'unique titre de niveau 1 appartient à la page, voir
 * `PublicModulesList`).
 *
 * **Bande pleine largeur** : le fond et les filets haut/bas couvrent toute la
 * largeur de l'écran ; seuls les contenus (titre et grille) sont recentrés et
 * bornés pour rester lisibles sur un grand écran.
 * ============================================================================
 */
export function ReviewsModule({ module }: { module: PageModule }) {
  const raw = module.content.type === "reviews" ? module.content : null;
  if (raw === null) {
    return null;
  }

  const content = resolveReviewsContent(raw);
  if (content.reviews.length === 0) {
    return null;
  }

  return (
    <section
      id={module.anchorId}
      className="w-full border-y border-[var(--border-color)] bg-[var(--surface-color-soft)]"
    >
      <RevealHero animation={module.animation}>
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          {content.heading.trim() !== "" ? (
            <h2 className="module-h2 mb-10 text-center">{content.heading}</h2>
          ) : null}
          <ReviewsCarousel
            heading={content.heading}
            provider={content.provider}
            summaryWord={content.summaryWord}
            overallScore={content.overallScore}
            totalReviewsText={content.totalReviewsText}
            reviews={content.reviews}
            autoplaySpeedMs={content.autoplaySpeedMs}
            pauseOnHover={content.pauseOnHover}
          />
        </div>
      </RevealHero>
    </section>
  );
}
