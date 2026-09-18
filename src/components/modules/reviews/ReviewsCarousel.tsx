"use client";

import * as React from "react";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";

import {
  type ReviewItem,
  type ReviewProvider,
  type ReviewsContent,
} from "@/lib/pages";

/**
 * ============================================================================
 * CARROUSEL D'AVIS — composant d'affichage du module « Avis clients » (14.4)
 * ----------------------------------------------------------------------------
 * **Props-only et découplé** : aucun store, aucun import Back-Office. C'est le
 * renderer serveur (`ReviewsModule`) qui lit le JSONB du module, le normalise
 * via `resolveReviewsContent` et lui transmet ses props.
 *
 * Quatre points d'implémentation méritent d'être expliqués :
 *   - **Ids de dégradé SVG via `useId()`** : les étoiles partielles ont besoin
 *     d'un `<linearGradient>` par étoile. Un identifiant aléatoire (le mock
 *     utilisait `Math.random()`) produirait un mismatch d'hydratation ; `useId`
 *     est stable entre serveur et client. Les `:` sont retirés car ils sont
 *     invalides dans une référence `url(#…)`.
 *   - **Autoplay lint-safe** : l'intervalle repart d'un `setState` **fonctionnel**
 *     (jamais d'un index capturé), les deps sont honnêtes et l'identifiant est un
 *     `window.setInterval` (`number`) — le type global `NodeJS.Timeout` n'a rien
 *     à faire dans ce code.
 *   - **Pause** : au survol **et** au focus clavier. Le réglage `pauseOnHover`
 *     gouverne la pause : s'il est faux, les gestionnaires ne posent jamais
 *     l'état, donc l'autoplay reste actif (D4).
 *   - **Cartes hors index toujours montées** (le track ne se démonte pas) : elles
 *     sont `aria-hidden` pour ne pas être relues, mais restent visibles pendant
 *     la transition.
 * ============================================================================
 */

/** Props de rendu — structure identique à `ReviewsContent`, sans le discriminant. */
type ReviewsCarouselProps = Omit<ReviewsContent, "type">;

/** Étoile pleine, vide ou partiellement remplie (dégradé à deux arrêts). */
function StarIcon({ id, percent }: { id: string; percent: number }) {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
      <defs>
        <linearGradient id={id}>
          {/* Deux arrêts à la même position : la coupure est nette, sans fondu
              (une étoile à moitié remplie n'est pas une étoile floue). */}
          <stop offset={`${percent}%`} stopColor="var(--star-color)" />
          <stop offset={`${percent}%`} stopColor="var(--star-color-empty)" />
        </linearGradient>
      </defs>
      <path
        d="M12 2.5l2.955 5.99 6.61.96-4.783 4.662 1.129 6.584L12 17.586l-5.911 3.11 1.129-6.584L2.435 9.45l6.61-.96z"
        fill={`url(#${id})`}
      />
    </svg>
  );
}

/** Cinq étoiles reflétant une note 0..5 (remplissage partiel inclus). */
function RenderStars({ score }: { score: number }) {
  const baseId = React.useId().replace(/:/g, "");
  return (
    <span
      role="img"
      aria-label={`${score.toFixed(1)} sur 5`}
      className="inline-flex items-center gap-0.5"
    >
      {Array.from({ length: 5 }, (_, index) => {
        // Part de CETTE étoile : 0 si la note est en dessous, 1 au-dessus,
        // fraction sinon (ex. 3.5 → 50 % sur la 4ᵉ).
        const percent = Math.round(
          Math.min(Math.max(score - index, 0), 1) * 100
        );
        return <StarIcon key={index} id={`${baseId}-${index}`} percent={percent} />;
      })}
    </span>
  );
}

/**
 * Logo du fournisseur — marque approximative en SVG inline, texte en
 * `currentColor` pour rester lisible dans les deux thèmes. Aucun média, aucun
 * fetch (D9) : ces tracés vivent avec le composant.
 */
const PROVIDER_LOGOS: Record<ReviewProvider, React.ReactNode> = {
  google: (
    <svg
      viewBox="0 0 170 48"
      role="img"
      aria-label="Google"
      className="h-[80px] w-auto max-w-full"
      fill="currentColor"
    >
      {/* « G » stylisé : un anneau ouvert en haut à droite (l’arc part du
          milieu droit et fait le tour) et une barre horizontale qui vient s’y
          raccorder. Tracés en `currentColor`, sans couleur de marque en dur. */}
      <path
        d="M40 24A16 16 0 1 1 35.314 12.686"
        fill="none"
        stroke="currentColor"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <path
        d="M24 24h16"
        fill="none"
        stroke="currentColor"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <text x="52" y="34" fontSize="28" fontWeight="600">
        Google
      </text>
    </svg>
  ),
  trustpilot: (
    <svg
      viewBox="0 0 200 48"
      role="img"
      aria-label="Trustpilot"
      className="h-[80px] w-auto max-w-full"
      fill="currentColor"
    >
      <path d="M22 6l4.9 10 11 1.6-8 7.8 1.9 11L22 31.2 12.2 36.4l1.9-11-8-7.8 11-1.6z" />
      <text x="46" y="34" fontSize="26" fontWeight="600">
        Trustpilot
      </text>
    </svg>
  ),
  trusted_shops: (
    <svg
      viewBox="0 0 240 48"
      role="img"
      aria-label="Trusted Shops"
      className="h-[80px] w-auto max-w-full"
      fill="currentColor"
    >
      <path
        d="M22 5l14 5.4v9.9c0 8.8-5.9 15.4-14 17.7-8.1-2.3-14-8.9-14-17.7V10.4z"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
      />
      <path
        d="M15.5 24.5l4.4 4.4 8.6-9.4"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <text x="48" y="33" fontSize="24" fontWeight="600">
        Trusted Shops
      </text>
    </svg>
  ),
  avis_verifies: (
    <svg
      viewBox="0 0 230 48"
      role="img"
      aria-label="Avis Vérifiés"
      className="h-[80px] w-auto max-w-full"
      fill="currentColor"
    >
      <circle
        cx="22"
        cy="24"
        r="16"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
      />
      <path
        d="M14.5 24.5l4.6 4.6 9.4-10"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <text x="48" y="33" fontSize="24" fontWeight="600">
        Avis Vérifiés
      </text>
    </svg>
  ),
  tripadvisor: (
    <svg
      viewBox="0 0 260 48"
      role="img"
      aria-label="Tripadvisor"
      className="h-[80px] w-auto max-w-full"
      fill="currentColor"
    >
      {/* Marque approximative : les deux « jumelles » (yeux de la chouette)
          avec leur pupille, puis le nom. */}
      <circle
        cx="14"
        cy="24"
        r="8"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
      />
      <circle
        cx="34"
        cy="24"
        r="8"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
      />
      <circle cx="14" cy="24" r="2.6" />
      <circle cx="34" cy="24" r="2.6" />
      <text x="52" y="33" fontSize="24" fontWeight="600">
        Tripadvisor
      </text>
    </svg>
  ),
  facebook: (
    <svg
      viewBox="0 0 200 48"
      role="img"
      aria-label="Facebook"
      className="h-[80px] w-auto max-w-full"
      fill="currentColor"
    >
      {/* Marque approximative : le carré arrondi et son « f ». Le contour
          (plutôt qu'un aplat plein) garde le tracé lisible dans les deux
          thèmes, le « f » ne pouvant pas être découpé dans une même couleur. */}
      <rect
        x="6"
        y="6"
        width="36"
        height="36"
        rx="9"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
      />
      <text x="25" y="35" fontSize="30" fontWeight="700" textAnchor="middle">
        f
      </text>
      <text x="54" y="33" fontSize="24" fontWeight="600">
        Facebook
      </text>
    </svg>
  ),
};

/** true si l'utilisateur demande des animations réduites (SSR : false). */
function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = React.useState(false);
  React.useEffect(() => {
    if (typeof window.matchMedia !== "function") {
      return;
    }
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    // Détection différée : un `setState` synchrone dans l'effet est interdit par
    // `react-hooks/set-state-in-effect` (même idiome que `useSliderEngine`).
    const frame = requestAnimationFrame(() => setReduced(query.matches));
    const update = () => setReduced(query.matches);
    query.addEventListener("change", update);
    return () => {
      cancelAnimationFrame(frame);
      query.removeEventListener("change", update);
    };
  }, []);
  return reduced;
}

/** Une carte d'avis (avatar, identité, note, commentaire). */
function ReviewCard({ review }: { review: ReviewItem }) {
  const initial =
    review.initial.trim() || review.author.trim().charAt(0).toUpperCase();
  return (
    <div className="flex h-full flex-col gap-3 rounded-[var(--radius)] border border-[var(--border-color)] bg-[var(--surface-color)] p-5">
      <div className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[var(--accent-color)] text-sm font-semibold text-[var(--text-color)]"
        >
          {initial}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-[var(--text-color)]">
            {review.author}
          </p>
          {review.timeAgo.trim() !== "" ? (
            <p className="text-xs text-[var(--text-muted)]">{review.timeAgo}</p>
          ) : null}
        </div>
        {review.isVerified ? (
          <span
            role="img"
            aria-label="Avis vérifié"
            title="Avis vérifié"
            className="ml-auto inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-[var(--accent-color)] text-[var(--text-color)]"
          >
            <Check className="size-3" aria-hidden="true" />
          </span>
        ) : null}
      </div>
      <RenderStars score={review.rating} />
      <p className="line-clamp-4 text-sm leading-relaxed text-[var(--text-color)]">
        {review.comment}
      </p>
    </div>
  );
}

export function ReviewsCarousel({
  heading,
  provider,
  summaryWord,
  overallScore,
  totalReviewsText,
  reviews,
  autoplaySpeedMs,
  pauseOnHover,
}: ReviewsCarouselProps) {
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [paused, setPaused] = React.useState(false);
  const reducedMotion = usePrefersReducedMotion();

  const count = reviews.length;
  // Robustesse : un index hérité hors bornes ne doit pas masquer la piste.
  const activeIndex = count > 0 ? currentIndex % count : 0;

  // Autoplay — coupé sous mouvement réduit, pendant une pause, ou s'il n'y a
  // rien à faire défiler. Le `setState` est fonctionnel : aucun index capturé.
  React.useEffect(() => {
    if (reducedMotion || paused || count <= 1) {
      return;
    }
    const id = window.setInterval(() => {
      setCurrentIndex((current) => (current + 1) % count);
    }, autoplaySpeedMs);
    return () => window.clearInterval(id);
  }, [autoplaySpeedMs, count, paused, reducedMotion]);

  // Le survol/focus ne pose l'état que si le réglage l'autorise : sinon
  // `paused` reste faux et l'effet ci-dessus ne redémarre jamais pour rien.
  const pause = () => {
    if (pauseOnHover) {
      setPaused(true);
    }
  };
  const resume = () => {
    if (pauseOnHover) {
      setPaused(false);
    }
  };

  const goPrev = () => {
    setCurrentIndex((current) => (current - 1 + count) % count);
  };
  const goNext = () => {
    setCurrentIndex((current) => (current + 1) % count);
  };

  const multiple = count > 1;

  return (
    <div
      role="region"
      aria-roledescription="carousel"
      aria-label={heading.trim() || "Avis clients"}
      onMouseEnter={pause}
      onMouseLeave={resume}
      onFocus={pause}
      onBlur={resume}
      className="grid gap-8 md:grid-cols-[1fr_1.5fr_1fr] md:items-center md:gap-10"
    >
      {/* ---- Colonne gauche : le logo du fournisseur d'avis ---- */}
      <div className="flex items-center justify-center text-[var(--text-color)] md:justify-start">
        {PROVIDER_LOGOS[provider]}
      </div>

      {/* ---- Colonne centrale : le carrousel ---- */}
      <div className="flex flex-col items-center gap-4">
        <div className="w-full max-w-[320px] overflow-hidden">
          <div
            className="flex transition-transform duration-500 ease-silk motion-reduce:transition-none"
            style={{ transform: `translateX(-${activeIndex * 100}%)` }}
          >
            {reviews.map((review, index) => (
              <article
                key={review.id}
                role="group"
                aria-roledescription="slide"
                aria-label={`${index + 1} sur ${count}`}
                aria-hidden={index !== activeIndex || undefined}
                className="w-full shrink-0 px-0.5"
              >
                <ReviewCard review={review} />
              </article>
            ))}
          </div>
        </div>

        {multiple ? (
          <div className="flex items-center gap-4">
            <button
              type="button"
              aria-label="Avis précédent"
              onClick={goPrev}
              className="flex size-9 items-center justify-center rounded-full border border-[var(--border-color)] bg-[var(--surface-color)] text-[var(--text-color)] transition-colors hover:border-[var(--accent-color-strong)] focus-visible:ring-2 focus-visible:ring-[var(--accent-color-strong)] focus-visible:outline-none"
            >
              <ChevronLeft className="size-4" aria-hidden="true" />
            </button>
            <span className="text-xs tabular-nums text-[var(--text-muted)]">
              {activeIndex + 1} / {count}
            </span>
            <button
              type="button"
              aria-label="Avis suivant"
              onClick={goNext}
              className="flex size-9 items-center justify-center rounded-full border border-[var(--border-color)] bg-[var(--surface-color)] text-[var(--text-color)] transition-colors hover:border-[var(--accent-color-strong)] focus-visible:ring-2 focus-visible:ring-[var(--accent-color-strong)] focus-visible:outline-none"
            >
              <ChevronRight className="size-4" aria-hidden="true" />
            </button>
          </div>
        ) : null}
      </div>

      {/* ---- Colonne droite : la synthèse (légende affichée une seule fois, D8) ---- */}
      <div className="flex flex-col items-center gap-2 text-center md:items-end md:text-right">
        {summaryWord.trim() !== "" ? (
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--text-color)]">
            {summaryWord}
          </p>
        ) : null}
        <div className="flex items-center gap-2">
          <RenderStars score={overallScore} />
          <span className="text-2xl font-semibold tabular-nums text-[var(--text-color)]">
            {overallScore.toFixed(1)}
          </span>
        </div>
        {totalReviewsText.trim() !== "" ? (
          <p className="text-xs text-[var(--text-muted)]">{totalReviewsText}</p>
        ) : null}
      </div>
    </div>
  );
}
