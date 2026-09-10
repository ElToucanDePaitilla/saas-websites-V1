"use client";

import * as React from "react";

import type { HeroVideoMedia } from "@/lib/pages";
import { cn } from "@/lib/utils";

/**
 * ============================================================================
 * HERO VIDEO BACKGROUND — média vidéo de la variante "video" (Étape 7.3)
 * ----------------------------------------------------------------------------
 * Client Component. Couche de fond branchée en `children` de `BaseHero` :
 *   - Desktop (≥ 768px) : balise `<video>` absolue `object-cover`,
 *     `autoPlay muted loop playsInline controls={false}` (muted/playsinline
 *     toujours actifs — exigence navigateur pour l'autoplay) + poster desktop
 *     16:9 affiché pendant le chargement ;
 *   - Mobile (< 768px) : la vidéo n'est **pas montée** → image fallback 9:16
 *     affichée (économie de data/batterie) ;
 *   - `prefers-reduced-motion` : pas d'autoplay, image poster affichée.
 * ============================================================================
 */

const DESKTOP_MEDIA = "(min-width: 768px)";
const REDUCED_MEDIA = "(prefers-reduced-motion: reduce)";

type HeroVideoBackgroundProps = {
  media: HeroVideoMedia;
};

/** Image pleine surface en object-cover (alt vide : décorative). */
function FullImage({
  url,
  alt,
  className,
}: {
  url: string;
  alt: string;
  className?: string;
}) {
  if (url === "") {
    return null;
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt={alt}
      aria-hidden="true"
      className={cn(
        "absolute inset-0 h-full w-full object-cover",
        className
      )}
    />
  );
}

export function HeroVideoBackground({ media }: HeroVideoBackgroundProps) {
  const [isDesktop, setIsDesktop] = React.useState(true);
  const [reduced, setReduced] = React.useState(false);

  React.useEffect(() => {
    const mqDesktop = window.matchMedia(DESKTOP_MEDIA);
    const mqReduced = window.matchMedia(REDUCED_MEDIA);
    const apply = () => {
      setIsDesktop(mqDesktop.matches);
      setReduced(mqReduced.matches);
    };
    // Détection différée (rAF) : aucun setState synchrone dans l'effet.
    const frame = requestAnimationFrame(apply);
    mqDesktop.addEventListener("change", apply);
    mqReduced.addEventListener("change", apply);
    return () => {
      cancelAnimationFrame(frame);
      mqDesktop.removeEventListener("change", apply);
      mqReduced.removeEventListener("change", apply);
    };
  }, []);

  const hasVideo = media.videoUrl.trim() !== "";
  const showVideo = hasVideo && isDesktop && !reduced;

  // Pas de vidéo (mobile, reduced-motion ou URL vide) : image adaptée.
  if (!showVideo) {
    const source = isDesktop ? media.posterDesktop : media.fallbackMobile;
    if (source.url !== "") {
      return (
        <div aria-hidden="true" className="absolute inset-0">
          <FullImage url={source.url} alt={source.alt} />
        </div>
      );
    }
    return <div aria-hidden="true" className="absolute inset-0 bg-neutral-900" />;
  }

  return (
    <div aria-hidden="true" className="absolute inset-0 bg-neutral-900">
      {/* Poster desktop affiché tant que la vidéo n'a pas démarré. */}
      <FullImage url={media.posterDesktop.url} alt={media.posterDesktop.alt} />
      <video
        className="absolute inset-0 h-full w-full object-cover"
        src={media.videoUrl}
        autoPlay
        muted
        loop={media.loop}
        playsInline
        controls={false}
        preload="metadata"
        poster={media.posterDesktop.url || undefined}
        tabIndex={-1}
      />
    </div>
  );
}
